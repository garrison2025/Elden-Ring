import {cp,mkdir,rm,readFile,writeFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {injectToolNavigation} from './navigation.mjs';
const root=process.cwd(),dist=path.join(root,'dist'),source=path.join(root,'public');
const url=(process.env.SITE_URL||'').trim().replace(/\/$/,'');
if(url&&!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(url))throw Error('SITE_URL must be an HTTPS origin, e.g. https://example.com');
await rm(dist,{force:true,recursive:true});await cp(source,dist,{recursive:true});
async function pages(dir){const arr=[];for(const entry of await readdir(dir,{withFileTypes:true})){const child=path.join(dir,entry.name);if(entry.isDirectory())arr.push(...await pages(child));else if(entry.name==='index.html')arr.push(child)}return arr}
let indexed=[];
for(const file of await pages(dist)){
 let html=await readFile(file,'utf8');const uri=path.relative(dist,path.dirname(file)).split(path.sep).filter(Boolean).join('/');const pathname=uri?`/${uri}/`:'/';
 const intentionallyNoindex=uri==='weapon-ar-lab'||uri==='weapon-ar-validation'||uri==='weapon-data-workbench'||uri==='weapon-database'||uri==='validation-status'||uri==='respec-planner'||uri==='weapon-requirements'||uri==='armor-optimizer'||uri==='weapon-upgrade-calculator';
 const meta=intentionallyNoindex?'':(url?`<link rel="canonical" href="${url+pathname}">`:'<meta name="robots" content="noindex,follow">');
 html=html.replace('</head>',`${meta}</head>`);
 // Never index the developer-only synthetic AR fixture or verification test status.
 if(url&&!intentionallyNoindex)indexed.push(pathname);
 html=injectToolNavigation(html,uri);
 await writeFile(file,html,'utf8');
}
let robots=url?`User-agent: *\nAllow: /\nSitemap: ${url}/sitemap.xml\n`:'User-agent: *\nDisallow: /\n';
await writeFile(path.join(dist,'robots.txt'),robots);
if(url){const body=indexed.sort().map(p=>`  <url><loc>${url+p}</loc></url>`).join('\n');await writeFile(path.join(dist,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`)}
console.log(`Built ${indexed.length} indexable pages; ${url||'preview noindex'}. Output: dist/`);