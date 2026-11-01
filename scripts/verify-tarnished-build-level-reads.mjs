#!/usr/bin/env node
// Fail the comparator CI unless both independent public v1.17 browser reads
// agree with one another AND with the local Wretch build-level calculation.
import {readFileSync} from 'node:fs';

const paths = [
  '.audit/build-level-first.json',
  '.audit/tarnished-build-level-public.json',
];
const [first, second] = paths.map(path => JSON.parse(readFileSync(path, 'utf8')));
const errors = [];
const expectedCount = 20;
function validateRun(data, index) {
  if (data.site !== 'Tarnished.dev public v1.17') errors.push(`read ${index}: site marker mismatch`);
  if (!Array.isArray(data.samples) || data.samples.length !== expectedCount) {
    errors.push(`read ${index}: expected ${expectedCount} samples`);
    return new Map();
  }
  const out = new Map();
  for (const sample of data.samples) {
    if (!/^level-\d{2}$/.test(sample.id) || out.has(sample.id)) {
      errors.push(`read ${index}: duplicate/invalid sample id ${sample.id}`);
      continue;
    }
    out.set(sample.id, sample);
    const snap = sample.siteData || {};
    const stats = sample.stats;
    const validStats = Array.isArray(stats) && stats.length === 8 &&
      stats.every(n => Number.isInteger(n) && n >= 10 && n <= 99);
    if (!validStats || stats.slice(0,3).some(n => n !== 10)) {
      errors.push(`read ${index} ${sample.id}: invalid Wretch stats`);
    }
    if (sample.verified !== true ||
        sample.class !== 'Wretch' || snap.classLabel !== 'Wretch' ||
        snap.version !== 'Elden Ring Version: v1.17' ||
        typeof snap.url !== 'string' ||
        !snap.url.startsWith('https://www.tarnished.dev/build-planner') ||
        snap.runeOff !== true || snap.physickOff !== true ||
        !Array.isArray(snap.statValues) || !validStats ||
        !snap.statValues.every((v, i) => v === String(stats[i]))) {
      errors.push(`read ${index} ${sample.id}: public inputs not validated`);
    }
    if (!Number.isInteger(sample.local) ||
        !Number.isInteger(sample.publicLevel) ||
        sample.delta !== 0 || sample.local !== sample.publicLevel) {
      errors.push(`read ${index} ${sample.id}: local/site level mismatch`);
    }
  }
  return out;
}

const firstById = validateRun(first, 1);
const secondById = validateRun(second, 2);
for (let i = 1; i <= expectedCount; i++) {
  const id = `level-${String(i).padStart(2, '0')}`;
  const a = firstById.get(id), b = secondById.get(id);
  if (!a || !b) { errors.push(`missing ${id} in one or both reads`); continue; }
  if (JSON.stringify(a.stats) !== JSON.stringify(b.stats) ||
      a.publicLevel !== b.publicLevel || a.local !== b.local ||
      a.siteData?.version !== b.siteData?.version) {
    errors.push(`${id}: independent reads diverge`);
  }
}
if (errors.length) {
  console.error('[BUILD LEVEL PARITY FAIL] ' + JSON.stringify(errors));
  process.exit(1);
}
console.log('[BUILD LEVEL PARITY PASS] 20/20 Wretch cases matched in both independent v1.17 public browser reads; 0 mismatches, 0 unobserved.');
