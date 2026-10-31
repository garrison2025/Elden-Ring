import {join} from 'node:path';

/**
 * Chrome launched with --remote-debugging-port=0 writes its actually assigned
 * localhost port to this profile file. Using a fixed CI-wide port can attach
 * to a stale Chrome instance or fail due to a port collision.
 */
export function parseChromeDebugPort(text){
 if(typeof text!=='string')throw new RangeError('Chrome debug port file is missing.');
 const lines=text.trim().split(/\r?\n/);
 const port=lines[0];
 if(!/^[1-9][0-9]{0,4}$/.test(port)||Number(port)>65535)
  throw new RangeError('Chrome DevToolsActivePort does not contain a valid TCP port.');
 if(!/^\/devtools\/browser\/[A-Za-z0-9-]{8,120}$/.test(lines[1]??''))
  throw new RangeError('Chrome DevToolsActivePort is missing its browser endpoint.');
 return Number(port);
}

/**
 * Poll the port file + page discovery endpoint, never a guessed TCP port.
 * Dependencies are injectable for deterministic tests without launching Chrome.
 * The URL returned must refer to the exact assigned local port and a CDP page.
 */
export async function waitForChromePage({
 profile,readText,request,getExitReason=()=>null,
 timeoutMs=20_000,pollMs=150,now=Date.now,
 wait=ms=>new Promise(resolve=>setTimeout(resolve,ms))
}={}){
 if(typeof profile!=='string'||!profile||
    typeof readText!=='function'||typeof request!=='function'||
    typeof getExitReason!=='function'||typeof now!=='function'||
    typeof wait!=='function'||!Number.isInteger(timeoutMs)||timeoutMs<100||
    timeoutMs>120000||!Number.isInteger(pollMs)||pollMs<1||pollMs>5000)
  throw new RangeError('Invalid Chrome CDP startup polling configuration.');
 const deadline=now()+timeoutMs;
 let lastIssue='Chrome DevToolsActivePort file not yet available';
 do{
  const stopped=getExitReason();
  if(stopped)throw new Error('Chrome exited before CDP became ready: '+String(stopped).slice(0,160));
  try{
   const port=parseChromeDebugPort(await readText(join(profile,'DevToolsActivePort'),'utf8'));
   // Loopback only; never fetch another host or use the public network.
   const resp=await request('http://127.0.0.1:'+port+'/json/list',
    {signal:AbortSignal.timeout(1500)});
   if(!resp?.ok)throw new Error('CDP HTTP endpoint not ready');
   const targets=await resp.json();
   if(!Array.isArray(targets))throw new Error('CDP returned a non-array target list');
   const value=targets.find(target=>target?.type==='page')?.webSocketDebuggerUrl;
   if(!value)throw new Error('CDP has no page target yet');
   const ws=new URL(value);
   if(ws.protocol!=='ws:'||ws.hostname!=='127.0.0.1'||
      Number(ws.port)!==port||!ws.pathname.startsWith('/devtools/page/'))
    throw new Error('CDP page URL is not bound to the assigned local port');
   return ws.toString();
  }catch(e){
   lastIssue=String(e?.message??e).slice(0,190);
  }
  if(now()>=deadline)break;
  await wait(pollMs);
 }while(now()<deadline);
 throw new Error('Chrome CDP startup timed out ('+timeoutMs+'ms); last check: '+lastIssue);
}
