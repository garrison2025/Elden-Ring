import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parent.parent
SPEC = importlib.util.spec_from_file_location("tarnished_monitor", ROOT / "scripts" / "monitor_tarnished_updates.py")
monitor = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(monitor)

BASE_HTML = """
<html><header>Elden Ring Version: v1.17</header><main>
<h2 id="updates-heading">Recent Updates</h2>
<ol class="whatever_updateList">
<li><time>10/23/2026</time><div><p>Improved the Armor Optimizer.</p>
<ul><li>Fixed skipped armor combinations.</li>
<li>Added one-piece exclusion buttons.</li></ul></div></li>
<li><time>8/28/2026</time><div><p>Updated data to support patch 1.17.</p></div></li>
<li><time>9/12/2024</time><div><p>Fixed affinity filters.</p></div></li>
</ol>
<details><summary>Show all updates</summary><ol><li><time>3/31/2024</time>CSV export.</li></ol></details>
</main></html>"""


class CompetitorMonitorTests(unittest.TestCase):
    def test_extracts_only_recent_top_level_updates_and_version(self):
        snapshot = monitor.parse_html(BASE_HTML)
        self.assertEqual(snapshot["version"], "v1.17")
        self.assertEqual(len(snapshot["entries"]), 3)
        self.assertEqual(snapshot["entries"][0]["date"], "2026-10-23")
        self.assertIn("one-piece exclusion", snapshot["entries"][0]["excerpt"])
        self.assertFalse(any(e["date"] == "2024-03-31" for e in snapshot["entries"]))

    def test_repeated_snapshot_cannot_create_new_issue(self):
        baseline = monitor.parse_html(BASE_HTML)
        r = monitor.compare(baseline, monitor.parse_html(BASE_HTML))
        self.assertFalse(r["changed"])
        self.assertEqual(r["changes"], [])
        self.assertEqual(r["fingerprint"], baseline["fingerprint"])

    def test_new_entry_and_version_uses_review_issue_without_deploy_claim(self):
        base = monitor.parse_html(BASE_HTML)
        new_html = BASE_HTML.replace("v1.17</header>", "v1.18</header>").replace(
            '<ol class="whatever_updateList">',
            '<ol class="whatever_updateList"><li><time>10/30/2026</time><p>Fixed weapon AR.</p></li>')
        result = monitor.compare(base, monitor.parse_html(new_html))
        self.assertTrue(result["changed"])
        self.assertTrue(result["version_changed"])
        self.assertEqual(result["changes"][0]["date"], "2026-10-30")
        text = monitor.issue_body(result)
        self.assertIn("TRIAGE ONLY", text)
        self.assertIn("tarnished-monitor:", text)
        self.assertIn("do not", text.lower())

    def test_edits_to_existing_date_are_detected_even_without_new_date(self):
        base = monitor.parse_html(BASE_HTML)
        edited = BASE_HTML.replace("Fixed skipped armor combinations.", "Fixed skipped valid armor combinations.")
        diff = monitor.compare(base, monitor.parse_html(edited))
        self.assertTrue(diff["changed"])
        self.assertEqual(diff["changes"][0]["kind"], "edited-same-date")
        self.assertFalse(diff["version_changed"])

    def test_missing_version_or_heading_fails_closed(self):
        for html in [BASE_HTML.replace('id="updates-heading"', ''), BASE_HTML.replace('v1.17', 'unknown'),
                     '<html><h2 id="updates-heading">Recent Updates</h2></html>']:
            with self.assertRaises(ValueError):
                monitor.parse_html(html)

    def test_classification_is_triage_not_certification(self):
        self.assertIn("P0", monitor.classify({"excerpt": "Updated to patch 1.18"}, True))
        self.assertIn("P1", monitor.classify({"excerpt": "Improved armor optimizer"}, False))
        self.assertIn("P1", monitor.classify({"excerpt": "Fixed attack rating"}, False))


if __name__ == "__main__":
    unittest.main()
