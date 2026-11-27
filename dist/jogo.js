{
const root=document.getElementById('lobulo-game');
const $=id=>root.querySelector('#'+id);
const cv=$('cv'),stage=$('stage'),heroPortrait=$('heroPortrait');
let ctx=null, frameId=null, arenaObserver=null;
let frameTime=0, frameCredit=0, cellPaths=null, cellPattern='';
const FRAME_MS=1000/30;
const PIXEL_BUDGET=480000;
const R=330,A=R*Math.sqrt(3)/2,TAU=Math.PI*2,WEEK=18,END=180,MAXSEP=9,CAP=64,SPHMAX=24;
const reduce=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
const C={slide:'#f2d6e1',sinus:'#fbe9f0',speck:'#e9bccd',cell:'#e7a2b9',cell2:'#dd93ad',nuc:'#5b3a8c',inf:'#a77acb',infN:'#3e2463',dead:'#d8457a',rbc:'#c9343f',teal:'#0e8a8c',tealD:'#08605f',tealL:'#8fe0dc',kup:'#e0965a',kupN:'#7a3b1a',cd8:'#8db1e6',cd8N:'#2f2560',fib:'#3b6fb0',fibL:'#9cc0ea',wall:'#6a4a90',ink:'#2b1633',dane:'#c9f1ee',sph:'#e6eff7',sphS:'#8fa9c0',imm:'#4f8fdc',gem:'#8a5cc9'};
const NORM=[0,1,2,3,4,5].map(k=>[Math.cos(k*Math.PI/3),Math.sin(k*Math.PI/3)]);
const TOP=[
{id:'mor',name:'Morfologia',ctr:'Anticorpos anti-HBs',tiers:[
 ['Mira nos vírions','Os disparos escolhem a partícula de Dane e deixam as esferas de HBsAg por último.'],
 ['Neutralização','+50% de dano nos vírions e mais dano no chefe.'],
 ['Rajada neutralizante','+1 projétil, e cada disparo atravessa um alvo.']]},
{id:'pat',name:'Patogênese',ctr:'Linfócitos T CD8+',tiers:[
 ['Citotoxicidade','Você elimina hepatócitos infectados mais rápido e de mais longe.'],
 ['Citocinas (IFN-γ e TNF)','Curam hepatócitos infectados por perto, sem matá-los e sem cicatriz.'],
 ['Depuração ampliada','As citocinas agem num raio maior e mais depressa.']]},
{id:'cli',name:'Clínica',ctr:'Recuperação hepática',tiers:[
 ['Regeneração','Hepatócitos mortos voltam depois de alguns segundos.'],
 ['Resolução','A fibrose recua aos poucos.'],
 ['Recuperação completa','+30 de vigor máximo, cura 30 e a regeneração fica mais rápida.']]},
{id:'vac',name:'Vacinação',ctr:'Imunidade anti-HBs',tiers:[
 ['Vacina','30% dos hepatócitos saudáveis ficam imunes: os vírions que chegam neles são neutralizados.'],
 ['Resposta de memória','55% dos hepatócitos saudáveis ficam imunes.'],
 ['Vacina + HBIG','80% dos hepatócitos saudáveis ficam imunes.']]},
{id:'tra',name:'Tratamento',ctr:'Análogos de nucleos(t)ídeos',tiers:[
 ['Inibe a polimerase','Hepatócitos infectados fabricam vírions na metade da velocidade.'],
 ['Supressão profunda','A produção de vírions cai 80%. As células infectadas continuam lá, com cccDNA.'],
 ['Terapia contínua','Na arena, a produção de vírions cai 90%.']]}
];
const Q=[
{t:'mor',q:'Qual é o genoma do vírus da hepatite B?',a:['DNA circular, parcialmente de fita dupla (cerca de 3,2 kb)','RNA de fita simples, polaridade positiva','DNA de fita dupla linear e grande (cerca de 150 kb)'],e:'O HBV (família Hepadnaviridae) tem um genoma minúsculo: DNA circular relaxado, parcialmente de fita dupla, com cerca de 3,2 kb.'},
{t:'mor',q:'Como se chama a partícula completa e infecciosa do HBV?',a:['Partícula de Dane, com cerca de 42 nm','Esfera de HBsAg, com cerca de 22 nm','Corpúsculo de Councilman'],e:'A partícula de Dane tem envelope com HBsAg e, dentro, um capsídeo icosaédrico com o genoma e a polimerase. O corpúsculo de Councilman é um hepatócito apoptótico, não um vírus.'},
{t:'mor',q:'As esferas e os filamentos de 22 nm que sobram no sangue são formados por quê?',a:['Só por HBsAg, sem capsídeo nem genoma','Capsídeo com DNA viral dentro','Polimerase viral livre'],e:'Hepatócitos infectados secretam grandes quantidades dessas partículas subvirais. Sem capsídeo nem genoma, elas não infectam.'},
{t:'mor',q:'Pela classificação de Baltimore, onde fica o HBV?',a:['Grupo VII: DNA com transcrição reversa','Grupo I: DNA de fita dupla','Grupo VI: RNA com transcrição reversa'],e:'Mesmo com genoma de DNA, o HBV replica por um intermediário de RNA (pgRNA) que a polimerase viral transcreve de volta em DNA. O HIV, que também usa transcrição reversa, é do grupo VI.'},
{t:'mor',q:'Qual proteína forma o capsídeo icosaédrico do HBV?',a:['A proteína do core (HBcAg)','O antígeno de superfície (HBsAg)','A proteína X (HBx)'],e:'O capsídeo é montado pela proteína do core e guarda o genoma e a polimerase. O HBsAg fica no envelope.'},
{t:'mor',q:'Quantos quadros de leitura (ORFs) o genoma do HBV tem, e o que eles codificam?',a:['Quatro, sobrepostos: core, superfície, polimerase e HBx','Um só, que gera uma poliproteína única','Dois: um pro capsídeo e outro pro envelope'],e:'A sobreposição dos quadros de leitura aproveita ao máximo um genoma de apenas cerca de 3,2 kb.'},
{t:'pat',q:'Qual receptor do hepatócito o HBV usa para entrar na célula?',a:['NTCP, um transportador de ácidos biliares','CD4','ACE2'],e:'O domínio pré-S1 da proteína grande do envelope se liga ao NTCP, receptor específico do fígado. Isso ajuda a explicar o tropismo hepático do vírus.'},
{t:'pat',q:'Como o HBV copia o próprio genoma dentro do capsídeo?',a:['Transcreve o pgRNA de volta em DNA, com a polimerase viral (transcriptase reversa)','Copia o DNA só pela DNA polimerase da célula, de forma semiconservativa','Copia o RNA com uma RNA polimerase dependente de RNA'],e:'O pgRNA é transcrito reversamente em DNA pela polimerase viral. Diferente dos retrovírus, a integração no genoma da célula não é uma etapa obrigatória.'},
{t:'pat',q:'O que é o cccDNA do HBV?',a:['Um minicromossomo circular fechado no núcleo, molde da transcrição viral','O genoma em fita simples que vai dentro do vírion','Um RNA que codifica a polimerase'],e:'O DNA relaxado que vem no vírion é reparado no núcleo e vira cccDNA, molde do pgRNA e dos mRNAs. Os antivirais atuais não o eliminam, por isso a cura é rara.'},
{t:'pat',q:'Na hepatite B, de onde vem a maior parte da lesão do hepatócito?',a:['Da resposta imune, sobretudo linfócitos T CD8+ contra hepatócitos infectados','Do efeito citopático direto do vírus','De uma toxina produzida pelo HBV'],e:'O HBV é pouco ou nada citopático. Em estudos com chimpanzés, hepatócitos já infectados não mostravam lesão antes da chegada dos linfócitos T específicos.'},
{t:'pat',q:'Qual vírus precisa do HBsAg do HBV para formar o próprio envelope?',a:['Vírus da hepatite D (delta)','Vírus da hepatite C','Vírus da hepatite E'],e:'O HDV é um vírus defeituoso: usa o HBsAg como envelope e só infecta quem tem HBV, por coinfecção ou superinfecção. Ele também entra pelo NTCP.'},
{t:'pat',q:'Na hepatite B crônica, o que acontece com os linfócitos T CD8+ específicos contra o vírus?',a:['Ficam exauridos e respondem mal','Se multiplicam sem controle e eliminam o vírus','Desaparecem do fígado por completo'],e:'A exposição prolongada ao antígeno viral leva à exaustão das células T HBV-específicas, e a resposta fica fraca.'},
{t:'cli',q:'Em que fase da vida a infecção pelo HBV mais costuma cronificar?',a:['Em recém-nascidos (cerca de 90% cronificam)','Em adultos jovens (cerca de 90% cronificam)','Em idosos (quase todos cronificam)'],e:'Pelo CDC, cerca de 90% dos lactentes infectados e cerca de 30% das crianças infectadas entre 1 e 5 anos ficam cronicamente infectados. Entre adultos, cerca de 95% se recuperam.'},
{t:'cli',q:'Qual padrão sorológico indica hepatite B aguda?',a:['HBsAg positivo e anti-HBc IgM positivo','HBsAg negativo e anti-HBs positivo','HBsAg positivo e anti-HBc IgM negativo'],e:'O anti-HBc IgM indica infecção recente (menos de 6 meses). HBsAg positivo com IgM negativo sugere infecção crônica; anti-HBs com HBsAg negativo indica imunidade.'},
{t:'cli',q:'Qual padrão indica imunidade só por vacina, sem infecção prévia?',a:['Anti-HBs positivo, com anti-HBc total negativo','Anti-HBs positivo, com anti-HBc total positivo','HBsAg positivo, com anti-HBs negativo'],e:'A vacina só tem HBsAg, então gera anti-HBs mas não anti-HBc. Anti-HBs com anti-HBc positivo indica imunidade por infecção natural resolvida.'},
{t:'cli',q:'Na janela imunológica da hepatite B aguda (HBsAg já negativo e anti-HBs ainda negativo), qual marcador costuma estar positivo?',a:['Anti-HBc IgM','Anti-HBe','Anti-HBs'],e:'O anti-HBc IgM fecha o diagnóstico de infecção aguda quando o HBsAg já sumiu e o anti-HBs ainda não apareceu.'},
{t:'cli',q:'Qual destas NÃO é uma via de transmissão do HBV?',a:['Fecal-oral, por água e alimentos','Sexual','Perinatal, de mãe para filho'],e:'O HBV passa por sangue e fluidos corporais: vias parenteral, sexual e perinatal. A via fecal-oral é a das hepatites A e E.'},
{t:'cli',q:'O que a presença do HBeAg sugere?',a:['Replicação viral ativa e maior infectividade','Imunidade pela vacina','Cura da infecção'],e:'O HBeAg vem da proteína pré-core e é secretado. Sua presença marca replicação ativa; a perda do HBeAg com surgimento de anti-HBe (soroconversão) costuma acompanhar menor replicação.'},
{t:'vac',q:'Qual é o antígeno da vacina contra hepatite B?',a:['HBsAg recombinante','Vírus inteiro vivo atenuado','HBcAg purificado'],e:'A vacina é de subunidade: HBsAg recombinante, que induz anticorpos anti-HBs. Não contém vírus vivo nem o core.'},
{t:'vac',q:'Que nível de anti-HBs costuma indicar proteção após a vacina?',a:['Pelo menos 10 mUI/mL','Qualquer valor detectável, mesmo 1 mUI/mL','Acima de 10.000 mUI/mL'],e:'Em pessoas imunocompetentes, anti-HBs de 10 mUI/mL ou mais, medido 1 a 2 meses após o esquema completo, indica resposta protetora.'},
{t:'vac',q:'Como se previne a hepatite D?',a:['Vacinando contra a hepatite B','Com uma vacina específica contra o HDV','Com imunoglobulina anti-HDV'],e:'O HDV depende do HBsAg do HBV pra formar o envelope, então só infecta quem tem HBV. Prevenir a hepatite B previne a D.'},
{t:'vac',q:'Que tipo de imunidade a vacina dá?',a:['Ativa: anticorpos anti-HBs e memória imunológica','Passiva: anticorpos prontos de outra pessoa','Nenhuma imunidade humoral, só celular'],e:'A vacina estimula o próprio organismo a produzir anti-HBs e células de memória. Anticorpos prontos, como na HBIG, são imunidade passiva.'},
{t:'vac',q:'O que é a HBIG?',a:['Imunoglobulina com anticorpos anti-HBs prontos (imunidade passiva)','Uma vacina de vírus atenuado','Um antiviral oral'],e:'A imunoglobulina anti-hepatite B dá proteção imediata, mas temporária, porque os anticorpos já vêm prontos.'},
{t:'tra',q:'Qual é o alvo do tenofovir e do entecavir contra o HBV?',a:['A polimerase viral, na etapa de transcrição reversa','A protease viral','A integrase viral'],e:'São análogos de nucleos(t)ídeos que bloqueiam a transcrição reversa do pgRNA. Protease e integrase são alvos de antivirais contra outros vírus, como o HIV.'},
{t:'tra',q:'Os antivirais orais atuais costumam curar a hepatite B crônica?',a:['Não: suprimem o vírus, mas o cccDNA persiste','Sim, em seis meses de tratamento','Sim, eliminam o HBsAg na maioria dos casos'],e:'Eles reduzem a replicação e o risco de cirrose e câncer, mas não eliminam o cccDNA. Pela OMS, a maioria precisa manter o tratamento por toda a vida.'},
{t:'tra',q:'Qual é o tratamento específico da hepatite B aguda na maioria dos casos?',a:['Suporte clínico: não há antiviral específico de rotina','Tenofovir por 6 meses','Corticoide em doses altas'],e:'Segundo a OMS, não há tratamento específico para a hepatite B aguda: o cuidado é de suporte, e a maioria dos adultos se recupera.'},
{t:'tra',q:'Por que o tratamento da hepatite B crônica costuma ser tão prolongado?',a:['O cccDNA continua nos hepatócitos e pode reativar a replicação se o tratamento parar','O vírus fica latente no sangue, fora das células','Os antivirais só agem por poucas semanas'],e:'O cccDNA persiste no núcleo e serve de molde pra novas rodadas de replicação. Por isso o tratamento costuma ser longo, muitas vezes por tempo indefinido.'}
];
const COMBO={q:'Um recém-nascido de mãe HBsAg positiva: o que fazer logo ao nascer?',a:['Vacina e HBIG, em até 12 horas de vida','Só a vacina, a partir do segundo mês','Só observar e testar o bebê aos 6 meses'],e:'Segundo o CDC, vacina e HBIG nas primeiras 12 horas, em locais de aplicação diferentes. A vacina dá proteção duradoura; a HBIG cobre o intervalo até a vacina funcionar.'};
let S=null,W=1,H=1,dpr=1,sc=1,ox=0,oy=0,bg=null,best=0,curQ=null,curT=null,curCombo=false,answered=false,last=performance.now(),lastH='';
let seed=1;
const rnd=()=>(seed=seed*16807%2147483647)/2147483647;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const joy={on:false,id:null,ox:0,oy:0,x:0,y:0};
const keys=new Set();
const tEl=$('toast');
let toastQ=[],toastT=0,toastGap=0;
const hEl={day:$('day'),hpt:$('hpt'),hpb:$('hpb'),lvt:$('lvt'),fbt:$('fbt'),xpb:$('xpb')};

function inset(x,y){let m=1e9;for(const[nx,ny]of NORM)m=Math.min(m,A-(x*nx+y*ny));return m}
function clampHex(o,m){for(const[nx,ny]of NORM){const d=A-(o.x*nx+o.y*ny);if(d<m){o.x-=(m-d)*nx;o.y-=(m-d)*ny}}}
function edgeR(a){const cx=Math.cos(a),cy=Math.sin(a);let m=1e9;for(const[nx,ny]of NORM){const d=cx*nx+cy*ny;if(d>1e-6)m=Math.min(m,A/d)}return m}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function fibPct(){return Math.round(100*S.sep.length/MAXSEP)}
function pips(n){return '●'.repeat(n)+'○'.repeat(3-n)}

function setInf(s,c){if(c.st!==0)return false;c.st=1;c.p=0;c.imm=false;c.prod=4+rnd()*6;c.dec=1+rnd()*2;c.kt=0;c.cy=0;s.infected++;s.totalInf++;return true}
function newState(weapon=selectedWeapon){
 seed=(Date.now()%2147483646)+1;
 const tri=[0,1,2,3,4,5].map(k=>{const a=(-90+60*k)*Math.PI/180;return{x:Math.cos(a)*R*.9,y:Math.sin(a)*R*.9}});
 const cells=[];
 for(let k=0;k<24;k++){const a=k*TAU/24,ca=Math.cos(a),sa=Math.sin(a);for(let r=62,i=0;r<R;r+=24,i++){const j=(rnd()-.5)*6,x=ca*r-sa*j,y=sa*r+ca*j;if(inset(x,y)>18&&tri.every(t=>Math.hypot(t.x-x,t.y-y)>40))cells.push({x,y,r:7.4+rnd()*1.6,st:0,p:0,ph:rnd()*TAU,alt:(i+k)%2,imm:false,prod:0,dec:0,kt:0,cy:0,rg:0})}}
 const kup=[];let tries=0;
 while(kup.length<7&&tries++<500){const a=(Math.floor(rnd()*24)+.5)*TAU/24,r=110+rnd()*150,x=Math.cos(a)*r,y=Math.sin(a)*r;if(inset(x,y)>40&&kup.every(k=>Math.hypot(k.x-x,k.y-y)>95)&&Math.hypot(x,y+95)>120)kup.push({x,y,r:21,reach:64,ph:rnd()*TAU,grab:0,hit:0,cd:0,tg:null})}
 const rbc=[];for(let i=0;i<(reduce?0:24);i++){const a=(Math.floor(rnd()*24)+.5)*TAU/24;rbc.push({a,r:30+rnd()*(edgeR(a)-36),sp:26+rnd()*22})}
 const p={x:0,y:-95,r:15,hp:100,max:100,fx:0,fy:1,
  facing:1,walk:0,castAt:-1,castFacing:1};
 const s={phase:'intro',t:0,clock:0,tri,cells,kup,rbc,p,en:[],pr:[],orbs:[],sep:[],puff:[],
  build:createBuild(weapon),chest:null,draft:null,bossWins:0,nextBoss:0,
  st:{spd:145,cd:.20,shots:1,reach:13,mag:76,lvl:1,xp:0,need:3,aim:0,dmgE:1,pierce:0,bm:.8,killT:.7,cytoR:0,cytoT:3.2,regen:0,sepT:0,prodMul:1,immP:0},
  tier:{mor:0,pat:0,cli:0,vac:0,tra:0},
  pending:0,infected:0,totalInf:0,killsC:0,cured:0,kills:0,nSph:0,log:[],seen:{},hurt:0,used:new Set(),comboDone:false,immAll:0,
  waveT:7,boss:null,bossDown:false,cirr:false,sepClock:0};
 for(const k of shuffle([0,1,2,3,4,5]).slice(0,3)){const t=tri[k],near=cells.filter(c=>c.st===0&&Math.hypot(c.x-t.x,c.y-t.y)<120);if(near.length)setInf(s,near[Math.floor(rnd()*near.length)])}
 for(let i=0;i<2;i++)s.orbs.push({x:p.x+(rnd()-.5)*75,y:p.y+40+(rnd()-.5)*34,t:rnd()*TAU});
 s.orbs.push({x:p.x,y:p.y+110,t:rnd()*TAU});
 return s;
}
function mkDane(x,y){return{type:'dane',x,y,r:11,hp:20,max:20,sp:46+rnd()*12,dps:6,tgt:null,bind:0,rt:rnd()*.4,hit:0,ph:rnd()*TAU}}
function mkSph(x,y){const f=rnd()<.35;return{type:'sph',x,y,r:f?10:8.5,hp:12,max:12,sp:24+rnd()*10,dps:2.5,fil:f,hit:0,ph:rnd()*TAU,wob:rnd()*TAU}}
function mkBoss(x,y){
 const index=S.nextBoss;
 const boss=BOSSES[index];
 return {type:'boss',index,x,y,r:boss.radius,hp:boss.hp,max:boss.hp,sp:boss.speed,dps:boss.damage,
  hit:0,ph:0,windup:0,charge:2.3};
}
function posed(){S.en.push(mkDane(S.tri[0].x,S.tri[0].y+30),mkDane(S.tri[3].x,S.tri[3].y-30))}
function spawn(type){
 let t=null;for(let i=0;i<8;i++){const c=S.tri[Math.floor(rnd()*6)];if(dist(c,S.p)>150){t=c;break}}
 if(!t)return null;
 const e=type==='boss'?mkBoss(t.x*.69,t.y*.69):mkDane(t.x+(rnd()-.5)*24,t.y+(rnd()-.5)*24);
 S.en.push(e);return e;
}
function once(k,m){if(!S.seen[k]){S.seen[k]=1;toast(m)}}

function toast(m){toastQ.push(m)}
function tickToast(dt){if(toastT>0){toastT-=dt;if(toastT<=0){tEl.classList.remove('show');toastGap=.4}}else if(toastGap>0)toastGap-=dt;else if(toastQ.length){tEl.textContent=toastQ.shift();tEl.classList.add('show');toastT=2.8}}

function push(o,k,kr){const dx=o.x-k.x,dy=o.y-k.y,d=Math.hypot(dx,dy),m=o.r+kr;if(d>0&&d<m){o.x+=dx/d*(m-d);o.y+=dy/d*(m-d)}}
function pushWalls(o){for(const s of S.sep){const n=Math.floor(s.shown);for(let i=0;i<n;i++)push(o,s.nodes[i],8)}}
function wallHit(b){for(const s of S.sep){const n=Math.floor(s.shown);for(let i=0;i<n;i++){const w=s.nodes[i];if(Math.hypot(w.x-b.x,w.y-b.y)<10)return true}}return false}
function nearHealthy(e,md){let bc=null,bd=md;for(const c of S.cells)if(c.st===0){const d=dist(c,e);if(d<bd){bd=d;bc=c}}return bc}
function drop(x,y,n){for(let i=0;i<n;i++)S.orbs.push({x:x+(rnd()-.5)*14,y:y+(rnd()-.5)*14,t:rnd()*TAU})}
function kill(c){c.st=2;c.kt=0;c.cy=0;c.rg=S.st.regen||0;S.infected--;S.killsC++;drop(c.x,c.y,3);once('dead','Hepatócito infectado morto pela resposta imune: vira corpúsculo de Councilman, encolhido e bem eosinofílico.');if(S.killsC%6===0)addSeptum()}
function cure(c){c.st=0;c.kt=0;c.cy=0;S.infected--;S.cured++;drop(c.x,c.y,1);once('cure','As citocinas curaram o hepatócito sem matá-lo: nada de cicatriz.')}
function regrow(c){c.st=0;c.rg=0;c.imm=rnd()<S.st.immP}
function addSeptum(){if(S.sep.length>=MAXSEP){S.cirr=true;return}const i=Math.floor(rnd()*6),a=S.tri[i];const b=rnd()<.6?S.tri[(i+(rnd()<.5?1:5))%6]:{x:a.x*.38,y:a.y*.38};const L=dist(a,b),n=Math.floor(L/15),nodes=[];
 for(let s=1;s<n;s++){const x=a.x+(b.x-a.x)*s/n,y=a.y+(b.y-a.y)*s/n;if(Math.hypot(x-S.p.x,y-S.p.y)>50)nodes.push({x:x+(rnd()-.5)*4,y:y+(rnd()-.5)*4})}
 S.sep.push({nodes,shown:0});once('fib','Células estreladas ativadas: com a lesão vem a fibrose. Em azul, como no tricrômico de Masson.')}
function gain(n){
 const st=S.st;st.xp+=n;
 while(st.xp>=st.need){st.xp-=st.need;st.lvl++;st.need=Math.min(11,3+st.lvl);S.pending++}
}
function bind(e){
 const c=e.tgt;e.hp=0;e.gone=true;
 if(c.imm||S.immAll>0){S.puff.push({x:e.x,y:e.y,t:.5});once('imm','Anticorpos anti-HBs neutralizaram o vírion antes de ele infectar o hepatócito.');return}
 if(!setInf(S,c))return;once('inf','Um vírion se ligou ao NTCP e infectou um hepatócito: agora ele fabrica mais vírions.');
}
function reimmunize(){const hl=S.cells.filter(c=>c.st===0),want=Math.round(hl.length*S.st.immP);let have=hl.filter(c=>c.imm).length;for(const c of shuffle(hl.filter(c=>!c.imm))){if(have>=want)break;c.imm=true;have++}}
function applyTier(id,n){
 const st=S.st,P=S.p;
 if(id==='mor'){if(n===1){st.aim=1;st.bm=.94}else if(n===2){st.dmgE=1.35;st.bm=1}else{st.shots+=1;st.pierce=1;st.bm=1.1}}
 else if(id==='pat'){if(n===1){st.killT=.45;st.reach=22}else if(n===2){st.cytoR=60;st.cytoT=3.2}else{st.cytoR=95;st.cytoT=1.8}}
 else if(id==='cli'){if(n===1){st.regen=28;for(const c of S.cells)if(c.st===2)c.rg=st.regen}else if(n===2){st.sepT=20}else{P.max+=30;P.hp=Math.min(P.max,P.hp+30);st.regen=14}}
 else if(id==='vac'){st.immP=[0,.3,.55,.8][n];reimmunize()}
 else if(id==='tra'){st.prodMul=[1,.5,.2,.1][n]}
}

const WEAPONS = {
 dart: {name:'Dardo', icon:'➤', color:'#3663bd', desc:'Disparo preciso de longo alcance.',
  range:250, speed:370, damage:17, interval:.59, shots:1, spread:0,
  evolution:{name:'Dardo Cometa', desc:'Os dardos atravessam até dois alvos extras e chegam mais longe.'}},
 fan: {name:'Leque', icon:'⋔', color:'#aa501c', desc:'Três disparos em cone. Forte de perto.',
  range:178, speed:340, damage:12, interval:.72, shots:3, spread:.28,
  evolution:{name:'Leque Solar', desc:'Cinco disparos atravessam um alvo extra e cobrem um cone mais largo.'}},
 orbit: {name:'Órbita', icon:'◎', color:'#316b5d', desc:'Anel de energia que acerta ao redor.',
  range:97, speed:0, damage:19, interval:.70, shots:0, spread:0,
  evolution:{name:'Órbita Gêmea', desc:'Dois anéis. O segundo alcança mais longe e empurra os inimigos.'}}
};
const RARITIES = {
 common: {label:'Comum', weight:3},
 rare: {label:'Rara', weight:1},
 special: {label:'Especial'}
};
const SKILLS = {
 mark: {rarity:'common', name:'Marca', icon:'◇', color:'#8d4384', line:'Acertos marcam o alvo. Acertos seguintes dão +25% de dano.',
  next:'Marcas duram 5 segundos e dão +40% de dano.'},
 link: {rarity:'rare', name:'Ricochete', icon:'↝', color:'#4363ad', line:'Um disparo da rajada salta para um inimigo próximo, com 35% do dano.',
  next:'O salto alcança mais longe e causa 55% do dano.'},
 shield: {rarity:'rare', name:'Barreira', icon:'⬡', color:'#32776b', line:'Bloqueia um golpe e protege por 1 segundo. Recarga de 13 segundos.',
  next:'A Barreira recarrega em 9 segundos.'},
 pulse: {rarity:'rare', name:'Pulso', icon:'◉', color:'#7849a4', line:'A cada terceiro ataque, uma onda de dano sai de você.',
  next:'As ondas ficam maiores e causam mais dano.'},
 magnet: {rarity:'common', name:'Ímã', icon:'∪', color:'#87601b', line:'Atrai os fragmentos a uma distância maior.',
  next:'O alcance de coleta aumenta mais uma vez.'},
 reserve: {rarity:'common', name:'Reserva', icon:'✦', color:'#a34656', line:'Cada fragmento recupera 2 pontos de vigor.',
  next:'Cada fragmento recupera 3 pontos de vigor.'}
};
const FUSIONS = {
 constellation: {name:'Constelação', needs:['mark','link'], icon:'✧', color:'#7a45a4',
  desc:'Acertar um alvo marcado faz a rajada saltar e marcar até dois inimigos.'},
 counter: {name:'Contrapulso', needs:['shield','pulse'], icon:'⬡', color:'#286a69',
  desc:'Quando a Barreira bloqueia um golpe, solta uma onda forte que empurra os inimigos.'},
 amber: {name:'Circuito de Âmbar', needs:['magnet','reserve'], icon:'✦', color:'#976019',
  desc:'A cada quatro fragmentos, recupera 4 de vigor e dispara até três dardos.'},
 guided: {name:'Pulso Guiado', needs:['mark','pulse'], icon:'⊙', color:'#924265',
  desc:'O Pulso explode no alvo marcado da rajada e causa dano extra naquela área.'}
};
const BOSSES = [
 {name:'Sentinela', at:24, hp:129, speed:46, damage:12, radius:28, wave:89, period:4.1, color:'#a85d27',
  cue:'A Sentinela prepara um golpe circular. Saia do anel antes que ele feche.'},
 {name:'Guardião da Colmeia', at:69, hp:234, speed:39, damage:15, radius:35, wave:106, period:3.8, color:'#814b9a',
  cue:'O Guardião chama reforços. Desvie da onda e limpe o espaço ao redor.'},
 {name:'Foco viral', at:114, hp:342, speed:35, damage:17, radius:42, wave:117, period:3.5, color:'#0e8a8c',
  cue:'Chegou o Foco viral. Reduza os hepatócitos infectados para desacelerar a recuperação dele.'}
];
let selectedWeapon='dart';
const currentWeapon=()=>WEAPONS[S.build.weapon];
const skillRank=id=>S.build.skills[id]||0;
const ownsFusion=id=>S.build.fusions.has(id);
const weaponName=()=>S.build.evolved?currentWeapon().evolution.name:currentWeapon().name;

function createBuild(weapon){
 return {weapon,rank:1,evolved:false,skills:{},fusions:new Set(),casts:0,fragments:0,
  barrierReady:0,barrierUntil:0,fusionMissed:false,effects:[]};
}
function armStats(){
 const arm=currentWeapon(),build=S.build;
 const evolved=build.evolved;
 return {range:arm.range+(build.rank-1)*9+(evolved?29:0),
  speed:arm.speed, damage:arm.damage*(1+.24*(build.rank-1)+(evolved ? .40 : 0)),
  interval:arm.interval/(1+.12*(build.rank-1)+(evolved ? .18 : 0)),
  shots:arm.shots ? arm.shots+2*(S.st.shots-1)+(evolved&&build.weapon==='fan'?2:0) : 0,
  spread:arm.spread+(evolved&&build.weapon==='fan' ? .035 : 0),
  pierce:S.st.pierce+(evolved?(build.weapon==='dart'?2:1):0),color:arm.color};
}
function mend(amount){S.p.hp=Math.min(S.p.max,S.p.hp+amount)}
function enemiesNear(point,radius,skip=null){
 return S.en.filter(e=>e!==skip&&e.hp>0&&dist(e,point)<radius+e.r)
  .sort((a,b)=>dist(a,point)-dist(b,point));
}
function effect(visual){
 if(S.build.effects.length>=24)S.build.effects.shift();
 const duration=reduce ? .16 : .30;
 S.build.effects.push({...visual,life:duration,max:duration});
}
function ring(point,r,color){effect({x:point.x,y:point.y,r,color})}
function spark(from,to,color){effect({x:from.x,y:from.y,x2:to.x,y2:to.y,color})}
function harm(enemy,damage){
 const {dmgE,bm}=S.st;
 const modifier=enemy.type==='boss'?dmgE*bm:enemy.type==='dane'?dmgE:1;
 enemy.hp-=damage*modifier;enemy.hit=.10;
}
function strike(enemy,damage,canJump){
 const mark=skillRank('mark'),link=skillRank('link');
 const marked=mark&&enemy.markedUntil>S.t;
 harm(enemy,damage*(marked?(mark===1?1.25:1.40):1));
 if(mark)enemy.markedUntil=S.t+(mark===1?3:5);
 if(!link||!canJump)return;
 const constellation=marked&&ownsFusion('constellation');
 const nearby=enemiesNear(enemy,link===1?108:145,enemy).slice(0,constellation?2:1);
 for(const other of nearby){
  const factor=constellation ? .66 : link===1 ? .35 : .55;
  harm(other,damage*factor);
  if(constellation)other.markedUntil=S.t+(mark===1?3:5);
  spark(enemy,other,constellation?'#884ab3':'#4c77cd');
 }
}
function areaHit(point,radius,damage,color,pushBack=false){
 ring(point,radius,color);
 for(const enemy of enemiesNear(point,radius)){
  harm(enemy,damage);
  if(pushBack&&enemy.type!=='boss'){
   const distance=dist(enemy,point)||1;
   enemy.x+=(enemy.x-point.x)/distance*17;
   enemy.y+=(enemy.y-point.y)/distance*17;
   enemy.slowUntil=S.t+1.4;
   clampHex(enemy,enemy.r);
  }
 }
}
function projectile(from,angle,stats,canJump){
 if(S.pr.length>=72)return;
 S.pr.push({x:from.x,y:from.y,vx:Math.cos(angle)*stats.speed,vy:Math.sin(angle)*stats.speed,
  life:(stats.range+8)/stats.speed,dmg:stats.damage,pl:stats.pierce,hit:new Set(),
  color:stats.color,canJump});
}
function fireWeapon(dt){
 const st=S.st;st.cd-=dt;
 if(st.cd>0)return;
 const p=S.p, build=S.build, stats=armStats();
 const nearby=enemiesNear(p,stats.range);
 let target=nearby[0];
 if(st.aim)target=nearby.find(e=>e.type!=='sph')||target;
 if(!target){st.cd=.12;return}
 if(stats.shots){
  const angle=Math.atan2(target.y-p.y,target.x-p.x),mid=(stats.shots-1)/2;
  for(let i=0;i<stats.shots;i++)projectile(p,angle+(i-mid)*stats.spread,stats,i===mid);
 }else{
  ring(p,stats.range,stats.color);
  for(const e of nearby)strike(e,stats.damage,e===target);
  if(build.evolved)areaHit(p,stats.range+38,stats.damage*.47,'#57a78a',true);
 }
 p.castAt=S.t;
 p.castFacing=Math.sign(target.x-p.x)||p.facing;
 st.cd=stats.interval;
 build.casts++;
 const pulse=skillRank('pulse');
 if(pulse&&build.casts%3===0){
  const guided=ownsFusion('guided')&&target.markedUntil>S.t;
  areaHit(guided?target:p,pulse===1?79:111,(pulse===1?10:16)*(guided?1.75:1),
   guided?'#ab538d':'#8354ae');
 }
}
function gainFragment(){
 const reserve=skillRank('reserve');
 if(reserve)mend(reserve+1);
 S.build.fragments++;
 if(ownsFusion('amber')&&S.build.fragments%4===0){
  mend(4);ring(S.p,91,'#bc8125');
  const stats={range:188,speed:340,damage:15,pierce:0,color:'#b87c1d'};
  for(const e of enemiesNear(S.p,stats.range).slice(0,3)){
   projectile(S.p,Math.atan2(e.y-S.p.y,e.x-S.p.x),stats,false);
  }
 }
 gain(1);
}
function hurtPlayer(damage){
 const shield=skillRank('shield'), b=S.build;
 if(shield&&S.t<b.barrierUntil)return;
 if(shield&&S.t>=b.barrierReady){
  b.barrierReady=S.t+(shield===1?13:9);b.barrierUntil=S.t+1;
  if(ownsFusion('counter'))areaHit(S.p,136,34,'#367f77',true);
  else ring(S.p,42,'#458475');
  return;
 }
 S.p.hp-=damage;S.hurt=.18;
}
function drawBuild(){
 const p=S.p,b=S.build;
 if(b.weapon==='orbit'){
  ctx.strokeStyle=b.evolved?'rgba(36,109,86,.68)':'rgba(44,110,85,.38)';
  ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,armStats().range,0,TAU);ctx.stroke();
 }
 if(skillRank('shield')&&(S.t>=b.barrierReady||S.t<b.barrierUntil)){
  ctx.strokeStyle='#237260';ctx.lineWidth=2.2;ctx.beginPath();ctx.arc(p.x,p.y,24,0,TAU);ctx.stroke();
 }
 for(const fx of b.effects){
  ctx.save();ctx.globalAlpha=Math.min(1,fx.life/fx.max+.13);ctx.strokeStyle=fx.color;
  ctx.lineWidth=fx.r?3.6:4;ctx.beginPath();
  if(fx.r)ctx.arc(fx.x,fx.y,fx.r*(reduce?1:1-.31*(fx.life/fx.max)),0,TAU);
  else{ctx.moveTo(fx.x,fx.y);ctx.lineTo(fx.x2,fx.y2)}
  ctx.stroke();ctx.restore();
 }
}
function tickBuild(dt){
 for(const fx of S.build.effects)fx.life-=dt;
 S.build.effects=S.build.effects.filter(fx=>fx.life>0);
}
function moveBoss(e,dt){
 const boss=BOSSES[e.index],p=S.p;
 if(e.windup>0){
  e.windup-=dt;
  if(e.windup<=0){
   ring(e,boss.wave,boss.color);
   if(dist(e,p)<boss.wave+p.r)hurtPlayer(boss.damage);
   if(e.index>0){
    for(let i=0;i<2&&S.en.length<CAP;i++){
     const a=rnd()*TAU;S.en.push(mkSph(e.x+Math.cos(a)*e.r,e.y+Math.sin(a)*e.r));
    }
   }
  }
  return;
 }
 e.charge-=dt;
 if(e.charge<=0&&dist(e,p)<boss.wave+42){
  e.charge=boss.period;e.windup=.87;return;
 }
 const distance=dist(e,p)||1;
 const speed=e.sp*(e.slowUntil>S.t ? .6 : 1);
 e.x+=(p.x-e.x)/distance*speed*dt;e.y+=(p.y-e.y)/distance*speed*dt;
 if(e.index===BOSSES.length-1)e.hp=Math.min(e.max,e.hp+Math.min(2.7,.29*S.infected)*dt);
}
function skillCard(id){
 const s=SKILLS[id],rank=skillRank(id);
 const partner=Object.values(FUSIONS).find(f=>!rank&&f.needs.includes(id)&&
  f.needs.some(need=>need!==id&&skillRank(need)));
 return {kind:'skill',id,rarity:s.rarity,title:s.name,label:rank?'Nível 2':'Nova habilidade',
  desc:(rank?s.next:s.line)+(partner?' Completa a receita de '+partner.name+'.':''),icon:s.icon,color:s.color};
}
function trainingCard(){
 return {kind:'train',rarity:'common',title:'Afiar '+currentWeapon().name,label:'Arma · nível '+(S.build.rank+1),
  desc:'Mais dano, alcance e frequência de ataque.',icon:currentWeapon().icon,color:currentWeapon().color};
}
const recoveryCard=()=>({kind:'recover',title:'Fôlego extra',label:'Vigor',desc:'Recupere 30 de vigor e aumente seu máximo em 8.',
 icon:'＋',color:'#ae4a56'});
