import { carregarInfluenza, poseInfluenza } from './influenza-2d.js';
import { Personagem2D } from './personagem-2d.js';
import { toxocaraChapter, evolucoesToxocara } from './toxocara.js?v=oocisto';
import { modeloToxocara, desenharCompanheiro } from './arte-toxocara.js?v=oocisto-animacao';
import { oocistoAtlas, modeloOocisto, poseSolturaOocisto, duracaoMutacao, desenharMudaOocisto,
 desenharTrilhaOocisto, desenharDisparoOocisto, desenharImpactoOocisto } from './arte-oocisto.js?v=animacao';
import { criarDisparoOocisto, avancarDisparoOocisto } from './combate-oocisto.js';
import { formasOocisto, proximaFormaOocisto, perguntasCrescente, sortearPergunta } from './morfologia-oocisto.js';

{
const root=document.getElementById('lobulo-game');
const $=id=>root.querySelector('#'+id);
const cv=$('cv'), stage=$('stage'), terrain=$('arenaTerrain'), roomAtlas=$('roomAtlas');
const parasiteAtlas=$('parasiteAtlas');
const chapters={
 influenza:{
  id:'influenza',title:'Influenza',short:'Influenza',topic:'Influenza',
  lead:'Monte seu vírus e passe por quatro arenas do aparelho respiratório.',
  stages:respiratory.stages,bosses:respiratory.bosses,review:respiratory.review,practice:respiratory.review.epidemiology,
  win:'Você passou pela traqueia e venceu o macrófago alveolar. +25 moedas.'
 },
 vsr:vsrChapter,
 toxocara:toxocaraChapter
};
const courseLimits=atlasCourseLimits;
const courseChoiceKey='atlas-viral-curso-ativo';
let selectedChapter=chapters.influenza;
const courseButtons=new Map();
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const TAU=Math.PI*2, FRAME_MS=1000/30;
const SHOT_ANIMATION_SPEED=1.4;
const SHOT_REACH=175;
const keys=new Set();
const moveStick={id:null,ox:0,oy:0,x:0,y:0};
const aimStick={id:null,ox:0,oy:0,x:0,y:0,mouse:false};
let touchLayout=window.matchMedia('(pointer: coarse)').matches||(window.navigator?.maxTouchPoints??0)>0;
const startingMorph={...viralMorphology.defaults};
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

const SLOTS=[
 ['ataque','Envoltório · ataque'],
 ['pulso','Envoltório · pulso'],
 ['defesa','Envoltório · defesa'],
 ['apoio','Envoltório · apoio'],
 ['nucleo','Reforço do nucleocapsídeo'],
 ['movimento','Acessório de movimento'],
 ['status','Status']
];
const RARITIES={
 common:{label:'Comum',weight:3},rare:{label:'Super-rara',weight:1},
 epic:{label:'Épica',weight:.55},legendary:{label:'Lendária',weight:.22},
 special:{label:'Especial'}
};
const UPGRADE_RARITIES={common:['common','rare','epic'],rare:['rare','epic','legendary']};
const SUPER_STATES={empty:'Faça um dash no anel',ready:'Pronto',armed:'No próximo disparo'};
const TRAITS={
 ha:{slot:'ataque',name:'Hemaglutinina',icon:'✺',color:'#a45826',rarity:'common',
  desc:'Fortalece os disparos. No nível 2, o golpe alcança até dois alvos.',
  study:'A hemaglutinina (HA) é uma proteína do envoltório. Ela ajuda o influenza a se ligar à célula. Anticorpos contra HA podem neutralizar o vírus.'},
 crescente:{slot:'ataque',name:'Crescente dourado',icon:'☾',color:'#a57831',rarity:'rare',kicker:'Ataque',
  desc:'Equipa uma peça dourada e acrescenta 4 pontos de dano ao disparo.'},
 na:{slot:'pulso',name:'Neuraminidase',icon:'◎',color:'#26797b',rarity:'common',
  desc:'Desenha ramos na membrana e solta um pulso em área a cada três ataques.',
  study:'A neuraminidase (NA) também fica no envoltório. Ela ajuda a liberar as novas partículas virais. Anticorpos contra NA podem contribuir para a proteção e reduzir a gravidade.'},
 shell:{slot:'defesa',name:'Membrana firme',icon:'⬡',color:'#396586',rarity:'rare',
  desc:'Amortece parte do dano dos ataques da arena.'},
 veil:{slot:'defesa',name:'Véu cintilante',icon:'✧',color:'#7a4793',rarity:'common',
  desc:'Aumenta a integridade máxima e recupera parte dela ao subir de nível.'},
 magnet:{slot:'apoio',name:'Anel coletor',icon:'∪',color:'#8c621e',rarity:'common',
  desc:'Atrai fragmentos de mais longe e facilita a convocação de ecos.'},
 core:{slot:'nucleo',name:'Núcleo estável',icon:'◇',color:'#705196',rarity:'rare',
  desc:'Aumenta o dano dos disparos e dos pulsos.'},
 dash:{slot:'movimento',name:'Impulso',icon:'»',color:'#3f658a',rarity:'common',
  desc:'Dash curto. As melhorias reduzem a recarga.'},
 reserve:{slot:'status',name:'Reserva de energia',icon:'✦',color:'#a34864',rarity:'common',
  desc:'Recupera integridade lentamente durante a partida.'}
};
const FUSIONS={
 resonancia:{name:'Ressonância violeta',chapter:'influenza',needs:{ha:1,na:1},icon:'✹',color:'#7a43a8',
  desc:'A cada terceiro disparo, o pulso lança também um feixe violeta na direção do ataque.'},
 eco:{name:'Eco inflamatório',chapter:'influenza',needs:{shell:1,dash:2},quiz:'pathogenesis',icon:'↟',color:'#ad5365',kicker:'Patogenia · Super',
  desc:'Use o dash para escapar do impacto de uma onda do chefe. Acione o Super para lançar o próximo disparo em leque, com +30% de dano por alvo.'},
 confluencia:{name:'Confluência',chapter:'vsr',needs:{},quiz:'syncytium',recipe:'Desafio do sincício',icon:'◉',color:'#5c5ba8',kicker:'Patogenia · ecos',
  desc:'A cada três disparos que acertam com a ajuda de um eco, libere um pulso curto em volta do personagem.'}
};
const SLOT_NAMES=Object.fromEntries(SLOTS);
const OPTIONAL=['shell','veil','magnet','core','dash','reserve'];
const defenseArt={
 cell:{look:'box',colors:['#efb084','#bd6679','#ffe5c3']},
 patrol:{look:'tuft',colors:['#85bbdd','#485b96','#d1eff0']},
 watch:{look:'shell',colors:['#9bd9c5','#458787','#e4f5c6']},
 airway:{look:'spark',colors:['#79b2d6','#4d5d98','#deefff']},
 lungs:{look:'scallop',colors:['#bb7ec2','#663b87','#f8cae8']},
 vsrWatch:{look:'shell',colors:['#8bb4cf','#486184','#e0fbeb']},
 vsrBronchi:{look:'spark',colors:['#7fcbb4','#3e727f','#e6ffd9']}
};
const companionLook={morph:{...viralMorphology.defaults,face:'calm'}};
const bodyCache=new Map();
const mapCache=document.createElement('canvas');
mapCache.width=mapCache.height=respiratory.size;

let S=null, ctx=null, frameId=null, observer=null;
let influenzaRig=null;
const toxocaraRig=new Personagem2D(modeloToxocara);
const oocistoRig=new Personagem2D(modeloOocisto);
const pendingPortraits=new Map();
let W=1,H=1,dpr=1,scale=1,ox=0,oy=0,lastFrame=0,lastHud='';
let toastUntil=0;

function sprite(type,rank=0) {
 const key=type+'-'+rank;
 if(!bodyCache.has(key)) {
  bodyCache.set(key,arenaArt.creature(defenseArt[type],rank,true));
 }
 return bodyCache.get(key);
}

function traitRank(id) {
 const held=S.slots[TRAITS[id].slot];
 return held?.id===id?held.rank:0;
}

function canEquip(id) {
 const held=S.slots[TRAITS[id].slot];
 return !held||(held.id===id&&held.rank<3);
}

function equip(id) {
 if(!canEquip(id))return false;
 const level=traitRank(id)+1;
 S.slots[TRAITS[id].slot]={id,rank:level};
 if(id==='veil'){
  S.p.max+=12;
  S.p.hp=Math.min(S.p.max,S.p.hp+18);
 }
 return true;
}

function canFuse(id) {
 const fusion=FUSIONS[id];
 return fusion.chapter===S.chapter.id&&!S.fusions.has(id)&&Object.entries(fusion.needs).every(([trait,rank])=>traitRank(trait)>=rank);
}

function equipFusion(id) {
 if(!canFuse(id))return false;
 S.fusions.add(id);
 crew.discoverFusion(id);
 return true;
}

function traitCard(id) {
 const trait=TRAITS[id], level=traitRank(id)+1;
 return {...trait,id,kind:'trait',rarity:UPGRADE_RARITIES[trait.rarity][level-1],level};
}

function fusionCard(id) {
 return {...FUSIONS[id],id,kind:'fusion',rarity:'special'};
}

function chooseTraits(ids, count) {
 const pool=ids.filter(canEquip).map(traitCard);
 const cards=[];
 while(pool.length&&cards.length<count) {
  const total=pool.reduce((sum,card)=>sum+RARITIES[card.rarity].weight,0);
  let roll=Math.random()*total;
  const index=pool.findIndex(card=>(roll-=RARITIES[card.rarity].weight)<0);
  cards.push(pool.splice(index,1)[0]);
 }
 return cards;
}

function encounterCards(ids,preferred=[]) {
 const fusions=Object.keys(FUSIONS).filter(id=>!FUSIONS[id].quiz&&canFuse(id)).map(fusionCard);
 const featured=preferred.filter(canEquip).map(traitCard);
 const spare=3-fusions.length-featured.length;
 const rest=chooseTraits(ids.filter(id=>!preferred.includes(id)),spare);
 return [...fusions,...featured,...rest];
}

function actor(type,x,y,required=false) {
 const setup=(S?.chapter??selectedChapter).bosses[type];
 const hp=setup?.health??(type==='cell'?28:31);
 return {type,x,y,hp,max:hp,r:setup?.r??(type==='cell'?15:13),
  speed:setup?.speed??(type==='cell'?0:43+Math.random()*12),
  hitAt:-1,required,phase:Math.random()*TAU,charge:1.8,windup:0,waves:0,spottedAt:null};
}

function addTargets() {
 const stop=room();
 for(const [x,y] of stop.targets)S.enemies.push(actor('cell',x,y,true));
}

function room() {
 return S.chapter.stages[S.step];
}

function chapterMorph(){
 return {...startingMorph,genome:selectedChapter.fixedGenome??startingMorph.genome};
}

function chapterStats(chapter,morph) {
 return chapter.stats??viralMorphology.stats(morph);
}

function createState() {
 const chapter=selectedChapter,morph=chapterMorph(),stats=chapterStats(chapter,morph);
 const first=chapter.stages[0];
 return {
  phase:'play',clock:0,step:0,regions:0,impact:0,cells:0,level:1,xp:0,chapter,morph,stats,control:morph.control,
  p:{...first.spawn,r:15,hp:stats.hp,max:stats.hp,fx:0,fy:1,facing:1,walk:0,stride:0,dash:0,dashAt:-1,
   cooldown:0,hitAt:-2,castAt:-1,shot:null},
  slots:{movimento:{id:'dash',rank:1}},fusions:new Set(),enemies:[],orbs:[],effects:[],projectiles:[],
  parasite:chapter===toxocaraChapter?{
   adaptacao:null,companheiro:null,shield:false,casts:0,
   oocisto:$('parasiteEvolution').value==='oocisto',morfologia:null,mudanca:null,crescenteAt:-1
  }:null,
  segmented:null,variation:null,pathogenesisOffered:false,superState:'empty',
  replication:arenaReplication.create(morph.replication),pressure:null,studySeen:false,
  nextAttack:stats.delay,casts:0,assistedCasts:0,nextPatrol:5.5,encounter:null,round:null,history:[],
  mucus:-1,mucusTime:0,mucusAnswered:false,roomCleared:false,wind:null,arrivedAt:-5,tapUntil:-1
 };
}

function currentBoss() {
 return S.enemies.find(e=>e.hp>0&&Object.hasOwn(S.chapter.bosses,e.type));
}

function announce(message) {
 const toast=$('toast');
 toast.textContent=message;
 toast.classList.add('show');
 toastUntil=S.clock+3.8;
}

function clearInput() {
 moveStick.id=null;aimStick.id=null;aimStick.mouse=false;keys.clear();
 if(S)S.tapUntil=-1;
}

function dash() {
 if(S?.phase!=='play'||S.p.cooldown>0)return;
 S.p.dash=S.stats.dash;
 S.p.dashAt=S.clock;
 if(S.parasite?.oocisto)S.p.shot=null;
 const recharge=S.stats.cooldown-(traitRank('dash')-1)*.42;
 S.p.cooldown=recharge*(S.variation?.cooldownFactor??1);
}

function armSuper() {
 if(S?.phase!=='play'||S.roomCleared||!S.fusions.has('eco')||S.superState!=='ready')return;
 S.superState='armed';
 announce('Eco armado. Mire para lançar o próximo disparo em leque.');
}

function pressureAtPlayer() {
 const field=S.pressure;
 return field&&field.until>S.clock&&distance(field,S.p)<field.r?field:null;
}

function move(dt) {
 const p=S.p;
 let x=0,y=0;
 if(moveStick.id!==null) {
  const dx=moveStick.x-moveStick.ox,dy=moveStick.y-moveStick.oy,length=Math.hypot(dx,dy);
  if(length>5){const power=Math.min(1,length/38);x=dx/length*power;y=dy/length*power;}
 }
 x+=Number(keys.has('arrowright')||keys.has('d'))-Number(keys.has('arrowleft')||keys.has('a'));
 y+=Number(keys.has('arrowdown')||keys.has('s'))-Number(keys.has('arrowup')||keys.has('w'));
 const length=Math.max(1,Math.hypot(x,y));x/=length;y/=length;
 p.walk=Math.hypot(x,y);
 if(p.walk>.1){p.fx=x/p.walk;p.fy=y/p.walk;}
 if(Math.abs(x)>.08)p.facing=Math.sign(x);
 const surface=S.mucus<0?(pressureAtPlayer()?.speedFactor??1):(room().surface?.speedFactor??.51);
 const speed=S.stats.speed*surface*(evolucoesToxocara[S.parasite?.adaptacao]?.speedFactor??1);
 const dashing=p.dash>0;
 p.x+=(dashing?p.fx*speed*2.85:x*speed)*dt;
 p.y+=(dashing?p.fy*speed*2.85:y*speed)*dt;
 p.stride+=dt*(dashing?22:16)*p.walk;
 p.dash=Math.max(0,p.dash-dt);
 p.cooldown=Math.max(0,p.cooldown-dt);
 respiratory.confine(p,room());
}

function harm(amount) {
 const p=S.p;
 if(S.clock-p.hitAt<.78||p.dash>0)return;
 if(S.parasite?.oocisto)p.shot=null;
 if(S.parasite?.shield){
  S.parasite.shield=false;
  p.hitAt=S.clock;lastHud='';
  announce('Broto do jardim absorveu o impacto.');
  return;
 }
 const forma=formasOocisto[S.parasite?.morfologia];
 p.hp=Math.max(0,p.hp-amount*S.stats.damageTaken*(forma?.defense??1)*(1-traitRank('shell')*.14));
 p.hitAt=S.clock;
}

function addEffect(effect) {
 if(S.effects.length>=32)S.effects.shift();
 S.effects.push({...effect,born:S.clock});
}

function hit(enemy,damage) {
 if(enemy.hp<=0)return;
 enemy.hp-=damage;enemy.hitAt=S.clock;
 if(enemy.type==='patrol')enemy.spottedAt??=S.clock;
 if(enemy.hp>0)return;
 const total=enemy.required?3:2;
 for(let i=0;i<total;i++) {
  S.orbs.push({x:enemy.x+(i-1)*10,y:enemy.y+(i%2?7:-3),t:Math.random()*TAU});
 }
 if(enemy.type==='cell'){S.cells++;S.impact=Math.min(96,S.impact+9);}
}

function unit(x,y,min=0) {
 const length=Math.hypot(x,y);
 if(length<=min)return null;
 return {x:x/length,y:y/length};
}

function aimDirection() {
 if(aimStick.id===null)return null;
 if(aimStick.mouse){
  const p=S.p;
  return unit(aimStick.x-(ox+p.x*scale),aimStick.y-(oy+p.y*scale),2);
 }
 return unit(aimStick.x-aimStick.ox,aimStick.y-aimStick.oy,7);
}

function aimedAt(enemy,p,aim,reach,width) {
 const x=enemy.x-p.x,y=enemy.y-p.y;
 const along=x*aim.x+y*aim.y;
 return along>=-enemy.r&&along<=reach+enemy.r&&Math.abs(x*aim.y-y*aim.x)<width+enemy.r+Math.max(0,along)*.07;
}

function fireLine(p,aim,reach,color,type='strike',life=.18,origin=p) {
 addEffect({type,x:origin.x,y:origin.y,x2:p.x+aim.x*reach,y2:p.y+aim.y*reach,color,life});
}

function fireEcho(p,aim,nearby,reach,damage,origin) {
 const rays=[-.32,0,.32].map(angle=>{
  const c=Math.cos(angle),s=Math.sin(angle);
  return {x:aim.x*c-aim.y*s,y:aim.x*s+aim.y*c};
 });
 for(const ray of rays)fireLine(p,ray,reach,'#ffb09d','echo',.3,origin);
 const bonusDamage=Math.round(damage*1.3);
 for(const enemy of nearby){
  if(rays.some(ray=>aimedAt(enemy,p,ray,reach,14)))hit(enemy,bonusDamage);
 }
 S.superState='empty';
}

function assistShots(nearby,aim) {
 let assisted=false;
 for(const ally of S.replication.allies){
  const target=nearby.find(enemy=>enemy.hp>0&&distance(enemy,ally)<=142+enemy.r&&aimedAt(enemy,ally,aim,142,17));
  if(!target)continue;
  addEffect({type:'assist',x:ally.x,y:ally.y,x2:target.x,y2:target.y,
   color:ally.study?'#ffdc9c':'#aef7eb',life:.21});
  hit(target,ally.study?6:4);
  assisted=true;
 }
 if(assisted&&S.fusions.has('confluencia')&&++S.assistedCasts%3===0){
  const {x,y}=S.p,r=96;
  addEffect({type:'pulse',x,y,r,color:'#c7f9e6',life:.34});
  for(const enemy of nearby)if(distance(enemy,S.p)<r+enemy.r)hit(enemy,10);
 }
}

function attackTargets(p,reach) {
 return S.enemies.filter(enemy=>enemy.hp>0&&distance(p,enemy)<reach+enemy.r)
  .sort((a,b)=>distance(p,a)-distance(p,b));
}

function oocistoAimPoint(p,ray,reach) {
 const length=aimStick.id!==null&&aimStick.mouse?
  Math.max(40,Math.hypot(aimStick.x-(ox+p.x*scale),aimStick.y-(oy+p.y*scale))/scale):reach;
 return {x:p.x+ray.x*length,y:p.y+ray.y*length};
}

function releaseAttack(shot,releasePose,nearby=attackTargets(S.p,shot.reach)) {
 const p=S.p,{reach,ha,na,core}=shot;
 const aim=shot.manual?(aimDirection()??shot.ray):null;
 const primary=nearby[0];
 const ray=aim??(primary&&unit(primary.x-p.x,primary.y-p.y))??shot.ray;
 if(Math.abs(ray.x)>.08)shot.side=Math.sign(ray.x);
 const targets=aim?nearby.filter(enemy=>aimedAt(enemy,p,aim,reach,14)):nearby;
 const rig=shot.rig;
 const origin=releasePose?rig.ponto('disparo',playerPosition(rig,p.x,p.y,24,shot.side),
  playerPose(rig,releasePose,S.morph.body)):p;
 S.casts++;
 p.castAt=S.clock;
 if(p.walk<.18)p.facing=shot.side;
 const crescent=traitRank('crescente');
 const color=ha||S.parasite?'#ffe5a5':'#b8f8fd';
 const effectType=releasePose?'pellet':'strike';
 const shapeDamage=influenzaCore.stats(S.segmented).attackOffset+(S.variation?.attackOffset??0);
 const damage=S.stats.attack+ha*4+core*4+crescent*4+shapeDamage;
 if(rig===oocistoRig){
  const target=shot.manual?oocistoAimPoint(p,ray,reach):primary??oocistoAimPoint(p,ray,reach);
  S.projectiles.push(criarDisparoOocisto(origin,p,target,ray,{alcance:reach,dano:damage,dourado:Boolean(crescent)}));
 }else if(S.superState==='armed'){
  fireEcho(p,ray,nearby,reach,damage,origin);
 }else{
  if(aim||!primary)fireLine(p,ray,reach,color,effectType,.18,origin);
  for(const target of targets.slice(0,ha>=2?2:1)){
   if(!aim)addEffect({type:effectType,x:origin.x,y:origin.y,x2:target.x,y2:target.y,color,life:.18});
   hit(target,damage);
  }
 }
 if(na&&S.casts%3===0) {
  const range=96+na*15;
  addEffect({type:'pulse',x:p.x,y:p.y,r:range,color:'#a3f7de',life:.34});
  for(const enemy of nearby)if(distance(enemy,p)<range+enemy.r)hit(enemy,9+na*4+core*4);
  if(S.fusions.has('resonancia')){
   const length=reach+66;
   fireLine(p,ray,length,'#eeb8ff','beam',.35,origin);
   for(const enemy of S.enemies)if(aimedAt(enemy,p,ray,length,24))hit(enemy,17+na*3);
  }
 }
 if(room().escapePulse&&++S.parasite.casts%3===0){
  const r=112;
  addEffect({type:'pulse',x:p.x,y:p.y,r,color:'#ffe7a7',life:.34});
  for(const enemy of nearby)if(distance(enemy,p)<r+enemy.r)hit(enemy,11);
 }
 if(!S.parasite)assistShots(nearby,ray);
}

function attack(dt) {
 const p=S.p;
 S.nextAttack-=dt;
 if(S.roomCleared)return;
 if(p.shot){
  const shot=p.shot;
  const speed=shot.rig===oocistoRig?1:SHOT_ANIMATION_SPEED;
  if(shot.animation.avancar(dt*speed,(event,pose)=>{
   if(event==='disparo')releaseAttack(shot,pose);
  }))p.shot=null;
 }
 if(S.nextAttack>0||p.shot)return;
 const rig=activePlayerRig();
 if(rig===oocistoRig&&(p.dash>0||S.clock-p.hitAt<rig.modelo.clipes.hurt.duracao))return;
 const aim=S.control==='manual'?aimDirection():null;
 const auto=S.control==='auto'||keys.has('j')||S.tapUntil>=S.clock;
 if(!aim&&!auto)return;
 const ha=traitRank('ha'),reach=SHOT_REACH+ha*14;
 const nearby=attackTargets(p,reach);
 const primary=nearby[0];
 if(!aim&&!primary)return;
 const ray=aim??unit(primary.x-p.x,primary.y-p.y)??{x:p.fx,y:p.fy};
 const shot={manual:Boolean(aim),ray,side:Math.abs(ray.x)>.08?Math.sign(ray.x):p.facing,
  reach,ha,na:traitRank('na'),core:traitRank('core')};
 S.nextAttack=S.stats.interval-ha*.025;
 S.tapUntil=-1;
 if(rig){
  shot.rig=rig;
  shot.animation=new Personagem2D(rig.modelo);
  shot.animation.tocar('shoot');
  p.shot=shot;
 }else releaseAttack(shot,undefined,nearby);
}

function pressurePattern(enemy) {
 return enemy.waves%2===1?S.chapter.bosses[enemy.type]?.pressure:null;
}

function moveDefenses(dt) {
 const p=S.p;
 const {patrolRange}=influenzaCore.stats(S.segmented);
 S.nextPatrol-=dt;
 if(S.nextPatrol<=0){
  S.nextPatrol=4.7-S.step*.46;
  if(S.enemies.length<13){
   const sign=Math.abs(p.x)>125?-Math.sign(p.x):Math.random()<.5?-1:1;
   const enemy=actor('patrol',p.x+sign*(145+Math.random()*70),p.y+55);
   respiratory.confine(enemy,room());
   S.enemies.push(enemy);
  }
 }
 for(const enemy of S.enemies) {
  if(enemy.hp<=0||enemy.type==='cell')continue;
  const boss=S.chapter.bosses[enemy.type], d=distance(p,enemy);
  if(enemy.type==='patrol'&&enemy.spottedAt===null){
   if(d>patrolRange){
    const direction=enemy.phase+S.clock*.65;
    enemy.x+=Math.cos(direction)*enemy.speed*.35*dt;
    enemy.y+=Math.sin(direction)*enemy.speed*.35*dt;
    respiratory.confine(enemy,room());
    continue;
   }
   enemy.spottedAt=S.clock;
  }
  if(enemy.windup>0) {
   enemy.windup=Math.max(0,enemy.windup-dt);
   if(enemy.windup===0) {
    const pressure=pressurePattern(enemy),antibody=enemy.type==='lungs'&&!pressure;
    enemy.waves++;
    if(pressure){
     S.pressure={x:enemy.x,y:enemy.y,r:boss.wave,until:S.clock+pressure.duration,speedFactor:pressure.speedFactor};
     announce('Campo dourado · saia do círculo para recuperar a velocidade.');
    }else{
     addEffect({type:'pulse',x:enemy.x,y:enemy.y,r:boss.wave,
      color:antibody?'#e2c4ff':'#ff8e9e',antibody,life:.36});
     if(d<boss.wave+p.r){
      if(p.dash>0&&S.fusions.has('eco')&&S.superState==='empty'){
       S.superState='ready';
       announce('Eco inflamatório carregado. Toque em Super ou pressione E.');
      }
      harm(S.step===0?14:19);
     }
    }
    enemy.charge=2.65;
   }
   continue;
  }
  if(boss&&d<boss.wave+90) {
   enemy.charge-=dt;
   if(enemy.charge<=0){enemy.windup=.85;continue;}
  }
  if(d>.01) {
   enemy.x+=(p.x-enemy.x)/d*enemy.speed*dt;
   enemy.y+=(p.y-enemy.y)/d*enemy.speed*dt;
   respiratory.confine(enemy,room());
  }
  if(d<enemy.r+p.r)harm(boss?13:8);
 }
}

function collect(dt) {
 const p=S.p, reach=65+traitRank('magnet')*27+crew.extraReach()+(evolucoesToxocara[S.parasite?.companheiro]?.reach??0);
 for(let i=S.orbs.length-1;i>=0;i--) {
  const orb=S.orbs[i],d=distance(orb,p);
  if(d>reach)continue;
  if(d<20){S.orbs.splice(i,1);S.xp++;if(!S.parasite)arenaReplication.fragment(S.replication);continue;}
  const move=Math.min(1,(78+(1-d/reach)*185)*dt/d);
  orb.x+=(p.x-orb.x)*move;orb.y+=(p.y-orb.y)*move;
 }
}

function spawnBoss(id) {
 const {x,y,name}=S.chapter.bosses[id];
 S.enemies.push(actor(id,x,y,true));
 S.encounter=id;
 const cue=id==='lungs'?'Pulmões · desvie do pulso violeta e saia do campo dourado.':
  name+' entrou na arena. Saia do anel quando ele se acender.';
 announce(cue);
}

function levelAfterArena() {
 let threshold=4+S.level*2;
 while(S.xp>=threshold){
  S.xp-=threshold;S.level++;
  threshold=4+S.level*2;
 }
}

function arenaReward() {
 const area=room(), reward=area.reward;
 S.roomCleared=true;
 S.regions=S.step+1;
 saveCourseProgress();
 S.enemies.length=0;S.effects.length=0;S.projectiles.length=0;
 S.mucus=-1;S.p.dash=0;S.pressure=null;
 S.impact=Math.min(96,S.impact+12);
 S.p.hp=Math.min(S.p.max,S.p.hp+14);
 if(reward)equip(reward);
 levelAfterArena();
 if(S.parasite){
  openQuiz(area.question,'cycle',correct=>{
   if(correct)S.p.hp=Math.min(S.p.max,S.p.hp+12);
   if(area.choices){
    const cards=area.choices.map(id=>{
     const {kind,description,...choice}=evolucoesToxocara[id];
     return {...choice,id,kind:'parasite',kicker:kind,desc:description,rarity:'common'};
    });
    showDraft(cards,'Escolha uma evolução',area.name+' · arena concluída',
     'A escolha acompanha o personagem nas próximas arenas.');
   }else{
    S.round=null;
    continueRun();
   }
  },'Acerte para recuperar 12 pontos de integridade.');
  return;
 }
 const available=[...OPTIONAL,...['ha','na'].filter(traitRank)];
 const featured=reward==='na'?['na',...(traitRank('shell')?['dash']:[])]:[];
 const cards=reward==='ha'?['shell','core','reserve'].filter(canEquip).map(traitCard):
  encounterCards(available,featured);
 const title=reward?TRAITS[reward].name+' entrou no envoltório':'Escolha uma evolução';
 const note=reward?TRAITS[reward].study:'As habilidades evoluem no próprio espaço.';
 const draft={cards,title,label:area.name+' · arena concluída',note,topic:reward};
 if(S.step===0&&S.chapter.id==='influenza')showLayoutChoices(draft);
 else if(area.unlock)showChallenge(fusionCard(area.unlock),'Desafio do sincício',
  'Associe a proteína do VSR ao efeito observado nas células.',()=>resumeDraft(draft));
 else resumeDraft(draft);
}

function leaveArena() {
 const next=S.chapter.stages[S.step+1];
 if(!next)return;
 S.phase='travel';
 S.wind={time:0,x:S.p.x,y:S.p.y};
 clearInput();setPanel('travel');syncArena();
 $('travelNote').textContent=S.parasite?'Passagem para '+next.name:'Corrente de ar para '+next.name;
}

function enterArena(step) {
 S.step=step;S.roomCleared=false;S.encounter=null;
 S.enemies.length=0;S.orbs.length=0;S.effects.length=0;S.projectiles.length=0;
 S.variation=influenzaCore.roll(S.segmented);
 Object.assign(S.p,{...room().spawn,walk:0,dash:0,dashAt:-1,castAt:-1,shot:null});
 S.pressure=null;S.studySeen=false;
 if(S.parasite){
  S.parasite.shield=Boolean(evolucoesToxocara[S.parasite.companheiro]?.shield);
  S.parasite.casts=0;
  if(room().escapePulse)S.p.hp=Math.min(S.p.max,S.p.hp+15);
 }else arenaReplication.update(S.replication,S.p,S.clock,1,false);
 S.mucus=-1;S.mucusTime=0;S.mucusAnswered=false;S.nextPatrol=4.8;S.nextAttack=S.stats.delay;
 addTargets();makeRoom();
}

function travel(dt) {
 const wind=S.wind, duration=reduce ? .32 : 1.19;
 wind.time+=dt;S.clock+=dt;
 const t=Math.min(1,wind.time/duration), progress=t*t;
 S.p.x=wind.x+(reduce?0:Math.sin(t*Math.PI*2)*22*progress);
 S.p.y=wind.y+progress*157;
 if(!S.parasite)arenaReplication.update(S.replication,S.p,S.clock,dt,false);
 if(t<1)return;
 enterArena(S.step+1);
 S.wind=null;S.arrivedAt=S.clock;S.phase='play';
 setPanel('play');lastHud='';cv.focus({preventScroll:true});
 const cue=room().escapePulse?' · Bônus do ciclo canino: até 15 de integridade.':'';
 announce(S.variation?room().name+' · '+S.variation.name+'. '+S.variation.desc+'.':room().name+cue);
}

function checkpoint() {
 const area=room();
 if(S.enemies.some(enemy=>enemy.required))return false;
 if(!S.encounter&&distance(area,S.p)>62)return false;
 if(area.boss&&!S.encounter){spawnBoss(area.boss);return false;}
 arenaReward();return true;
}

function mucusCheck(dt) {
 const index=respiratory.mucusAt(room(),S.p);
 if(index!==S.mucus) {
  S.mucus=index;S.mucusTime=0;S.mucusAnswered=false;
  if(index>=0)announce(room().surface?.label??'Muco espesso: seu movimento ficou mais lento.');
 }
 if(index<0||S.mucusAnswered||room().surface)return false;
 S.mucusTime+=dt;
 if(S.mucusTime<.36)return false;
 S.mucusAnswered=true;
 const pool=S.chapter.id==='influenza'&&S.step===1?
  [respiratory.questions[index],...respiratory.influenzaBank]:[respiratory.questions[2]];
 const unseen=pool.filter(question=>!S.history.some(item=>item.question===question.q));
 const options=unseen.length?unseen:pool;
 openQuiz(options[Math.floor(Math.random()*options.length)],'mucus');
 return true;
}

function studyPost() {
 const area=room();
 return (S.parasite?.oocisto?area.postoCrescente:null)??area.study;
}

function studyCheckpoint() {
 const post=studyPost();
 if(!post||S.studySeen||distance(post,S.p)>34)return false;
 S.studySeen=true;
 if(post===room().postoCrescente){
  showChallenge(traitCard('crescente'),'Crescente dourado',
   'Acerte para equipar o crescente na vaga de ataque.',resumeAfterChallenge,{
    question:sortearPergunta(perguntasCrescente,S.history),unlock:()=>{
     if(equip('crescente'))S.parasite.crescenteAt=S.clock;
    }
   });
  return true;
 }
 const pool=post.questions??respiratory.prophylaxis;
 const question=pool[Math.floor(Math.random()*pool.length)];
 openQuiz(question,'study',correct=>{
  if(correct)arenaReplication.studyReward(S.replication,S.p,S.clock);
  S.round=null;
  continueRun();
  if(correct&&S.phase==='play')announce('Aliado de estudo por '+arenaReplication.studyDuration+' s.');
 },'Acerte para ganhar um aliado temporário.');
 return true;
}

function update(dt) {
 S.clock+=dt;
 move(dt);
 collect(dt);
 if(!S.parasite)arenaReplication.update(S.replication,S.p,S.clock,dt,!S.roomCleared);
 if(S.roomCleared){
  if(room().exit&&distance(room().exit,S.p)<45)leaveArena();
  return;
 }
 if(mucusCheck(dt)||studyCheckpoint())return;
 attack(dt);
 moveDefenses(dt);
 if(S.projectiles.length){
  S.projectiles=S.projectiles.filter(shot=>avancarDisparoOocisto(shot,dt,S.enemies,(enemy,impact)=>{
   hit(enemy,impact.dano);
   addEffect({...impact,type:'oocisto-impact',life:impact.dourado?.3:.22});
  }));
 }
 const regeneration=traitRank('reserve')*.76;
 S.p.hp=Math.min(S.p.max,S.p.hp+dt*regeneration);
 S.effects=S.effects.filter(effect=>S.clock-effect.born<effect.life);
 S.enemies=S.enemies.filter(enemy=>enemy.hp>0);
 if(S.p.hp<=0){finish(false);return;}
 checkpoint();
}

function rarityBadge(rarity) {
 const badge=document.createElement('span');
 badge.className='rarity-badge';badge.dataset.rarity=rarity;
 badge.textContent=RARITIES[rarity].label;
 return badge;
}

function buttonCard(card, onChoose) {
 const button=document.createElement('button');
 button.type='button';button.className='build-card';
 button.dataset.rarity=card.rarity;button.dataset.choice=card.id;
 button.style.setProperty('--ability-color',card.color);
 const icon=document.createElement('span');
 icon.className='build-icon';icon.setAttribute('aria-hidden','true');icon.textContent=card.icon;
 const content=document.createElement('span');content.className='build-copy';
 const meta=document.createElement('span');meta.className='build-meta';
 const location=document.createElement('span');location.className='build-kicker';
 location.textContent=card.kicker??(card.kind==='fusion'?'Fusão':SLOT_NAMES[card.slot]+' · nível '+card.level);
 meta.append(rarityBadge(card.rarity),location);
 const title=document.createElement('strong');title.textContent=card.name;
 const body=document.createElement('span');body.className='build-desc';body.textContent=card.desc;
 content.append(meta,title,body);button.append(icon,content);
 button.addEventListener('click',onChoose);
 button.addEventListener('focus',()=>previewEvolution(card));
 button.addEventListener('pointerenter',()=>previewEvolution(card));
 return button;
}

function setPanel(phase) {
 stage.dataset.phase=phase;
 for(const [id,state] of [['intro','intro'],['lv','level'],['pause','pause'],['end','end']])$(id).hidden=phase!==state;
 $('hud').hidden=phase==='intro';
 $('arenaActions').hidden=phase!=='play';
 $('travelNote').hidden=phase!=='travel';
 $('touchLegend').hidden=phase!=='play'||!touchLayout;
 $('bossBar').hidden=true;
 $('crewHud').disabled=phase==='level'||phase==='travel';
 $('pauseBtn').disabled=phase!=='play'&&phase!=='pause';
 if(phase!=='play')$('toast').classList.remove('show');
}

function showIntro() {
 S=null;lastHud='';clearInput();
 setPanel('intro');syncArena();
 $('arenaNotice').hidden=true;
 renderChapter();
}

function renderCourseStatus(){
 const mode=atlasProgress.status();
 const status={connecting:'Consultando o progresso…',saving:'Salvando com ChatGPT…',account:'Progresso salvo com ChatGPT',
  signin:'Progresso neste navegador',local:'Progresso neste navegador'};
 $('courseStatus').textContent=status[mode];
 $('courseSignIn').hidden=mode!=='signin';
 for(const [id,{button,score}] of courseButtons){
  button.setAttribute('aria-pressed',String(id===selectedChapter.id));
  score.textContent=courseScore(id);
 }
}

function courseScore(id){
 const entry=atlasProgress.read(id),max=courseLimits[id],correct=entry?.correct??0;
 return (entry?.cleared===max?'Concluído':(entry?.cleared??0)+'/'+max+' arenas')+
   ' · '+correct+(correct===1?' acerto':' acertos');
}

function setupCourses(){
 try{
  const requested=new URLSearchParams(location.search).get('curso');
  const last=Object.hasOwn(chapters,requested)?requested:localStorage.getItem(courseChoiceKey);
  if(Object.hasOwn(chapters,last))selectedChapter=chapters[last];
 }catch{}
 for(const chapter of Object.values(chapters)){
  const button=document.createElement('button');
  button.type='button';button.dataset.course=chapter.id;
  const title=document.createElement('strong');title.textContent=chapter.title;
  const score=document.createElement('span');
  button.append(title,score);
  button.addEventListener('click',()=>{
   selectedChapter=chapter;
   try{localStorage.setItem(courseChoiceKey,chapter.id);}catch{}
   renderChapter();
  });
  $('courseChoices').append(button);
  courseButtons.set(chapter.id,{button,score});
 }
 atlasProgress.init(courseLimits,renderCourseStatus);
}

function renderChapter(){
 const chapter=selectedChapter, influenza=chapter.id==='influenza';
 const parasite=chapter===toxocaraChapter;
 $('chapterTitle').textContent=chapter.title;
 $('chapterLead').textContent=chapter.lead;
 $('chapterGroup').textContent=parasite?'Atlas Viral · Toxocara canis':'Atlas Viral · Fase respiratória';
 $('integrityLabel').textContent=parasite?'Integridade':'Integridade viral';
 $('genomeOption').hidden=parasite||Boolean(chapter.fixedGenome);
 $('parasiteEvolutionOption').hidden=!parasite;
 for(const id of ['bodySelect','faceSelect','surfaceSelect','replicationSelect'])$(id).closest('label').hidden=parasite;
 for(const id of ['virusSlots','virusFusions','virusGenome','virusGuide','arenaTerrain'])$(id).hidden=parasite;
 $('parasiteHelp').hidden=!parasite;
 $('parasiteTerrain').hidden=!parasite;
 $('routeCaption').textContent=parasite?'Mapa do percurso zoonótico':'Mapa das vias respiratórias';
 $('influenzaDefenses').hidden=!influenza;
 $('influenzaPathogenesis').hidden=!influenza;
 $('influenzaCoreHelp').hidden=!influenza;
 $('influenzaLink').hidden=!influenza;
 $('vsrHelp').hidden=chapter.id!=='vsr';
 $('practiceBtn').textContent='Revisar · '+chapter.practice.topic;
 stage.setAttribute('aria-label','Arena · '+chapter.short);
 cv.setAttribute('aria-label','Arena do Atlas Viral, com '+chapter.stages.length+' regiões');
 $('campaignRoute').replaceChildren();
 $('regionTrack').replaceChildren();
 for(const area of chapter.stages){
  const entry=document.createElement('li'),name=document.createElement('b'),detail=document.createElement('span');
  name.textContent=area.name;detail.textContent=area.caption??area.task;
  entry.append(name,detail);$('campaignRoute').append(entry);
  const region=document.createElement('li');region.textContent=area.name;$('regionTrack').append(region);
 }
 if(!parasite){$('guideTopic').value=chapter.topic;renderGuideQuestions();}
 renderCourseStatus();
 updateKit();
 renderIntroduction();
}

function renderIntroduction() {
 const relevant=Object.entries(FUSIONS).filter(([,fusion])=>fusion.chapter===selectedChapter.id);
 const found=crew.fusionsFound();
 $('fusionCount').textContent='Poderes especiais descobertos '+relevant.filter(([id])=>found.includes(id)).length+'/'+relevant.length;
 const list=$('fusionRecipes');
 list.replaceChildren();
 for(const [id,fusion] of relevant){
  const row=document.createElement('li');
  const recipe=fusion.recipe??Object.entries(fusion.needs).map(([key,rank])=>TRAITS[key].name+(rank>1?' nível '+rank:'')).join(' + ');
  row.textContent=found.includes(id)?fusion.name+' · '+recipe:recipe;
  list.append(row);
 }
}

function setupGuide() {
 const select=$('guideTopic');
 const topics=[...new Set(guiaRespiratoria.map(item=>item.topic))];
 for(const topic of ['Todos os temas',...topics]){
  const option=document.createElement('option');
  option.value=topic;option.textContent=topic;select.append(option);
 }
 select.addEventListener('change',renderGuideQuestions);
}

function renderGuideQuestions(){
 const select=$('guideTopic'),list=$('guideQuestions');
 list.replaceChildren();
 for(const entry of guiaRespiratoria){
  if(select.value!=='Todos os temas'&&entry.topic!==select.value)continue;
  const row=document.createElement('li');
  row.value=entry.number;
  const level=document.createElement('strong');level.textContent=entry.level;
  const text=document.createElement('p');text.lang='es';text.textContent=entry.prompt;
  row.append(level,text);list.append(row);
 }
}

function startRun() {
 S=createState();lastHud='';clearInput();enterArena(0);
 setPanel('play');syncArena();
 if(S)cv.focus({preventScroll:true});
}

function setupChoice(title,label,note) {
 S.p.shot=null;
 S.phase='level';clearInput();setPanel('level');syncArena();
 $('qText').textContent=title;$('lvTag').textContent=label;
 $('draftHint').hidden=!note;$('draftHint').textContent=note;
 $('opts').replaceChildren();
 $('ups').replaceChildren();$('ups').hidden=true;
 $('contBtn').textContent='Continuar';$('contBtn').classList.remove('ghost');
 $('fb').hidden=true;$('contBtn').hidden=true;$('reviewBtn').hidden=true;$('evolutionPreview').hidden=true;
}

function showDraft(cards,title,label,note,topic=null) {
 S.round={kind:'draft',cards,title,label,note,topic};
 setupChoice(title,label,note);
 $('reviewBtn').hidden=!topic;
 $('evolutionPreview').hidden=false;
 previewEvolution();
 if(!cards.length){$('contBtn').hidden=false;$('contBtn').focus();return;}
 const panel=$('ups');panel.hidden=false;
 for(const card of cards){
  const button=buttonCard(card,()=>{
   if(S?.phase!=='level'||S.round?.kind!=='draft')return;
   if(card.kind==='trait'){
    if(!equip(card.id))return;
   }else if(card.kind==='parasite'){
    S.parasite[card.slot]=card.id;
    if(card.hp){S.p.max+=card.hp;S.p.hp+=card.hp;}
   }else if(!equipFusion(card.id))return;
   continueRun();
  });
  panel.append(button);
 }
 panel.firstElementChild?.focus({preventScroll:true});
}

function resumeDraft(draft) {
 showDraft(draft.cards,draft.title,draft.label,draft.note,draft.topic);
}

function coreCard(id,item,segmented,kicker,desc,rarity='rare') {
 return {id,name:item.name,color:item.color,icon:item.icon??String(segmented.segments),
  segmented,kicker,desc,rarity,question:item.question};
}

function coreStatsText(segmented) {
 const {patrolRange,chance,bonusShare,attackOffset}=influenzaCore.stats(segmented);
 const damage=attackOffset?' · '+String(attackOffset).replace('-','−')+' no dano do disparo':'';
 return 'Detectabilidade '+patrolRange+' · Variabilidade '+chance+'% · '+bonusShare+'% das formas são bônus'+damage;
}

function showCoreChoices({title,note,cards,skip,hint},draft,onUnlock) {
 const round={kind:'core-choice',returnTo:()=>resumeDraft(draft)};
 S.round=round;
 setupChoice(title,'Área do núcleo · Orofaringe',note);
 $('evolutionPreview').hidden=false;
 previewEvolution(cards[0]);
 const panel=$('ups');panel.hidden=false;
 for(const card of cards){
  const button=buttonCard(card,()=>{
   if(S?.phase!=='level'||S.round!==round)return;
   openQuiz(card.question,'core',correct=>{
    if(!correct){resumeDraft(draft);return;}
    S.segmented=card.segmented;
    onUnlock(draft);
   },hint);
  });
  panel.append(button);
 }
 const skipButton=$('contBtn');
 skipButton.textContent=skip;skipButton.hidden=false;skipButton.classList.add('ghost');
 panel.firstElementChild.focus({preventScroll:true});
}

function showLayoutChoices(draft) {
 const cards=[8,7].map(segments=>{
  const segmented={segments};
  return coreCard('segments-'+segments,influenzaCore.layouts[segments],segmented,'Morfologia interna',coreStatsText(segmented));
 });
 showCoreChoices({title:'Escolha seu núcleo',note:'Detectabilidade é o alcance de visão das patrulhas. Variabilidade é a chance de sortear uma forma temporária ao entrar em outra arena.',
  cards,skip:'Seguir sem núcleo segmentado',hint:'Acerte para equipar esta morfologia interna.'},draft,showProfileChoices);
}

function showProfileChoices(draft) {
 const layout=influenzaCore.layouts[S.segmented.segments];
 const cards=layout.profiles.map(profile=>{
  const segmented={...S.segmented,profile};
  return coreCard(profile,influenzaCore.profiles[profile],segmented,layout.name,coreStatsText(segmented));
 });
 showCoreChoices({title:'Escolha um perfil de influenza',note:'Seu núcleo de '+layout.name+' está equipado. Uma pergunta bônus libera o perfil escolhido e o acesso ao poder exclusivo.',
  cards,skip:'Manter só os segmentos',hint:'Se errar, você segue com os segmentos que equipou.'},draft,showSignatureChoices);
}

function showSignatureChoices(draft) {
 const profile=influenzaCore.profiles[S.segmented.profile];
 const cards=profile.signatures.map(signature=>{
  const power=influenzaCore.signatures[signature];
  return coreCard(signature,power,{...S.segmented,signature},'Poder exclusivo',power.desc,'special');
 });
 showCoreChoices({title:'Escolha um poder exclusivo',note:'Cada partida tem um espaço para um poder de núcleo. O efeito é passivo e aparece na descrição de cada opção.',
  cards,skip:'Manter o perfil sem poder',hint:'Se errar, você segue com seu perfil de núcleo.'},draft,resumeDraft);
}

function resumeAfterChallenge() {
 S.round=null;
 continueRun();
}

function showPathogenesis() {
 S.pathogenesisOffered=true;
 showChallenge(fusionCard('eco'),'Patogenia respiratória',
  'Membrana firme e Impulso nível 2 abriram um desafio de patogenia.',resumeAfterChallenge);
}

function showChallenge(card,title,note,onContinue,{
 question=S.chapter.review[card.quiz],unlock=()=>equipFusion(card.id)
}={}) {
 const round={kind:'pathogenesis',returnTo:onContinue};
 S.round=round;
 const label=card.rarity==='special'?'recompensa Especial':card.kicker;
 setupChoice(title,room().name+' · '+label,note);
 $('evolutionPreview').hidden=false;
 previewEvolution(card);
 const choice=buttonCard(card,()=>{
  if(S?.phase!=='level'||S.round!==round)return;
  openQuiz(question,'pathogenesis',correct=>{
   if(correct)unlock();
   onContinue();
  },'Acerte para equipar esta evolução.');
 });
 $('ups').append(choice);$('ups').hidden=false;
 $('contBtn').textContent='Seguir com a combinação atual';
 $('contBtn').hidden=false;$('contBtn').classList.add('ghost');
 choice.focus({preventScroll:true});
}

function openQuiz(question,mode,returnTo=null,hint='') {
 S.round={kind:'quiz',mode,returnTo,answered:false};
 const note=mode==='mucus'?'Uma resposta certa protege sua integridade. Um erro custa 26 pontos.':hint;
 const source=question.guide?' · Taller 14, questão '+question.guide:'';
 setupChoice(question.q,question.level+' · '+question.topic+source,note);
 if(mode==='practice')$('hud').hidden=true;
 const order=[0,1,2];
 for(let i=order.length-1;i>0;i--) {
  const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];
 }
 for(const index of order){
  const option=document.createElement('button');
  option.type='button';option.className='opt';option.textContent=question.answers[index];
  option.dataset.correct=String(index===0);
  option.addEventListener('click',()=>answerQuiz(index,question,option));
  $('opts').append(option);
 }
 $('opts').firstElementChild?.focus({preventScroll:true});
}

