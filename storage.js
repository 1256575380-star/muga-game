/* Retains v0.1 IndexedDB/JSON saves. A synchronous journal survives page teardown. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MUGAStorage=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const ACTIVE='muga-active-slot',PREFIX='muga-slot-v2-',LEGACY='muga-fallback';
  const copy=x=>JSON.parse(JSON.stringify(x));
  function create({local=null,indexedDB=null,validate=x=>x,serialize=JSON.stringify,now=Date.now,timeout=1800}={}){
    let db=null,records=[],queue=Promise.resolve(),clock=0;
    const read=k=>{try{return JSON.parse(local?.getItem(k)||'null');}catch{return null;}};
    const write=(k,v)=>{try{if(!local)return false;local.setItem(k,serialize(v));return true;}catch{return false;}};
    const stamp=()=>clock=Math.max(now(),clock+1);
    const valid=x=>{try{return validate(copy(x));}catch{return null;}};
    function normalise(r){if(!r||![1,2,3].includes(r.id))return null;const current=valid(r.state),previous=r.previous?valid(r.previous):null;if(!current&&!previous)return null;return {id:r.id,state:current||previous,previous:current?previous:null,updated:Number(r.updated)||0,recovered:!current};}
    function merge(all){const merged=new Map();for(const source of all){const r=normalise(source);if(!r)continue;const old=merged.get(r.id);if(!old||r.updated>old.updated){const prior=old&&(JSON.stringify(old.state)===JSON.stringify(r.state)?old.previous:old.state);merged.set(r.id,{...r,previous:r.previous||prior||null});}else if(!old.previous&&r.previous)old.previous=r.previous;}records=[...merged.values()];return records;}
    function journal(r){return write(PREFIX+r.id,{id:r.id,state:r.state,updated:r.updated});}
    function activate(id){if([1,2,3].includes(id))write(ACTIVE,{id,at:stamp()});}
    function open(){return new Promise(resolve=>{if(!indexedDB){resolve();return;}let done=false;const finish=()=>{if(done)return;done=true;clearTimeout(timer);resolve();};const timer=setTimeout(finish,timeout);try{const req=indexedDB.open('muga-office-v1',1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('slots'))req.result.createObjectStore('slots',{keyPath:'id'});};req.onsuccess=()=>{if(done){req.result.close();return;}db=req.result;db.onversionchange=()=>{db.close();db=null;};finish();};req.onerror=finish;req.onblocked=finish;}catch{finish();}});}
    function readDB(){return new Promise(resolve=>{if(!db){resolve([]);return;}let done=false;const finish=v=>{if(done)return;done=true;clearTimeout(timer);resolve(v);};const timer=setTimeout(()=>finish([]),timeout);try{const req=db.transaction('slots').objectStore('slots').getAll();req.onsuccess=()=>finish(req.result);req.onerror=()=>finish([]);}catch{finish([]);}});}
    function putDB(record){return new Promise(resolve=>{if(!db){resolve(false);return;}let tx,done=false;const finish=ok=>{if(done)return;done=true;clearTimeout(timer);resolve(ok);};const timer=setTimeout(()=>{try{tx?.abort();}catch{}finish(false);},timeout);try{tx=db.transaction('slots','readwrite');tx.objectStore('slots').put(record);tx.oncomplete=()=>finish(true);tx.onerror=()=>finish(false);tx.onabort=()=>finish(false);}catch{finish(false);}});}
    async function init(){await open();const old=read(LEGACY);const backups=[1,2,3].map(id=>read(PREFIX+id));merge([...(await readDB()),...(Array.isArray(old)?old:[]),...backups]);clock=Math.max(clock,...records.map(r=>r.updated));return records;}
    function checkpoint(state,id){if(!state)return false;const old=records.find(r=>r.id===id);const r={id,state:copy(state),previous:old?.previous||null,updated:stamp()};records=records.filter(x=>x.id!==id).concat(r);activate(id);return journal(r);}
    function save(state,id){const old=records.find(r=>r.id===id);const r={id,state:copy(state),previous:old?.state||null,updated:stamp()};records=records.filter(x=>x.id!==id).concat(r);const localOK=journal(r);activate(id);
      // Enqueue transactions in action order, but make the journal durable before yielding.
      const promise=queue.then(async()=>{const idbOK=await putDB(r);return {ok:localOK||idbOK,local:localOK,indexedDB:idbOK,record:r};});queue=promise.catch(()=>{});return promise;
    }
    function resume(){const preferred=read(ACTIVE)?.id;return records.find(r=>r.id===preferred)||records.slice().sort((a,b)=>b.updated-a.updated)[0]||null;}
    return {init,save,checkpoint,activate,resume,records:()=>records};
  }
  return {create};
});