const coinCard=()=>({kind:'coins',title:'Bolsa da equipe',label:'Recompensa',desc:'18 moedas para recrutar e treinar na base.',
 icon:'●',color:'#92701e'});
function availableSkills(){
 return Object.keys(SKILLS).filter(id=>skillRank(id)<2);
}
function rollSkills(ids,count){
 const pool=ids.slice();
 const picks=[];
 while(pool.length&&picks.length<count){
  const weight=id=>RARITIES[SKILLS[id].rarity].weight;
  let roll=rnd()*pool.reduce((total,id)=>total+weight(id),0);
  const index=pool.findIndex(id=>{roll-=weight(id);return roll<0});
  picks.push(pool.splice(index,1)[0]);
 }
 return picks;
}
function draftSkills(){
 const pool=availableSkills();
 const partners=shuffle([...new Set(Object.values(FUSIONS).flatMap(f=>
  f.needs.filter(id=>!skillRank(id)&&f.needs.some(other=>skillRank(other)))))]);
 const lead=partners[0];
 const cards=rollSkills(pool.filter(id=>id!==lead),lead?2:3).map(skillCard);
 if(lead)cards.unshift(skillCard(lead));
 if(S.build.rank<3&&(S.st.lvl>=3||cards.length<3))cards.splice(2,1,trainingCard());
 if(cards.length<3)cards.push(recoveryCard());
 if(cards.length<3)cards.push(coinCard());
 return cards;
}
function bossCards(){
 const eligible=shuffle(Object.keys(FUSIONS).filter(id=>!ownsFusion(id)&&FUSIONS[id].needs.every(skillRank)));
 const cards=[];
 if(eligible.length){
  if(S.build.fusionMissed||S.chest.index===BOSSES.length-1||rnd()<.40){
   const id=eligible[0], f=FUSIONS[id];
   cards.push({kind:'fusion',id,rarity:'special',title:f.name,label:'Fusão',desc:f.desc,icon:f.icon,color:f.color});
   S.build.fusionMissed=false;
  }else S.build.fusionMissed=true;
 }
 const arm=currentWeapon();
 if(!S.build.evolved&&S.build.rank>=2){
  cards.push({kind:'evolve',rarity:'special',title:arm.evolution.name,label:'Evolução da arma',desc:arm.evolution.desc,icon:arm.icon,color:arm.color});
 }
 const pool=[recoveryCard(),coinCard()];
 if(S.build.rank<3)pool.push(trainingCard());
 const [next]=rollSkills(availableSkills(),1);
 if(next)pool.push(skillCard(next));
 if(cards.length<2)cards.push(...shuffle(pool).slice(0,2-cards.length));
 cards.push({kind:'surprise',title:'Baú fechado',label:'Sorteio',desc:'Pode trazer vigor, moedas, uma habilidade ou um treino de arma.',
  icon:'✧',color:'#6a548d'});
 return cards;
}
function learn(card){
 const b=S.build;
 switch(card.kind){
  case 'skill':
   b.skills[card.id]=skillRank(card.id)+1;
   return SKILLS[card.id].name+' · nível '+b.skills[card.id];
  case 'train':
   b.rank++;
   return currentWeapon().name+' · nível '+b.rank;
  case 'fusion':
   if(card.id==='amber')b.fragments=0;
   b.fusions.add(card.id);crew.discoverFusion(card.id);
   return FUSIONS[card.id].name+' · fusão';
  case 'evolve':
   b.evolved=true;
   return weaponName()+' · evolução';
  case 'recover':
   S.p.max+=8;mend(30);
   return 'Fôlego extra · +8 vigor máximo';
  case 'coins':
   crew.rewardCoins(18);
   return '+18 moedas para a equipe';
  case 'surprise': {
   const pool=[recoveryCard(),coinCard()];
   if(b.rank<3)pool.push(trainingCard());
   const [next]=rollSkills(availableSkills(),1);
   if(next)pool.push(skillCard(next));
   return 'Baú: '+learn(shuffle(pool)[0]);
  }
 }
}
function showIntro(){
 if(S?.phase==='play')return;
 S=null;lastH='';keys.clear();joy.on=false;
 toastQ=[];toastT=0;toastGap=0;tEl.classList.remove('show');
 $('intro').hidden=false;$('lv').hidden=true;$('pause').hidden=true;$('end').hidden=true;
 $('pauseBtn').disabled=true;$('crewHud').disabled=false;
 $('arenaNotice').hidden=true;$('arenaRoster').hidden=true;$('hud').hidden=true;
 hEl.day.textContent='Semana 1';hEl.hpt.textContent='100/100';hEl.hpb.style.width='100%';
 hEl.lvt.textContent='Nível 1';hEl.xpb.style.width='0%';hEl.fbt.textContent='Chefes 0/'+BOSSES.length;
 renderArsenal();syncArena();
}
function rarityBadge(rarity){
 const badge=document.createElement('span');
 badge.className='rarity-badge';badge.dataset.rarity=rarity;
 badge.textContent=RARITIES[rarity].label;
 return badge;
}
function optionButton(card,handler){
 const button=document.createElement('button');button.type='button';
 button.className='build-card';button.dataset.kind=card.kind||'';
 if(card.id)button.dataset.choice=card.id;
 if(card.rarity)button.dataset.rarity=card.rarity;
 button.style.setProperty('--ability-color',card.color);
 const icon=document.createElement('span');icon.className='build-icon';icon.setAttribute('aria-hidden','true');icon.textContent=card.icon;
 const title=document.createElement('strong');title.textContent=card.title;
 const desc=document.createElement('span');desc.className='build-desc';desc.textContent=card.desc;
 const text=document.createElement('span');text.className='build-copy';
 if(card.rarity||card.label){
  const meta=document.createElement('span');meta.className='build-meta';
  if(card.rarity)meta.append(rarityBadge(card.rarity));
  if(card.label){
   const label=document.createElement('span');label.className='build-kicker';label.textContent=card.label;
   meta.append(label);
  }
  text.append(meta);
 }
 text.append(title,desc);button.append(icon,text);
 button.addEventListener('click',handler);return button;
}
function renderArsenal(){
 const list=$('arsenalChoices');list.textContent='';
 for(const [id,arm] of Object.entries(WEAPONS)){
  const button=optionButton({kind:'arm',id,title:arm.name,desc:arm.desc,color:arm.color,icon:arm.icon},()=>{
   selectedWeapon=id;
   for(const current of list.children)current.setAttribute('aria-pressed',String(current.dataset.choice===id));
  });
  button.setAttribute('aria-pressed',String(selectedWeapon===id));list.append(button);
 }
 const found=crew.fusionsFound();
 $('fusionCount').textContent='Fusões descobertas '+found.length+'/'+Object.keys(FUSIONS).length;
 const recipes=$('fusionRecipes');recipes.textContent='';
 for(const [id,fusion] of Object.entries(FUSIONS)){
  const li=document.createElement('li');
  const combination=fusion.needs.map(skill=>SKILLS[skill].name).join(' + ');
  li.textContent=found.includes(id)?fusion.name+' · '+combination:combination;
  recipes.append(li);
 }
}
function setupChoice(title,label,hint){
 S.phase='level';joy.on=false;answered=false;
 $('lvTag').textContent=label;$('qText').textContent=title;
 $('draftHint').textContent=hint;$('draftHint').hidden=!hint;
 $('opts').textContent='';$('fb').hidden=true;$('fb').textContent='';$('contBtn').hidden=true;
 $('studyBtn').hidden=true;
 const box=$('ups');box.textContent='';box.hidden=false;
 $('lv').hidden=false;syncArena();return box;
}
function showDraft(cards,chest=null){
 const draft={cards,chest,chosen:false};S.draft=draft;
 const ready=Object.entries(FUSIONS).filter(([id,f])=>!ownsFusion(id)&&f.needs.every(skillRank)).map(([,f])=>f.name);
 const hint=ready.length?'Pode aparecer após um chefe: '+ready.join(', ')+'.':
  'Combine habilidades para abrir fusões nos chefes.';
 const box=setupChoice(chest?chest.name+' caiu':'Escolha uma melhoria',
  chest?'Recompensa do chefe':'Nível '+(S.st.lvl-S.pending+1),
  chest?'Escolha uma recompensa.':hint);
 for(const card of cards)box.append(optionButton(card,()=>{
  if(S.phase!=='level'||S.draft!==draft||draft.chosen)return;
  draft.chosen=true;
  toast(learn(card));
  if(chest){S.chest=null;continueRun()}
  else closeLevel();
 }));
 $('studyBtn').hidden=!!chest||!TOP.some(t=>S.tier[t.id]<3);
 box.firstElementChild?.focus({preventScroll:true});
}
function openLevel(){showDraft(draftSkills())}
function openStudy(){
 if(S.phase!=='level'||!S.draft||S.draft.chest||S.draft.chosen)return;
 const draft=S.draft;
 const box=setupChoice('Escolha um tema de HBV','Pergunta de virologia','Um acerto vale uma contramedida e 4 moedas.');
 for(const t of TOP.filter(t=>S.tier[t.id]<3)){
  const tier=t.tiers[S.tier[t.id]];
  box.append(optionButton({title:t.name,desc:tier[0]+' · '+tier[1],color:'#665199',icon:'?'},()=>{
   if(S.phase!=='level'||S.draft!==draft||draft.chosen)return;
   draft.chosen=true;startQ({t});
  }));
 }
 if(!S.comboDone&&S.tier.vac>0&&S.tier.mor>0){
  box.append(optionButton({title:'Profilaxia neonatal',desc:'Pergunta especial sobre vacinação e imunoglobulina.',
   color:'#316b5d',icon:'＋'},()=>{
   if(S.phase!=='level'||S.draft!==draft||draft.chosen)return;
   draft.chosen=true;startQ({combo:true});
  }));
 }
 const back=document.createElement('button');back.type='button';back.className='arena-button ghost';
 back.textContent='Voltar às melhorias';back.addEventListener('click',()=>showDraft(draft.cards));box.append(back);
 box.firstElementChild?.focus({preventScroll:true});
}
function continueRun(){
 S.draft=null;
 if(S.chest){showDraft(bossCards(),S.chest);return}
 if(S.pending>0){openLevel();return}
 $('lv').hidden=true;S.phase='play';syncArena();
}
function describeBuild(list){
 list.textContent='';
 const rows=[{title:weaponName()+' · nível '+S.build.rank,rarity:S.build.evolved?'special':null}];
 for(const [id,skill] of Object.entries(SKILLS)){
  const rank=skillRank(id);
  if(rank)rows.push({title:skill.name+' · nível '+rank,rarity:skill.rarity});
 }
 for(const id of S.build.fusions)rows.push({title:FUSIONS[id].name+' · fusão',rarity:'special'});
 for(const t of TOP)if(S.tier[t.id])rows.push({title:t.tiers[S.tier[t.id]-1][0]+' · revisão de HBV'});
 for(const {title,rarity} of rows){
  const li=document.createElement('li');li.className='none';li.textContent=title;
  if(rarity)li.append(' ',rarityBadge(rarity));
  list.append(li);
 }
}