function answerQuiz(index,question,option) {
 if(S?.phase!=='level'||S.round?.kind!=='quiz'||S.round.answered)return;
 const correct=index===0,mucus=S.round.mode==='mucus';
 S.round.answered=true;S.round.correct=correct;
 S.history.push({question:question.q,correct});
 saveCourseProgress();
 if(mucus) {
  if(correct)crew.rewardAnswer();
  else S.p.hp=Math.max(0,S.p.hp-26);
 }
 for(const button of $('opts').children) {
  button.disabled=true;
  if(button.dataset.correct==='true')button.classList.add('ok');
 }
 if(!correct)option.classList.add('no');
 const feedback=$('fb');
 feedback.className='fb '+(correct?'good':'bad');
 const headline=document.createElement('p');
 headline.className='fbh';
 headline.textContent=mucus?(correct?'Integridade preservada':'Você perdeu 26 pontos de integridade'):
  (correct?'Resposta certa':'Confira a resposta');
 const explanation=document.createElement('p');explanation.textContent=question.note;
 feedback.replaceChildren(headline,explanation);feedback.hidden=false;
 $('contBtn').hidden=false;$('contBtn').focus({preventScroll:true});hud();
}

function reviewTrait() {
 const draft=S?.round;
 if(draft?.kind==='draft'&&draft.topic)openQuiz(S.chapter.review[draft.topic],'review',draft);
}

