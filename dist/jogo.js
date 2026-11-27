{
const root=document.getElementById('lobulo-game');
const $=id=>root.querySelector('#'+id);
const cv=$('cv'), stage=$('stage'), terrain=$('arenaTerrain');
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const TAU=Math.PI*2, FRAME_MS=1000/30;
const keys=new Set();
const joy={on:false,id:null,ox:0,oy:0,x:0,y:0};
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

const SLOTS=[
 ['ataque','Envoltório · ataque'],
 ['pulso','Envoltório · pulso'],
 ['defesa','Envoltório · defesa'],
 ['apoio','Envoltório · apoio'],
 ['nucleo','Nucleocapsídeo'],
 ['movimento','Movimento'],
 ['status','Status']
];
const RARITIES={common:{label:'Comum',weight:3},rare:{label:'Rara',weight:1},special:{label:'Especial'}};
const TRAITS={
 ha:{slot:'ataque',name:'Hemaglutinina',icon:'✺',color:'#a45826',rarity:'common',
  desc:'Fortalece o disparo automático da partida.',
  study:'A hemaglutinina (HA) é uma proteína do envoltório. Ela ajuda o influenza a se ligar à célula. Anticorpos contra HA podem neutralizar o vírus.'},
 na:{slot:'pulso',name:'Neuraminidase',icon:'◎',color:'#26797b',rarity:'common',
  desc:'Solta um pulso em área a cada três ataques.',
  study:'A neuraminidase (NA) também fica no envoltório. Ela ajuda a liberar as novas partículas virais. Anticorpos contra NA podem contribuir para a proteção e reduzir a gravidade.'},
 shell:{slot:'defesa',name:'Membrana firme',icon:'⬡',color:'#396586',rarity:'rare',
  desc:'Amortece parte do dano dos ataques da arena.'},
 veil:{slot:'defesa',name:'Véu cintilante',icon:'✧',color:'#7a4793',rarity:'common',
  desc:'Aumenta a integridade máxima e recupera parte dela ao subir de nível.'},
 magnet:{slot:'apoio',name:'Anel coletor',icon:'∪',color:'#8c621e',rarity:'common',
  desc:'Atrai fragmentos de mais longe.'},
 core:{slot:'nucleo',name:'Núcleo estável',icon:'◇',color:'#705196',rarity:'rare',
  desc:'Aumenta o dano dos disparos e dos pulsos.'},
 dash:{slot:'movimento',name:'Impulso',icon:'»',color:'#3f658a',rarity:'common',
  desc:'Dash curto. As melhorias reduzem a recarga.'},
 reserve:{slot:'status',name:'Reserva de energia',icon:'✦',color:'#a34864',rarity:'common',
  desc:'Recupera integridade lentamente durante a partida.'}
};
const FUSIONS={
 resonancia:{name:'Ressonância violeta',needs:['ha','na'],icon:'✹',color:'#7a43a8',
  desc:'Os pulsos ganham um segundo anel violeta, de alcance maior.'}
};
const SLOT_NAMES=Object.fromEntries(SLOTS);
const OPTIONAL=['shell','veil','magnet','core','dash','reserve'];
const playerArt={look:'orbit',colors:['#ff916f','#a4405d','#ffd4a3']};
const defenseArt={
 cell:{look:'box',colors:['#efb084','#bd6679','#ffe5c3']},
 patrol:{look:'tuft',colors:['#85bbdd','#485b96','#d1eff0']},
 watch:{look:'shell',colors:['#9bd9c5','#458787','#e4f5c6']},
 airway:{look:'spark',colors:['#79b2d6','#4d5d98','#deefff']},
 lungs:{look:'scallop',colors:['#bb7ec2','#663b87','#f8cae8']}
};
const bodyCache=new Map();
const mapCache=document.createElement('canvas');
mapCache.width=respiratory.width;mapCache.height=respiratory.height;

let S=null, ctx=null, frameId=null, observer=null;
let W=1,H=1,dpr=1,scale=1,ox=0,oy=0,lastFrame=0,lastHud='';
let toastUntil=0;

function sprite(type,rank=0) {
 const key=type+'-'+rank;
 if(!bodyCache.has(key)) {
  const art=type==='player'?playerArt:defenseArt[type];
  bodyCache.set(key,arenaArt.creature(art,rank,type!=='player'));
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
 return !S.fusions.has(id)&&FUSIONS[id].needs.every(traitRank);
}

function traitCard(id) {
 const trait=TRAITS[id], level=traitRank(id)+1;
 return {...trait,id,kind:'trait',rarity:level===1?trait.rarity:'rare',level};
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
 const fusions=Object.keys(FUSIONS).filter(canFuse).map(fusionCard);
 const featured=preferred.filter(canEquip).map(traitCard);
 const spare=3-fusions.length-featured.length;
 const rest=chooseTraits(ids.filter(id=>!preferred.includes(id)),spare);
 return [...fusions,...featured,...rest];
}

function actor(type,x,y,required=false) {
 const setup=respiratory.bosses[type];
 const hp=setup?.health??(type==='cell'?28:31);
 return {type,x,y,hp,max:hp,r:setup?.r??(type==='cell'?15:13),
  speed:setup?.speed??(type==='cell'?0:43+Math.random()*12),
  hitAt:-1,required,phase:Math.random()*TAU,charge:1.8,windup:0,waves:0};
}

function addTargets() {
 const stop=respiratory.stages[S.step];
 for(const [x,y] of stop.targets)S.enemies.push(actor('cell',x,y,true));
}

function createState() {
 return {
  phase:'play',clock:0,step:0,regions:0,impact:0,cells:0,level:1,xp:0,
  p:{x:0,y:71,r:14,hp:100,max:100,fx:0,fy:1,facing:1,walk:0,dash:0,cooldown:0,hitAt:-2,castAt:-1},
  slots:{movimento:{id:'dash',rank:1}},fusions:new Set(),enemies:[],orbs:[],effects:[],
  nextAttack:.35,casts:0,nextPatrol:5.5,encounter:null,round:null,history:[],
  mucus:-1,mucusTime:0,mucusAnswered:false
 };
}

function currentBoss() {
 return S.enemies.find(e=>e.hp>0&&Object.hasOwn(respiratory.bosses,e.type));
}

function announce(message) {
 const toast=$('toast');
 toast.textContent=message;
 toast.classList.add('show');
 toastUntil=S.clock+3.8;
}

function clearInput() {
 joy.on=false;joy.id=null;keys.clear();
}

function dash() {
 if(S?.phase!=='play'||S.p.cooldown>0)return;
 S.p.dash=.16;
 S.p.cooldown=2.55-(traitRank('dash')-1)*.42;
}

function move(dt) {
 const p=S.p;
 let x=0,y=0;
 if(joy.on) {
  const dx=joy.x-joy.ox,dy=joy.y-joy.oy,length=Math.hypot(dx,dy);
  if(length>5){const power=Math.min(1,length/37);x=dx/length*power;y=dy/length*power;}
 }
 x+=Number(keys.has('arrowright')||keys.has('d'))-Number(keys.has('arrowleft')||keys.has('a'));
 y+=Number(keys.has('arrowdown')||keys.has('s'))-Number(keys.has('arrowup')||keys.has('w'));
 const length=Math.max(1,Math.hypot(x,y));x/=length;y/=length;
 p.walk=Math.hypot(x,y);
 if(p.walk>.1){p.fx=x/p.walk;p.fy=y/p.walk;}
 if(Math.abs(x)>.08)p.facing=Math.sign(x);
 const speed=S.mucus===-1?152:77;
 const dashing=p.dash>0;
 p.x+=(dashing?p.fx*speed*2.9:x*speed)*dt;
 p.y+=(dashing?p.fy*speed*2.9:y*speed)*dt;
 p.dash=Math.max(0,p.dash-dt);
 p.cooldown=Math.max(0,p.cooldown-dt);
 respiratory.confine(p,respiratory.stages[S.step].gate);
}

function harm(amount) {
 const p=S.p;
 if(S.clock-p.hitAt<.78||p.dash>0)return;
 p.hp=Math.max(0,p.hp-amount*(1-traitRank('shell')*.14));
 p.hitAt=S.clock;
}

function addEffect(effect) {
 if(S.effects.length>=32)S.effects.shift();
 S.effects.push({...effect,born:S.clock});
}

function hit(enemy,damage) {
 if(enemy.hp<=0)return;
 enemy.hp-=damage;enemy.hitAt=S.clock;
 if(enemy.hp>0)return;
 const total=enemy.required?3:2;
 for(let i=0;i<total;i++) {
  S.orbs.push({x:enemy.x+(i-1)*10,y:enemy.y+(i%2?7:-3),t:Math.random()*TAU});
 }
 if(enemy.type==='cell'){S.cells++;S.impact=Math.min(96,S.impact+9);}
}

function attack(dt) {
 S.nextAttack-=dt;
 if(S.nextAttack>0)return;
 const p=S.p,ha=traitRank('ha'),na=traitRank('na'),core=traitRank('core');
 const reach=171+ha*12;
 const enemies=S.enemies.filter(e=>e.hp>0&&distance(p,e)<reach+e.r).sort((a,b)=>distance(p,a)-distance(p,b));
 if(!enemies.length)return;
 S.nextAttack=.56-ha*.035;
 S.casts++;
 p.castAt=S.clock;
 if(p.walk<.1&&Math.abs(enemies[0].x-p.x)>3)p.facing=Math.sign(enemies[0].x-p.x);
 for(const enemy of enemies.slice(0,ha>=2?2:1)) {
  addEffect({type:'strike',x:p.x,y:p.y,x2:enemy.x,y2:enemy.y,color:ha?'#ffe1a0':'#ffd2bb',life:.18});
  hit(enemy,15+ha*4+core*4);
 }
 if(na&&S.casts%3===0) {
  const range=91+na*15;
  const fused=S.fusions.has('resonancia');
  addEffect({type:'pulse',x:p.x,y:p.y,r:range,color:'#a3f7de',life:.34});
  if(fused)addEffect({type:'pulse',x:p.x,y:p.y,r:range+39,color:'#edb4ff',life:.46});
  for(const enemy of enemies) {
   const rangeToEnemy=distance(enemy,p);
   if(rangeToEnemy<range+enemy.r)hit(enemy,9+na*4+core*4);
   if(fused&&rangeToEnemy<range+39+enemy.r)hit(enemy,10+na*2);
  }
 }
}

function moveDefenses(dt) {
 const p=S.p;
 S.nextPatrol-=dt;
 if(S.nextPatrol<=0){
  S.nextPatrol=4.7-S.step*.46;
  if(S.enemies.length<13){
   const y=p.y+86, sign=Math.random()<.5?-1:1;
   const enemy=actor('patrol',sign*(respiratory.halfWidth(y)-22),y);
   respiratory.confine(enemy,respiratory.stages[S.step].gate);
   S.enemies.push(enemy);
  }
 }
 for(const enemy of S.enemies) {
  if(enemy.hp<=0||enemy.type==='cell')continue;
  const boss=respiratory.bosses[enemy.type], d=distance(p,enemy);
  if(enemy.windup>0) {
   enemy.windup=Math.max(0,enemy.windup-dt);
   if(enemy.windup===0) {
    const antibody=enemy.type==='lungs'&&enemy.waves%2===0;
    enemy.waves++;
    addEffect({type:'pulse',x:enemy.x,y:enemy.y,r:boss.wave,
     color:antibody?'#e2c4ff':'#ff8e9e',antibody,life:.36});
    if(d<boss.wave+p.r)harm(S.step===0?14:19);
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
   respiratory.confine(enemy,respiratory.stages[S.step].gate);
  }
  if(d<enemy.r+p.r)harm(boss?13:8);
 }
}

function collect(dt) {
 const p=S.p, reach=65+traitRank('magnet')*27+crew.extraReach();
 for(let i=S.orbs.length-1;i>=0;i--) {
  const orb=S.orbs[i],d=distance(orb,p);
  if(d>reach)continue;
  if(d<20){S.orbs.splice(i,1);S.xp++;continue;}
  const move=Math.min(1,(78+(1-d/reach)*185)*dt/d);
  orb.x+=(p.x-orb.x)*move;orb.y+=(p.y-orb.y)*move;
 }
}

function spawnBoss(id) {
 const {x,y,name}=respiratory.bosses[id];
 S.enemies.push(actor(id,x,y,true));
 S.encounter=id;
 const cue=id==='lungs'?'Pulmões · macrófago alveolar e ondas de anticorpos anti-HA. Desvie dos anéis.':
  name+' entrou na arena. Saia do anel quando ele se acender.';
 announce(cue);
}

function checkpoint() {
 if(S.enemies.some(e=>e.required))return false;
 const stop=respiratory.stages[S.step];
 if(!S.encounter&&distance(stop,S.p)>58)return false;
 if(S.step===0&&!S.encounter){spawnBoss('watch');return false;}
 if(S.step===2) {
  if(!S.encounter){spawnBoss('airway');return false;}
  if(S.encounter==='airway'){spawnBoss('lungs');return false;}
  finish(true);return true;
 }
 const reward=S.step===0?'ha':'na';
 equip(reward);
 S.step++;S.regions++;
 S.encounter=null;
 S.impact=Math.min(96,S.impact+12);
 S.p.hp=Math.min(S.p.max,S.p.hp+14);
 addTargets();
 const ids=S.step===1?['shell','core','reserve']:[...OPTIONAL,'ha','na'];
 const cards=S.step===1?ids.filter(canEquip).map(traitCard):encounterCards(ids,['na']);
 showDraft(cards,TRAITS[reward].name+' entrou no envoltório',
  S.step===1?'Recompensa do primeiro chefe':'Marco da traqueia',TRAITS[reward].study,reward);
 return true;
}

function mucusCheck(dt) {
 const index=respiratory.mucusAt(S.p);
 if(index!==S.mucus) {
  S.mucus=index;S.mucusTime=0;S.mucusAnswered=false;
  if(index>=0)announce('Muco espesso: seu movimento ficou mais lento.');
 }
 if(index<0||S.mucusAnswered)return false;
 S.mucusTime+=dt;
 if(S.mucusTime<.36)return false;
 S.mucusAnswered=true;
 const pool=index<2?[respiratory.questions[index],...respiratory.influenzaBank]:[respiratory.questions[2]];
 const unseen=pool.filter(question=>!S.history.some(item=>item.question===question.q));
 const options=unseen.length?unseen:pool;
 openQuiz(options[Math.floor(Math.random()*options.length)],'mucus');
 return true;
}

function update(dt) {
 S.clock+=dt;
 move(dt);
 if(mucusCheck(dt))return;
 attack(dt);
 moveDefenses(dt);
 collect(dt);
 const regeneration=traitRank('reserve')*.76;
 S.p.hp=Math.min(S.p.max,S.p.hp+dt*regeneration);
 S.effects=S.effects.filter(effect=>S.clock-effect.born<effect.life);
 S.enemies=S.enemies.filter(enemy=>enemy.hp>0);
 if(S.p.hp<=0){finish(false);return;}
 if(checkpoint())return;
 const threshold=4+S.level*2;
 if(S.xp>=threshold){
  S.xp-=threshold;S.level++;
  const cards=encounterCards([...OPTIONAL,...['ha','na'].filter(traitRank)]);
  if(cards.length)showDraft(cards,'Escolha uma evolução','Nível '+S.level,'Cada habilidade sobe de nível no próprio espaço.');
 }
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
 location.textContent=card.kind==='fusion'?'Fusão':SLOT_NAMES[card.slot]+' · nível '+card.level;
 meta.append(rarityBadge(card.rarity),location);
 const title=document.createElement('strong');title.textContent=card.name;
 const body=document.createElement('span');body.className='build-desc';body.textContent=card.desc;
 content.append(meta,title,body);button.append(icon,content);
 button.addEventListener('click',onChoose);
 return button;
}

function setPanel(phase) {
 stage.dataset.phase=phase;
 for(const [id,state] of [['intro','intro'],['lv','level'],['pause','pause'],['end','end']])$(id).hidden=phase!==state;
 $('hud').hidden=phase==='intro';
 $('dashBtn').hidden=phase!=='play';
 $('bossBar').hidden=true;
 $('crewHud').disabled=phase==='level';
 $('pauseBtn').disabled=phase!=='play'&&phase!=='pause';
 if(phase!=='play')$('toast').classList.remove('show');
}

function showIntro() {
 S=null;lastHud='';clearInput();
 setPanel('intro');syncArena();
 $('arenaNotice').hidden=true;
 renderIntroduction();
}

function renderIntroduction() {
 $('fusionCount').textContent='Fusões descobertas '+crew.fusionsFound().length+'/'+Object.keys(FUSIONS).length;
 const list=$('fusionRecipes');
 list.replaceChildren();
 for(const [id,fusion] of Object.entries(FUSIONS)){
  const row=document.createElement('li');
  const recipe=fusion.needs.map(key=>TRAITS[key].name).join(' + ');
  row.textContent=crew.fusionsFound().includes(id)?fusion.name+' · '+recipe:recipe;
  list.append(row);
 }
}

function setupGuide() {
 const select=$('guideTopic'), list=$('guideQuestions');
 const topics=[...new Set(guiaRespiratoria.map(item=>item.topic))];
 for(const topic of ['Todos os temas',...topics]){
  const option=document.createElement('option');
  option.value=topic;option.textContent=topic;select.append(option);
 }
 select.value='Influenza';
 function renderQuestions(){
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
 select.addEventListener('change',renderQuestions);
 renderQuestions();
}

function startRun() {
 S=createState();lastHud='';clearInput();addTargets();
 setPanel('play');syncArena();
 if(S)cv.focus({preventScroll:true});
}

function setupChoice(title,label,note) {
 S.phase='level';clearInput();setPanel('level');syncArena();
 $('qText').textContent=title;$('lvTag').textContent=label;
 $('draftHint').hidden=!note;$('draftHint').textContent=note;
 $('opts').replaceChildren();
 $('ups').replaceChildren();$('ups').hidden=true;
 $('fb').hidden=true;$('contBtn').hidden=true;$('reviewBtn').hidden=true;
}

function showDraft(cards,title,label,note,topic=null) {
 S.round={kind:'draft',cards,title,label,note,topic};
 setupChoice(title,label,note);
 $('reviewBtn').hidden=!topic;
 if(!cards.length){$('contBtn').hidden=false;$('contBtn').focus();return;}
 const panel=$('ups');panel.hidden=false;
 for(const card of cards)panel.append(buttonCard(card,()=>{
  if(S?.phase!=='level'||S.round?.kind!=='draft')return;
  if(card.kind==='trait') {
   if(!equip(card.id))return;
  }else{
   if(!canFuse(card.id))return;
   S.fusions.add(card.id);crew.discoverFusion(card.id);
  }
  continueRun();
 }));
 panel.firstElementChild?.focus({preventScroll:true});
}

function openQuiz(question,mode,returnTo=null) {
 S.round={kind:'quiz',mode,returnTo,answered:false};
 const note=mode==='mucus'?'Uma resposta certa protege sua integridade. Um erro custa 26 pontos.':'';
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
 S.round.answered=true;
 const correct=index===0,mucus=S.round.mode==='mucus';
 S.history.push({question:question.q,correct});
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
 if(draft?.kind==='draft'&&draft.topic)openQuiz(respiratory.review[draft.topic],'review',draft);
}

function practice() {
 S=createState();lastHud='';
 openQuiz(respiratory.review.epidemiology,'practice',{kind:'intro'});
}

function continueRun() {
 if(S?.phase!=='level')return;
 const round=S.round;
 if(round?.kind==='quiz'&&!round.answered)return;
 const destination=round?.returnTo;
 if(destination?.kind==='intro'){showIntro();$('practiceBtn').focus();return;}
 if(destination?.kind==='draft'){
  showDraft(destination.cards,destination.title,destination.label,destination.note);
  return;
 }
 S.round=null;
 if(S.p.hp<=0){finish(false);return;}
 S.phase='play';clearInput();setPanel('play');syncArena();cv.focus({preventScroll:true});
}

function describeBuild(list) {
 list.replaceChildren();
 for(const [key,label] of SLOTS) {
  const item=document.createElement('li');item.className='none';
  const held=S.slots[key];
  item.textContent=label+' · '+(held?TRAITS[held.id].name+' '+held.rank:'Livre');
  list.append(item);
 }
 for(const id of S.fusions){
  const item=document.createElement('li');item.className='none';
  item.append(FUSIONS[id].name+' ',rarityBadge('special'));list.append(item);
 }
}

function pauseGame() {
 if(S?.phase!=='play')return;
 S.phase='pause';clearInput();setPanel('pause');syncArena();
 describeBuild($('ctr'));$('resumeBtn').focus({preventScroll:true});
}

function resume() {
 if(S?.phase!=='pause')return;
 S.phase='play';clearInput();setPanel('play');syncArena();
 cv.focus({preventScroll:true});
}

function finish(won) {
 S.phase='end';clearInput();
 if(won){S.impact=100;S.regions=3;crew.rewardCoins(25);}
 setPanel('end');syncArena();
 $('endH').textContent=won?'Fase respiratória concluída':'A defesa respiratória conteve o vírus';
 $('endP').textContent=won?'Você passou pela traqueia e venceu o macrófago alveolar. +25 moedas.':'Tente outra combinação e use o dash para sair dos anéis de defesa.';
 $('sInf').textContent=S.cells;$('sBoss').textContent=S.regions+'/3';$('sF').textContent=S.impact+'%';
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
 const p=S.p,area=respiratory.stages[S.step],boss=currentBoss();
 const region=respiratory.stages[S.p.y<=230?0:S.p.y<=530?1:2].name;
 const hp=Math.ceil(p.hp),dashSeconds=Math.ceil(p.cooldown);
 const key=[hp,p.max,region,S.step,S.level,S.xp,S.impact,S.mucus,boss?.type,boss?.hp,dashSeconds].join('|');
 if(key===lastHud)return;
 lastHud=key;
 $('regionNow').textContent=region;$('hpt').textContent=hp+'/'+p.max;
 $('hpb').style.width=100*p.hp/p.max+'%';
 $('lvt').textContent='Nível '+S.level;$('fbt').textContent='Mal-estar '+S.impact+'%';
 $('xpb').style.width=Math.min(100,100*S.xp/(4+S.level*2))+'%';
 const guide=$('arenaTissue'),ready=S.enemies.every(e=>e.type!=='cell'||!e.required);
 const next=ready&&S.step===1?'Alcance o marco da neuraminidase.':area.task;
 guide.textContent=boss?'Defesa ativa · '+respiratory.bosses[boss.type].name:next;
 for(const [index,el] of [...$('regionTrack').children].entries()){
  if(index===S.step)el.setAttribute('aria-current','step');
  else el.removeAttribute('aria-current');
  el.classList.toggle('done',index<S.regions);
 }
 $('mucusStatus').hidden=S.mucus<0;
 $('dashBtn').disabled=p.cooldown>0;
 $('dashTime').textContent=dashSeconds?dashSeconds+'s':'Pronto';
 const bossBar=$('bossBar');bossBar.hidden=!boss||S.phase!=='play';
 if(boss){
  $('bossName').textContent=respiratory.bosses[boss.type].name;
  $('bossFill').style.width=100*boss.hp/boss.max+'%';
 }
}

function makeMap() {
 const g=mapCache.getContext('2d');
 if(!g)return;
 g.setTransform(1,0,0,1,respiratory.width/2,0);
 respiratory.paintMap(g,terrain);
 const thumb=$('crewChart'), h=thumb.getContext('2d');
 if(!h)return;
 h.clearRect(0,0,thumb.width,thumb.height);
 const ratio=Math.min(thumb.width/respiratory.width,thumb.height/respiratory.height)*.94;
 const w=respiratory.width*ratio,k=respiratory.height*ratio;
 h.drawImage(mapCache,(thumb.width-w)/2,(thumb.height-k)/2,w,k);
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
 const w=W/(2*scale),h=H/(2*scale),half=respiratory.width/2;
 const x=w>=half?0:clamp(S.p.x,-half+w,half-w);
 const y=h*2>=respiratory.height?respiratory.height/2:clamp(S.p.y,h,respiratory.height-h);
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
 const boss=respiratory.bosses[e.type];
 if(boss&&e.windup>0){
  const progress=1-e.windup/.85;
  oval(ctx,e.x,e.y,boss.wave,boss.wave,'rgba(252,92,117,.17)','#ffcab7');
  ctx.beginPath();ctx.arc(e.x,e.y,boss.wave,-Math.PI/2,-Math.PI/2+TAU*progress);
  ctx.strokeStyle='#fff1d0';ctx.lineWidth=4;ctx.stroke();
  if(e.type==='lungs'&&e.waves%2===0)drawAntibodies(e.x,e.y,boss.wave);
 }
 const motion=reduce?0:Math.sin(S.clock*8+e.phase)*e.r*.095;
 arenaArt.drawActor(ctx,sprite(e.type,boss?.rank),e.x,e.y,e.r,motion,S.clock-e.hitAt<.13);
 if(e.required&&!boss&&e.hp<e.max){
  ctx.fillStyle='#522645';ctx.fillRect(e.x-14,e.y+13,28,4);
  ctx.fillStyle='#ffdca3';ctx.fillRect(e.x-14,e.y+13,28*e.hp/e.max,4);
 }
}

function drawPlayer() {
 const p=S.p,ha=traitRank('ha'),na=traitRank('na'),fused=S.fusions.size>0;
 const shell=traitRank('shell'),veil=traitRank('veil'),core=traitRank('core');
 const traits=Object.keys(S.slots).length-1;
 const grade=Math.min(3,Math.floor((traits+ha+na+S.fusions.size)/2));
 const pace=reduce?0:Math.sin(S.clock*20)*p.walk;
 const bounce=reduce?0:Math.abs(pace)*3+Math.sin(S.clock*4)*1.8;
 const recoil=reduce?0:Math.max(0,1-(S.clock-p.castAt)/.14)*3;
 const aura=fused?'#e79bff':na?'#b5ffe3':ha?'#ffe0a5':null;
 if(aura)oval(ctx,p.x,p.y+10,23+grade*2,8,'rgba(77,27,76,.38)',aura);
 if(shell||veil)oval(ctx,p.x,p.y-6,24+grade,24+grade,null,shell?'#b4e2ed':'#dcb7f0');
 if(p.dash>0&&!reduce) {
  ctx.globalAlpha=.3;
  arenaArt.drawActor(ctx,sprite('player',grade),p.x-p.fx*22,p.y-p.fy*22,19,bounce);
  ctx.globalAlpha=1;
 }
 ctx.save();ctx.translate(p.x,p.y);
 ctx.scale(p.facing*(p.dash>0&&!reduce?1.14:1),1);
 if(!reduce)ctx.rotate(pace*.11);
 arenaArt.drawActor(ctx,sprite('player',grade),-recoil,0,19+grade,bounce,S.clock-p.hitAt<.18);
 if(ha)oval(ctx,-17,-19-bounce,3.1+ha,3.1+ha,'#ffd992','#7c4252');
 if(na)oval(ctx,18,-14-bounce,3.3+na,3.3+na,'#a4f1d0','#4b5769');
 if(core)oval(ctx,0,-30-bounce,3+core,3+core,'#d7a8ff','#644081');
 if(traitRank('magnet'))oval(ctx,-24,4,3.1,3.1,'#ffdaa0','#89594c');
 if(traitRank('reserve'))oval(ctx,24,5,3.1,3.1,'#ffacca','#885567');
 ctx.restore();
}

function drawEffects() {
 for(const effect of S.effects) {
  const t=(S.clock-effect.born)/effect.life;
  ctx.globalAlpha=1-t;
  if(effect.type==='pulse') {
   const r=Math.max(1,effect.r*(reduce?1:.44+.56*t));
   oval(ctx,effect.x,effect.y,r,r,null,effect.color);
   if(effect.antibody)drawAntibodies(effect.x,effect.y,r);
  }else{
   const dx=effect.x2-effect.x,dy=effect.y2-effect.y;
   const end = reduce ? .95 : .45+.55*t;
   ctx.beginPath();ctx.moveTo(effect.x+dx*Math.max(0,end-.38),effect.y+dy*Math.max(0,end-.38));
   ctx.lineTo(effect.x+dx*end,effect.y+dy*end);
   ctx.lineCap='round';ctx.lineWidth=6;ctx.strokeStyle='#693150';ctx.stroke();
   ctx.lineWidth=3;ctx.strokeStyle=effect.color;ctx.stroke();
  }
 }
 ctx.globalAlpha=1;
}

function draw() {
 ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height);
 setCamera();
 ctx.setTransform(dpr*scale,0,0,dpr*scale,dpr*ox,dpr*oy);
 ctx.drawImage(mapCache,-respiratory.width/2,0);
 respiratory.drawMucus(ctx,S.clock,S.mucus,reduce);
 if(S.step<2)respiratory.lock(ctx,respiratory.stages[S.step].gate);
 const stop=respiratory.stages[S.step];
 const label=['Hemaglutinina','Neuraminidase','Bifurcação'][S.step];
 if(!currentBoss())respiratory.marker(ctx,stop,label,S.enemies.every(e=>!e.required),S.clock,reduce);
 for(const orb of S.orbs)arenaArt.drawFragment(ctx,orb,reduce);
 for(const enemy of S.enemies)drawDefense(enemy);
 crew.drawEscort();
 drawEffects();drawPlayer();
 if(joy.on){
  const dx=joy.x-joy.ox,dy=joy.y-joy.oy,length=Math.max(1,Math.hypot(dx,dy)),amount=Math.min(34,length);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  oval(ctx,joy.ox,joy.oy,36,36,'rgba(79,43,73,.25)','#f4d8e4');
  oval(ctx,joy.ox+dx/length*amount,joy.oy+dy/length*amount,13,13,'rgba(255,227,223,.74)',null);
 }
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
 if(S?.phase!=='play'||joy.on)return;
 const [x,y]=relative(event);
 Object.assign(joy,{on:true,id:event.pointerId,ox:x,oy:y,x,y});
 try{cv.setPointerCapture(event.pointerId);}catch{}
 event.preventDefault();
});
cv.addEventListener('pointermove',event=>{
 if(joy.on&&event.pointerId===joy.id)[joy.x,joy.y]=relative(event);
});
for(const event of ['pointerup','pointercancel','lostpointercapture']){
 cv.addEventListener(event,pointer=>{
  if(pointer.pointerId===joy.id){joy.on=false;joy.id=null;}
 });
}

const directionKeys=['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'];
window.addEventListener('keydown',event=>{
 if(crew.isOpen())return;
 const key=event.key?.toLowerCase();
 if(S?.phase==='play'&&directionKeys.includes(key)){
  keys.add(key);event.preventDefault();
 }
 if(S?.phase==='play'&&event.code==='Space'&&document.activeElement?.tagName!=='BUTTON'){
  event.preventDefault();if(!event.repeat)dash();
 }
 if(key==='escape'||key==='p'){
  if(S?.phase==='play')pauseGame();
  else if(S?.phase==='pause')resume();
 }
});
window.addEventListener('keyup',event=>keys.delete(event.key?.toLowerCase()));
window.addEventListener('blur',clearInput);
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseGame();});
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