function update(dt){
 const P=S.p,st=S.st;S.t+=dt;S.hurt=Math.max(0,S.hurt-dt);S.immAll=Math.max(0,S.immAll-dt);
 let mx=0,my=0;
 if(joy.on){const dx=joy.x-joy.ox,dy=joy.y-joy.oy,l=Math.hypot(dx,dy);if(l>6){const m=Math.min(1,l/42);mx=dx/l*m;my=dy/l*m}}
 if(keys.has('arrowleft')||keys.has('a'))mx-=1;
 if(keys.has('arrowright')||keys.has('d'))mx+=1;
 if(keys.has('arrowup')||keys.has('w'))my-=1;
 if(keys.has('arrowdown')||keys.has('s'))my+=1;
 const ml=Math.hypot(mx,my);if(ml>1){mx/=ml;my/=ml}
 P.x+=mx*st.spd*dt;P.y+=my*st.spd*dt;
 P.walk=Math.min(1,ml);
 if(ml>.1){P.fx=mx;P.fy=my}
 if(Math.abs(mx)>.1)P.facing=Math.sign(mx);
 for(const k of S.kup)push(P,k,k.r);
 pushWalls(P);clampHex(P,P.r+4);
 if(S.hurt<=0)P.hp=Math.min(P.max,P.hp+dt);
 const reach=P.r+st.reach, pickupRange=st.mag+crew.extraReach()+skillRank('magnet')*38;
 for(const c of S.cells){
  if(c.st===1){
   c.prod-=dt;if(c.prod<=0){c.prod=(9+rnd()*5)/st.prodMul;if(S.en.length<CAP)S.en.push(mkDane(c.x+(rnd()-.5)*8,c.y+(rnd()-.5)*8))}
   c.dec-=dt;if(c.dec<=0){c.dec=3.4+rnd()*2.4;if(S.en.length<CAP&&S.nSph<SPHMAX)S.en.push(mkSph(c.x+(rnd()-.5)*8,c.y+(rnd()-.5)*8))}
   const d=dist(c,P);
   if(d<reach+c.r){c.kt+=dt;if(c.kt>=st.killT){kill(c);continue}}else if(c.kt>0)c.kt=Math.max(0,c.kt-dt*1.5);
   if(st.cytoR>0){if(d<st.cytoR+c.r){c.cy+=dt;if(c.cy>=st.cytoT){cure(c);continue}}else if(c.cy>0)c.cy=Math.max(0,c.cy-dt*.7)}
  }else if(c.st===2&&st.regen>0){c.rg-=dt;if(c.rg<=0)regrow(c)}
 }
 if(st.sepT>0){S.sepClock+=dt;if(S.sepClock>=st.sepT){S.sepClock=0;if(S.sep.length){S.sep.pop();once('res','Resolução: a fibrose recuou um pouco.')}}}
 for(let i=S.orbs.length-1;i>=0;i--){const o=S.orbs[i],d=dist(o,P);if(d<pickupRange){const f=Math.min(1,(90+300*(1-d/pickupRange))*dt/Math.max(d,1));o.x+=(P.x-o.x)*f;o.y+=(P.y-o.y)*f}if(dist(o,P)<P.r+6){S.orbs.splice(i,1);gainFragment()}}
 if(!S.bossDown){S.waveT-=dt;if(S.waveT<=0){const n=2+Math.floor(S.t/25)+Math.min(3,Math.floor(S.infected/5));for(let i=0;i<n&&S.en.length<CAP;i++)spawn('dane');S.waveT=Math.max(5,9-3*S.t/END)}}
 const encounter=BOSSES[S.nextBoss];
 if(!S.boss&&encounter&&S.t>=encounter.at){
  const boss=spawn('boss');
  if(boss){S.boss=boss;S.nextBoss++;toast(encounter.cue)}
 }
 for(const e of S.en){
  if(e.hp<=0)continue;
  const speed=e.sp*(e.slowUntil>S.t ? .60 : 1);
  e.ph+=dt*3;e.hit=Math.max(0,e.hit-dt);
  if(e.type==='dane'){
   if(e.tgt&&e.tgt.st!==0){e.tgt=null;e.bind=0;e.rt=0}
   if(!e.tgt){e.rt-=dt;if(e.rt<=0){e.tgt=nearHealthy(e,300);e.rt=.5}}
   let tx=P.x,ty=P.y;if(e.tgt){tx=e.tgt.x;ty=e.tgt.y}
   const dx=tx-e.x,dy=ty-e.y,l=Math.hypot(dx,dy)||1;
   if(!(e.tgt&&l<e.r+e.tgt.r+1)){e.x+=dx/l*speed*dt;e.y+=dy/l*speed*dt}
   if(e.tgt&&l<e.r+e.tgt.r+3){e.bind+=dt;if(e.bind>.9)bind(e)}else e.bind=Math.max(0,e.bind-dt);
  }else if(e.type==='sph'){
   e.wob+=dt*1.6;const dx=P.x-e.x,dy=P.y-e.y,l=Math.hypot(dx,dy)||1;
   e.x+=(dx/l+Math.cos(e.wob)*.6)*speed*dt;e.y+=(dy/l+Math.sin(e.wob)*.6)*speed*dt;
  }else moveBoss(e,dt);
  if(e.hp>0&&dist(e,P)<e.r+P.r)hurtPlayer(e.dps*dt);
  pushWalls(e);clampHex(e,e.r);
 }
 for(let i=0;i<S.en.length;i++)for(let j=i+1;j<S.en.length;j++){const a=S.en[i],b=S.en[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),m=a.r+b.r;if(d>0&&d<m){const k=(m-d)/2/d;a.x-=dx*k;a.y-=dy*k;b.x+=dx*k;b.y+=dy*k}}
 for(const k of S.kup){
  k.hit=Math.max(0,k.hit-dt);k.ph+=dt;k.cd-=dt;
  let tg=null,bd=k.reach;for(const e of S.en){const d=dist(k,e);if(d<bd){bd=d;tg=e}}
  k.tg=tg;k.grab=tg?Math.min(1,k.grab+dt*4):Math.max(0,k.grab-dt*3);
  if(tg&&k.cd<=0){tg.hp-=tg.type==='boss'?5:40;tg.hit=.12;k.cd=1.1;once('kup','Célula de Kupffer: macrófago do sinusoide. Ela fagocita o que chega perto, e está do seu lado.')}
 }
 fireWeapon(dt);
 for(let i=S.pr.length-1;i>=0;i--){
  const b=S.pr[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;let dead=false;
  for(const e of S.en){
   if(e.hp<=0||b.hit.has(e))continue;
   if(dist(e,b)<e.r+4){
    strike(e,b.dmg,b.canJump);b.hit.add(e);b.canJump=false;
    if(b.pl>0)b.pl--;else dead=true;
    break;
   }
  }
  if(!dead&&wallHit(b))dead=true;
  if(dead||b.life<=0)S.pr.splice(i,1);
 }
 const keep=[];let ns=0;
 for(const e of S.en){
  if(e.hp>0){keep.push(e);if(e.type==='sph')ns++;continue}
  if(e.gone)continue;
  S.kills++;
  if(e.type==='dane')drop(e.x,e.y,2);
  else if(e.type==='sph'){if(rnd()<.5)drop(e.x,e.y,1)}
  else{
   drop(e.x,e.y,7);S.boss=null;S.bossWins++;
   S.bossDown=e.index===BOSSES.length-1;
   S.chest={...BOSSES[e.index],index:e.index};
  }
 }
 S.en=keep;S.nSph=ns;
 for(let i=S.puff.length-1;i>=0;i--){S.puff[i].t-=dt;if(S.puff[i].t<=0)S.puff.splice(i,1)}
 if(!reduce)P.rot+=dt*.8;
 tickBuild(dt);
 if(P.hp<=0){P.hp=0;finish('exhaust')}
 else if(S.cirr)finish('cirrhosis');
 else if(S.chest){showDraft(bossCards(),S.chest)}
 else if(S.bossDown&&S.infected<=0)finish('win');
 else if(S.t>=END)finish('chronic');
 else if(S.pending>0)openLevel();
}
function ambient(dt){
 S.clock+=dt;
 if(!reduce)for(const b of S.rbc){b.r-=b.sp*dt;if(b.r<28)b.r=edgeR(b.a)-8}
 for(const s of S.sep)if(s.shown<s.nodes.length)s.shown=Math.min(s.nodes.length,s.shown+dt*26);
 for(const o of S.orbs)o.t+=dt*3;
 if(S.phase!=='play')for(const k of S.kup)k.ph+=dt;
}

function resize(){
 const size=stage.getBoundingClientRect();
 if(!ctx||S?.phase!=='play'||crew.isOpen()||!size.width||!size.height)return false;
 const width=Math.max(1,Math.round(size.width)),height=Math.max(1,Math.round(size.height));
 const density=Math.min(1.5,window.devicePixelRatio||1,Math.sqrt(PIXEL_BUDGET/(width*height)));
 if(bg&&W===width&&H===height&&dpr===density)return true;
 W=width;H=height;dpr=density;
 cv.width=Math.max(1,Math.floor(W*dpr));
 cv.height=Math.max(1,Math.floor(H*dpr));
 const margin=12;
 sc=Math.min(W/(2*A+2*margin),H/(2*R+2*margin));ox=W/2;oy=H/2;
 buildBg();
 return !!bg;
}
function hexPath(g,r){g.beginPath();for(let k=0;k<6;k++){const a=(-90+60*k)*Math.PI/180,x=Math.cos(a)*r,y=Math.sin(a)*r;if(k)g.lineTo(x,y);else g.moveTo(x,y)}g.closePath()}
function triad(g,t){
 g.save();g.translate(t.x,t.y);g.rotate(Math.atan2(t.y,t.x)+Math.PI/2);
 g.beginPath();g.arc(0,0,36,0,TAU);g.fillStyle='#f7e4ea';g.fill();
 g.beginPath();g.ellipse(0,-2,19,12,0,0,TAU);g.fillStyle='#fbf0f4';g.fill();g.lineWidth=2;g.strokeStyle=C.wall;g.stroke();
 g.fillStyle=C.rbc;g.beginPath();g.ellipse(-5,-3,3.4,2.2,.3,0,TAU);g.fill();g.beginPath();g.ellipse(6,0,3.4,2.2,-.4,0,TAU);g.fill();
 g.beginPath();g.arc(-16,15,6,0,TAU);g.fillStyle='#fbf0f4';g.fill();g.lineWidth=3.5;g.strokeStyle='#b0283c';g.stroke();
 g.beginPath();g.arc(15,15,7.5,0,TAU);g.fillStyle='#f4dbe5';g.fill();g.fillStyle=C.nuc;
 for(let i=0;i<8;i++){const b=i/8*TAU;g.beginPath();g.arc(15+Math.cos(b)*5.4,15+Math.sin(b)*5.4,1.5,0,TAU);g.fill()}
 g.restore();
}
function buildBg(){
 if(!S)return;
 if(!bg)bg=document.createElement('canvas');
 bg.width=cv.width;bg.height=cv.height;const g=bg.getContext('2d');
 if(!g){bg=null;return;}
 g.setTransform(dpr*sc,0,0,dpr*sc,dpr*ox,dpr*oy);
 hexPath(g,R);g.fillStyle=C.slide;g.fill();
 g.save();hexPath(g,R);g.clip();
 g.lineCap='round';g.strokeStyle=C.sinus;g.lineWidth=13;
 for(let k=0;k<24;k++){const a=(k+.5)*TAU/24,e=edgeR(a);g.beginPath();g.moveTo(Math.cos(a)*30,Math.sin(a)*30);g.lineTo(Math.cos(a)*e,Math.sin(a)*e);g.stroke()}
 let s2=7;const r2=()=>(s2=s2*16807%2147483647)/2147483647;g.fillStyle=C.speck;
 for(let i=0;i<420;i++){const x=(r2()-.5)*2*A,y=(r2()-.5)*2*R;if(inset(x,y)>2){g.beginPath();g.arc(x,y,.9+r2()*1.2,0,TAU);g.fill()}}
 g.restore();
 hexPath(g,R);g.strokeStyle='#d7aabd';g.lineWidth=2;g.stroke();
 for(const t of S.tri)triad(g,t);
 g.beginPath();g.arc(0,0,25,0,TAU);g.fillStyle='#fbf0f4';g.fill();g.lineWidth=3;g.strokeStyle=C.wall;g.stroke();
 g.fillStyle=C.rbc;for(let i=0;i<5;i++){const a=i*1.3;g.beginPath();g.ellipse(Math.cos(a)*11,Math.sin(a)*9,3.6,2.4,a,0,TAU);g.fill()}
}

function circ(x,y,r){ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill()}
function eyes(x,y,a,s,w,p){const px=-Math.sin(a),py=Math.cos(a);for(const d of[-1,1]){const ex=x+px*d*s*1.5,ey=y+py*d*s*1.5;ctx.fillStyle=w;circ(ex,ey,s);ctx.fillStyle=p;circ(ex+Math.cos(a)*s*.35,ey+Math.sin(a)*s*.35,s*.55)}}
function drawKup(k){
 if(k.grab>0&&k.tg){ctx.strokeStyle=C.kup;ctx.lineWidth=7;ctx.lineCap='round';for(const s of[-.38,.38]){const a=Math.atan2(k.tg.y-k.y,k.tg.x-k.x)+s,d=Math.min(dist(k,k.tg),k.reach)*k.grab;ctx.beginPath();ctx.moveTo(k.x+Math.cos(a)*k.r*.6,k.y+Math.sin(a)*k.r*.6);ctx.quadraticCurveTo(k.x+Math.cos(a)*d*.7,k.y+Math.sin(a)*d*.7,k.x+Math.cos(a-s*.8)*d,k.y+Math.sin(a-s*.8)*d);ctx.stroke()}}
 ctx.fillStyle=k.hit>0?'#ffe3cf':C.kup;ctx.beginPath();
 for(let i=0;i<=14;i++){const a=i/14*TAU,rr=k.r*(1+.13*Math.sin(a*3+k.ph)+.08*Math.sin(a*5-k.ph*1.4)),x=k.x+Math.cos(a)*rr,y=k.y+Math.sin(a)*rr;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y)}
 ctx.closePath();ctx.fill();
 ctx.fillStyle=C.kupN;ctx.beginPath();ctx.ellipse(k.x-2,k.y+1,k.r*.42,k.r*.26,.5,0,TAU);ctx.fill();
 ctx.fillStyle='rgba(122,59,26,.35)';circ(k.x+7,k.y-6,2.2);circ(k.x+3,k.y+9,1.8);
}
function drawDane(x,y,r,hit,ph){
 ctx.strokeStyle=C.tealD;ctx.lineWidth=Math.max(1.4,r*.12);ctx.lineCap='round';
 const n=r>20?18:9;
 for(let i=0;i<n;i++){const a=ph*.12+i*TAU/n,c=Math.cos(a),s=Math.sin(a);ctx.beginPath();ctx.moveTo(x+c*r,y+s*r);ctx.lineTo(x+c*r*1.3,y+s*r*1.3);ctx.stroke()}
 ctx.fillStyle=hit>0?'#ffffff':C.dane;circ(x,y,r);ctx.strokeStyle=C.teal;ctx.lineWidth=Math.max(1.2,r*.1);ctx.stroke();
 ctx.fillStyle=C.teal;ctx.beginPath();for(let k=0;k<6;k++){const a=k*Math.PI/3+.3,px=x+Math.cos(a)*r*.58,py=y+Math.sin(a)*r*.58;if(k)ctx.lineTo(px,py);else ctx.moveTo(px,py)}ctx.closePath();ctx.fill();
 ctx.strokeStyle=C.tealL;ctx.lineWidth=Math.max(1,r*.08);ctx.beginPath();ctx.arc(x,y,r*.28,0,TAU);ctx.stroke();
}
function drawSph(e){
 ctx.fillStyle=e.hit>0?'#ffffff':C.sph;ctx.strokeStyle=C.sphS;ctx.lineWidth=1.6;
 if(e.fil){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.ph*.25);ctx.beginPath();ctx.ellipse(0,0,e.r*1.7,e.r*.62,0,0,TAU);ctx.fill();ctx.stroke();ctx.restore()}
 else{circ(e.x,e.y,e.r);ctx.stroke();ctx.fillStyle='rgba(143,169,192,.55)';for(let i=0;i<6;i++){const a=e.ph*.2+i*TAU/6;circ(e.x+Math.cos(a)*e.r*.55,e.y+Math.sin(a)*e.r*.55,1.1)}}
}
function drawEn(e){
 if(e.type==='sph')drawSph(e);
 else drawDane(e.x,e.y,e.r,e.hit,e.ph);
 if(e.type==='boss'){
  const boss=BOSSES[e.index];
  ctx.fillStyle=boss.color;circ(e.x,e.y,e.r*.28);
  ctx.strokeStyle=boss.color;ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(e.x,e.y,e.r+8,0,TAU);ctx.stroke();
  if(e.windup>0){
   ctx.lineWidth=2;ctx.strokeStyle='rgba(153,62,54,.52)';ctx.setLineDash([5,6]);
   ctx.beginPath();ctx.arc(e.x,e.y,boss.wave,0,TAU);ctx.stroke();ctx.setLineDash([]);
   ctx.strokeStyle='#ad5139';ctx.lineWidth=3;ctx.beginPath();
   ctx.arc(e.x,e.y,boss.wave,-Math.PI/2,-Math.PI/2+TAU*(1-e.windup/.87));ctx.stroke();
  }
 }
 if(e.markedUntil>S.t){
  ctx.strokeStyle='#8b4686';ctx.lineWidth=2.1;ctx.beginPath();
  ctx.arc(e.x,e.y,e.r+5,0,TAU);ctx.stroke();
 }
}
function drawAb(x,y,a){ctx.save();ctx.translate(x,y);ctx.rotate(a+Math.PI/2);ctx.strokeStyle=C.imm;ctx.lineWidth=2.2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,5);ctx.lineTo(0,0);ctx.moveTo(0,0);ctx.lineTo(-4,-5);ctx.moveTo(0,0);ctx.lineTo(4,-5);ctx.stroke();ctx.restore()}
function drawHeroSprite(p){
 const build=S.build;
 const height=56+4*(build.rank-1)+(build.evolved?4:0);
 const width=height*heroPortrait.naturalWidth/heroPortrait.naturalHeight;
 const cast=Math.max(0,1-(S.t-p.castAt)/.16);
 const stride=reduce?0:Math.sin(S.t*19)*p.walk;
 const lift=reduce?0:Math.abs(stride)*3+Math.sin(S.t*3)*(1-p.walk)*1.2;
 const facing=cast>0&&p.walk<.1?p.castFacing:p.facing;
 ctx.save();
 ctx.translate(p.x,p.y);
 ctx.beginPath();
 ctx.ellipse(0,9,19,7,0,0,TAU);
 ctx.fillStyle=S.hurt>0?'rgba(180,30,62,.42)':'rgba(33,27,54,.25)';
 ctx.fill();
 if(build.evolved){
  ctx.strokeStyle='#a86e20';ctx.lineWidth=3;ctx.stroke();
  ctx.strokeStyle='#ffe6a0';ctx.lineWidth=1.2;ctx.stroke();
 }
 if(build.fusions.size){
  ctx.beginPath();ctx.ellipse(0,9,24,10,0,0,TAU);
  ctx.strokeStyle='#7843aa';ctx.lineWidth=2.8;ctx.stroke();
  ctx.strokeStyle='#e6afff';ctx.lineWidth=1.2;ctx.stroke();
 }
 ctx.scale(facing,1);
 ctx.translate(reduce?0:-cast*3,-lift);
 if(!reduce)ctx.rotate(stride*.07);
 ctx.drawImage(heroPortrait,-width/2,11-height,width,height);
 if(!reduce&&cast>0){
  ctx.globalAlpha=cast;
  ctx.fillStyle=currentWeapon().color;
  circ(width*.42,-7,5);
  ctx.fillStyle='#fff0bc';
  circ(width*.42,-7,2.5);
 }
 ctx.restore();
}

