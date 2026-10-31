#!/usr/bin/env python3
"""Read-only competitor change monitor. Python stdlib, public HTML only.

No mirroring competitor code, no auto-applied formulas, and no game-version
certification. The output is a triage request, not a site release note.
"""
import argparse
from datetime import datetime
from hashlib import sha256
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

URL = "https://www.tarnished.dev/"
BASELINE = Path("monitoring/tarnished-dev-baseline.json")
REPORT = Path(".monitor/tarnished-dev-result.json")
ISSUE = Path(".monitor/tarnished-dev-review.md")
MAX_HTML_BYTES = 3_000_000
DATE = re.compile(r"^\d{1,2}/\d{1,2}/\d{4}$")
VERSION = re.compile(r"Elden Ring Version:\s*(v\d+(?:\.\d+){1,3})", re.I)
SPACE = re.compile(r"\s+")


def normalize(text):
    return SPACE.sub(" ", text).strip()


def signature(text):
    return sha256(text.encode("utf-8")).hexdigest()


class RecentUpdatesParser(HTMLParser):
    """Consume exactly the first OL immediately after #updates-heading.

    Nested bullet LIs are merged into their parent update, never treated as
    separate dated releases. Archived older entries and unrelated HTML excluded.
    """
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.heading_seen = False
        self.in_list = False
        self.finished = False
        self.li_depth = 0
        self.collect_time = False
        self.current = None
        self.entries = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "h2" and attrs.get("id") == "updates-heading":
            self.heading_seen = True
        if self.heading_seen and not self.in_list and not self.finished and tag == "ol":
            self.in_list = True
        elif self.in_list and tag == "li":
            if self.li_depth == 0:
                self.current = {"date_fragments": [], "text_fragments": []}
            self.li_depth += 1
        elif self.current is not None and tag == "time":
            self.collect_time = True

    def handle_data(self, data):
        if self.current is None or not data.strip():
            return
        key = "date_fragments" if self.collect_time else "text_fragments"
        self.current[key].append(data)

    def handle_endtag(self, tag):
        if tag == "time":
            self.collect_time = False
        elif tag == "li" and self.in_list and self.li_depth:
            self.li_depth -= 1
            if self.li_depth == 0 and self.current is not None:
                raw_date = normalize(" ".join(self.current["date_fragments"]))
                description = normalize(" ".join(self.current["text_fragments"]))
                if DATE.fullmatch(raw_date) and description:
                    day = datetime.strptime(raw_date, "%m/%d/%Y").strftime("%Y-%m-%d")
                    self.entries.append({"date": day, "digest": signature(description),
                                         "excerpt": description[:110]})
                self.current = None
        elif tag == "ol" and self.in_list and self.li_depth == 0:
            self.in_list = False
            self.finished = True


def parse_html(html):
    if len(html) > MAX_HTML_BYTES:
        raise ValueError("Unexpected large response; refuse to parse")
    version_match = VERSION.search(html)
    parser = RecentUpdatesParser()
    parser.feed(html)
    if not version_match or not parser.finished or len(parser.entries) < 2:
        raise ValueError("Recent Updates or visible version is unavailable. Site layout changed; do not assume no updates.")
    records = parser.entries[:6]
    if len({x["date"] + x["digest"] for x in records}) != len(records):
        raise ValueError("Duplicated recent update entries; check parser")
    version = version_match.group(1)
    fingerprint = signature(json.dumps(
        {"version": version, "entries": [(x["date"], x["digest"]) for x in records]},
        ensure_ascii=False, sort_keys=True))
    return {"schema": 1, "source": URL, "version": version,
            "entries": records, "fingerprint": fingerprint}


def fetch_public_home():
    request = Request(URL, headers={
        "User-Agent": "BuildLab-UpdateMonitor/1.0 (+https://github.com/garrison2025/Elden-Ring; read-only; twice daily)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.8",
        "Cache-Control": "no-cache",
    })
    last_error = None
    for attempt in range(2):
        try:
            with urlopen(request, timeout=18) as response:
                if response.status != 200:
                    raise ValueError("Unexpected status " + str(response.status))
                data = response.read(MAX_HTML_BYTES + 1)
                if len(data) > MAX_HTML_BYTES:
                    raise ValueError("HTML exceeds safe response size")
                return data.decode("utf-8", errors="strict")
        except (HTTPError, URLError, TimeoutError, UnicodeError) as exc:
            last_error = exc
            if attempt == 0:
                time.sleep(3)
    raise RuntimeError("Public page unavailable; monitoring FAIL-CLOSED: " + str(last_error))


