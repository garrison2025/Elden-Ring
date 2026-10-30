import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir,readFile,stat} from 'node:fs/promises';
import {join,resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../public');
const paths=['','build-planner','class-optimizer','level-rune-calculator','equip-load-calculator','weapon-ar-lab','validation-status','about','privacy'];
for (const slug of paths){
  test(`static page ${slug||'/'} has usable metadata and local assets`,async()=>{
    const p=join(root,slug,'index.html'),html=await readFile(p,'utf8');
    assert.match(html,/<html lang="en">/);
    assert.match(html,/<title>[^<]+<\/title>/);
    assert.match(html,/<meta name="description" content="[^"]+"/);
    assert.equal((html.match(/<h1\b/g)||[]).length,1);
    for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){
      const ref=match[1];if(ref.startsWith('#')||/^(https?:|mailto:|data:|javascript:)/.test(ref))continue;
      const path=ref.split(/[?#]/)[0];if(!path)continue;
      const local=resolve(dirname(p),decodeURI(path));
      assert.ok(local.startsWith(root+'/')||local===root,`path escapes site: ${ref}`);
      const file=(await stat(local)).isDirectory()?join(local,'index.html'):local;
      assert.ok((await stat(file)).isFile(),`missing local file ${ref}`);
    }
  });
}
test('research-only AR cannot be indexed',async()=>{
 const p=await readFile(join(root,'weapon-ar-lab/index.html'),'utf8');
 assert.match(p,/noindex/);assert.match(p,/SYNTHETIC DATA/);
});
