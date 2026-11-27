const allowedCourses={influenza:4,vsr:2,toxocara:3};
const progressHeaders={'Cache-Control':'private, no-store','Content-Type':'application/json; charset=utf-8'};

function progressResponse(body,status=200){
 return new Response(JSON.stringify(body),{status,headers:progressHeaders});
}

async function readProgress(db,userId){
 const {results}=await db.prepare('SELECT course_id, cleared, correct FROM course_progress WHERE user_id = ?').bind(userId).all();
 return Object.fromEntries(results.map(({course_id,cleared,correct})=>[course_id,{cleared,correct}]));
}

async function updateProgress(db,userId,request){
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return progressResponse({error:'json_required'},415);
 const text=await request.text();
 if(text.length>2048)return progressResponse({error:'too_large'},413);
 let updates;
 try{updates=JSON.parse(text);}catch{return progressResponse({error:'invalid_json'},400);}
 if(!updates||typeof updates!=='object'||Array.isArray(updates))return progressResponse({error:'invalid_progress'},400);
 const statements=[];
 const upsert='INSERT INTO course_progress (user_id, course_id, cleared, correct) VALUES (?, ?, ?, ?) '+
  'ON CONFLICT(user_id, course_id) DO UPDATE SET cleared = MAX(cleared, excluded.cleared), correct = MAX(correct, excluded.correct)';
 for(const [id,progress] of Object.entries(updates)){
  const {cleared,correct}=progress??{};
  if(!Object.hasOwn(allowedCourses,id)||!Number.isInteger(cleared)||cleared<0||cleared>allowedCourses[id]||
     !Number.isInteger(correct)||correct<0||correct>100)return progressResponse({error:'invalid_progress'},400);
  statements.push(db.prepare(upsert).bind(userId,id,cleared,correct));
 }
 if(statements.length)await db.batch(statements);
 return progressResponse(await readProgress(db,userId));
}

async function handleProgress(request,env){
 const userId=request.headers.get('oai-authenticated-user-id');
 if(!userId)return progressResponse({error:'sign_in_required'},401);
 if(!['GET','POST'].includes(request.method))return progressResponse({error:'method_not_allowed'},405);
 if(!env.DB)return progressResponse({error:'unavailable'},503);
 try{
  return request.method==='POST'?await updateProgress(env.DB,userId,request):
   progressResponse(await readProgress(env.DB,userId));
 }catch{return progressResponse({error:'unavailable'},503);}
}

export default {
 async fetch(request,env){
  const path=new URL(request.url).pathname;
  if(path==='/api/progresso')return handleProgress(request,env);
  if(!['GET','HEAD'].includes(request.method))return new Response('Método inválido',{status:405});
  const key=path==='/'?'/index.html':path;
  if(!Object.hasOwn(SITE_ASSETS,key))return new Response('Página não encontrada',{status:404});
  const {type,base64}=SITE_ASSETS[key];
  const body=request.method==='HEAD'?null:Uint8Array.from(atob(base64),character=>character.charCodeAt(0));
  return new Response(body,{headers:{'Content-Type':type,'Cache-Control':'private, max-age=0, must-revalidate'}});
 }
};