function practice() {
 S=createState();lastHud='';
 openQuiz(S.chapter.practice,'practice',{kind:'intro'});
}

function saveCourseProgress(){
 atlasProgress.record(S.chapter.id,S.regions,S.history.filter(answer=>answer.correct).length);
}

function continueRun() {
 if(S?.phase!=='level')return;
 const round=S.round;
 if(round?.kind==='quiz'&&!round.answered)return;
 const destination=round?.returnTo;
 if(typeof destination==='function'){destination(round.correct);return;}
 if(destination?.kind==='intro'){showIntro();$('practiceBtn').focus();return;}
 if(destination?.kind==='draft'){
  showDraft(destination.cards,destination.title,destination.label,destination.note);
  return;
 }
 if(round?.kind==='draft'&&S.roomCleared&&S.parasite?.oocisto){
  const form=proximaFormaOocisto(S.parasite.morfologia);
  if(form){
   showChallenge(form,form.name,'Acerte para equipar a próxima forma da casca.',resumeAfterChallenge,{
    question:sortearPergunta(form.questions,S.history),unlock:()=>{
     const previous=formasOocisto[S.parasite.morfologia]?.level??0;
     S.parasite.mudanca={de:previous,at:S.clock};
     S.parasite.morfologia=form.id;
    }
   });
   return;
  }
 }
 if(round?.kind==='draft'&&S.step>0&&room().exit&&!S.pathogenesisOffered&&canFuse('eco')){
  showPathogenesis();
  return;
 }
 S.round=null;
 if(S.p.hp<=0){finish(false);return;}
 if(S.roomCleared&&!room().exit){finish(true);return;}
 S.phase='play';clearInput();setPanel('play');syncArena();cv.focus({preventScroll:true});
 if(S.roomCleared)announce(S.parasite?'Chegue à passagem para avançar.':'Chegue à corrente de ar para avançar.');
}