function drawP(){
 const P=S.p,st=S.st;
 if(st.cytoR>0){ctx.fillStyle='rgba(47,125,224,.07)';circ(P.x,P.y,st.cytoR);ctx.strokeStyle='rgba(47,125,224,.4)';ctx.lineWidth=1.5;ctx.setLineDash([5,6]);ctx.beginPath();ctx.arc(P.x,P.y,st.cytoR,0,TAU);ctx.stroke();ctx.setLineDash([])}
 ctx.strokeStyle='rgba(47,37,96,.28)';ctx.lineWidth=1.2;ctx.setLineDash([3,5]);ctx.beginPath();ctx.arc(P.x,P.y,P.r+st.reach+8,0,TAU);ctx.stroke();ctx.setLineDash([]);
 if(heroPortrait.complete&&heroPortrait.naturalHeight){
  drawHeroSprite(P);
 }else{
  const a=Math.atan2(P.fy,P.fx);
  ctx.fillStyle=S.hurt>0?'#e45b72':C.cd8;circ(P.x,P.y,P.r);
  ctx.fillStyle=C.cd8N;circ(P.x-Math.cos(a)*1.5,P.y-Math.sin(a)*1.5,P.r*.66);
  eyes(P.x+Math.cos(a)*4,P.y+Math.sin(a)*4,a,3.6,'#ffffff','#10202a');
 }
 if(S.tier.pat>=1){ctx.fillStyle=C.dead;for(let i=0;i<S.tier.pat+2;i++){const b=i*TAU/(S.tier.pat+2)+.6;circ(P.x+Math.cos(b)*P.r*.8,P.y+Math.sin(b)*P.r*.8,1.7)}}
 const nm=S.tier.mor;for(let i=0;i<nm;i++){const b=S.clock*1.6+i*TAU/nm;drawAb(P.x+Math.cos(b)*(P.r+12),P.y+Math.sin(b)*(P.r+12),b)}
}
function labels(){
 const sx=x=>ox+x*sc,sy=y=>oy+y*sc;
 ctx.font='700 13px Nunito,system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
 const L=[['veia central',0,40],['espaço porta',S.tri[0].x,S.tri[0].y+52],['você (linfócito T)',S.p.x,S.p.y-32]];
 const k=S.kup.slice().sort((a,b)=>Math.hypot(a.x,a.y+95)-Math.hypot(b.x,b.y+95))[0];if(k)L.push(['célula de Kupffer',k.x,k.y+36]);
 const ic=S.cells.find(c=>c.st===1);if(ic)L.push(['hepatócito infectado',ic.x,ic.y+20]);
 for(const[t,x,y]of L){ctx.lineWidth=4;ctx.strokeStyle='rgba(255,250,252,.92)';ctx.strokeText(t,sx(x),sy(y));ctx.fillStyle=C.ink;ctx.fillText(t,sx(x),sy(y))}
}
function drawCellBodies(){
 if(typeof Path2D!=='function')return false;
 const pattern=S.cells.map(c=>c.st).join('');
 if(!cellPaths||cellPattern!==pattern){
  cellPattern=pattern;cellPaths=new Map();
  function disc(color,x,y,r){
   if(!cellPaths.has(color))cellPaths.set(color,new Path2D());
   const path=cellPaths.get(color);path.moveTo(x+r,y);path.arc(x,y,r,0,TAU);
  }
  for(const c of S.cells){
   const shade=c.st===2?C.dead:c.st===1?C.inf:c.alt?C.cell2:C.cell;
   disc(shade,c.x,c.y,c.st===2?c.r*.62:c.r);
  }
  for(const c of S.cells){
   if(c.st===2)disc('#3b1730',c.x+1,c.y-1,1.5);
   else disc(c.st===1?C.infN:C.nuc,c.x,c.y,c.r*.36);
  }
 }
 for(const [color,path] of cellPaths){ctx.fillStyle=color;ctx.fill(path)}
 return true;
}
function draw(){
 ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height);
 if(!bg||!S)return;
 ctx.drawImage(bg,0,0);
 ctx.setTransform(dpr*sc,0,0,dpr*sc,dpr*ox,dpr*oy);
 const st=S.st;
 ctx.fillStyle=C.rbc;for(const b of S.rbc){ctx.beginPath();ctx.ellipse(Math.cos(b.a)*b.r,Math.sin(b.a)*b.r,3.6,2.3,b.a,0,TAU);ctx.fill()}
 const batched=drawCellBodies();
 for(const c of S.cells){
  if(!batched){
   if(c.st===2){ctx.fillStyle=C.dead;circ(c.x,c.y,c.r*.62);ctx.fillStyle='#3b1730';circ(c.x+1,c.y-1,1.5)}
   else {
    ctx.fillStyle=c.st===1?C.inf:(c.alt?C.cell2:C.cell);circ(c.x,c.y,c.r);
    ctx.fillStyle=c.st===1?C.infN:C.nuc;circ(c.x,c.y,c.r*.36);
   }
  }
  if(c.st===2)continue;
  if(c.st===1){
   ctx.fillStyle=C.tealL;const ph=S.clock*2+c.ph;circ(c.x+Math.cos(ph)*c.r*.62,c.y+Math.sin(ph)*c.r*.62,1.5);circ(c.x+Math.cos(ph+2.1)*c.r*.62,c.y+Math.sin(ph+2.1)*c.r*.62,1.5);
   const pa=c.kt/st.killT,pb=st.cytoR?c.cy/st.cytoT:0,pr=Math.max(pa,pb);
   if(pr>0){ctx.strokeStyle=pa>=pb?'#c2334a':'#2f7de0';ctx.lineWidth=2.2;ctx.beginPath();ctx.arc(c.x,c.y,c.r+2.8,-Math.PI/2,-Math.PI/2+TAU*Math.min(1,pr));ctx.stroke()}
  }else if(c.imm||S.immAll>0){ctx.strokeStyle=C.imm;ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(c.x,c.y,c.r+1.5,0,TAU);ctx.stroke()}
 }
 ctx.lineCap='round';ctx.lineJoin='round';
 for(const s of S.sep){const n=Math.floor(s.shown);if(n<2)continue;ctx.beginPath();ctx.moveTo(s.nodes[0].x,s.nodes[0].y);for(let i=1;i<n;i++)ctx.lineTo(s.nodes[i].x,s.nodes[i].y);ctx.strokeStyle=C.fib;ctx.lineWidth=15;ctx.stroke();ctx.strokeStyle=C.fibL;ctx.lineWidth=2;ctx.stroke()}
 if(S.boss?.index===BOSSES.length-1){
  const b=S.boss,inf=[];for(const c of S.cells)if(c.st===1){const d=dist(c,b);if(d<420)inf.push([d,c])}
  inf.sort((x,y)=>x[0]-y[0]);ctx.strokeStyle='rgba(14,138,140,.3)';ctx.lineWidth=1.5;ctx.setLineDash([4,5]);
  for(const[,c]of inf.slice(0,10)){ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.stroke()}
  ctx.setLineDash([]);
 }
 ctx.fillStyle=C.gem;
 for(const o of S.orbs){const r=3.8+Math.sin(o.t)*.6;ctx.beginPath();ctx.moveTo(o.x,o.y-r*1.2);ctx.lineTo(o.x+r,o.y);ctx.lineTo(o.x,o.y+r*1.2);ctx.lineTo(o.x-r,o.y);ctx.closePath();ctx.fill()}
 for(const k of S.kup)drawKup(k);
 for(const e of S.en)drawEn(e);
 for(const p of S.puff){const r=6+(.5-p.t)*40;ctx.strokeStyle='rgba(79,143,220,'+Math.max(0,p.t*2)+')';ctx.lineWidth=2.4;ctx.beginPath();ctx.arc(p.x,p.y,r,0,TAU);ctx.stroke()}
 ctx.fillStyle=C.cd8;ctx.strokeStyle=C.cd8N;ctx.lineWidth=1.5;
 for(const b of S.pr){ctx.fillStyle=b.color;ctx.beginPath();ctx.arc(b.x,b.y,3.6,0,TAU);ctx.fill();ctx.stroke()}
 drawBuild();
 crew.drawEscort();
 drawP();
 ctx.setTransform(dpr,0,0,dpr,0,0);
 if(S.phase==='intro')labels();
 if(S.boss&&S.phase!=='intro'){
  const b=S.boss,w=Math.min(300,W*.6),x=(W-w)/2,y=H-26;
  ctx.font='800 12px Nunito,system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.lineJoin='round';
  ctx.lineWidth=4;ctx.strokeStyle='rgba(255,250,252,.92)';ctx.strokeText(BOSSES[b.index].name,W/2,y-3);ctx.fillStyle=C.ink;ctx.fillText(BOSSES[b.index].name,W/2,y-3);
  ctx.fillStyle='rgba(43,22,51,.25)';ctx.fillRect(x,y,w,8);ctx.fillStyle=C.teal;ctx.fillRect(x,y,w*Math.max(0,b.hp)/b.max,8);
 }
 if(joy.on&&S.phase==='play'){ctx.strokeStyle='rgba(47,37,96,.45)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(joy.ox,joy.oy,42,0,TAU);ctx.stroke();const dx=joy.x-joy.ox,dy=joy.y-joy.oy,l=Math.hypot(dx,dy),m=Math.min(l,42);ctx.fillStyle='rgba(47,37,96,.35)';circ(joy.ox+(l?dx/l*m:0),joy.oy+(l?dy/l*m:0),16)}
 if(S.hurt>0){ctx.strokeStyle='rgba(194,51,74,'+Math.min(.45,S.hurt*2.5)+')';ctx.lineWidth=10;ctx.strokeRect(5,5,W-10,H-10)}
}
function hud(){
 $('crewHud').disabled=S.phase==='level';
 $('pauseBtn').disabled=!['play','pause'].includes(S.phase);
 const p=S.p,st=S.st,b=S.build,week=Math.min(10,Math.floor(S.t/WEEK)+1);
 const hp=Math.max(0,Math.ceil(p.hp));
 const key=[week,hp,p.max,st.lvl,st.xp,st.need,S.sep.length,S.infected,S.bossWins,
  b.rank,b.evolved,...Object.values(b.skills),b.fusions.size].join('|');
 if(key===lastH)return;
 lastH=key;
 hEl.day.textContent='Semana '+week;
 hEl.hpt.textContent=hp+'/'+p.max;hEl.hpb.style.width=(100*Math.max(0,p.hp)/p.max)+'%';
 hEl.lvt.textContent='Nível '+st.lvl;hEl.xpb.style.width=(100*st.xp/st.need)+'%';
 hEl.fbt.textContent='Chefes '+S.bossWins+'/'+BOSSES.length;
 $('arenaWeapon').textContent=weaponName()+' '+b.rank;
 const choices=[...Object.keys(b.skills).map(id=>SKILLS[id].name),...Array.from(b.fusions,id=>FUSIONS[id].name)];
 $('arenaSkills').textContent=choices.join(' · ');
 $('arenaTissue').textContent='Infectados '+S.infected+' · Fibrose '+fibPct()+'%';
}

