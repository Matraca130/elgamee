const influenzaCore=(()=>{
 const layouts={
  8:{name:'8 segmentos',profiles:['a','b'],color:'#e5f3ff',patrolRange:170,chance:32,bonusShare:50,
   question:{level:'Intermediária',topic:'Comparação de fichas',
    q:'O número de segmentos de uma ficha é compatível com influenza A e também com outro tipo humano. Entre B e C, qual tem a mesma contagem de A?',
    fields:[{label:'Outro tipo de influenza',terms:['Influenza B','Tipo B','B','Gripe B']}],
    note:'Influenza A e B têm oito segmentos de RNA de fita simples negativa. Influenza C tem sete.'}},
  7:{name:'7 segmentos',profiles:['c'],color:'#e5f3ff',patrolRange:135,chance:23,bonusShare:50,attackOffset:-2,
   question:{level:'Intermediária',topic:'Comparação de fichas',
    q:'Entre A, B e C, qual tipo de influenza tem sete segmentos de RNA?',
    fields:[{label:'Tipo de influenza',terms:['Influenza C','Tipo C','C','Gripe C']}],
    note:'Entre esses três tipos, C tem sete segmentos. A e B têm oito.'}}
 };

 const profiles={
  a:{name:'Influenza A',color:'#ffd185',patrolRange:205,chance:56,bonusShare:70,signatures:['drift','shift'],
   question:{level:'Intermediária',topic:'Epidemiologia',
    q:'Um boletim cita A(H3N2) e influenza B na mesma temporada. A qual dos dois tipos pertenciam os agentes das pandemias de gripe documentadas?',
    fields:[{label:'Tipo relacionado às pandemias',terms:['Influenza A','Tipo A','A','Gripe A']}],
    note:'A e B causam epidemias sazonais. Entre os tipos de influenza, só o A é conhecido por ter causado pandemias.'}},
  b:{name:'Influenza B',color:'#a1f2ed',patrolRange:165,chance:40,bonusShare:60,signatures:['drift'],
   question:{level:'Intermediária',topic:'Epidemiologia',
    q:'O boletim de uma mesma temporada registra casos por A e por B. Qual afirmação se sustenta para os dois tipos?',
    answers:['Participam das epidemias sazonais humanas.','Já foram responsáveis por pandemias documentadas.','Recebem subtipos designados pela combinação H e N.'],
    note:'A e B circulam em humanos e causam epidemias sazonais. As pandemias conhecidas de influenza foram causadas pelo tipo A.'}},
  c:{name:'Influenza C',color:'#e6c1ff',patrolRange:125,chance:26,bonusShare:50,attackOffset:-2,signatures:['quiet'],
   question:{level:'Intermediária',topic:'Epidemiologia',
    q:'Uma ficha descreve influenza C em humanos. Ao comparar com A e B, qual conclusão é sustentada pelos registros epidemiológicos?',
    answers:['C costuma causar doença leve e seu papel nas epidemias humanas difere do observado para A e B.','C participa das epidemias sazonais com o mesmo papel estabelecido para A e B.','C compartilha com A o histórico de pandemias humanas documentadas.'],
    note:'As infecções pelo tipo C geralmente são leves. A gravidade também depende da pessoa e do contexto da infecção.'}}
 };

 const signatures={
  drift:{name:'Deriva',icon:'≋',color:'#9cece6',chanceOffset:15,
   desc:'Aumenta em 15 pontos percentuais a chance de uma forma extra a cada nova arena.',
   question:{guide:6,level:'Intermediária',topic:'Vigilância antigênica',
    q:'Qual fenômeno descreve mudanças antigênicas graduais na influenza?',
    fields:[{label:'Nome do fenômeno',terms:['Deriva antigênica','Deriva','Drift','Antigenic drift']}],
    note:'Deriva antigênica é a mudança gradual em antígenos do vírus ao longo do tempo.'}},
  shift:{name:'Salto',icon:'✦',color:'#ffcf9d',intensity:1.5,
   desc:'As formas extras, favoráveis ou desfavoráveis, têm efeito 50% mais forte na arena.',
   question:{level:'Difícil',topic:'Vigilância antigênica',
    q:'Um texto descreve uma mudança antigênica grande e abrupta no influenza A. Como se chama esse padrão na vigilância?',
    fields:[{label:'Nome do fenômeno',terms:['Salto antigênico','Salto','Shift','Antigenic shift','Cambio antigénico mayor']}],
    note:'Salto antigênico descreve uma mudança grande e abrupta na influenza A. Deriva descreve mudanças graduais.'}},
  quiet:{name:'Passo discreto',icon:'›',color:'#e6c1ff',patrolOffset:-15,
   desc:'As patrulhas da arena percebem o personagem 15 unidades de distância mais perto.',
   question:{level:'Intermediária',topic:'Genoma da influenza C',
    q:'Que tipo de material genético compõe os sete segmentos do influenza C?',
    fields:[{label:'Ácido nucleico (sigla)',terms:['RNA','ARN']},{label:'Polaridade',terms:['Negativa','Sentido negativo','Polaridade negativa','Polaridad negativa','Negativo','−','-']}],
    note:'O influenza C tem RNA de fita simples negativa, dividido em sete segmentos.'}}
 };

 function stats(core){
  const base=profiles[core?.profile]??layouts[core?.segments];
  const signature=signatures[core?.signature];
  return {
   patrolRange:(base?.patrolRange??165)+(signature?.patrolOffset??0),
   chance:(base?.chance??0)+(signature?.chanceOffset??0),
   bonusShare:base?.bonusShare??50,attackOffset:base?.attackOffset??0,
   intensity:signature?.intensity??1
  };
 }

 function shape(core){
  const layout=layouts[core?.segments];
  if(!layout)return null;
  return {segments:core.segments,color:profiles[core.profile]?.color??layout.color,
   accent:signatures[core.signature]?.color};
 }

 function roll(core,random=Math.random){
  const {chance,bonusShare,intensity}=stats(core);
  if(!chance||random()*100>=chance)return null;
  const positive=random()*100<bonusShare;
  const direction=positive?1:-1,sign=positive?'+':'−';
  const color=positive?'#ffe8a5':'#ff9bae';
  if(random()<.5){
   const damage=4*intensity;
   return {name:positive?'Crista luminosa':'Crista opaca',desc:sign+damage+' no dano do disparo',
    positive,color,attackOffset:direction*damage};
  }
  const recharge=20*intensity;
  return {name:positive?'Pés de brisa':'Pés de chumbo',desc:(positive?'−':'+')+recharge+'% na recarga do dash',
   positive,color,cooldownFactor:1-direction*recharge/100};
 }

 return {layouts,profiles,signatures,stats,shape,roll};
})();