function parasiteFormName() {
 return S.parasite.oocisto?(formasOocisto[S.parasite.morfologia]?.name??'Corpo-base'):room().form;
}

function describeBuild(list) {
 list.replaceChildren();
 if(S.parasite){
  const skills=['adaptacao','companheiro'].map(slot=>evolucoesToxocara[S.parasite[slot]]?.name);
  const notes=[parasiteFormName(),traitRank('crescente')?TRAITS.crescente.name:null,'Impulso 1',...skills].filter(Boolean);
  for(const note of notes){
   const item=document.createElement('li');item.textContent=note;list.append(item);
  }
  return;
 }
 for(const [key,label] of SLOTS) {
  const item=document.createElement('li');item.className='none';
  const held=S.slots[key];
  item.textContent=label+' · '+(held?TRAITS[held.id].name+' '+held.rank:'Livre');
  if(held)item.append(' ',rarityBadge(UPGRADE_RARITIES[TRAITS[held.id].rarity][held.rank-1]));
  list.append(item);
 }
 const replication=document.createElement('li');replication.className='none';
 replication.textContent='Replicação · '+S.replication.profile.name;
 list.append(replication);
 for(const id of S.fusions){
  const item=document.createElement('li');item.className='none';
  item.append((FUSIONS[id].kicker?FUSIONS[id].kicker+' · ':'')+FUSIONS[id].name+' ',rarityBadge('special'));list.append(item);
 }
 if(S.segmented){
  const {segments,profile,signature}=S.segmented;
  const core=document.createElement('li');core.className='none';
  core.textContent='Morfologia interna · '+influenzaCore.layouts[segments].name+(profile?' · '+influenzaCore.profiles[profile].name:'');
  const stats=document.createElement('li');stats.className='none';stats.textContent=coreStatsText(S.segmented);
  list.append(core,stats);
  if(signature){
   const power=document.createElement('li');power.className='none';
   power.append('Poder exclusivo · '+influenzaCore.signatures[signature].name+' ',rarityBadge('special'));list.append(power);
  }
  if(S.variation){
   const variation=document.createElement('li');variation.className='none';
   variation.textContent=S.variation.name+' · '+S.variation.desc;list.append(variation);
  }
 }
}

