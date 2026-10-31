/**
 * Build-time navigation enhancement: avoids maintaining 14 near-identical
 * headers. Every static HTML page receives links to all calculators and weapon references.
 * The public/ source files remain simple and the output is crawlable HTML.
 */
const additional=[
 ['respec-planner/','Respec Planner'],
 ['weapon-requirements/','Weapon Requirements'],
 ['armor-optimizer/','Armor Optimizer'],
 ['weapon-upgrade-calculator/','Smithing Stones'],
 ['weapon-database/','Weapon Database'],
 ['weapon-ar-calculator/','Weapon AR Calculator']
];
export function injectToolNavigation(html,uri=''){
 if(typeof html!=='string')throw new TypeError('Expected HTML string.');
 if(html.includes('class="header-more"'))return html;
 const start=html.indexOf('<header class="site-header">'),end=html.indexOf('</header>',start);
 if(start<0||end<0)return html;
 let header=html.slice(start,end+9);
 const prefix=uri?'../':'';
 const links=additional.map(([href,label])=>'<a href="'+prefix+href+'">'+label+'</a>').join('');
 const marker='</nav><details class="mobile-menu">';
 if(!header.includes(marker))return html;
 header=header.replace(marker,
  '</nav><details class="header-more"><summary>More tools</summary><div class="header-more-list">'+
  links+'</div></details><details class="mobile-menu">');
 const mobile=header.match(/<details class="mobile-menu">[\s\S]*?<\/details>/);
 if(!mobile||!mobile[0].includes('</nav>'))throw new Error('Mobile navigation is missing.');
 header=header.replace(mobile[0],mobile[0].replace('</nav>',links+'</nav>'));
 return html.slice(0,start)+header+html.slice(end+9);
}
