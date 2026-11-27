const atlasProgress=(()=>{
 const key='atlas-viral-cursos-v1';
 const courses={};
 let limits={},mode='connecting',notify=()=>{},queued=false,saving=false;
 const bounded=(value,max)=>Number.isInteger(value)?Math.min(max,Math.max(0,value)):0;

 function restore(source){
  for(const [id,limit] of Object.entries(limits)){
   const row=source?.[id],prior=courses[id];
   courses[id]={
    cleared:Math.max(prior?.cleared??0,bounded(row?.cleared,limit)),
    correct:Math.max(prior?.correct??0,bounded(row?.correct,100))
   };
  }
 }

 function store(){
  try{localStorage.setItem(key,JSON.stringify(courses));}catch{}
 }

 async function synchronize(){
  queued=true;
  if(saving)return;
  saving=true;
  while(queued){
   queued=false;
   try{
    const response=await fetch('/api/progresso',{
     method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
     body:JSON.stringify(courses)
    });
    if(response.ok){
     restore(await response.json());
     store();
     mode=queued?'saving':'account';
    }else mode=response.status===401?'signin':'local';
   }catch{mode='local';}
   notify();
  }
  saving=false;
 }

 function init(courseLimits,onUpdate){
  limits=courseLimits;
  notify=onUpdate;
  let stored=null;
  try{stored=JSON.parse(localStorage.getItem(key));}catch{}
  restore(stored);
  notify();
  window.addEventListener('online',synchronize);
  synchronize();
 }

 function record(id,cleared,correct){
  const prior=courses[id];
  if(!prior||cleared<=prior.cleared&&correct<=prior.correct)return;
  restore({[id]:{cleared,correct}});
  store();
  if(mode==='account')mode='saving';
  notify();
  synchronize();
 }

 return {init,record,read:id=>courses[id],status:()=>mode};
})();