function pauseGame() {
 if(S?.phase!=='play')return;
 S.phase='pause';clearInput();setPanel('pause');syncArena();
 $('pauseControl').value=S.control;
 describeBuild($('ctr'));$('resumeBtn').focus({preventScroll:true});
}

function resume() {
 if(S?.phase!=='pause')return;
 S.phase='play';clearInput();setPanel('play');syncArena();
 cv.focus({preventScroll:true});
}

function finish(won) {
 S.phase='end';clearInput();
 if(won){S.impact=100;S.regions=S.chapter.stages.length;crew.rewardCoins(25);saveCourseProgress();}
 setPanel('end');syncArena();
 const oocisto=S.parasite?.oocisto;
 $('endH').textContent=won?(oocisto?'Oocisto · caminho concluído':S.chapter.short+' · capítulo concluído'):
  S.parasite?'A rota foi interrompida':'A defesa respiratória conteve o vírus';
 $('endP').textContent=won?(oocisto?'Você chegou ao marco da migração com o Oocisto. +25 moedas.':S.chapter.win):
  'Tente outra combinação e use o dash para sair dos anéis de defesa.';
 $('sInf').textContent=S.cells;$('sBoss').textContent=S.regions+'/'+S.chapter.stages.length;
 $('sDefensesLabel').textContent=S.parasite?'defesas superadas':'células enfrentadas';
 $('sResultLabel').textContent=S.parasite?'respostas certas':'mal-estar no jogo';
 $('sF').textContent=S.parasite?S.history.filter(answer=>answer.correct).length:S.impact+'%';
 describeBuild($('loadoutEnd'));
 $('codex').replaceChildren();
 for(const result of S.history) {
  const row=document.createElement('li');row.className=result.correct?'':'x';
  row.textContent=result.question;$('codex').append(row);
 }
 $('runQuizLog').hidden=!S.history.length;
 $('againBtn').focus({preventScroll:true});
}

