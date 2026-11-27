import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const state='docs/contexto/estado.md';
const decisions='docs/decisoes';
const generated=join(root,'.atlas-contexto');
const palace=join(generated,'palace');
const read=file=>readFileSync(join(root,file),'utf8');
const notes=readdirSync(join(root,decisions))
 .filter(file=>file.endsWith('.md')).sort().map(file=>join(decisions,file));
const documents=[state,'AGENTS.md',...notes];
const areas=JSON.parse(read('docs/contexto/areas.json'));
const unique=items=>[...new Set(items)];
const sources=unique([...documents,...areas.flatMap(area=>area.arquivos)])
 .filter(file=>existsSync(join(root,file)));
const normalize=text=>text.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase()
 .replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const contains=(text,term)=>term!==''&&(' '+text+' ').includes(' '+term+' ');
const commonWords=new Set(['a','o','de','da','do','das','dos','el','la','los','las','del','por','para','como','que','em','en','um','uma']);

function matchingAreas(query){
 return areas.filter(area=>[area.tema,...area.busca].some(term=>contains(query,normalize(term))));
}

function showHistory(query=''){
 const paths=matchingAreas(normalize(query)).flatMap(area=>area.arquivos);
 const args=['log','-5','--date=short','--format=%h %ad %s','--name-only'];
 if(paths.length)args.push('--',...unique(paths));
 else if(query)args.push('--fixed-strings','--regexp-ignore-case','--grep='+query);
 try{
  const text=execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  console.log(text||'Nenhum commit correspondente.');
 }catch{console.log('Histórico do Git indisponível nesta cópia.');}
}

function search(raw){
 const query=normalize(raw);
 const terms=unique(query.split(' ').filter(word=>word.length>1&&!commonWords.has(word)));
 const matched=matchingAreas(query);
 const related=unique(matched.flatMap(area=>[area.tema,...area.busca]).map(normalize))
  .filter(term=>!terms.includes(term));
 const nearby=new Set(matched.flatMap(area=>area.arquivos));
 const hits=[];
 for(const file of sources){
  const lines=read(file).split(/\r?\n/);
  let best=null;
  for(const [index,line] of lines.entries()){
   if(file==='README.md'&&line.startsWith('|')&&line.includes('npm run contexto'))continue;
   const text=normalize(line);
   const score=Number(contains(text,query))*18+
    terms.filter(term=>contains(text,term)).length*8+
    Math.min(4,related.filter(term=>contains(text,term)).length)*2;
   if(score&&(!best||score>best.score))best={file,line:index+1,excerpt:line.trim().slice(0,220),score};
  }
  if(best)hits.push({...best,score:best.score+Number(documents.includes(file))*4+Number(nearby.has(file))*3});
 }
 hits.sort((left,right)=>right.score-left.score||left.file.localeCompare(right.file));
 if(!hits.length){console.log('Nenhum trecho encontrado. Consulte os temas com npm run contexto -- areas.');return;}
 if(matched.length)console.log('Temas relacionados · '+matched.map(area=>area.tema).join(', '));
 for(const hit of hits.slice(0,7))console.log(hit.file+':'+hit.line+'  '+hit.excerpt);
}

function showArea(query){
 const matched=matchingAreas(normalize(query));
 if(!matched.length){console.log('Temas disponíveis · '+areas.map(area=>area.tema).join(', '));return;}
 for(const area of matched){
  console.log(area.tema+' · '+area.resumo);
  for(const file of area.arquivos)console.log('  '+file);
 }
}

function memoryCorpus(){
 const records=documents.map(file=>'## '+file+'\n\n'+read(file).trim());
 return '# Contexto do Atlas Viral\n\n'+records.join('\n\n')+'\n';
}

function exportMemPalace(corpus=memoryCorpus()){
 const directory=join(generated,'mempalace');
 mkdirSync(directory,{recursive:true});
 writeFileSync(join(directory,'atlas-viral.md'),corpus);
 return directory;
}

function runMemPalace(command,args){
 const options=['--palace',palace,'--wing','atlas-viral'];
 const result=spawnSync('mempalace',['--backend','chroma',command,...options,...args],{
  cwd:root,stdio:'inherit',env:{...process.env,MEMPALACE_EMBEDDING_MODEL:'embeddinggemma'}
 });
 if(result.error?.code==='ENOENT')console.error('MemPalace indisponível neste ambiente.');
 else if(result.error)console.error('Falha ao iniciar o MemPalace.');
 return result.status===0;
}

function semantic(raw){
 const corpus=memoryCorpus();
 const stamp=join(generated,'mempalace.sha256');
 const hash=createHash('sha256').update(corpus).digest('hex');
 const fresh=existsSync(palace)&&existsSync(stamp)&&readFileSync(stamp,'utf8')===hash;
 if(!fresh){
  const folder=exportMemPalace(corpus);
  if(!runMemPalace('mine',['--no-gitignore',folder])){search(raw);return;}
  writeFileSync(stamp,hash);
 }
 if(!runMemPalace('search',['--results','5','--',raw]))search(raw);
}

const [command='inicio',...args]=process.argv.slice(2);
const query=args.join(' ').trim();
const routes={
 inicio(){console.log(read(state).trim());},
 areas(){showArea('');},
 area(){showArea(query);},
 buscar(){if(query)search(query);else showArea('');},
 historico(){showHistory(query);},
 semantica(){if(query)semantic(query);else showArea('');},
 'exportar-mempalace'(){console.log(exportMemPalace());}
};
if(Object.hasOwn(routes,command))routes[command]();
else{
 console.error('Use inicio, areas, area, buscar, historico, semantica ou exportar-mempalace.');
 process.exitCode=1;
}
