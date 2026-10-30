/**
 * Hash a LOCAL, user-selected screenshot without uploading or retaining its
 * bytes. A SHA-256 match proves only byte-for-byte file identity, not that
 * the file is a genuine game screenshot or has been reviewed.
 */
const fail=message=>{throw new RangeError(message);};
export const SCREENSHOT_MAX_BYTES=12_000_000;
const printableFilename=v=>typeof v==='string'&&v.length>0&&v.length<=180&&
 !/[\\/\u0000-\u001f\u007f]/.test(v);
const hex=buffer=>Array.from(new Uint8Array(buffer),b=>b.toString(16).padStart(2,'0')).join('');

export function validateLocalScreenshotFingerprint(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||
  value.algorithm!=='SHA-256'||
  typeof value.sha256!=='string'||! /^[a-f0-9]{64}$/.test(value.sha256)||
  !Number.isInteger(value.byteLength)||value.byteLength<12||
  value.byteLength>SCREENSHOT_MAX_BYTES||
  !['image/png','image/jpeg','image/webp'].includes(value.mediaType)||
  !printableFilename(value.filename)||
  value.screenshotReviewed!==false||value.gameClientVerified!==false)
  fail('Invalid local screenshot fingerprint metadata.');
 return {algorithm:'SHA-256',sha256:value.sha256,
  byteLength:value.byteLength,mediaType:value.mediaType,filename:value.filename,
  screenshotReviewed:false,gameClientVerified:false};
}
export async function fingerprintLocalScreenshot(file,{subtle=globalThis.crypto?.subtle}={}){
 if(!file||typeof file!=='object'||!printableFilename(file.name)||
   !Number.isInteger(file.size)||file.size<12||file.size>SCREENSHOT_MAX_BYTES||
   typeof file.arrayBuffer!=='function')
  fail('Choose a PNG, JPEG or WebP screenshot under 12 MB.');
 const suffix=file.name.toLowerCase().split('.').pop();
 if(!['png','jpg','jpeg','webp'].includes(suffix))
  fail('Screenshot must have a .png, .jpg, .jpeg or .webp extension.');
 if(!subtle||typeof subtle.digest!=='function')
  fail('SHA-256 is unavailable in this browser (secure context required).');
 const bytes=await file.arrayBuffer();
 if(!(bytes instanceof ArrayBuffer)||bytes.byteLength!==file.size)
  fail('Screenshot file size changed during reading.');
 const view=new Uint8Array(bytes);
 const png=view.length>=8&&[137,80,78,71,13,10,26,10].every((n,i)=>view[i]===n);
 const jpeg=view[0]===255&&view[1]===216&&view[2]===255;
 const webp=view.length>=12&&[82,73,70,70].every((n,i)=>view[i]===n)&&
  [87,69,66,80].every((n,i)=>view[i+8]===n);
 const mediaType=png?'image/png':jpeg?'image/jpeg':webp?'image/webp':null;
 if(!mediaType)fail('File is not a recognized PNG, JPEG or WebP screenshot.');
 const validExtension=mediaType==='image/png'?suffix==='png':
  mediaType==='image/jpeg'?['jpg','jpeg'].includes(suffix):suffix==='webp';
 if(!validExtension||(file.type&&file.type!==mediaType))
  fail('Image signature, extension and MIME type do not agree.');
 const digest=await subtle.digest('SHA-256',bytes);
 return validateLocalScreenshotFingerprint({algorithm:'SHA-256',sha256:hex(digest),
  byteLength:bytes.byteLength,mediaType,filename:file.name,
  screenshotReviewed:false,gameClientVerified:false});
}
export async function compareLocalScreenshotToFingerprint(file,expected,options={}){
 const original=validateLocalScreenshotFingerprint(expected);
 const actual=await fingerprintLocalScreenshot(file,options);
 return {
  status:original.sha256===actual.sha256&&original.byteLength===actual.byteLength&&
   original.mediaType===actual.mediaType?'bytes-match':'bytes-mismatch',
  expectedSha256:original.sha256,actualSha256:actual.sha256,
  expectedByteLength:original.byteLength,actualByteLength:actual.byteLength,
  originalFilename:original.filename,selectedFilename:actual.filename,
  screenshotReviewed:false,gameClientVerified:false,
  note:'Byte identity only. Matching hashes never authenticate gameplay, App/Regulation version or screenshot content.'
 };
}