def classify(entry, version_change):
    text = entry.get("excerpt", "").lower()
    if version_change or any(word in text for word in ("patch", "game data", "version")):
        return "P0 · Check official patch and source-data version; do not silently overwrite v1.17"
    if any(word in text for word in ("attack rating", "weapon ar", "affinity", "dps", "damage")):
        return "P1 · Check weapon AR/damage model and rerun identical-input numeric comparisons"
    if any(word in text for word in ("armor", "poise", "equip load")):
        return "P1 · Check armor optimizer completeness, exclusion controls, DLC coverage"
    if any(word in text for word in ("build", "spell", "talisman", "effect")):
        return "P2 · Check relevant planner/spell/effect UX and independently implemented tests"
    return "P3 · Review relevance and compare usability; no automatic feature merge"


def compare(baseline, observed):
    if baseline.get("schema") != 1 or baseline.get("source") != URL:
        raise ValueError("Invalid baseline source/schema")
    older = baseline.get("entries")
    if not isinstance(older, list) or len(older) < 2:
        raise ValueError("Baseline must include at least two dated entries")
    previous = {x["date"]: x["digest"] for x in older}
    changes = []
    for entry in observed["entries"]:
        old = previous.get(entry["date"])
        if old is None:
            changes.append({**entry, "kind": "new-date"})
        elif old != entry["digest"]:
            changes.append({**entry, "kind": "edited-same-date"})
    version_changed = observed["version"] != baseline["version"]
    return {"changed": bool(changes) or version_changed,
            "version_changed": version_changed, "changes": changes,
            "new_version": observed["version"], "previous_version": baseline["version"],
            "fingerprint": observed["fingerprint"]}


def issue_body(result):
    lines = [
        "<!-- tarnished-monitor:" + result["fingerprint"] + " -->",
        "## Tarnished.dev update detected — TRIAGE ONLY",
        "",
        "**Source:** " + URL,
        "**Version:** " + result["previous_version"] + " → " + result["new_version"],
        "**Change type:** public recent-update HTML / site version; not a proven live game-data change.",
        "",
        "### Candidate changes",
    ]
    if not result["changes"]:
        lines.append("- Public version label changed (no new Recent Updates entry).")
    for change in result["changes"]:
        lines.append("- " + change["date"] + " (" + change["kind"] + "): " +
                     change["excerpt"] + ("…" if len(change["excerpt"]) >= 110 else ""))
        lines.append("  - " + classify(change, result["version_changed"]))
    lines += [
        "",
        "### Required independent review before any site change",
        "- [ ] Open the competitor update and confirm it is substantive, not markup/cache drift.",
        "- [ ] Compare with Bandai Namco official patch notes and confirm App/Regulation versions when game data is involved.",
        "- [ ] Check our existing feature/algorithm to avoid unnecessary duplications.",
        "- [ ] Reproduce affected calculation cases and collect same-input competitor results, including 1H/2H and DLC if relevant.",
        "- [ ] Independently implement fixes using permitted data, with tests and source attribution. Do not copy competitor proprietary code or images.",
        "- [ ] Only after PR CI and review pass: update our OWN /updates/ page with truthful shipped changes.",
        "",
        "**Automated monitor does not publish competitor changes, assert numerical parity, merge features, or change our pinned v1.17 source.**",
    ]
    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--html-file", type=Path, help="Offline test fixture instead of live HTTP")
    parser.add_argument("--baseline", type=Path, default=BASELINE)
    parser.add_argument("--report", type=Path, default=REPORT)
    parser.add_argument("--issue", type=Path, default=ISSUE)
    parser.add_argument("--seed", action="store_true", help="Write source-derived initial baseline (manual only)")
    args = parser.parse_args()
    html = args.html_file.read_text(encoding="utf-8") if args.html_file else fetch_public_home()
    observed = parse_html(html)
    if args.seed:
        args.baseline.parent.mkdir(parents=True, exist_ok=True)
        args.baseline.write_text(json.dumps(observed, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("Seeded source snapshot with version " + observed["version"])
        return
    baseline = json.loads(args.baseline.read_text(encoding="utf-8"))
    result = compare(baseline, observed)
    result["observed"] = observed
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    args.issue.write_text(issue_body(result), encoding="utf-8")
    print("[TARNISHED MONITOR] version " + result["previous_version"] + " → " +
          result["new_version"] + "; new/edited items=" + str(len(result["changes"])) +
          "; changed=" + str(result["changed"]))
    output = os.environ.get("GITHUB_OUTPUT")
    if output:
        with open(output, "a", encoding="utf-8") as f:
            f.write("changed=" + str(result["changed"]).lower() + "\n")
            f.write("fingerprint=" + result["fingerprint"] + "\n")


if __name__ == "__main__":
    try:
        main()
    except (ValueError, RuntimeError, OSError, json.JSONDecodeError) as error:
        print("[TARNISHED MONITOR] FAIL-CLOSED: " + str(error), file=sys.stderr)
        sys.exit(1)