function pickQ(id){
 const idx=[];Q.forEach((q,i)=>{if(q.t===id)idx.push(i)});
 const fresh=idx.filter(i=>!S.used.has(i)),pool=fresh.length?fresh:idx,i=pool[Math.floor(rnd()*pool.length)];
 S.used.add(i);return Q[i];
}
function startQ(cd){
 curCombo=!!cd.combo;curT=cd.combo?null:cd.t;curQ=cd.combo?COMBO:pickQ(cd.t.id);
 $('draftHint').hidden=true;$('ups').hidden=true;$('ups').textContent='';
 $('lvTag').textContent=cd.combo?'Combo · Profilaxia neonatal':curT.name+' · '+curT.ctr+' · acertando: nível '+(S.tier[curT.id]+1);
 $('qText').textContent=curQ.q;const box=$('opts');box.textContent='';
 for(const o of shuffle(curQ.a.slice())){const b=document.createElement('button');b.className='opt';b.textContent=o;b.dataset.c=o===curQ.a[0]?'1':'0';b.addEventListener('click',()=>answer(b,o));box.append(b)}
 setTimeout(()=>{const f=box.querySelector('button');if(f)f.focus({preventScroll:true})},60);
}
function answer(btn,o){
 if(answered)return;answered=true;const ok=o===curQ.a[0];
 for(const b of $('opts').children){b.disabled=true;if(b.dataset.c==='1')b.classList.add('ok');else if(b===btn)b.classList.add('no')}
 S.log.push({q:curQ.q,a:curQ.a[0],ok});
 const fb=$('fb');fb.className='fb '+(ok?'good':'bad');fb.textContent='';
 const add=(txt,cls)=>{const p=document.createElement('p');if(cls)p.className=cls;p.textContent=txt;fb.append(p)};
 add(ok?'Certo.':'Ainda não.','fbh');
 if(!ok)add('Você marcou: '+o+'.');
 add(curQ.e);
 if(ok){
  crew.rewardAnswer();add('+4 moedas para a equipe.');
  if(curCombo){S.comboDone=true;S.immAll=25;S.p.hp=Math.min(S.p.max,S.p.hp+40);add('Combo ativado: por 25 s todo vírion que chega a um hepatócito saudável é neutralizado, e você recuperou vigor.')}
  else{const T=curT,n=++S.tier[T.id];applyTier(T.id,n);add('Contramedida '+T.ctr+', nível '+n+': '+T.tiers[n-1][0]+'. '+T.tiers[n-1][1])}
 }else add(curCombo?'O combo não saiu desta vez.':'Sem evolução desta vez: '+curT.ctr+' continua no nível '+S.tier[curT.id]+'.');
 add('Resposta completa: '+curQ.a[0]+'.');
 fb.hidden=false;const c=$('contBtn');c.textContent='Continuar';c.hidden=false;c.focus({preventScroll:true});
}
function closeLevel(){
 if(S.phase!=='level'||!S.draft?.chosen||S.draft.chest)return;
 S.pending=Math.max(0,S.pending-1);continueRun();
}
function renderCtr(){describeBuild($('ctr'))}
function finish(res){
 if(S.phase==='end')return;S.phase='end';joy.on=false;$('lv').hidden=true;$('pause').hidden=true;
 const week=Math.min(10,Math.floor(S.t/WEEK)+1),score=res==='win'?11:week;
 if(score>best){best=score;try{localStorage.setItem('lobulo-hbv-best',String(best))}catch(_){}}
 const T={
  win:['Infecção resolvida','Você controlou a infecção no lóbulo. Na prática clínica, após a resolução, o HBsAg desaparece e o anti-HBc total persiste. O cccDNA ainda pode permanecer no fígado.'],
  chronic:['A infecção persistiu',(S.bossDown?'Você derrubou o foco, mas ainda havia hepatócitos infectados.':'O foco viral continuou ativo ao fim da partida.')+' Na clínica, a persistência de HBsAg por pelo menos seis meses define hepatite B crônica.'],
  exhaust:['Linfócito exausto','O excesso de antígeno esgotou o seu linfócito. Na hepatite B crônica, os linfócitos T CD8+ específicos também ficam exauridos, e a resposta fica fraca. Você chegou à semana '+week+' de 10.'],
  cirrhosis:['O fígado cirrosou','A resposta imune destruiu hepatócitos demais. A lesão repetida ativa as células estreladas, que depositam colágeno e levam à cirrose. Você chegou à semana '+week+' de 10.']
 }[res];
 $('endH').textContent=T[0];$('endP').textContent=T[1];
 $('sInf').textContent=String(S.infected);$('sBoss').textContent=S.bossWins+'/'+BOSSES.length;$('sF').textContent=fibPct()+'%';
 describeBuild($('loadoutEnd'));
 const ul=$('codex');ul.textContent='';
 if(!S.log.length){const li=document.createElement('li');li.className='none';li.textContent='Se quiser revisar, escolha uma pergunta de HBV ao subir de nível.';ul.append(li)}
 for(const l of S.log){const li=document.createElement('li');if(!l.ok)li.className='x';const q=document.createElement('b');q.textContent=l.q+' ';const a=document.createElement('span');a.textContent='Resposta: '+l.a+'.';li.append(q,a);ul.append(li)}
 $('bestE').textContent=best?'Seu recorde: '+(best>10?'infecção resolvida':'semana '+best):'';
 $('end').hidden=false;syncArena();setTimeout(()=>$('againBtn').focus({preventScroll:true}),60);
}
function startRun(){
 S=newState();posed();S.phase='play';lastH='';cellPaths=null;$('arenaNotice').hidden=true;
 $('hud').hidden=false;$('arenaRoster').hidden=false;
 toastQ=[];toastT=0;toastGap=0;tEl.classList.remove('show');
 $('intro').hidden=true;$('end').hidden=true;$('lv').hidden=true;$('pause').hidden=true;
 toast('Colete os fragmentos roxos para escolher habilidades.');
 syncArena();
}
function pauseGame(){if(!S||S.phase!=='play')return;S.phase='pause';joy.on=false;renderCtr();$('pause').hidden=false;syncArena();$('resumeBtn').focus()}
function resume(){
 $('pause').hidden=true;
 if(S?.phase==='pause'){S.phase='play';syncArena()}
}