function hud() {
 const p=S.p,area=room(),boss=currentBoss();
 const {profile,charge,allies}=S.replication;
 const underPressure=Boolean(pressureAtPlayer());
 const hp=Math.ceil(p.hp),dashSeconds=Math.ceil(p.cooldown);
 const key=[hp,p.max,S.step,S.level,S.xp,S.impact,S.mucus,boss?.type,boss?.hp,dashSeconds,
  S.roomCleared,S.phase,S.control,touchLayout,S.segmented?.segments,S.segmented?.profile,S.segmented?.signature,
  S.fusions.has('eco'),S.superState,charge,allies.length,underPressure,S.studySeen,S.parasite?.shield,S.parasite?.morfologia].join('|');
 if(key===lastHud)return;
 lastHud=key;
 $('regionNow').textContent=area.name;$('hpt').textContent=hp+'/'+p.max;
 $('hpb').style.width=100*p.hp/p.max+'%';
 $('lvt').textContent='Nível '+S.level;$('fbt').textContent=S.parasite?parasiteFormName():'Mal-estar '+S.impact+'%';
 $('xpb').style.width=Math.min(100,100*S.xp/(4+S.level*2))+'%';
 const guide=$('arenaTissue');
 const exitGuide=area.exit?(S.parasite?'Arena concluída · siga até a passagem.':'Arena concluída · siga até a corrente de ar.'):
  'Arena final concluída.';
 guide.textContent=S.roomCleared?exitGuide:
  boss?'Defesa ativa · '+S.chapter.bosses[boss.type].name:area.task;
 for(const [index,el] of [...$('regionTrack').children].entries()){
  if(index===S.step)el.setAttribute('aria-current','step');
  else el.removeAttribute('aria-current');
  el.classList.toggle('done',index<S.regions);
 }
 $('mucusStatus').hidden=S.mucus<0||S.roomCleared;
 $('mucusStatus').textContent=area.surface?.label??'Muco · movimento mais lento';
 $('pressureStatus').hidden=!underPressure;
 const companion=evolucoesToxocara[S.parasite?.companheiro];
 $('echoStatus').hidden=Boolean(S.parasite&&!companion);
 $('echoStatus').textContent=companion?companion.name+(S.parasite.shield?' · proteção pronta':''):
  'Ecos '+allies.length+'/'+profile.capacity+' · '+charge+'/'+arenaReplication.cost+' fragmentos';
 const post=studyPost();
 $('studyHint').hidden=!post||S.studySeen||S.roomCleared;
 if(post)$('studyHint').textContent=post.hint??'Posto de profilaxia · à direita da entrada';
 $('coreHud').hidden=!S.segmented;
 if(S.segmented){
  const {segments,profile}=S.segmented, {chance,patrolRange}=influenzaCore.stats(S.segmented);
  $('coreHudTitle').textContent=profile?influenzaCore.profiles[profile].name+' · '+segments+' segmentos':influenzaCore.layouts[segments].name;
  $('coreHudStats').textContent='Variabilidade '+chance+'% · Detectabilidade '+patrolRange;
 }
 const form=$('coreForm');form.hidden=!S.variation;
 if(S.variation){
  form.dataset.effect=S.variation.positive?'bonus':'penalty';
  form.textContent=S.variation.name+' · '+S.variation.desc;
 }
 $('dashBtn').disabled=p.cooldown>0;
 $('dashTime').textContent=dashSeconds?dashSeconds+'s':'Pronto';
 const superButton=$('superBtn');
 superButton.hidden=!S.fusions.has('eco')||S.roomCleared;
 superButton.disabled=S.superState!=='ready';
 superButton.dataset.state=S.superState;
 $('superStatus').textContent=SUPER_STATES[S.superState];
 $('touchLegend').hidden=S.phase!=='play'||!touchLayout;
 $('aimLegend').textContent=S.control==='auto'?'Ataque automático':'Mirar e atacar';
 const bossBar=$('bossBar');bossBar.hidden=!boss||S.phase!=='play';
 if(boss){
  $('bossName').textContent=S.chapter.bosses[boss.type].name;
  $('bossFill').style.width=100*boss.hp/boss.max+'%';
 }
}

function makeRoom() {
 const g=mapCache.getContext('2d');
 if(!g)return;
 g.setTransform(1,0,0,1,respiratory.size/2,0);
 respiratory.paintRoom(g,S.parasite?parasiteAtlas:roomAtlas,room());
 if(S.chapter.id==='vsr'){
  g.fillStyle='rgba(35,131,122,.13)';
  g.fillRect(-respiratory.size/2,0,respiratory.size,respiratory.size);
 }
}

function makeRoutePreview() {
 const thumb=$('crewChart'),g=thumb.getContext('2d');
 if(!g||!terrain.complete||!terrain.naturalWidth)return;
 g.clearRect(0,0,thumb.width,thumb.height);
 const ratio=Math.min(thumb.width/respiratory.mapWidth,thumb.height/respiratory.mapHeight)*.94;
 const w=respiratory.mapWidth*ratio,h=respiratory.mapHeight*ratio;
 g.drawImage(terrain,(thumb.width-w)/2,(thumb.height-h)/2,w,h);
}

function makeParasitePreview() {
 const canvas=$('parasiteTerrain'),g=canvas.getContext('2d');
 if(!g||!parasiteAtlas.complete||!parasiteAtlas.naturalWidth)return;
 const tile=parasiteAtlas.naturalWidth/2, height=canvas.height/3;
 for(const {art} of toxocaraChapter.stages){
  g.drawImage(parasiteAtlas,art%2*tile+4,Math.floor(art/2)*tile+tile*.28,tile-8,tile*.44,
   0,art*height,canvas.width,height-3);
 }
}

function resize() {
 const box=stage.getBoundingClientRect();
 if(!ctx||!box.width||!box.height)return false;
 W=box.width;H=box.height;
 dpr=Math.min(1.8,window.devicePixelRatio||1,Math.sqrt(700000/(W*H)));
 cv.width=Math.max(1,Math.floor(W*dpr));cv.height=Math.max(1,Math.floor(H*dpr));
 scale=Math.max(.57,Math.min(1.16,W/470,H/560));
 return true;
}

function setCamera() {
 const w=W/(2*scale),h=H/(2*scale),half=respiratory.size/2;
 const x=w>=half?0:clamp(S.p.x,-half+w,half-w);
 const y=h>=half?half:clamp(S.p.y,h,respiratory.size-h);
 ox=W/2-x*scale;oy=H/2-y*scale;
}

function oval(g,x,y,rx,ry,fill,edge) {
 g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);
 if(fill){g.fillStyle=fill;g.fill();}
 if(edge){g.strokeStyle=edge;g.lineWidth=2.4;g.stroke();}
}

function drawAntibodies(x,y,radius) {
 ctx.save();ctx.lineWidth=2.8;ctx.lineCap='round';ctx.strokeStyle='#efe0ff';
 for(let i=0;i<6;i++){
  const a=i*TAU/6+Math.PI/6;
  const px=x+Math.cos(a)*radius,py=y+Math.sin(a)*radius;
  ctx.beginPath();ctx.moveTo(px,py+6);ctx.lineTo(px,py);
  ctx.lineTo(px-4,py-5);ctx.moveTo(px,py);ctx.lineTo(px+4,py-5);ctx.stroke();
 }
 ctx.restore();
}

function drawDefense(e) {
 const boss=S.chapter.bosses[e.type];
 if(boss&&e.windup>0){
  const progress=1-e.windup/.85;
  const pressure=Boolean(pressurePattern(e)),antibody=e.type==='lungs'&&!pressure;
  const fill=pressure?'rgba(255,181,93,.23)':antibody?'rgba(207,149,251,.21)':'rgba(252,92,117,.17)';
  const edge=pressure?'#ffe194':antibody?'#edc9ff':'#ffcab7';
  oval(ctx,e.x,e.y,boss.wave,boss.wave,fill,edge);
  ctx.beginPath();ctx.arc(e.x,e.y,boss.wave,-Math.PI/2,-Math.PI/2+TAU*progress);
  ctx.strokeStyle='#fff1d0';ctx.lineWidth=4;ctx.stroke();
  if(antibody)drawAntibodies(e.x,e.y,boss.wave);
 }
 const motion=reduce?0:Math.sin(S.clock*8+e.phase)*e.r*.095;
 arenaArt.drawActor(ctx,sprite(e.type,boss?.rank),e.x,e.y,e.r,motion,S.clock-e.hitAt<.13);
 if(e.spottedAt!==null&&S.clock-e.spottedAt<.8){
  ctx.font='900 18px system-ui, sans-serif';ctx.textAlign='center';ctx.lineWidth=4;
  ctx.strokeStyle='#44253c';ctx.fillStyle='#ffdda8';
  ctx.strokeText('!',e.x,e.y-20);ctx.fillText('!',e.x,e.y-20);
 }
 if(e.required&&!boss&&e.hp<e.max){
  ctx.fillStyle='#522645';ctx.fillRect(e.x-14,e.y+13,28,4);
  ctx.fillStyle='#ffdca3';ctx.fillRect(e.x-14,e.y+13,28*e.hp/e.max,4);
 }
}

function appearance(card=null) {
 if(S.parasite){
  const {adaptacao,companheiro,oocisto}=S.parasite;
  const form=card?.kind==='parasite-form'?card:formasOocisto[S.parasite.morfologia];
  return {parasite:true,fase:S.step,adaptacao,companheiro,oocisto,...(card?.kind==='parasite'?{[card.slot]:card.id}:{}),
   nivelMorfologia:form?.level??0,crescente:card?.id==='crescente'||Boolean(traitRank('crescente'))};
 }
 const rank=id=>card?.kind==='trait'&&card.id===id?card.level:traitRank(id);
 return {
  morph:S.morph,ha:rank('ha'),na:rank('na'),core:rank('core'),
  defense:Boolean(rank('shell')||rank('veil')),magnet:Boolean(rank('magnet')),reserve:Boolean(rank('reserve')),
  segmented:influenzaCore.shape(card?.segmented??S.segmented),variation:S.variation,
  antenna:S.fusions.has('eco')||card?.id==='eco',
  vsr:S.chapter.id==='vsr',confluence:S.fusions.has('confluencia')||card?.id==='confluencia',
  fused:S.fusions.has('resonancia')||card?.id==='resonancia'
 };
}

function influenzaPosition(x,y,r,lado=1) {
 return {x,y:y-4,escala:r/54,lado};
}

function influenzaModelPose(pose,body) {
 return poseInfluenza(reduce?influenzaRig.modelo.neutra:pose,body);
}

function parasiteRig(oocisto) {
 return oocisto?oocistoRig:toxocaraRig;
}

function activePlayerRig() {
 return S.parasite?parasiteRig(S.parasite.oocisto):S.chapter.id==='influenza'?influenzaRig:null;
}

function playerPosition(rig,x,y,r,side) {
 return rig===influenzaRig?influenzaPosition(x,y,r,side):{x,y:y-3,escala:r/27,lado:side};
}

function playerPose(rig,pose,body) {
 return rig===influenzaRig?influenzaModelPose(pose,body):(reduce?rig.modelo.neutra:pose);
}

function drawParasite(g,local,look,pose,rig) {
 const {x,y,escala,lado}=local;
 const spread=rig===oocistoRig&&!reduce?pose.sx:1;
 oval(g,x,y+escala*23,escala*21*spread,escala*5.5/spread,'rgba(37,29,53,.34)');
 if(look.companheiro)desenharCompanheiro(g,look.companheiro,x-lado*34*escala,y+9*escala);
 rig.desenhar(g,local,playerPose(rig,pose),look);
}

function influenzaLook(look) {
 return {...look,genome:viralMorphology.genomes[look.morph.genome],
  temper:look.temper??viralMorphology.faces[look.morph.face].intensity};
}

function drawInfluenza(g,local,look,pose) {
 const {x,y,escala}=local;
 oval(g,x,y+escala*48,escala*47,escala*11,'rgba(37,29,53,.34)');
 influenzaRig.desenhar(g,local,influenzaModelPose(pose,look.morph.body),influenzaLook(look));
}

