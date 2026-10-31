import importlib.util
from pathlib import Path
from tempfile import TemporaryDirectory
import copy
import json
import unittest

ROOT = Path(__file__).resolve().parent.parent
SPEC = importlib.util.spec_from_file_location('safe_sync', ROOT / 'scripts/stage_tarnished_safe_sync.py')
safe = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(safe)

HTML = '''<html><div>Elden Ring Version: v1.17</div>
<h2 id="updates-heading">Recent Updates</h2><ol>
<li><time>10/23/2026</time><p>Improved armor optimizer.</p></li>
<li><time>8/28/2026</time><p>Updated game data to patch 1.17.</p></li>
</ol></html>'''

def examples():
    previous = safe.watcher.parse_html(HTML)
    now = safe.watcher.parse_html(HTML.replace('v1.17</div>', 'v1.18</div>').replace(
       'Improved armor optimizer.', 'Improved armor optimizer and exclusion controls.'))
    report = safe.watcher.compare(previous, now)
    report['observed'] = now
    return previous, report

class SafeSyncTests(unittest.TestCase):
    def test_new_version_only_stages_public_observation_and_never_game_claims(self):
        baseline, report = examples()
        published = safe.make_public_observation(report, baseline)
        self.assertEqual(published['referenceVersion'], 'v1.18')
        self.assertEqual(published['reviewPriority'], 'P0')
        self.assertFalse(published['gameDataCertified'])
        self.assertFalse(published['ourFeaturesUpdated'])
        self.assertTrue(published['humanOrIndependentReviewRequired'])
        self.assertEqual(published['sourceKind'], 'external-competitor-not-our-release')
        self.assertEqual(published['reviewStatus'], 'pending-independent-review')
        self.assertEqual(len(published['recentUpdates']), 2)
        self.assertEqual(tuple(safe.ALLOWED_PATHS),(
            'monitoring/tarnished-dev-baseline.json','public/data/tarnished-dev-watch.json'))

    def test_staging_is_idempotent_and_writes_exactly_two_json_paths(self):
        baseline, report = examples()
        with TemporaryDirectory() as temp:
            root = Path(temp)
            p1, p2, p3 = root/'result.json', root/'baseline.json', root/'public.json'
            p1.write_text(json.dumps(report))
            p2.write_text(json.dumps(baseline))
            actual = safe.stage(p1,p2,p3)
            self.assertEqual(actual, json.loads(p3.read_text()))
            self.assertEqual(json.loads(p2.read_text()),report['observed'])
            self.assertEqual(set(x.name for x in root.iterdir()), {'result.json','baseline.json','public.json'})
            with self.assertRaisesRegex(ValueError,'Reported change does not match recalculated'):
                safe.stage(p1,p2,p3)

    def test_tampered_or_unobserved_metrics_fail_closed(self):
        baseline, report = examples()
        for invalid in (
            {'fingerprint':'0'*64},
            {'changed':False},
            {'previous_version':'v9.99'},
            {'version_changed':False},
        ):
            corrupted = copy.deepcopy(report)
            corrupted.update(invalid)
            with self.assertRaises(ValueError):
                safe.make_public_observation(corrupted,baseline)
        tampered = copy.deepcopy(report)
        tampered['observed']['entries'][0]['excerpt'] = '<script>unsafe notice</script>' * 7
        with self.assertRaises(ValueError):
            safe.make_public_observation(tampered,baseline)
        misdirected = copy.deepcopy(report)
        misdirected['observed']['source'] = 'https://evil.example/'
        with self.assertRaises(ValueError):
            safe.make_public_observation(misdirected,baseline)

    def test_p1_math_updates_are_review_leads_only(self):
        baseline = safe.watcher.parse_html(HTML)
        current = safe.watcher.parse_html(HTML.replace('Improved armor optimizer.', 'Fixed weapon AR formula.'))
        result = safe.watcher.compare(baseline,current)
        result['observed'] = current
        publication=safe.make_public_observation(result,baseline)
        self.assertEqual(publication['reviewPriority'],'P1')
        self.assertFalse(publication['ourFeaturesUpdated'])
        self.assertTrue(publication['humanOrIndependentReviewRequired'])

if __name__ == '__main__':
    unittest.main()
