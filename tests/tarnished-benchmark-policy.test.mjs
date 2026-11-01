import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../public/'+path,import.meta.url),'utf8');
test('reference tools no longer require user installation or game client screenshots to be useful',()=>{
 const html=read('validation-status/index.html');
 assert.match(html,/Reference benchmark first — no game installation required/);
 assert.match(html,/Tarnished\.dev/);
 assert.match(html,/v1\.17 reference calculator/);
 assert.match(html,/Game-client screenshots are needed only for claims of independently game-verified current-patch accuracy/);
 assert.match(html,/pinned v1\.17 reference AR engine now meets the documented representative 50-case external parity matrix/);
});
test('weapon catalog links to free versioned reference workbench without pretending benchmark parity',()=>{
 const html=read('weapon-database/index.html');
 assert.match(html,/Calculate reference AR with public v1\.17 data/);
 assert.match(html,/Tarnished\.dev-benchmarked/);
 assert.match(html,/must actually record passing comparison cases/);
 const data=read('src/upstream-regulation-v117.mjs');
 assert.match(data,/public\/regulation-vanilla-v1\.17\.js/);
 assert.match(data,/No third-party script is run/);
});
test('homepage separately labels v1.17 reference AR and unverified current patch AR',()=>{
 const html=read('index.html');
 assert.match(html,/Reference v1\.17 AR passes 50 independently repeated same-input external-site comparisons/);
 assert.match(html,/current-patch certified AR/);
 assert.match(html,/no game installation is needed/);
});

test('accuracy dashboard distinguishes 86 approved AR, 347/348 expanded AR, 487 weights, 460 direct requirements and internal math',()=>{
 const html=read('validation-status/index.html');
 assert.match(html,/86 \/ 86/);
 assert.match(html,/347 \/ 348/);
 assert.match(html,/487 \/ 487/);
 assert.match(html,/460 \/ 487/);
 assert.match(html,/39,552/);
 assert.match(html,/NOT 39,552 external-site comparisons/);
 assert.match(html,/Historic 50-case reference benchmark/);
 assert.match(html,/Historical original direct-browser audit: Icerind Hatchet/);
 assert.match(html,/27 are independently pinned-source-only/);
 assert.match(html,/41180592038/);
 assert.match(html,/41180757356/);
 assert.match(html,/41180757347/);
 assert.match(html,/Regulation 1\.17\.3 game client/);
 assert.match(html,/Fire Knight&amp;#39;s Greatsword|Fire Knight&#39;s Greatsword/);
 const home=read('index.html');
 assert.match(home,/50 of 50 independently repeated Tarnished.dev v1.17 browser cases/);
});
