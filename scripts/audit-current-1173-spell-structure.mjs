#!/usr/bin/env node
/** Reproducible publicly visible v1.17.3 spell-table read, no paid API.
 * Diagnostics expose only HTML tag structures around selected terms, not source table.
 */
const url='https://almanauts.com/eldenring/spells/';
const response=await fetch(url,{headers:{'Accept':'text/html','User-Agent':'Elden-Ring-Build-Lab-Data-QA/1.0'}});
if(!response.ok)throw Error('Public spell page HTTP '+response.status);
const html=await response.text();
const terms=['Black Flame','Ranni&#39;s Dark Moon','Ranni\'s Dark Moon','Glintstone Pebble','Comet Azur'];
console.log('[SPELL HTML STRUCTURE] '+JSON.stringify({bytes:html.length,trRows:(html.match(/<tr\b/gi)||[]).length,
 tableCount:(html.match(/<table\b/gi)||[]).length,
 has1173:/1\.17\.3/.test(html),hasBuild25827938:html.includes('25827938'),
 hasSpellHeading:html.includes('Spells'),
 snippets:terms.map(term=>{const i=html.indexOf(term);return {term,index:i,
    before:i<0?null:html.slice(Math.max(0,i-170),i).replace(/\s+/g,' ').slice(0,170),
    after:i<0?null:html.slice(i,i+410).replace(/\s+/g,' ').slice(0,410)}})}));
if(html.length<2000||!html.includes('25827938'))throw Error('Not an accepted versioned public HTML spell page');