const crew=(()=>{
// Cada ficha descreve um tema de estudo. A afinidade e os talentos pertencem ao mascote do jogo.
const WHO = 'https://www.who.int/news-room/fact-sheets/detail/';
const CDC = 'https://www.cdc.gov/';
const species = [
  {
    id:'hbv', group:'Hepatites', label:'Hepatite B', code:'HBV', name:'Dane', look:'orbit', affinity:'arquivo',
    colors:['#80ccad','#408c83','#d8ffe1','#e0f1da'], source:[CDC+'hepatitis-b/hcp/diagnosis-testing/index.html','CDC'],
    note:'O anti-HBs pode aparecer após vacinação ou recuperação. O anti-HBc total ajuda a reconhecer quem já teve contato com o vírus.',
    quiz:[
      ['HBsAg negativo, anti-HBc total negativo e anti-HBs positivo. Qual história combina com esse perfil?', ['Imunidade pela vacinação','Infecção aguda','Infecção passada resolvida'], 'A vacina induz anti-HBs. O anti-HBc aparece após contato com o vírus.'],
      ['Qual perfil é típico de infecção passada e resolvida?', ['HBsAg negativo, anti-HBc total e anti-HBs positivos','Somente anti-HBs positivo','HBsAg e anti-HBc IgM positivos'], 'Após a resolução, é comum encontrar anti-HBc total e anti-HBs com HBsAg negativo.'],
      ['Qual achado, mantido por pelo menos seis meses, caracteriza infecção crônica pelo HBV?', ['HBsAg positivo','Anti-HBs isolado','Anti-HBc IgM isolado'], 'A persistência do antígeno de superfície por esse intervalo define a infecção crônica.'],
      ['HBsAg positivo e anti-HBc IgM positivo em um primeiro episódio de hepatite sugerem qual fase?', ['Infecção aguda','Imunidade vacinal','Infecção passada resolvida'], 'O anti-HBc IgM costuma marcar infecção recente. O contexto clínico importa porque ele também pode aparecer em exacerbações.']
    ]
  },
  {
    id:'hmpv', group:'Respiratórios', label:'Metapneumovírus humano', code:'hMPV', name:'Eco', look:'tuft', affinity:'correio',
    colors:['#8ac4ef','#537bb4','#d1efff','#dfedfa'], source:[CDC+'human-metapneumovirus/about/index.html','CDC'],
    note:'O hMPV pertence à mesma família do vírus sincicial respiratório. Pode atingir tanto as vias aéreas superiores quanto as inferiores.',
    quiz:[
      ['Qual vírus pertence à mesma família do hMPV?', ['Vírus sincicial respiratório','Influenza A','Adenovírus'], 'O hMPV e o vírus sincicial respiratório pertencem à família Pneumoviridae.'],
      ['Um lactente com hMPV evoluiu com bronquiolite. Qual estrutura está inflamada?', ['Pequenas vias aéreas dos pulmões','Pleura','Alvéolos exclusivamente'], 'A bronquiolite acomete os bronquíolos. O hMPV pode causar esse quadro nas vias aéreas inferiores.'],
      ['Em qual grupo há maior risco de doença grave pelo hMPV?', ['Crianças pequenas, idosos e imunossuprimidos','Somente adolescentes','Somente adultos jovens saudáveis'], 'Pessoas de qualquer idade podem ter hMPV, com maior risco de gravidade nesses três grupos.']
    ]
  },
  {
    id:'hiv', group:'HIV', label:'HIV / VIH', code:'HIV', name:'Íris', look:'gem', affinity:'casos',
    colors:['#c0a2e0','#9471aa','#f4dfff','#f0e5f6'], source:['https://hivinfo.nih.gov/understanding-hiv/fact-sheets/hiv-and-aids-basics','NIH'],
    note:'Os linfócitos T CD4+ coordenam parte da resposta imune. Sua contagem e a carga viral respondem a perguntas diferentes no acompanhamento do HIV.',
    quiz:[
      ['Uma ficha mostra a contagem de CD4 e a carga viral. Qual valor estima a quantidade de HIV no sangue?', ['Carga viral','Contagem de CD4','Contagem de plaquetas'], 'A carga viral mede a quantidade de RNA do HIV no sangue. A contagem de CD4 ajuda a avaliar o sistema imune.'],
      ['Qual população de células é um alvo central do HIV?', ['Linfócitos T CD4+','Hemácias maduras','Plaquetas'], 'O HIV afeta os linfócitos T CD4+, importantes para coordenar a defesa contra infecções.'],
      ['O que a sigla aids designa?', ['A fase mais avançada da infecção pelo HIV','O período logo após toda exposição','Um subtipo do HIV'], 'A aids é um estágio da infecção associado a comprometimento importante da imunidade.']
    ]
  },
  {
    id:'denv', group:'Dengue', label:'Dengue', code:'DENV', name:'Zizi', look:'wing', affinity:'colecao',
    colors:['#f7be63','#cd8056','#fff0a9','#fff0ca'], source:['https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/d/dengue','Ministério da Saúde'],
    note:'Há quatro sorotipos de DENV. Quem já teve dengue ainda pode ter uma nova infecção por outro sorotipo.',
    quiz:[
      ['Uma pessoa já teve dengue por DENV-1. Como interpretar uma nova infecção anos depois?', ['Pode envolver outro sorotipo de DENV','Dengue só ocorre uma vez','Todo episódio tardio é reativação do DENV-1'], 'A proteção duradoura é sobretudo contra o sorotipo que causou a primeira infecção.'],
      ['Quantos sorotipos de dengue fazem parte da classificação usual?', ['Quatro','Dois','Oito'], 'Os quatro sorotipos são DENV-1, DENV-2, DENV-3 e DENV-4.'],
      ['Qual mosquito é o principal vetor urbano da dengue no Brasil?', ['Aedes aegypti','Anopheles darlingi','Culex quinquefasciatus'], 'O Aedes aegypti é o principal vetor urbano do DENV.']
    ]
  },
  {
    id:'hav', group:'Hepatites', label:'Hepatite A', code:'HAV', name:'Pingo', look:'drop', affinity:'correio',
    colors:['#80d0d2','#478f9d','#cefbef','#dff4ee'], source:[WHO+'hepatitis-a','OMS'],
    note:'A hepatite A costuma ser aguda. A pesquisa de IgM anti-HAV ajuda a reconhecer uma infecção recente.',
    quiz:[
      ['Qual anticorpo favorece o diagnóstico de hepatite A aguda em alguém com sintomas?', ['IgM anti-HAV','Anti-HBs','Anti-HBc total'], 'A IgM específica contra o HAV é o marcador sorológico de infecção aguda.'],
      ['Qual evolução é típica da hepatite A?', ['Recuperação após a fase aguda','Infecção crônica na maioria dos adultos','Latência em gânglios sensitivos'], 'O HAV causa hepatite aguda e a maioria das pessoas se recupera.'],
      ['O que as hepatites A e E têm em comum em surtos ligados à água?', ['Transmissão fecal-oral','Dependência do HBV','Predomínio de transmissão por mosquito'], 'Água contaminada pode participar da transmissão fecal-oral das duas hepatites.']
    ]
  },
  {
    id:'hcv', group:'Hepatites', label:'Hepatite C', code:'HCV', name:'Cora', look:'scallop', affinity:'casos',
    colors:['#f2a499','#bf717d','#ffe1bd','#fae5dc'], source:[WHO+'hepatitis-c','OMS'],
    note:'O anti-HCV indica contato prévio. A detecção de RNA do HCV no sangue demonstra infecção atual.',
    quiz:[
      ['O anti-HCV foi reagente. Qual dado demonstra infecção atual?', ['RNA do HCV detectável','Anti-HBs detectável','História de vacinação contra hepatite B'], 'A pesquisa de RNA distingue a presença atual do vírus de um contato anterior já resolvido.'],
      ['Qual interpretação cabe a um anti-HCV positivo isolado?', ['Houve contato e é preciso verificar se a infecção está ativa','A pessoa está necessariamente com hepatite C crônica','Há imunidade por uma vacina contra HCV'], 'O anticorpo pode permanecer detectável depois da eliminação do vírus.'],
      ['Qual é uma característica dos antivirais de ação direta contra o HCV?', ['Podem curar a infecção na maioria dos casos','Funcionam como vacina','Servem apenas para aliviar a febre'], 'Os antivirais de ação direta permitem a cura da grande maioria das pessoas tratadas.']
    ]
  },
  {
    id:'hdv', group:'Hepatites', label:'Hepatite D', code:'HDV', name:'Delta', look:'shell', affinity:'arquivo',
    colors:['#b3ca74','#729254','#e8fbb8','#e8efd9'], source:[WHO+'hepatitis-d','OMS'],
    note:'A hepatite D está ligada à hepatite B. A vacinação contra o HBV também protege quem ainda é suscetível contra a hepatite D.',
    quiz:[
      ['Uma pessoa que já tem hepatite B crônica adquire HDV. Como se chama essa situação?', ['Superinfecção','Coinfecção simultânea','Imunidade cruzada'], 'Superinfecção é a aquisição do HDV por quem já tem infecção pelo HBV.'],
      ['Qual vacina também previne a hepatite D em quem ainda é suscetível?', ['Vacina contra hepatite B','Vacina contra hepatite A','Vacina contra influenza'], 'Evitar a infecção pelo HBV também previne a hepatite D, que depende do HBV.'],
      ['Uma pessoa adquire HBV e HDV ao mesmo tempo. Qual termo descreve o quadro?', ['Coinfecção','Superinfecção por HDV','Reativação isolada de HBV'], 'O termo coinfecção descreve a aquisição simultânea dos dois vírus.']
    ]
  },
  {
    id:'hev', group:'Hepatites', label:'Hepatite E', code:'HEV', name:'Nilo', look:'reed', affinity:'colecao',
    colors:['#eaca77','#b29650','#fff3b9','#f6edcf'], source:[WHO+'hepatitis-e','OMS'],
    note:'A hepatite E costuma ter curso agudo. Na gestação, sobretudo no segundo e no terceiro trimestres, há maior risco de doença grave.',
    quiz:[
      ['Em qual situação a hepatite E aguda merece atenção especial pelo risco de gravidade?', ['Gestação, sobretudo no segundo ou terceiro trimestre','Infecção por HAV resolvida na infância','Presença isolada de anti-HBs após vacinação'], 'A gestação está associada a maior risco de formas graves, particularmente no segundo e terceiro trimestres.'],
      ['Em quem pode ocorrer, raramente, hepatite E crônica?', ['Pessoas imunossuprimidas, como transplantados','Toda pessoa com IgG anti-HEV','Somente crianças saudáveis'], 'A infecção crônica é rara e foi descrita sobretudo sob imunossupressão.'],
      ['Qual pista epidemiológica aproxima um surto de hepatite E de um surto de hepatite A?', ['Exposição comum a água contaminada','Coinfecção obrigatória com HBV','Picadas de Aedes'], 'A transmissão fecal-oral por água contaminada pode ocorrer nos dois quadros.']
    ]
  },
  {
    id:'flu', group:'Respiratórios', label:'Influenza', code:'FLU', name:'Brisa', look:'spark', affinity:'correio',
    colors:['#efa8c4','#bd7095','#ffe7e3','#f8e1eb'], source:[CDC+'flu/about/viruses-types.html','CDC'],
    note:'Influenza A e B causam epidemias sazonais. Em nomes como H3N2, as letras identificam duas proteínas de superfície de influenza A.',
    quiz:[
      ['No subtipo H3N2, o que a letra N representa?', ['Neuraminidase','Nucleoproteína','Nucleocapsídeo'], 'H e N designam, respectivamente, hemaglutinina e neuraminidase.'],
      ['Quais tipos de influenza causam as epidemias sazonais humanas?', ['A e B','C e D','B e D'], 'Influenza A e B são os principais tipos associados à gripe sazonal.'],
      ['A designação H1N1 pertence a qual tipo de influenza?', ['Influenza A','Influenza B','Influenza C'], 'Os subtipos de influenza A são classificados pelas combinações de hemaglutinina e neuraminidase.']
    ]
  },
  {
    id:'rsv', group:'Respiratórios', label:'Vírus sincicial respiratório', code:'VSR', name:'Nimbo', look:'twins', affinity:'casos',
    colors:['#aaafe9','#767ab5','#e0e8ff','#eae8f8'], source:[CDC+'rsv/about/index.html','CDC'],
    note:'O VSR pode causar sintomas de resfriado. Em lactentes, é uma causa importante de bronquiolite e pneumonia.',
    quiz:[
      ['Qual síndrome das pequenas vias aéreas é especialmente associada ao VSR em lactentes?', ['Bronquiolite','Hepatite','Meningite'], 'A bronquiolite é uma manifestação importante da infecção das vias aéreas inferiores pelo VSR.'],
      ['Além de lactentes, qual grupo tem maior risco de doença grave por VSR?', ['Idosos, especialmente com doenças crônicas','Escolares saudáveis após um resfriado leve','Adultos jovens sem doença de base'], 'Idosos e pessoas com certas doenças crônicas também podem ter quadros graves.'],
      ['Qual apresentação é frequente na infecção leve pelo VSR?', ['Sintomas semelhantes aos de resfriado','Icterícia isolada','Paralisia flácida'], 'O VSR frequentemente causa doença respiratória leve com sintomas de resfriado.']
    ]
  },
  {
    id:'adeno', group:'Respiratórios', label:'Adenovírus', code:'AdV', name:'Prisma', look:'box', affinity:'arquivo',
    colors:['#82c9d8','#4e8ba7','#cdf9fd','#e2eff2'], source:[CDC+'adenovirus/about/index.html','CDC'],
    note:'Febre, faringite e conjuntivite podem ocorrer juntas na infecção por adenovírus. Alguns tipos também causam gastroenterite.',
    quiz:[
      ['Febre e faringite vieram acompanhadas de olhos vermelhos. Qual achado completa a febre faringoconjuntival?', ['Conjuntivite','Icterícia','Parotidite'], 'A associação de faringite, febre e conjuntivite é uma apresentação clássica do adenovírus.'],
      ['Além de doença respiratória e ocular, o que alguns adenovírus podem causar?', ['Gastroenterite','Hepatite D','Dengue'], 'Alguns tipos acometem o trato gastrointestinal e podem causar diarreia.'],
      ['Quem tem maior risco de formas graves de infecção por adenovírus?', ['Pessoas com imunidade comprometida','Escolares saudáveis com conjuntivite isolada','Adultos jovens saudáveis com rinite sazonal'], 'Imunossupressão e certas doenças cardíacas ou respiratórias aumentam o risco de gravidade.']
    ]
  },
  {
    id:'cov', group:'Respiratórios', label:'SARS-CoV-2', code:'CoV-2', name:'Halo', look:'crown', affinity:'colecao',
    colors:['#eaa66f','#bb7958','#ffe7bc','#f8e7d7'], source:[CDC+'covid/about/index.html','CDC'],
    note:'SARS-CoV-2 é o nome do vírus que causa a covid-19. Alguns sintomas podem persistir após a fase aguda.',
    quiz:[
      ['Qual é o nome da doença causada por SARS-CoV-2?', ['Covid-19','Influenza A','Bronquiolite por VSR'], 'Covid-19 designa a doença causada pelo coronavírus SARS-CoV-2.'],
      ['O que descreve a condição pós-covid?', ['Sintomas que surgem ou persistem após a fase aguda','Uma vacina contra coronavírus','Um subtipo sazonal de influenza'], 'A condição pós-covid pode envolver, entre outros sintomas, fadiga persistente.'],
      ['Febre e tosse podem ocorrer tanto na gripe quanto na covid-19. O que isso permite concluir?', ['Os sintomas isolados podem ser insuficientes para distinguir as duas','A tosse identifica exclusivamente influenza','A febre identifica exclusivamente SARS-CoV-2'], 'Os quadros se sobrepõem. Quando indicada, a testagem ajuda a distinguir as infecções.']
    ]
  }
];
const byId = Object.fromEntries(species.map(s => [s.id,s]));
const missions = {
  correio:{name:'Correio do atlas', desc:'Entregue as fichas de revisão à sala de leitura.', level:1, seconds:15, coins:20, xp:20, icon:'mail'},
  arquivo:{name:'Arquivo de lâminas', desc:'Organize as ilustrações para a próxima aula.', level:1, seconds:32, coins:32, xp:28, icon:'book'},
  casos:{name:'Plantão de casos', desc:'Separe as pistas de um caso para o grupo de estudo.', level:2, seconds:55, coins:46, xp:42, icon:'bag'},
  colecao:{name:'Curadoria da coleção', desc:'Monte uma página temática para a exposição do atlas.', level:4, seconds:80, coins:65, xp:58, icon:'gem'}
};
const talents = {
  agility:{name:'Agilidade', effect:'Encurta as missões em 10% por ponto.', short:'Missões mais rápidas', icon:'bolt'},
  memory:{name:'Memória', effect:'Rende 20% a mais de XP-base por ponto.', short:'Mais experiência', icon:'book'},
  trade:{name:'Negociação', effect:'Rende 15% a mais de moedas-base por ponto.', short:'Mais moedas', icon:'coin'}
};
const groups = ['Todos','Hepatites','HIV','Respiratórios','Dengue'];

const iconUrls={"book":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAALCAMAAAB4W0xQAAAACVBMVEUAAAA5WEmMqn3cGpceAAAAAXRSTlMAQObYZgAAACtJREFUeAFjwACMQAAjgTQTEDBCSKxcoDoQCeMCmRASGxeoFAwgXFQCHwAALcoAfvVEUAgAAAAASUVORK5CYII=","team":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAALCAMAAAB4W0xQAAAACVBMVEUAAAA5WEmMqn3cGpceAAAAAXRSTlMAQObYZgAAAC5JREFUeAFjIAQYGYEEgmJiAjGgFIyGUkAGMsUIBjAKpAikDErBhIEYCICq8QEAFvEATbhyTTQAAAAASUVORK5CYII=","mail":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAALCAMAAAB4W0xQAAAACVBMVEUAAAA5WEmMqn3cGpceAAAAAXRSTlMAQObYZgAAADFJREFUeAFjIAAYkQCIy8TEBGSBKRAXyIAiMBdEMwIxkIZwgQwICeNCAJiLBIBcfAAAJmgAeD8qjF4AAAAASUVORK5CYII=","bag":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAALCAMAAAB4W0xQAAAACVBMVEUAAAA5WEmMqn3cGpceAAAAAXRSTlMAQObYZgAAAC9JREFUeAFjIAwYwQDIAAMIC0ICKQQAcZmAgBFCQrhAcTAfygUyICSIiwSAXHwAABq9AFwBzYg4AAAAAElFTkSuQmCC","gem":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAALCAMAAAB4W0xQAAAADFBMVEUAAAA5WEmMqn3U4qgUXpVLAAAAAXRSTlMAQObYZgAAADtJREFUeAFjwAIYwQDIAANGJiBgZoLyQTxmZmYmCB/KA3IhAhA+kADzIHwQgPBgfBgPwkfwgHyEtcgAAC5hAISiLsrIAAAAAElFTkSuQmCC","bolt":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAALCAMAAAB4W0xQAAAACVBMVEUAAAA5WEmMqn3cGpceAAAAAXRSTlMAQObYZgAAAClJREFUeAFjwA4YgQBIQQEjExM+HhIfzAMCuABIBMHB4CFxgHYCCawAABT5AD2DatjTAAAAAElFTkSuQmCC","coin":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAALCAMAAAB4W0xQAAAADFBMVEUAAACRXCfmqkz/8aig7teWAAAAAXRSTlMAQObYZgAAAC1JREFUeAFjIAwYQQBIQwAjEzMzMxOMz8jExAyEMD5+LogPBDAekA8CQJoQAAAegABcK9HlngAAAABJRU5ErkJggg==","grid":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAALCAMAAAB4W0xQAAAACVBMVEUAAAA5WEmMqn3cGpceAAAAAXRSTlMAQObYZgAAADhJREFUeAFjIAAYQQBKAgEjExMTkAsmgQAoChQHYiCJCYCiQHEgBpJAANEFIYEAKAoUB2IgSQAAABf9AEle5XNrAAAAAElFTkSuQmCC","flag":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAALCAMAAAB4W0xQAAAADFBMVEUAAAA5WEmMqn3U4qgUXpVLAAAAAXRSTlMAQObYZgAAACpJREFUeAFjIAQYYQDIBgJGJiZmZmYmJhxcGACygQBGQwEqF6gKhY8HAAAZXwBBD+BSFwAAAABJRU5ErkJggg=="};
function pixelIcon(key){
  return '<img class="pixel-icon" width="14" height="11" src="'+(iconUrls[key]||iconUrls.book)+'" alt="" aria-hidden="true">';
}
const spriteCache=new Map();
function spriteCanvas(s,level=1){
  const rank=level>=6?3:level>=4?2:level>=2?1:0, key=s.id+rank;
  if(spriteCache.has(key))return spriteCache.get(key);
  const c=document.createElement('canvas'); c.width=36; c.height=32;
  const g=c.getContext('2d'), body=new Set(), shape=s.look, dark='#263b39';
  const rect=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h);};
  const block=(x,y,w,h)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)body.add(j*36+i);};
  const silhouette={
    orbit:[5,7,9,11,12,12,12,12,12,12,11,10,8,6],tuft:[4,7,9,10,11,11,12,12,12,12,11,10,8,6],
    gem:[3,5,7,8,9,10,11,12,12,11,10,9,8,6],wing:[4,6,8,9,10,10,11,11,11,10,10,9,7,5],
    drop:[2,3,4,6,7,9,10,11,12,12,12,11,9,6],scallop:[5,8,9,11,11,12,12,12,12,12,11,10,8,6],
    shell:[3,5,7,8,9,10,11,12,12,13,13,13,12,10],reed:[4,6,8,9,10,11,11,11,11,11,10,10,9,6],
    spark:[4,6,8,9,10,11,11,11,11,11,10,9,8,6],twins:[3,5,8,9,11,12,13,13,13,13,12,11,9,6],
    box:[8,10,11,11,11,11,11,11,11,11,11,11,10,8],crown:[5,7,9,10,11,11,12,12,12,12,11,10,8,6]
  }[shape];
  silhouette.forEach((width,y)=>block(18-width,9+y,2*width,1));
  if(shape==='orbit'){for(const[x,y,w,h]of [[9,6,3,5],[5,10,5,3],[25,7,3,5],[28,14,4,3],[4,17,4,3],[15,5,4,5]])block(x,y,w,h);}
  if(shape==='tuft'){block(13,6,4,5);block(15,4,3,4);block(19,6,4,4);block(22,4,3,3);block(6,13,3,4);}
  if(shape==='gem'){block(15,6,6,4);block(17,4,2,3);block(4,16,4,3);block(28,16,4,3);}
  if(shape==='wing'){
    for(const[x,y,d]of [[3,9,1],[33,9,-1]])for(let i=0;i<5;i++)block(x+(d===1?i:-i-2),y+i,3,5);
    block(14,6,2,5);block(12,5,3,2);block(21,6,2,4);block(23,5,2,2);
  }
  if(shape==='drop'){block(18,6,3,4);block(20,4,3,4);}
  if(shape==='scallop'){block(10,7,4,5);block(16,6,5,6);block(23,7,3,5);block(4,14,5,4);block(27,14,5,4);}
  if(shape==='reed'){block(18,5,2,6);block(20,4,5,3);block(13,4,4,2);block(15,6,3,3);}
  if(shape==='spark'){for(const[x,y,w,h]of [[9,6,3,6],[7,5,3,3],[23,7,4,4],[26,5,2,4],[3,15,5,3],[28,12,4,3]])block(x,y,w,h);}
  if(shape==='twins'){block(8,9,6,7);block(9,7,4,3);block(21,7,6,6);block(22,6,4,2);}
  if(shape==='box'){block(6,7,4,4);block(25,7,4,4);block(4,13,3,6);block(29,13,3,6);}
  if(shape==='crown'){for(const[x,y,w,h]of [[6,6,4,3],[8,8,2,5],[16,3,4,3],[17,6,2,5],[25,5,4,3],[25,8,2,5],[2,14,4,3],[29,16,4,3]])block(x,y,w,h);}
  const [base,shade,lit]=s.colors;
  rect(8,25,8,3,dark);rect(9,23,5,4,shade);rect(21,24,6,4,dark);rect(22,23,4,4,shade);
  for(const p of body){const x=p%36,y=Math.floor(p/36);rect(x-1,y,3,1,dark);rect(x,y-1,1,3,dark);}
  for(const p of body){const x=p%36,y=Math.floor(p/36);
    const edge=!body.has(p+36)||!body.has(p+72)||!body.has(p+1);
    const top=!body.has(p-36)||!body.has(p-72);
    rect(x,y,1,1,edge?shade:top&&x<21?lit:base);
  }
  if(shape==='shell'||shape==='gem'||shape==='box'){
    rect(13,12,4,1,lit);rect(15,11,4,1,lit);rect(18,12,4,1,shade);
  }else{rect(10,13,3,1,lit);rect(11,12,3,1,lit);}
  if(shape==='wing'){rect(4,11,2,3,lit);rect(28,12,2,3,lit);}
  for(const x of[12,21]){rect(x,15,3,4,dark);rect(x,15,1,1,'#fff8df');}
  rect(10,19,3,1,'#d79089');rect(24,19,3,1,'#d79089');
  rect(16,19,1,1,dark);rect(17,20,2,1,dark);rect(19,19,1,1,dark);
  if(rank>=1){rect(9,22,16,1,dark);rect(11,23,13,2,'#368174');rect(20,24,4,3,'#265e55');rect(21,24,3,1,'#78d4ab');}
  if(rank>=2){rect(12,22,3,3,'#a07132');rect(13,22,1,2,'#ffe379');}
  if(rank>=3){rect(12,8,13,2,'#61552f');rect(13,7,11,2,'#f8cc5c');for(const x of [13,18,23])rect(x,5,1,3,'#ffdc74');}
  spriteCache.set(key,c);return c;
}