function paintPortrait(canvas,look) {
 const g=canvas.getContext('2d');
 if(!g)return;
 g.clearRect(0,0,canvas.width,canvas.height);
 if(look.parasite){
  pendingPortraits.delete(canvas);
  const rig=parasiteRig(look.oocisto);
  drawParasite(g,playerPosition(rig,canvas.width/2,canvas.height*.52,canvas.width*.25,1),look,rig.modelo.neutra,rig);
  return;
 }
 if(!look.vsr){
  if(influenzaRig){
   const local=influenzaPosition(canvas.width/2,canvas.height*.56,canvas.width*.28);
   drawInfluenza(g,local,look,influenzaRig.pose(0,'idle'));
   return;
  }
  pendingPortraits.set(canvas,look);
 }else pendingPortraits.delete(canvas);
 arenaArt.drawVirus(g,canvas.width/2,canvas.height*.49,canvas.width*.28,look);
}

function previewEvolution(card=null) {
 paintPortrait($('evolutionPortrait'),appearance(card));
 $('evolutionCaption').textContent=card?'Prévia · '+card.name:'Morfologia atual';
}

function drawAnimatedPlayer(p,look,rig) {
 const shot=p.shot;
 const oocisto=rig===oocistoRig;
 const dashTime=(S.clock-p.dashAt)*(oocisto?1:1.5);
 const dashing=S.phase==='travel'||dashTime<rig.modelo.clipes.dash.duracao;
 const hurtTime=S.clock-p.hitAt;
 const shooting=shot&&(oocisto||!dashing&&hurtTime>=rig.modelo.clipes.hurt.duracao||shot.animation.tempo<.29);
 const local=playerPosition(rig,p.x,p.y,24,shooting?shot.side:p.facing);
 const dashPose=dashing?rig.pose(S.phase==='travel'?.18:dashTime,'dash'):null;
 const detail=look.parasite?{...look,flash:oocisto?Math.max(0,1-hurtTime/.13):0}:
  {...look,temper:Math.min(2,viralMorphology.faces[S.morph.face].intensity+Number(S.cells>=5)),
  flash:hurtTime<.18,antennaLit:S.superState!=='empty'};
 if(oocisto&&!reduce){
  const change=S.parasite.mudanca;
  if(change){
   const t=(S.clock-change.at)/duracaoMutacao;
   if(t<1)detail.mudanca={de:change.de,t};
  }
  detail.encaixe=Math.max(0,1-(S.clock-S.parasite.crescenteAt)/.42);
  if(dashPose)desenharTrilhaOocisto(ctx,p.x,p.y,p.fx,p.fy);
 }
 if(dashPose&&!reduce){
  ctx.save();
  ctx.globalAlpha=.26;
  const trail=playerPosition(rig,p.x-p.fx*18,p.y-p.fy*24,21,p.facing);
  rig.desenhar(ctx,trail,playerPose(rig,dashPose,S.morph.body),look.parasite?detail:influenzaLook(detail));
  ctx.restore();
 }
 const action=p.walk>.1?'move':'idle';
 const actionTime=oocisto&&action==='move'?p.stride/16*(1-look.nivelMorfologia*.12):S.clock;
 const pose=shooting?shot.animation.pose():dashPose??(hurtTime<rig.modelo.clipes.hurt.duracao?
  rig.pose(hurtTime,'hurt'):rig.pose(actionTime,action));
 if(look.parasite)drawParasite(ctx,local,detail,pose,rig);
 else drawInfluenza(ctx,local,detail,pose);
 if(detail.mudanca)desenharMudaOocisto(ctx,p.x,p.y-3,detail.mudanca.t);
}

function drawPlayer() {
 const p=S.p,look=appearance();
 const rig=activePlayerRig();
 if(rig){
  drawAnimatedPlayer(p,look,rig);
  return;
 }
 const stride=reduce?0:Math.sin(p.stride)*p.walk*3.8;
 const lift=reduce?0:Math.abs(stride)*.54+Math.sin(S.clock*3.4)*1.6;
 const recoil=reduce?0:Math.max(0,1-(S.clock-p.castAt)/.12)*2.4;
 const temper=Math.min(2,viralMorphology.faces[S.morph.face].intensity+Number(S.cells>=5));
 const pose={clock:reduce?0:S.clock,stride,lift,facing:p.facing,temper,
  streak:(p.dash>0||S.phase==='travel')&&!reduce ? .15 : 0,flash:S.clock-p.hitAt<.18,
  antennaLit:S.superState!=='empty'};
 if((p.dash>0||S.phase==='travel')&&!reduce) {
  ctx.globalAlpha=.26;
  arenaArt.drawVirus(ctx,p.x-p.fx*18,p.y-p.fy*24,21,look,pose);
  ctx.globalAlpha=1;
 }
 arenaArt.drawVirus(ctx,p.x-p.facing*recoil,p.y,24,look,pose);
}

function drawReplicas() {
 const influenza=influenzaRig&&S.chapter.id==='influenza';
 const look=influenza?{morph:{...S.morph,face:'calm'},segmented:influenzaCore.shape(S.segmented)}:companionLook;
 for(const ally of S.replication.allies){
  const remaining=ally.until-S.clock;
  const lift=reduce?0:Math.sin(S.clock*5+ally.side)*1.9;
  ctx.save();
  ctx.globalAlpha=.82*Math.min(1,remaining/.55);
  oval(ctx,ally.x,ally.y+8,15,5,null,ally.study?'#ffdb9c':'#a9e9d8');
  const radius=ally.study?12:10.5;
  if(influenza)drawInfluenza(ctx,influenzaPosition(ally.x,ally.y,radius,S.p.facing),look,
   influenzaRig.pose(S.clock+Math.abs(ally.side)*.13,'idle'));
  else arenaArt.drawVirus(ctx,ally.x,ally.y,radius,look,{lift,clock:reduce?0:S.clock});
  ctx.restore();
 }
}

function drawEffects() {
 for(const effect of S.effects) {
  const t=(S.clock-effect.born)/effect.life;
  ctx.globalAlpha=1-t;
  if(effect.type==='oocisto-impact'){
   desenharImpactoOocisto(ctx,effect,t,reduce);
  }else if(effect.type==='pulse') {
   const r=Math.max(1,effect.r*(reduce?1:.44+.56*t));
   oval(ctx,effect.x,effect.y,r,r,null,effect.color);
   if(effect.antibody)drawAntibodies(effect.x,effect.y,r);
  }else if(effect.type==='beam'||effect.type==='echo'){
   const echo=effect.type==='echo';
   ctx.beginPath();ctx.moveTo(effect.x,effect.y);ctx.lineTo(effect.x2,effect.y2);
   ctx.lineCap='round';ctx.lineWidth=echo?9:15;ctx.strokeStyle=echo?'#843857':'#702899';ctx.stroke();
   ctx.lineWidth=echo?4:7;ctx.strokeStyle=effect.color;ctx.stroke();
   ctx.lineWidth=echo?1.7:2.6;ctx.strokeStyle=echo?'#ffe8d4':'#fff0ff';ctx.stroke();
  }else if(effect.type==='pellet'){
   const dx=effect.x2-effect.x,dy=effect.y2-effect.y;
   const progress=reduce?.94:t;
   if(!reduce&&t<.45)oval(ctx,effect.x,effect.y,6+t*6,5+t*5,'rgba(255,236,183,.68)');
   ctx.save();
   ctx.translate(effect.x+dx*progress,effect.y+dy*progress);
   ctx.rotate(Math.atan2(dy,dx));
   oval(ctx,-3,0,9.2,3.5,'rgba(231,249,230,.45)');
   oval(ctx,0,0,5.9,3.8,'#42596b');
   oval(ctx,1,-.2,4.2,2.7,effect.color);
   ctx.restore();
  }else{
   const dx=effect.x2-effect.x,dy=effect.y2-effect.y;
   const assistance=effect.type==='assist';
   const end=reduce ? .96 : .45+.55*t;
   ctx.beginPath();ctx.moveTo(effect.x+dx*Math.max(0,end-.38),effect.y+dy*Math.max(0,end-.38));
   ctx.lineTo(effect.x+dx*end,effect.y+dy*end);
   ctx.lineCap='round';ctx.lineWidth=assistance?4:6;ctx.strokeStyle=assistance?'#3f576b':'#693150';ctx.stroke();
   ctx.lineWidth=assistance?2:3;ctx.strokeStyle=effect.color;ctx.stroke();
  }
 }
 ctx.globalAlpha=1;
}

function paintStick(stick,x,y,color) {
 if(stick.id!==null){
  x=stick.ox;y=stick.oy;
 }
 const vector=stick.id===null?null:unit(stick.x-x,stick.y-y,1);
 const radius=Math.min(33,Math.hypot(stick.x-x,stick.y-y));
 oval(ctx,x,y,35,35,'rgba(51,32,57,.39)',color);
 oval(ctx,x+(vector?.x??0)*radius,y+(vector?.y??0)*radius,13,13,color,null);
}

function drawControls() {
 if(!touchLayout||S.phase!=='play')return;
 ctx.setTransform(dpr,0,0,dpr,0,0);
 paintStick(moveStick,clamp(W*.2,44,116),H-72,'rgba(213,237,243,.77)');
 if(S.control==='manual'&&!aimStick.mouse)paintStick(aimStick,W-clamp(W*.2,44,116),H-72,'rgba(255,210,211,.79)');
}

function drawWind() {
 const age=S.clock-S.arrivedAt;
 if(S.phase!=='travel'&&age>.34)return;
 ctx.setTransform(dpr,0,0,dpr,0,0);
 if(S.phase==='travel'&&!reduce){
  ctx.lineCap='round';
  for(let i=0;i<8;i++){
   const x=(i+.5)*W/8+Math.sin(S.clock*3+i)*22;
   const y=((S.wind.time*385+i*103)%(H+190))-150;
   ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x-21,y+48,x+16,y+120);
   ctx.strokeStyle=i%2?'rgba(220,253,250,.74)':'rgba(185,224,246,.57)';
   ctx.lineWidth=2+i%3;ctx.stroke();
  }
 }
 ctx.fillStyle='#241934';
 const duration=reduce ? .32 : 1.19;
 ctx.globalAlpha=S.wind?Math.max(0,(S.wind.time/duration-.62)/.38):Math.max(0,1-age/.34);
 ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;
}

function draw() {
 ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height);
 setCamera();
 ctx.setTransform(dpr*scale,0,0,dpr*scale,dpr*ox,dpr*oy);
 ctx.drawImage(mapCache,-respiratory.size/2,0);
 const area=room();
 respiratory.drawMucus(ctx,area,S.clock,S.mucus,reduce);
 const field=S.pressure;
 if(field&&field.until>S.clock){
  oval(ctx,field.x,field.y,field.r,field.r,'rgba(231,164,75,.22)','#ffdf93');
  oval(ctx,field.x,field.y,field.r*.91,field.r*.91,null,'rgba(255,225,156,.65)');
 }
 if(S.roomCleared&&area.exit&&S.phase==='play'){
  respiratory.marker(ctx,{...area.exit,tone:'#c7f8f7'},S.parasite?'Passagem':'Corrente de ar',true,S.clock,reduce);
 }else if(!S.roomCleared&&!currentBoss()){
  respiratory.marker(ctx,area,area.label,S.enemies.every(e=>!e.required),S.clock,reduce);
 }
 const post=studyPost();
 if(post&&!S.studySeen&&!S.roomCleared){
  respiratory.marker(ctx,{...post,tone:post.tone??'#f8d68d'},post.label,true,S.clock,reduce);
 }
 for(const orb of S.orbs)arenaArt.drawFragment(ctx,orb,reduce);
 for(const enemy of S.enemies)drawDefense(enemy);
 crew.drawEscort();
 drawReplicas();
 const aim=S.control==='manual'&&S.phase==='play'&&!S.roomCleared?aimDirection():null;
 if(aim){
  const p=S.p;
  let x=p.x+aim.x*24,y=p.y+aim.y*24,dx=aim.x,dy=aim.y;
  if(S.parasite?.oocisto){
   const side=Math.abs(dx)>.08?Math.sign(dx):p.facing;
   const pose=playerPose(oocistoRig,poseSolturaOocisto);
   const origin=oocistoRig.ponto('disparo',playerPosition(oocistoRig,p.x,p.y,24,side),pose);
   const target=oocistoAimPoint(p,aim,SHOT_REACH);
   const ray=unit(target.x-origin.x,target.y-origin.y)??aim;
   x=origin.x;y=origin.y;dx=ray.x;dy=ray.y;
  }
  ctx.beginPath();ctx.moveTo(x,y);
  ctx.lineTo(x+dx*130,y+dy*130);
  ctx.setLineDash([7,5]);ctx.strokeStyle='rgba(255,249,215,.79)';ctx.lineWidth=2.1;ctx.stroke();ctx.setLineDash([]);
 }
 drawEffects();
 for(const shot of S.projectiles)desenharDisparoOocisto(ctx,shot,reduce);
 drawPlayer();
 drawWind();drawControls();
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
const portraitUrls=new WeakMap();
function spriteCanvas(s,level=1){
 const rank=level>=6?3:level>=4?2:level>=2?1:0;
 const key=s.id+rank;
 if(!spriteCache.has(key))spriteCache.set(key,arenaArt.creature(s,rank));
 return spriteCache.get(key);
}

