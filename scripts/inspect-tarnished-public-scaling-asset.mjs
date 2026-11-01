#!/usr/bin/env node
/* READ ONLY: Inspect publicly served resource metadata for evidence of
 * correction graph and spell calculation. Never export bundles or code.
 * No hidden API, no credentials, no redistributing site JavaScript.
 */
const url='https://www.tarnished.dev/spell-calculator';
const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(22000)});
if(!r.ok)throw Error('Source HTML '+r.status);
const html=await r.text();
console.log('[SOURCE PAGE]',JSON.stringify({length:html.length,title:html.match(/<title[^>]*>([^<]+)/)?.[1],version:/v1\.17/.test(html)}));
const urls=[...html.matchAll(/<script\b[^>]*src=["']([^"']+)["']/gi)].map(x=>new URL(x[1],url).href);
console.log('[JS RESOURCE REFERENCES]',JSON.stringify(urls.map(x=>new URL(x).pathname)));
for(const path of urls.slice(-25)){
 try{
 const resp=await fetch(path,{signal:AbortSignal.timeout(22000)});
 const t=await resp.text();
 if(t.length>5000000){console.log('[JS SKIP LARGE]',JSON.stringify({path:new URL(path).pathname,len:t.length}));continue;}
 const keys=['sorceryScaling','sorcery scaling','calcCorrectGraph','calcCorrect','spellDamage','spellScaling','Glintstone Pebble','152','0.9','0.89','damageMultiplier'];
 let count={};
 for(const k of keys){const rx=new RegExp(k.replaceAll('.','\\.'),'gi');const m=t.match(rx);if(m)count[k]=m.length;}
 // Tiny bounded snippets around relevant COMPUTATIONAL TOKENS, no source export.
 const snippets=[];
 for(const key of ['calcCorrect','spellDamage','sorceryScaling','sorcery scaling']){
 const at=t.toLowerCase().indexOf(key.toLowerCase());
 if(at>=0)snippets.push({token:key,around:t.slice(Math.max(0,at-145),at+200).replace(/[\r\n]/g,' ')});
 }
 console.log('[PUBLIC ASSET MATH CHECK]',JSON.stringify({file:new URL(path).pathname,len:t.length,counts:count,snippets}).slice(0,2500));
 const file=new URL(path).pathname;
 if(file.includes('93050')||file.includes('a06d7d')||file.includes('cfe5db')){
  const needles=file.includes('cfe5db')?
   ['Math.trunc((0,R.getSorceryScaling)','getSorceryScalingInt','Math.trunc(','glintstone']:
   ['function nf(','function ng(','function nm(','function nl(','getSorceryScaling', 'Math.trunc'];
  for(const n of needles){
   let i=t.indexOf(n),count=0;
   while(i>=0&&count<2){
    console.log('[MATH FUNCTION WINDOW]',JSON.stringify({file,needle:n,position:i,code:t.slice(Math.max(0,i-240),i+1650)}).slice(0,2300));
    i=t.indexOf(n,i+n.length);count++;
   }
  }
 }

 }catch(e){console.log('[ASSET FETCH ERROR]',String(e).slice(0,120))}
}