function portrait(id,level=1){
  const column=species.findIndex(s=>s.id===id);
  const row=level>=6?3:level>=4?2:level>=2?1:0;
  return '<span class="crew-sprite" style="--sprite-x:'+(100*column/(species.length-1))+
    '%;--sprite-y:'+(100*row/3)+'%" aria-hidden="true"></span>';
}

const hub = $('crewHub'), content = $('crewBody'), flash = $('crewFlash');
const SAVE_KEY = typeof window.openai?.setWidgetState==='function'
 ? 'lobulo-pagina-equipe-v1' : 'lobulo-equipe-viral-v1';
const MAX_LEVEL = 9, RECRUIT_COST = 40, LESSON_COST = 30;
const blankSave = () => ({version:1, coins:20, actors:{}, escort:null,revision:-1});
let state = blankSave(), storageOK = true;
let screen = 'catalog', focusId = 'hbv', dispatchId = null, filter = 'Todos';
let draftName = '', draftTalent = 'agility', origin = null, earlierFocus = null, readyMark = '';
const html = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const owned = () => Object.keys(state.actors).filter(id => byId[id]);
const cost = data => Object.keys(data.actors).length ? RECRUIT_COST : 0;
const threshold = level => 20 + 10*(level-1);
const unspent = a => a.level - Object.values(a.talents).reduce((sum,p) => sum+p,0);
const isReady = job => Date.now() >= job.ends;
const left = job => Math.max(0,Math.ceil((job.ends-Date.now())/1000));
const fmtTime = sec => `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;
const rankName = level => level>=6?'Veterano':level>=4?'Especialista':level>=2?'Explorador':'Recruta';
const theme = s => `--tint:${s.colors[3]};--accent:${s.colors[1]}`;
const validName = v => Array.from(String(v||'').trim()).slice(0,20).join('');
function validSave(data){
  return data?.version===1&&data.actors&&typeof data.actors==='object'&&
    Number.isSafeInteger(data.coins)&&data.coins>=0;
}
const pageHost=()=>window.openai;
let pageStorageOK=typeof pageHost()?.setWidgetState==='function';
function noteStorage(){
  $('crewSaveNote').hidden=storageOK||pageStorageOK;
}
function readSave(){
  let local=null;
  if(storageOK)try {
    local=JSON.parse(localStorage.getItem(SAVE_KEY));
  } catch(error) {
    if(error.name!=='SyntaxError')storageOK=false;
  }
  const attached=pageHost()?.widgetState?.lobulo;
  const copy=[local,attached].filter(validSave).reduce((a,b)=>(b.revision||0)>(a.revision||0)?b:a,state);
  return copy===state?state:JSON.parse(JSON.stringify(copy));
}
function save(){
  state.revision=Math.max(Date.now(),(state.revision||0)+1);
  if(storageOK)try {localStorage.setItem(SAVE_KEY,JSON.stringify(state))}
  catch {storageOK=false}
  if(pageStorageOK)try {
    const copy=JSON.parse(JSON.stringify(state));
    const pending=pageHost().setWidgetState({lobulo:copy});
    pending?.catch?.(()=>{pageStorageOK=false;noteStorage()});
  } catch {pageStorageOK=false}
  noteStorage();
}
function addXP(a,amount){
  const before=a.level;
  a.xp+=amount;
  while(a.level<MAX_LEVEL && a.xp>=threshold(a.level)){
    a.xp-=threshold(a.level);
    a.level++;
  }
  if(a.level===MAX_LEVEL)a.xp=0;
  return a.level-before;
}
function quote(id,a,key){
  const m=missions[key], t=a.talents;
  return {
    seconds:Math.round(m.seconds*(1-.1*t.agility)),
    coins:Math.round(m.coins*(1+.15*t.trade))+(byId[id].affinity===key?6:0),
    xp:Math.round(m.xp*(1+.2*t.memory))
  };
}
function gainMessage(a,levels){
  if(!levels)return '';
  return ` ${a.name} chegou ao nível ${a.level} e ganhou ${levels===1?'1 ponto de talento':levels+' pontos de talento'}.`;
}
function setFlash(message='',error=false){
  flash.textContent=message;
  flash.dataset.tone=error?'error':'good';
  flash.hidden=!message;
}
function go(next,id=null,message=''){
  screen=next;
  if(id)focusId=id;
  setFlash(message);
  render();
  const heading=content.querySelector('h2');
  if(heading){heading.tabIndex=-1;heading.focus();}
}
// Each action reads the current ledger and checks the job's ticket before changing its balance.
function transact(operation){
  function commit(){
    state=readSave();
    const result=operation(state)||{};
    if(!result.error)save();
    if(!hub.hidden){
      if(result.next)go(result.next,result.id,result.message||'');
      else{
        if(result.message||result.error)setFlash(result.error||result.message,!!result.error);
        render();
      }
    }
    syncBadges();
  }
  let locks;
  try{if(storageOK)locks=navigator.locks;}catch{}
  if(!locks){commit();return;}
  let entered=false;
  return locks.request(SAVE_KEY,()=>{entered=true;commit();}).catch(()=>{
    if(!entered){commit();return;}
    if(!hub.hidden)setFlash('Não foi possível registrar a ação. Tente de novo.',true);
  });
}
function action(label,act,id='',key='',css='c-primary',disabled=false,ticket=''){
  return `<button type="button" class="${css}" data-act="${act}" data-id="${id}" data-key="${key}" data-ticket="${ticket}"${disabled?' disabled':''}>${label}</button>`;
}
function heading(title,desc=''){
  return `<div class="crew-section-head"><div><h2>${title}</h2>${desc?`<p>${desc}</p>`:''}</div></div>`;
}
function back(label,act,id=''){return action('← '+label,act,id,'','c-back');}
function empty(title,description,button=''){
  return `<section class="empty-crew">${pixelIcon('team')}<h3>${title}</h3><p>${description}</p>${button?`<div class="panel-actions">${button}</div>`:''}</section>`;
}
function coinChip(value){return `<span class="reward-chip gold"><span class="coin-mark" aria-hidden="true"></span>${value} moedas</span>`;}
function rewards(coins,xp,seconds){
  return `<div class="rewards">${seconds!==undefined?`<span class="reward-chip">${seconds} s</span>`:''}${coinChip(coins)}<span class="reward-chip">${xp} XP</span></div>`;
}
function status(id,a) {
  if(a.job)return isReady(a.job)?'<span class="status-chip ready">Voltou da missão</span>':`<span class="status-chip busy">Em missão · <span data-countdown="${id}">${fmtTime(left(a.job))}</span></span>`;
  return state.escort===id?'<span class="status-chip arena">Na equipe da arena</span>':'<span class="status-chip">Livre</span>';
}
function cardArt(s,level,badge=''){
  return `<div class="dex-art" style="${theme(s)}"><span class="dex-code">${s.code}</span>${portrait(s.id,level)}${badge?`<span class="team-status">${badge}</span>`:''}</div>`;
}
function xpbar(a){
  const maxed=a.level===MAX_LEVEL, pct=maxed?100:Math.floor(100*a.xp/threshold(a.level));
  return `<div class="level-line"><span>Nível ${a.level} · ${rankName(a.level)}</span><span>${maxed?'Nível máximo':`${a.xp}/${threshold(a.level)} XP`}</span></div><div class="xp-track"><i style="width:${pct}%"></i></div>`;
}
function catalog(){
  const initial=!owned().length;
  const cards=species.filter(s=>filter==='Todos'||s.group===filter).map(s=>{
    const a=state.actors[s.id], cta=a?'Ver auxiliar':initial?'Escolher grátis':`Recrutar · ${RECRUIT_COST} moedas`;
    return `<button class="dex-card" data-act="${a?'agent':'create'}" data-id="${s.id}" aria-label="${html(cta+' · '+s.name+' · '+s.label)}">${cardArt(s,a?.level||1)}
      <span class="dex-copy"><span class="dex-name">${html(a?.name||s.name)}</span><span class="dex-virus">${s.label}</span>
      <span class="dex-actions">${cta}<span class="arrow-chip" aria-hidden="true">›</span></span></span></button>`;
  }).join('');
  return heading(initial?'Escolha seu primeiro auxiliar':'Recrutar auxiliares',initial?'O primeiro é grátis. Você escolhe o nome e o talento dele.':`Cada novo integrante custa ${RECRUIT_COST} moedas. Você pode recrutar um de cada vírus.`)+
    `<div class="crew-filters" role="group" aria-label="Filtrar vírus">${groups.map(g=>`<button class="crew-filter" data-act="filter" data-key="${g}" aria-pressed="${filter===g}">${g}</button>`).join('')}</div><div class="collection-grid">${cards}</div>`;
}
function team(){
  const ids=owned();
  if(!ids.length)return heading('Minha equipe')+empty('Quem vai entrar para a equipe?','Escolha entre os 12 mascotes do atlas. O primeiro recrutamento é grátis.',action('Escolher auxiliar','catalog'));
  const cards=ids.map(id=>{
    const a=state.actors[id],s=byId[id],pt=unspent(a);
    return `<article class="team-tile"><button class="team-link" data-act="agent" data-id="${id}" aria-label="Abrir ficha de ${html(a.name)}">
      ${cardArt(s,a.level,status(id,a))}<span class="dex-copy"><span class="dex-name">${html(a.name)}</span><span class="dex-virus">${s.label} · Nível ${a.level}</span>
      <span class="dex-actions">${pt?`${pt} ${pt===1?'ponto de talento':'pontos de talento'}`:'Ver ficha e talentos'} <span aria-hidden="true">›</span></span></span></button>
      ${action(a.job?(isReady(a.job)?'Ver recompensa':'Abrir missão'):'Enviar em missão',a.job?'job':'board',id,'','c-secondary tile-action')}</article>`;
  }).join('');
  return heading('Minha equipe',`${ids.length} de ${species.length} auxiliares recrutados.`)+`<div class="collection-grid">${cards}</div>`;
}
function passport(s,a=null){
  // Future parasite records can list several hosts. Each host has its role, life stage and form.
  // A vector may also be a definitive or intermediate host; keep those roles as separate entries.
  const cycle=s.hostCycle?.map(h=>`<li>${html(h.role)} · ${html(h.host)} · ${html(h.stage)} · ${html(h.form)}</li>`).join('');
  return `<aside class="sheet-panel id-sheet"><div class="profile-art" style="${theme(s)}"><span class="dex-code">${s.code}</span>${portrait(s.id,a?.level||1)}</div>
    <div class="profile-caption">${s.group==='HIV'||s.group==='Dengue'?'':`<div class="identity">${s.group}</div>`}<h3>${s.label}</h3><p class="profile-copy">${s.note}</p>
    ${cycle?`<h4>Hospedeiros e ciclo</h4><ul>${cycle}</ul>`:''}
    <a class="crew-source" href="${html(s.source[0])}" target="_blank" rel="noopener noreferrer">Ficha da fonte · ${s.source[1]}</a>
    <div class="affinity-line">Especialidade no jogo<br>${missions[s.affinity].name} · +6 moedas</div></div></aside>`;
}
function recruit(){
  const s=byId[focusId], price=cost(state), enough=state.coins>=price;
  return back('Voltar ao recrutamento','catalog')+heading(`Recrutar ${s.name}`)+`<div class="crew-detail-grid">${passport(s)}
    <form class="sheet-panel" id="crewRecruitForm"><h3>Personalizar auxiliar</h3>
    <label class="crew-label" for="crewName">Nome do mascote</label><input type="text" id="crewName" name="name" maxlength="20" autocomplete="off" required value="${html(draftName)}">
    <fieldset class="talent-choices"><legend>Escolha o primeiro talento</legend>${Object.entries(talents).map(([k,t])=>`<label class="talent-item"><input type="radio" name="talent" value="${k}" ${k===draftTalent?'checked':''}>${pixelIcon(t.icon)}<span><b>${t.name}</b><small>${t.effect}</small></span></label>`).join('')}</fieldset>
    <div class="panel-actions"><button type="submit" class="c-primary" ${enough?'':'disabled'}>${price?`Recrutar · ${price} moedas`:'Recrutar grátis'}</button></div>
    ${enough?'':`<p class="crew-small">Faltam ${price-state.coins} moedas. Sua equipe pode consegui-las em missões.</p>`}</form></div>`;
}
function profile(){
  const s=byId[focusId],a=state.actors[focusId],pt=unspent(a);
  const intro=a.completed===1?'1 missão concluída':`${a.completed} missões concluídas`;
  const training=Object.entries(talents).map(([key,t])=>{
    const n=a.talents[key], add=pt>0&&n<3;
    return `<div class="talent-item">${pixelIcon(t.icon)}<span><b>${t.name}</b><small>${t.effect}</small></span><span class="tail talent-readout">${n}/3</span>
      ${add?`<button class="talent-plus" type="button" data-act="train" data-id="${s.id}" data-key="${key}" aria-label="Aplicar um ponto em ${t.name}">+</button>`:''}</div>`;
  }).join('');
  let escort;
  if(state.escort===s.id){escort=a.job?'Assume a coleta na arena depois que você receber a recompensa.':`Acompanha o linfócito e amplia o alcance de coleta em ${12+3*a.level} unidades.`;}
  else{escort='Quando está livre, pode acompanhar o linfócito para recolher fragmentos de mais longe.';}
  return back('Minha equipe','team')+heading(html(a.name),intro)+`<div class="crew-detail-grid">${passport(s,a)}<section class="sheet-panel">
    ${xpbar(a)}<div class="panel-actions">${status(s.id,a)}${action(a.job?'Abrir missão':'Escolher missão',a.job?'job':'board',s.id)}</div>
    <div class="sheet-segment"><h3>Talentos</h3><p class="crew-small">${pt?`${pt} ${pt===1?'ponto disponível':'pontos disponíveis'}. Escolha onde investir.`:a.level===MAX_LEVEL?'Você distribuiu todos os pontos deste auxiliar.':'Cada novo nível libera um ponto para distribuir.'}</p>
    <div class="talent-tiles">${training}</div>
    ${a.level<MAX_LEVEL?`<div class="panel-actions">${action(`Treino de 20 XP · ${LESSON_COST} moedas`,'lesson',s.id,'','c-secondary',state.coins<LESSON_COST||!!a.job)}</div>`:''}
    ${a.level<MAX_LEVEL&&(a.job||state.coins<LESSON_COST)?`<p class="crew-small">${a.job?'O treino fica disponível quando o auxiliar volta à base.':`Faltam ${LESSON_COST-state.coins} moedas para o treino.`}</p>`:''}</div>
    <div class="sheet-segment"><h3>Companheiro de arena</h3><p class="crew-small">${escort}</p>
    ${state.escort!==s.id&&!a.job?`<div class="panel-actions">${action('Levar para a arena','escort',s.id,'','c-secondary')}</div>`:''}</div>
    </section></div>`;
}
function jobList(ids){
  if(!ids.length)return '';
  return `<h3>Missões da equipe</h3><div class="job-list">${ids.map(id=>{
    const a=state.actors[id],j=a.job;
    return `<div class="job-row" style="${theme(byId[id])}">${portrait(id,a.level)}<div class="slot-text"><b>${html(a.name)}</b><small>${missions[j.kind].name} · ${isReady(j)?'Recompensa pronta':`<span data-countdown="${id}">${fmtTime(left(j))}</span>`}</small>
    <div class="time-track"><i data-progress="${id}"></i></div></div>${action(isReady(j)?'Ver recompensa':'Abrir missão','job',id,'','c-secondary')}</div>`;
  }).join('')}</div>`;
}
function board(){
  const ids=owned(),busy=ids.filter(id=>state.actors[id].job),idle=ids.filter(id=>!state.actors[id].job);
  let out=heading('Quadro de missões','Cada auxiliar pode fazer uma missão por vez. Sua equipe pode trabalhar em paralelo.')+jobList(busy);
  if(!ids.length)return out+empty('A primeira missão espera por você','Recrute um auxiliar para assumir o Correio do atlas.',action('Recrutar grátis','catalog'));
  if(!idle.length)return out+empty('Equipe em campo','Você pode acompanhar uma missão acima ou recrutar outro auxiliar.',action('Ver recrutamento','catalog','','','c-secondary'));
  if(!idle.includes(dispatchId))dispatchId=idle[0];
  const a=state.actors[dispatchId], s=byId[dispatchId];
  out+=`<div class="dispatch-picker"><label for="crewDispatch">Quem vai em missão?</label><select id="crewDispatch">${idle.map(id=>`<option value="${id}" ${id===dispatchId?'selected':''}>${html(state.actors[id].name)} · Nível ${state.actors[id].level}</option>`).join('')}</select></div>`;
  out+=`<div class="mission-grid">${Object.entries(missions).map(([key,m])=>{
    const reward=quote(s.id,a,key), locked=a.level<m.level;
    return `<article class="mission-tile"><div class="mission-top"><div class="icon-tile">${pixelIcon(m.icon)}</div><h3>${m.name}</h3></div>
      <p>${m.desc}</p>${rewards(reward.coins,reward.xp,reward.seconds)}
      ${s.affinity===key?'<span class="crew-small">Inclui +6 moedas de especialidade.</span>':''}
      ${action(locked?'Libera no nível '+m.level:'Enviar '+html(a.name),'send',s.id,key,locked?'c-secondary':'c-primary',locked)}</article>`;
  }).join('')}</div>`;
  if(state.escort===s.id)out+=`<p class="crew-small">${html(a.name)} sai da arena durante a missão e volta quando você recebe a recompensa.</p>`;
  return out;
}
function assignment(){
  const s=byId[focusId],a=state.actors[focusId],j=a.job,m=missions[j.kind],ready=isReady(j);
  const [question,answers,explanation]=s.quiz[j.question], answered=Number.isInteger(j.answer),correct=j.answer===0;
  const quizOptions=j.order.map(n=>{
    const mark=answered?(n===0?' ✓':n===j.answer?' ×':''):'';
    const cl=answered?(n===0?' correct':n===j.answer?' wrong':''):'';
    return action(html(answers[n])+mark,'answer',s.id,String(n),'quiz-option'+cl,answered,j.ticket);
  }).join('');
  const coins=j.coins+(correct?8:0),xp=j.xp+(correct?6:0);
  return back('Quadro de missões','missions')+heading(m.name,`${html(a.name)} · ${s.label}`)+`<div class="crew-detail-grid">${passport(s,a)}
    <section class="sheet-panel"><h3>${ready?'Seu auxiliar voltou!':'Missão em andamento'}</h3>
    <div class="route-card"><div class="reward-line"><b>${ready?'Entrega concluída':'Tempo até o retorno'}</b><span class="job-deadline" data-countdown="${s.id}">${fmtTime(left(j))}</span></div>
    <div class="time-track"><i data-progress="${s.id}"></i></div><p class="crew-small">${ready?'Receba a recompensa para liberar o auxiliar.':(storageOK||pageStorageOK?'O relógio continua rodando enquanto você joga ou fecha a página.':'O relógio continua rodando enquanto a página está aberta.')}</p></div>
    ${rewards(coins,xp)}${ready?action('Receber recompensa','collect',s.id,'','c-primary',false,j.ticket):action('Voltar ao quadro','missions','','','c-secondary')}
    <div class="sheet-segment"><h3>Pergunta bônus</h3><p class="crew-small">Um acerto antes do resgate vale +8 moedas e +6 XP.</p><p><b>${question}</b></p>
    <div class="quiz-options">${quizOptions}</div>${answered?`<div class="quiz-review"><b>${correct?'Acertou! Bônus incluído.':html(answers[0])+'.'}</b> ${html(explanation)}</div>`:''}</div></section></div>`;
}

function currentReady(){
  return owned().filter(id=>state.actors[id].job && isReady(state.actors[id].job)).join('|');
}
function syncBadges(){
  const total=owned().length, running=owned().filter(id=>state.actors[id].job).length;
  $('crewCoins').textContent=state.coins;
  $('crewSize').textContent=total;
  $('crewJobs').textContent=running;
  $('crewJobs').hidden=!running;
  const ready=!!currentReady();
  if(!total)$('crewLead').textContent='Escolha um mascote viral para acompanhar você no lóbulo ou sair em missões por moedas e experiência.';
  else if(ready)$('crewLead').textContent='Tem auxiliar de volta à base. Abra a missão para conferir a resposta e receber sua recompensa.';
  else if(running)$('crewLead').textContent=running===1?'Um auxiliar está em missão. Você pode voltar à arena enquanto ele trabalha.':running+' auxiliares estão em missão. Você pode voltar à arena enquanto eles trabalham.';
  else $('crewLead').textContent='Sua equipe está na base. Escolha quem vai à arena e quem vai sair em missão.';
  $('crewHudReady').hidden=!ready;
  $('crewHud').setAttribute('aria-label',ready?'Abrir base dos auxiliares, recompensa pronta':'Abrir base dos auxiliares');
  scheduleTick();
}
function refreshClocks(){
  for(const el of content.querySelectorAll('[data-countdown]')){
    const j=state.actors[el.dataset.countdown]?.job;
    if(j)el.textContent=fmtTime(left(j));
  }
  for(const el of content.querySelectorAll('[data-progress]')){
    const j=state.actors[el.dataset.progress]?.job;
    if(j)el.style.width=Math.min(100,Math.max(0,(Date.now()-j.started)/(j.ends-j.started)*100))+'%';
  }
}
function render(){
  if(hub.hidden)return;
  if(screen==='create'&&state.actors[focusId])screen='agent';
  if(['agent','job'].includes(screen)&&!state.actors[focusId])screen='team';
  if(screen==='job'&&!state.actors[focusId].job)screen='agent';
  const tab={create:'catalog',agent:'team',job:'missions'}[screen]||screen;
  hub.classList.toggle('is-detail',screen!==tab);
  for(const b of hub.querySelectorAll('[data-view]')){
    if(b.dataset.view===tab)b.setAttribute('aria-current','page');
    else b.removeAttribute('aria-current');
  }
  noteStorage();
  $('crewReturnLabel').textContent={intro:'Ir para a arena',play:'Voltar à partida',pause:'Voltar à pausa',end:'Ver resultado'}[origin]||'Ir para a arena';
  $('crewReturnShort').textContent={intro:'Arena',play:'Voltar',pause:'Voltar',end:'Resultado'}[origin]||'Arena';
  content.innerHTML=({catalog,team,missions:board,create:recruit,agent:profile,job:assignment})[screen]();
  syncBadges();refreshClocks();
  readyMark=currentReady();
}
let missionTimer=null;
function scheduleTick(){
  if(missionTimer!==null){clearTimeout(missionTimer);missionTimer=null}
  if(document.hidden)return;
  const active=owned().map(id=>state.actors[id].job).filter(j=>j&&!isReady(j));
  if(active.length){
    const delay=hub.hidden?Math.max(1,Math.min(...active.map(j=>j.ends))-Date.now()):500;
    missionTimer=setTimeout(tick,delay);
  }
}
function tick(){
  const next=currentReady();
  if(next!==readyMark){
    readyMark=next;syncBadges();
    if(!hub.hidden&&['missions','job','team','agent'].includes(screen))render();
  }
  if(!hub.hidden)refreshClocks();
  scheduleTick();
}
function open(initial=false){
  if(!hub.hidden||S?.phase==='level')return;
  earlierFocus=document.activeElement;
  origin=S?.phase||'intro';
  if(S?.phase==='play')S.phase='base';
  joy.on=false;keys.clear();
  state=readSave();
  screen=owned().length?'team':'catalog';
  $('app').hidden=true;hub.hidden=false;
  setFlash();render();syncArena();
  if(!initial)$('crewReturn').focus();
}
function close(){
  if(hub.hidden)return;
  hub.hidden=true;$('app').hidden=false;
  if(S?.phase==='base')S.phase='play';
  keys.clear();syncArena();
  if(origin==='intro')renderArsenal();
  const target=origin==='intro'?$('startBtn'):(earlierFocus?.isConnected?earlierFocus:$('crewHud'));
  target?.focus();
  scheduleTick();
}
function makeTicket(){
  if(globalThis.crypto?.randomUUID)return crypto.randomUUID();
  return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
}
function dispatch(id,key){
  transact(data=>{
    const a=data.actors[id], m=missions[key];
    if(!a||a.job||!m||a.level<m.level)return {error:'Esse auxiliar já está ocupado ou ainda precisa subir de nível.'};
    const q=quote(id,a,key),now=Date.now(),pool=byId[id].quiz;
    const order=[0,1,2];
    for(let i=order.length-1;i>0;i--){const k=Math.floor(Math.random()*(i+1));[order[k],order[i]]=[order[i],order[k]];}
    a.job={ticket:makeTicket(),kind:key,started:now,ends:now+q.seconds*1000,coins:q.coins,xp:q.xp,question:a.nextQuestion,order,answer:null};
    a.nextQuestion=(a.nextQuestion+1)%pool.length;
    return {next:'job',id};
  });
}
function recordAnswer(id,ticket,index){
  transact(data=>{
    const j=data.actors[id]?.job;
    if(!j||j.ticket!==ticket||j.answer!==null||!j.order.includes(index))return {error:'Essa pergunta já foi encerrada.'};
    j.answer=index;
    return {message:index===0?'Resposta certa! O bônus já faz parte da recompensa.':'Você registrou sua resposta. Confira o comentário da ficha.'};
  });
}
function collect(id,ticket){
  transact(data=>{
    const a=data.actors[id],j=a?.job;
    if(!j||j.ticket!==ticket||!isReady(j))return {error:'A recompensa já foi recebida ou a missão ainda está em andamento.'};
    const bonus=j.answer===0, coins=j.coins+(bonus?8:0),xp=j.xp+(bonus?6:0);
    data.coins+=coins;
    const levels=addXP(a,xp);
    a.completed++;a.job=null;
    return {next:'agent',id,message:`Missão concluída! +${coins} moedas e +${xp} XP para ${a.name}.`+gainMessage(a,levels)};
  });
}
function newActor(){
  const id=focusId, name=validName(draftName), t=draftTalent;
  if(!name||!talents[t]){setFlash('Escolha um nome e um talento para seu auxiliar.',true);$('crewName')?.focus();return;}
  transact(data=>{
    const price=cost(data);
    if(data.actors[id])return {next:'agent',id,message:'Esse auxiliar já faz parte da equipe.'};
    if(data.coins<price)return {error:`Você precisa de ${price} moedas para recrutar.`};
    const skills={agility:0,memory:0,trade:0};skills[t]=1;
    data.actors[id]={name,level:1,xp:0,talents:skills,completed:0,nextQuestion:Math.floor(Math.random()*byId[id].quiz.length),job:null};
    data.coins-=price;
    if(!data.escort)data.escort=id;
    return {next:'agent',id,message:`${name} entrou na equipe com 1 ponto em ${talents[t].name.toLowerCase()}.`};
  });
}
function invest(id,key){
  transact(data=>{
    const a=data.actors[id];
    if(!a||!talents[key]||unspent(a)<1||a.talents[key]>=3)return {error:'Este ponto de talento já foi usado.'};
    a.talents[key]++;
    return {message:`${talents[key].name} de ${a.name} subiu para ${a.talents[key]}/3. O novo valor vale na próxima missão.`};
  });
}
function lesson(id){
  transact(data=>{
    const a=data.actors[id];
    if(!a||a.job||a.level>=MAX_LEVEL||data.coins<LESSON_COST)return {error:'Para treinar, o auxiliar precisa estar livre, abaixo do nível máximo, e a equipe precisa de 30 moedas.'};
    data.coins-=LESSON_COST;
    const levels=addXP(a,20);
    return {message:`Treino concluído. ${a.name} ganhou 20 XP.`+gainMessage(a,levels)};
  });
}
function setEscort(id){
  transact(data=>{
    if(!data.actors[id]||data.actors[id].job)return {error:'O auxiliar ainda está em missão.'};
    data.escort=id;
    return {message:`${data.actors[id].name} vai acompanhar você na arena.`};
  });
}
function escort(){
  const a=state.actors[state.escort];
  return a&&!a.job?a:null;
}
function drawEscort(){
  const a=escort();
  if(!a||S.phase==='intro')return;
  const bob=reduce?0:Math.sin(S.clock*3)*1.7;
  const x=S.p.x-S.p.fx*18-14,y=S.p.y-S.p.fy*18+1+bob;
  ctx.save();
  ctx.fillStyle='rgba(32,56,44,.2)';ctx.beginPath();ctx.ellipse(x+12,y+12,8,2.5,0,0,TAU);ctx.fill();
  ctx.imageSmoothingEnabled=false;ctx.drawImage(spriteCanvas(byId[state.escort],a.level),x,y-7,26,23);
  ctx.restore();
}
hub.addEventListener('click',e=>{
  const button=e.target.closest('button');
  if(!button||button.disabled)return;
  if(button.dataset.view){go(button.dataset.view);return;}
  const {act,id,key,ticket}=button.dataset;
  if(['catalog','team','missions','agent','job'].includes(act)){go(act,id);return;}
  switch(act){
    case 'filter':
      filter=key;setFlash();render();
      content.querySelector('.crew-filter[aria-pressed=true]')?.focus({preventScroll:true});break;
    case 'create':
      draftName=byId[id].name;draftTalent={correio:'agility',arquivo:'memory',casos:'memory',colecao:'trade'}[byId[id].affinity];
      go('create',id);break;
    case 'board':dispatchId=id;go('missions');break;
    case 'send':dispatch(id,key);break;
    case 'answer':recordAnswer(id,ticket,Number(key));break;
    case 'collect':collect(id,ticket);break;
    case 'train':invest(id,key);break;
    case 'lesson':lesson(id);break;
    case 'escort':setEscort(id);break;
  }
});
hub.addEventListener('input',e=>{if(e.target.id==='crewName')draftName=e.target.value;});
hub.addEventListener('change',e=>{
  if(e.target.name==='talent')draftTalent=e.target.value;
  if(e.target.id==='crewDispatch'){dispatchId=e.target.value;setFlash();render();$('crewDispatch')?.focus({preventScroll:true});}
});
hub.addEventListener('submit',e=>{if(e.target.id==='crewRecruitForm'){e.preventDefault();newActor();}});
$('crewReturn').addEventListener('click',close);
for(const id of ['crewHud','crewIntro','crewPause','crewEnd'])$(id).addEventListener('click',()=>open());
document.addEventListener('keydown',e=>{
  if(hub.hidden)return;
  if(e.key==='Escape'){e.preventDefault();close();e.stopPropagation();}
});
window.addEventListener('storage',e=>{
  if(e.key===SAVE_KEY){state=readSave();if(!hub.hidden)render();else syncBadges();}
});
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden){state=readSave();tick();if(!hub.hidden)render()}
  else scheduleTick();
});
window.addEventListener('openai:set_globals',event=>{
  pageStorageOK=typeof pageHost()?.setWidgetState==='function';
  const received=event.detail?.globals?.widgetState?.lobulo??pageHost()?.widgetState?.lobulo;
  if(validSave(received)&&(received.revision||0)>(state.revision||0)){
    state=JSON.parse(JSON.stringify(received));
    if(!hub.hidden)render();else syncBadges();
  }
  noteStorage();
});
state=readSave();
return {open,isOpen:()=>!hub.hidden,drawEscort,extraReach:()=>{const a=escort();return a?12+3*a.level:0;},
  fusionsFound:()=>Array.isArray(state.fusions)?state.fusions.filter(id=>Object.hasOwn(FUSIONS,id)):[],
  discoverFusion:id=>transact(data=>{
    const found=Array.isArray(data.fusions)?data.fusions:[];
    if(!found.includes(id))data.fusions=[...found,id];
  }),
  rewardAnswer:()=>transact(data=>{data.coins+=4;}),
  rewardCoins:amount=>transact(data=>{data.coins+=amount;})};
})();

function rel(e){const r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]}
cv.addEventListener('pointerdown',e=>{if(!S||S.phase!=='play')return;const[x,y]=rel(e);joy.on=true;joy.id=e.pointerId;joy.ox=x;joy.oy=y;joy.x=x;joy.y=y;try{cv.setPointerCapture(e.pointerId)}catch(_){}e.preventDefault()});
cv.addEventListener('pointermove',e=>{if(joy.on&&e.pointerId===joy.id){const[x,y]=rel(e);joy.x=x;joy.y=y}});
const release=e=>{if(e.pointerId===joy.id){joy.on=false;joy.id=null}};
for(const event of ['pointerup','pointercancel','lostpointercapture'])cv.addEventListener(event,release);
addEventListener('keydown',e=>{if(crew.isOpen())return;const k=(e.key||'').toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(k)){keys.add(k);if(S&&S.phase==='play')e.preventDefault()}if(k==='escape'||k==='p'){if(S&&S.phase==='play')pauseGame();else if(S&&S.phase==='pause')resume()}});
addEventListener('keyup',e=>keys.delete((e.key||'').toLowerCase()));
addEventListener('blur',()=>keys.clear());
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseGame()});
$('startBtn').addEventListener('click',startRun);
$('againBtn').addEventListener('click',showIntro);
$('contBtn').addEventListener('click',closeLevel);
$('resumeBtn').addEventListener('click',resume);
$('studyBtn').addEventListener('click',openStudy);
$('restartBtn').addEventListener('click',showIntro);
$('pauseBtn').addEventListener('click',()=>{if(S&&S.phase==='play')pauseGame();else if(S&&S.phase==='pause')resume()});

function releaseArena(){
 if(frameId!==null){cancelAnimationFrame(frameId);frameId=null}
 if(arenaObserver){arenaObserver.disconnect();arenaObserver=null}
 if(bg){bg.width=1;bg.height=1;bg=null}
 if(cv.width>1||cv.height>1){cv.width=1;cv.height=1}
}
function syncArena(){
 const phase=S?.phase||'intro';
 stage.dataset.phase=phase;
 if(phase!=='play'||crew.isOpen()||document.hidden){
  releaseArena();
  if(S)hud();
  return;
 }
 try{
  if(!ctx)ctx=cv.getContext('2d');
  if(!ctx||!resize())throw Error('Canvas 2D unavailable');
 }catch{
  releaseArena();S=null;lastH='';
  stage.dataset.phase='intro';$('intro').hidden=false;$('hud').hidden=true;
  $('pauseBtn').disabled=true;$('crewHud').disabled=false;
  $('arenaNotice').textContent='A arena não abriu neste navegador. A base e as missões continuam disponíveis.';
  $('arenaNotice').hidden=false;
  return;
 }
 if(!arenaObserver&&typeof ResizeObserver==='function'){
  arenaObserver=new ResizeObserver(()=>{if(resize())draw()});
  arenaObserver.observe(stage);
 }
 if(frameId===null){
  frameTime=performance.now();frameCredit=0;last=frameTime;
  draw();hud();frameId=requestAnimationFrame(frame);
 }
}
function frame(ts){
 frameId=null;
 if(!S||S.phase!=='play'||crew.isOpen()||document.hidden){syncArena();return}
 frameCredit+=Math.max(0,ts-frameTime);frameTime=ts;
 if(frameCredit>=FRAME_MS-.25){
  frameCredit=Math.max(0,frameCredit-FRAME_MS);
  const dt=Math.min(Math.max(0,(ts-last)/1000),.05);last=ts;
  update(dt);
  if(S.phase!=='play'){syncArena();return}
  ambient(dt);tickToast(dt);draw();hud();
 }
 if(frameId===null)frameId=requestAnimationFrame(frame);
}
window.addEventListener('resize',()=>{if(resize()&&arenaObserver===null)draw()});
try{best=+(localStorage.getItem('lobulo-hbv-best')||0)||0}catch{}
if(best)$('bestT').textContent='Seu recorde: '+(best>10?'infecção resolvida':'semana '+best);
showIntro();
crew.open(true);
}