function stopFrames() {
 if(frameId!==null){cancelAnimationFrame(frameId);frameId=null;}
 if(observer){observer.disconnect();observer=null;}
 if(cv.width>1||cv.height>1){cv.width=1;cv.height=1;}
}

function syncArena() {
 const phase=S?.phase||'intro';
 stage.dataset.phase=phase;
 if(phase!=='play'||crew.isOpen()||document.hidden) {
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
 if(S?.phase!=='play'||crew.isOpen()||document.hidden){syncArena();return;}
 if(time-lastFrame>=FRAME_MS-.25) {
  const dt=Math.min((time-lastFrame)/1000,.067);lastFrame=time;
  update(dt);
  if(S?.phase!=='play')return;
  if(S.clock>=toastUntil)$('toast').classList.remove('show');
  draw();hud();
 }
 if(frameId===null)frameId=requestAnimationFrame(frame);
}
window.addEventListener('resize',()=>{
 if(S?.phase==='play'&&!observer&&resize())draw();
});
terrain.addEventListener('load',()=>{
 makeMap();
 if(S?.phase==='play'&&ctx)draw();
});
const portrait=$('virusPortrait').getContext('2d');
if(portrait)portrait.drawImage(sprite('player'),0,0,112,112);
makeMap();
setupGuide();
showIntro();
}
