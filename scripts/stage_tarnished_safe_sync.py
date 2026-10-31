#!/usr/bin/env python3
"""Stage ONLY source-attributed, externally observed metadata for a safe auto-PR.

This deliberately cannot patch game formulas, parameter sources, site changelog,
code, configuration, HTML, licensing flags, or search indexing. No AI keys.
"""
import argparse
import importlib.util
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
SPEC = importlib.util.spec_from_file_location("upstream_watcher", ROOT / "scripts/monitor_tarnished_updates.py")
watcher = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(watcher)

VALID_HEX = re.compile(r"^[0-9a-f]{64}$")
VALID_DATE = re.compile(r"^\d{4}-\d\d-\d\d$")
VALID_VERSION = re.compile(r"^v\d+(?:\.\d+){1,3}$")
ALLOWED_PATHS = ("monitoring/tarnished-dev-baseline.json", "public/data/tarnished-dev-watch.json")

def verify_report(report, baseline):
    if not isinstance(report, dict) or not isinstance(baseline, dict):
        raise ValueError("Expected JSON objects for report and baseline")
    observed = report.get("observed")
    if not isinstance(observed, dict) or observed.get('schema') != 1:
        raise ValueError("Unrecognized or missing observed snapshot")
    if observed.get('source') != watcher.URL or baseline.get('source') != watcher.URL:
        raise ValueError("Source cannot be redirected")
    if not VALID_VERSION.fullmatch(str(observed.get('version', ''))):
        raise ValueError("Malformed source version")
    entries = observed.get('entries')
    if not isinstance(entries, list) or not 2 <= len(entries) <= 6:
        raise ValueError("Unexpected source entry count")
    for item in entries:
        if (not isinstance(item, dict) or not VALID_DATE.fullmatch(str(item.get('date', '')))
            or not VALID_HEX.fullmatch(str(item.get('digest', '')))
            or not isinstance(item.get('excerpt'), str) or not 1 <= len(item['excerpt']) <= 110
            or any(ord(c) < 32 for c in item['excerpt'])
            or '\ufffd' in item['excerpt']):
            raise ValueError("Unsafe source note in observation")
    expected_fingerprint = watcher.signature(json.dumps(
        {"version": observed["version"], "entries": [(x["date"], x["digest"]) for x in entries]},
        ensure_ascii=False, sort_keys=True))
    if observed.get('fingerprint') != expected_fingerprint:
        raise ValueError("Observed source fingerprint mismatch")
    calculated = watcher.compare(baseline, observed)
    for key in ('changed', 'fingerprint', 'version_changed', 'changes', 'new_version', 'previous_version'):
        if report.get(key) != calculated[key]:
            raise ValueError("Reported change does not match recalculated public-source comparison: " + key)
    if not calculated['changed']:
        raise ValueError("Nothing changed: do not create empty sync commits")
    return calculated


def make_public_observation(report, baseline):
    result = verify_report(report, baseline)
    observed = report['observed']
    highest = 'P0' if result['version_changed'] else 'P3'
    if highest != 'P0':
        for entry in result['changes']:
            classification = watcher.classify(entry, False)
            if classification.startswith('P1'): highest = 'P1'; break
            if classification.startswith('P2'): highest = 'P2'
    return {
        'schema': 1,
        'source': watcher.URL,
        'sourceKind': 'external-competitor-not-our-release',
        'gameDataCertified': False,
        'ourFeaturesUpdated': False,
        'humanOrIndependentReviewRequired': True,
        'referenceVersion': observed['version'],
        'previousReferenceVersion': baseline['version'],
        'fingerprint': observed['fingerprint'],
        'reviewPriority': highest,
        'reviewStatus': 'pending-independent-review',
        'recentUpdates': [{'date': x['date'], 'excerpt': x['excerpt'], 'digest': x['digest']}
                          for x in observed['entries']],
        'changedEntryCount': len(result['changes']),
        'sourceUrl': watcher.URL,
        'reviewIssuesUrl': 'https://github.com/garrison2025/Elden-Ring/issues',
        'scope': 'External update notice only. Independent site feature/algorithm sync is not automated.',
    }


def stage(report_path, baseline_path, public_path):
    report = json.loads(Path(report_path).read_text(encoding='utf-8'))
    baseline = json.loads(Path(baseline_path).read_text(encoding='utf-8'))
    public = make_public_observation(report, baseline)
    public_path = Path(public_path)
    public_path.parent.mkdir(parents=True, exist_ok=True)
    public_path.write_text(json.dumps(public, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    Path(baseline_path).write_text(json.dumps(report['observed'], ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('[SAFE AUTO-SYNC] staged only external reference metadata; priority=' + public['reviewPriority'])
    print('[SAFE AUTO-SYNC] allowed paths: ' + ', '.join(ALLOWED_PATHS))
    return public


if __name__ == '__main__':
    cli = argparse.ArgumentParser()
    cli.add_argument('--report', default='.monitor/tarnished-dev-result.json')
    cli.add_argument('--baseline', default='monitoring/tarnished-dev-baseline.json')
    cli.add_argument('--public', default='public/data/tarnished-dev-watch.json')
    args = cli.parse_args()
    try:
        stage(args.report, args.baseline, args.public)
    except (ValueError, OSError, json.JSONDecodeError) as error:
        print('[SAFE AUTO-SYNC] BLOCKED: ' + str(error), file=sys.stderr)
        sys.exit(1)
