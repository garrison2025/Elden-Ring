import {validateArProfile} from './weapon-ar.mjs';
import {compareArObservations,validateObservationSet,arReportCsv} from './ar-validation.mjs';
import {AR_SYNTHETIC_FIXTURE} from '../data/ar-synthetic-fixture.mjs';
import {AR_SYNTHETIC_OBSERVATIONS} from '../data/ar-observation-example.mjs';
const byId=id=>document.getElementById(id);
const status=(s,bad=false)=>{byId('validation-feedback').textContent=s;byId('validation-feedback').className=bad?'feedback bad':'feedback';};
const profileEditor=byId('verification-profile'),casesEditor=byId('verification-cases');
let report=null;
profileEditor.value=JSON.stringify(AR_SYNTHETIC_FIXTURE,null,2);
casesEditor.value=JSON.stringify(AR_SYNTHETIC_OBSERVATIONS,null,2);
const setDownload=(enabled)=>{byId('download-report').disabled=!enabled;byId('download-csv').disabled=!enabled;};
function clear(){
 report=null;setDownload(false);byId('verification-rows').replaceChildren();
 for(const id of ['verification-total','verification-matches','verification-mismatches','verification-errors'])byId(id).textContent='—';
}
function run(){
 clear();
 try{
  if(profileEditor.value.length>950000||casesEditor.value.length>100000)throw new RangeError('Input too large for browser QA.');
  const profile=validateArProfile(JSON.parse(profileEditor.value));
  const observations=validateObservationSet(JSON.parse(casesEditor.value));
  report=compareArObservations(profile,observations);
  byId('verification-total').textContent=report.summary.total;
  byId('verification-matches').textContent=report.summary.matches;
  byId('verification-mismatches').textContent=report.summary.mismatches;
  byId('verification-errors').textContent=report.summary.errors;
  const tbody=byId('verification-rows');
  for(const item of report.items){
    const tr=document.createElement('tr');
    const values=[item.id,item.status,item.computed??'—',item.expected,item.delta??'—',item.error||'Unreviewed'];
    for(const value of values){const td=document.createElement('td');td.textContent=String(value);tr.append(td);}
    tbody.append(tr);
  }
  setDownload(true);
  status('Comparison complete. All entered observations remain UNREVIEWED; even exact matches are NOT game-client certification.');
 }catch(e){clear();status('Validation rejected: '+e.message,true);}
}
function download(text,name,type){
 const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');
 a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),3000);
}
byId('run-verification').addEventListener('click',run);
byId('restore-example').addEventListener('click',()=>{
 profileEditor.value=JSON.stringify(AR_SYNTHETIC_FIXTURE,null,2);
 casesEditor.value=JSON.stringify(AR_SYNTHETIC_OBSERVATIONS,null,2);
 run();
});
byId('download-report').addEventListener('click',()=>{
 if(report)download(JSON.stringify(report,null,2),'ar-validation-report.json','application/json');
});
byId('download-csv').addEventListener('click',()=>{
 if(report)download(arReportCsv(report),'ar-validation-cases.csv','text/csv;charset=utf-8');
});
for(const [inputId,editor,limit] of [['profile-upload',profileEditor,950000],['cases-upload',casesEditor,100000]]){
 byId(inputId).addEventListener('change',async e=>{
   const file=e.target.files?.[0];if(!file)return;
   try{if(file.size>limit)throw new Error('File exceeds '+Math.round(limit/1000)+' KB limit.');
     editor.value=await file.text();clear();status('File loaded in your browser. Click Run comparisons to validate.');}
   catch(err){status(err.message,true)}finally{e.target.value='';}
 });
}
run();