function portrait(id,level=1){
 const sprite=spriteCanvas(byId[id],level);
 if(!portraitUrls.has(sprite))portraitUrls.set(sprite,sprite.toDataURL());
 return '<img class="crew-sprite" src="'+portraitUrls.get(sprite)+'" width="96" height="96" alt="" aria-hidden="true">';
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
  if(state.escort===s.id){escort=a.job?'Assume a coleta na arena depois que você receber a recompensa.':`Acompanha o seu vírus e amplia o alcance de coleta em ${12+3*a.level} unidades.`;}
  else{escort='Quando está livre, pode acompanhar o seu vírus para recolher fragmentos de mais longe.';}
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
  if(!total)$('crewLead').textContent='Escolha um mascote viral para acompanhar você na arena ou sair em missões por moedas e experiência.';
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
  clearInput();
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
  if(origin==='intro')renderIntroduction();
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
  const x=S.p.x-S.p.fx*20-15,y=S.p.y-S.p.fy*20+4;
  arenaArt.drawActor(ctx,spriteCanvas(byId[state.escort],a.level),x,y,12,bob);
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

function relative(event) {
 const rect=cv.getBoundingClientRect();
 return [event.clientX-rect.left,event.clientY-rect.top];
}
cv.addEventListener('pointerdown',event=>{
 if(S?.phase!=='play')return;
 const [x,y]=relative(event), mouse=event.pointerType==='mouse';
 if(mouse&&event.button!==0)return;
 if(!mouse)touchLayout=true;
 const useAim=S.control==='manual'&&(mouse||x>=W/2);
 if(mouse&&!useAim)return;
 const stick=useAim?aimStick:moveStick;
 if(stick.id!==null)return;
 Object.assign(stick,{id:event.pointerId,ox:x,oy:y,x,y,mouse});
 try{cv.setPointerCapture(event.pointerId);}catch{}
 cv.focus({preventScroll:true});
 event.preventDefault();
});
cv.addEventListener('pointermove',event=>{
 for(const stick of [moveStick,aimStick]){
  if(event.pointerId===stick.id)[stick.x,stick.y]=relative(event);
 }
});
for(const name of ['pointerup','pointercancel','lostpointercapture']){
 cv.addEventListener(name,event=>{
  if(event.pointerId===moveStick.id)moveStick.id=null;
  if(event.pointerId!==aimStick.id)return;
  if(name==='pointerup'&&!aimStick.mouse&&S?.phase==='play'&&!aimDirection())S.tapUntil=S.clock+.34;
  aimStick.id=null;aimStick.mouse=false;
 });
}

const directionKeys=['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'];
window.addEventListener('keydown',event=>{
 if(crew.isOpen())return;
 const key=event.key?.toLowerCase();
 if(S?.phase==='play'&&(directionKeys.includes(key)||key==='j')){
  keys.add(key);event.preventDefault();
 }
 if(S?.phase==='play'&&event.code==='Space'&&document.activeElement?.tagName!=='BUTTON'){
  event.preventDefault();if(!event.repeat)dash();
 }
 if(S?.phase==='play'&&key==='e'&&S.fusions.has('eco')){
  event.preventDefault();if(!event.repeat)armSuper();
 }
 if(key==='escape'||key==='p'){
  if(S?.phase==='play')pauseGame();
  else if(S?.phase==='pause')resume();
 }
});
window.addEventListener('keyup',event=>keys.delete(event.key?.toLowerCase()));
window.addEventListener('blur',clearInput);
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){if(S?.phase==='travel')stopFrames();else pauseGame();}
 else if(S?.phase==='travel')syncArena();
});
$('startBtn').addEventListener('click',startRun);
$('againBtn').addEventListener('click',showIntro);
$('contBtn').addEventListener('click',continueRun);
$('reviewBtn').addEventListener('click',reviewTrait);
$('practiceBtn').addEventListener('click',practice);
$('resumeBtn').addEventListener('click',resume);
$('restartBtn').addEventListener('click',showIntro);
$('pauseBtn').addEventListener('click',()=>{if(S?.phase==='pause')resume();else pauseGame();});
$('dashBtn').addEventListener('click',()=>{
 dash();
 if(S?.phase==='play')cv.focus({preventScroll:true});
});
$('superBtn').addEventListener('click',()=>{
 armSuper();
 if(S?.phase==='play')cv.focus({preventScroll:true});
});

function stopFrames() {
 if(frameId!==null){cancelAnimationFrame(frameId);frameId=null;}
 if(observer){observer.disconnect();observer=null;}
 if(cv.width>1||cv.height>1){cv.width=1;cv.height=1;}
}

function syncArena() {
 const phase=S?.phase||'intro';
 stage.dataset.phase=phase;
 if(!['play','travel'].includes(phase)||crew.isOpen()||document.hidden) {
  stopFrames();
  if(S)hud();
  return;
 }
 try{
  if(!ctx)ctx=cv.getContext('2d');
  if(!ctx||!resize())throw new Error('Canvas 2D unavailable');
 }catch{
  stopFrames();S=null;setPanel('intro');
  $('arenaNotice').textContent='A arena não abriu neste navegador. A base e as missões continuam disponíveis.';
  $('arenaNotice').hidden=false;
  return;
 }
 if(!observer&&typeof ResizeObserver==='function'){
  observer=new ResizeObserver(()=>{if(resize())draw();});
  observer.observe(stage);
 }
 lastHud='';
 if(frameId===null){
  lastFrame=performance.now();
  draw();hud();frameId=requestAnimationFrame(frame);
 }
}

function frame(time) {
 frameId=null;
 if(!S||!['play','travel'].includes(S.phase)||crew.isOpen()||document.hidden){syncArena();return;}
 if(time-lastFrame>=FRAME_MS-.25) {
  const dt=Math.min((time-lastFrame)/1000,.067);lastFrame=time;
  if(S.phase==='travel')travel(dt);else update(dt);
  if(!S||!['play','travel'].includes(S.phase))return;
  if(S.clock>=toastUntil)$('toast').classList.remove('show');
  draw();hud();
 }
 if(frameId===null)frameId=requestAnimationFrame(frame);
}
window.addEventListener('resize',()=>{
 if(S&&['play','travel'].includes(S.phase)&&!observer&&resize())draw();
});
terrain.addEventListener('load',makeRoutePreview);
roomAtlas.addEventListener('load',()=>{
 if(!S)return;
 makeRoom();
 if(ctx&&['play','travel'].includes(S.phase))draw();
});
parasiteAtlas.addEventListener('load',()=>{
 makeParasitePreview();
 if(S?.parasite){makeRoom();if(frameId!==null)draw();}
});

function fillSelect(select,choices) {
 for(const [key,value] of Object.entries(choices)){
  const option=document.createElement('option');
  option.value=key;option.textContent=value.name;select.append(option);
 }
}

function updateKit() {
 const morph=chapterMorph(),stats=chapterStats(selectedChapter,morph),parasite=selectedChapter===toxocaraChapter;
 const oocisto=parasite&&$('parasiteEvolution').value==='oocisto';
 const armor=stats.damageTaken<1?' · recebe 6% menos dano':'';
 $('morphStats').textContent=(stats.note?stats.note+' ':'')+stats.hp+' de integridade · '+stats.attack+
  ' de dano · velocidade '+stats.speed+' · recarga do dash '+stats.cooldown.toLocaleString('pt-BR')+' s'+armor;
 const profile=arenaReplication.profiles[startingMorph.replication];
 const count=profile.capacity===1?'1 eco por '+profile.duration+' s':
  'Até '+profile.capacity+' ecos por '+profile.duration+' s cada';
 const parasiteHint=oocisto?'Acerte as perguntas de morfologia após as duas arenas de solo.':
  'Ovo no ambiente · evolua ao concluir cada arena.';
 $('replicationNote').textContent=parasite?parasiteHint:count+'. Um aliado a cada '+arenaReplication.cost+' fragmentos.';
 $('controlsHelp').textContent=startingMorph.control==='manual'?
  'Arraste à esquerda para andar e à direita para mirar e atacar. No computador, use WASD ou setas e segure o mouse ou J para atacar. Espaço ou Dash desvia.':
  'Arraste ou use WASD e setas para andar. O ataque mira no alvo mais próximo. Use Espaço ou Dash para desviar.';
 paintPortrait($('virusPortrait'),parasite?{parasite:true,fase:0,oocisto}:{morph,vsr:selectedChapter.id==='vsr'});
}

const MORPH_SAVE='atlas-viral-morfologia-v1';
function saveMorphology() {
 try{localStorage.setItem(MORPH_SAVE,JSON.stringify(startingMorph));}catch{}
}

function setupMorphology() {
 let saved=null;
 try{saved=JSON.parse(localStorage.getItem(MORPH_SAVE));}catch{}
 const fields=[
  ['genome','genomeSelect',viralMorphology.genomes],['body','bodySelect',viralMorphology.bodies],
  ['face','faceSelect',viralMorphology.faces],['surface','surfaceSelect',viralMorphology.appendages],
  ['replication','replicationSelect',arenaReplication.profiles],
  ['control','controlSelect',viralMorphology.controls]
 ];
 $('parasiteEvolution').addEventListener('change',updateKit);
 for(const [key,id,choices] of fields){
  const control=$(id);fillSelect(control,choices);
  if(saved&&Object.hasOwn(choices,saved[key]))startingMorph[key]=saved[key];
  control.value=startingMorph[key];
  control.addEventListener('change',()=>{startingMorph[key]=control.value;saveMorphology();updateKit();});
 }
 const pause=$('pauseControl');fillSelect(pause,viralMorphology.controls);
 pause.addEventListener('change',()=>{
  if(S?.phase!=='pause')return;
  S.control=pause.value;startingMorph.control=pause.value;
  $('controlSelect').value=pause.value;saveMorphology();updateKit();clearInput();
 });
 updateKit();
}

makeRoutePreview();
makeParasitePreview();
setupMorphology();
setupGuide();
setupCourses();
showIntro();
oocistoAtlas.addEventListener('load',()=>{if(!S)updateKit();});
carregarInfluenza().then(modelo=>{
 influenzaRig=new Personagem2D(modelo);
 for(const [canvas,look] of pendingPortraits)paintPortrait(canvas,look);
 pendingPortraits.clear();
}).catch(()=>{
 pendingPortraits.clear();
});
}
