import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportMemPalace, prepareMemPalace, searchMemPalace } from './mempalace.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const state='docs/contexto/estado.md';
const decisions='docs/decisoes';
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

function showHistory(query='', {limit=5, details=true}={}){
 const paths=matchingAreas(normalize(query)).flatMap(area=>area.arquivos);
 const args=['log','-'+limit,'--date=short','--format=%h %ad %s'];
 if(details)args.push('--name-only');
 if(paths.length)args.push('--',...unique(paths));
 else if(query)args.push('--fixed-strings','--regexp-ignore-case','--grep='+query);
 try{
  const text=execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  console.log(text||'Nenhum commit correspondente.');
 }catch{console.log('Histórico do Git indisponível nesta cópia.');}
}

function search(raw, {files=sources, limit=7}={}){
 const query=normalize(raw);
 const terms=unique(query.split(' ').filter(word=>word.length>1&&!commonWords.has(word)));
 const matched=matchingAreas(query);
 const related=unique(matched.flatMap(area=>[area.tema,...area.busca]).map(normalize))
  .filter(term=>!terms.includes(term));
 const nearby=new Set(matched.flatMap(area=>area.arquivos));
 const hits=[];
 for(const file of files){
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
 for(const hit of hits.slice(0,limit))console.log(hit.file+':'+hit.line+'  '+hit.excerpt);
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

function semantic(raw){
 if(!searchMemPalace(memoryCorpus(),raw)){
  console.log('\nBusca por texto');
  search(raw);
 }
}

function resume(raw){
 console.log(read(state).trim());
 if(!raw)return;
 console.log('\n## Arquivos da área');
 showArea(raw);
 console.log('\n## Decisões e instruções relacionadas');
 search(raw,{files:documents,limit:4});
 console.log('\n## Mudanças recentes no Git');
 showHistory(raw,{limit:3,details:false});
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
 retomar(){resume(query);},
 preparar(){if(!prepareMemPalace(memoryCorpus()))process.exitCode=1;},
 'exportar-mempalace'(){console.log(exportMemPalace(memoryCorpus()));}
};
if(Object.hasOwn(routes,command))routes[command]();
else{
 console.error('Use inicio, areas, area, buscar, historico, retomar, preparar, semantica ou exportar-mempalace.');
 process.exitCode=1;
}
