import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseChromeDebugPort,waitForChromePage} from '../scripts/browser-cdp-startup.mjs';

const portFile='45123\n/devtools/browser/550e8400-e29b-41d4-a716-446655440000\n';
const page='ws://127.0.0.1:45123/devtools/page/unique123';
const response=items=>({ok:true,json:async()=>items});
const target=url=>[{type:'page',webSocketDebuggerUrl:url}];
const mockClock=()=>{let current=0;return {
 now:()=>current,wait:async ms=>{current+=ms;},time:()=>current
};};

test('Chromium ephemeral port parser refuses malformed and unsafe debugging port files',()=>{
 assert.equal(parseChromeDebugPort(portFile),45123);
 for(const value of [
  '',null,'0\n/devtools/browser/550e8400-e29b-41d4-a716-446655440000',
  '9227', '65536\n/devtools/browser/550e8400-e29b-41d4-a716-446655440000',
  '-1\n/devtools/browser/550e8400-e29b-41d4-a716-446655440000',
  '45123\nhttp://evil.example/'
 ])assert.throws(()=>parseChromeDebugPort(value),RangeError);
});

test('startup tolerates delayed port file and delayed local page target without hardcoded ports',async()=>{
 const t=mockClock(),urls=[];let reads=0,requests=0;
 const endpoint=await waitForChromePage({
  profile:'/tmp/fixture-chrome',
  readText:async filepath=>{reads++;assert.equal(filepath,'/tmp/fixture-chrome/DevToolsActivePort');
   if(reads<3)throw Error('ENOENT');return portFile;},
  request:async url=>{urls.push(url);requests++;
   return response(requests===1?[]:target(page));},
  now:t.now,wait:t.wait,timeoutMs:1200,pollMs:100
 });
 assert.equal(endpoint,page);
 assert.equal(reads,4);
 assert.equal(requests,2);
 assert.ok(urls.every(url=>url==='http://127.0.0.1:45123/json/list'));
 assert.equal(t.time(),300);
});

test('startup rejects page WebSocket URLs that do not match the assigned local port',async()=>{
 for(const forged of [
  'ws://127.0.0.1:9227/devtools/page/not-the-assigned-port',
  'wss://127.0.0.1:45123/devtools/page/wrong-scheme',
  'ws://evil.example:45123/devtools/page/external-host',
  'ws://127.0.0.1:45123/admin',
 ]){
  const t=mockClock();
  await assert.rejects(waitForChromePage({
   profile:'/tmp/synthetic',
   readText:async()=>portFile,
   request:async()=>response(target(forged)),
   now:t.now,wait:t.wait,timeoutMs:200,pollMs:100
  }),/timed out.*assigned local port/);
 }
});

test('Chrome early exit is distinguished from missing CDP endpoint',async()=>{
 const t=mockClock();
 await assert.rejects(waitForChromePage({
  profile:'/tmp/synthetic',readText:async()=>{throw Error('ENOENT')},
  request:async()=>{throw Error('should not request without Chrome port file')},
  getExitReason:()=>t.time()>=100?'exit code 137':null,
  now:t.now,wait:t.wait,timeoutMs:1000,pollMs:100
 }),/exited before CDP became ready: exit code 137/);
});

test('CDP polling has bounded readiness timeout and surfaces last diagnostic',async()=>{
 const t=mockClock();
 await assert.rejects(waitForChromePage({
  profile:'/tmp/synthetic',
  readText:async()=>{throw Error('DevToolsActivePort not created')},
  request:async()=>{throw Error('no request allowed')},
  now:t.now,wait:t.wait,timeoutMs:500,pollMs:100
 }),/startup timed out \(500ms\).*DevToolsActivePort not created/);
});

test('real-browser smoke retries only startup, not a failed page assertion',()=>{
 const src=readFileSync(new URL('../scripts/smoke-browser.mjs',import.meta.url),'utf8');
 assert.match(src,/--remote-debugging-port=0/);
 assert.doesNotMatch(src,/--remote-debugging-port=9227/);
 assert.match(src,/attempt<=2/);
 assert.match(src,/await connect\(\);/);
 assert.match(src,/await waitForChromePage\(/);
 assert.match(src,/catch\(error\)\{\s*console\.error\('\[BROWSER SMOKE\] FAIL:/);
});
