const respiratory = (() => {
 const size=760, mapWidth=720, mapHeight=970;
 const stages=[
  {name:'Orofaringe',art:0,rx:308,ry:278,spawn:{x:0,y:178},x:0,y:446,exit:{x:0,y:603},tone:'#f5bc8c',
   label:'Marco da hemaglutinina',targets:[[-135,250],[148,285],[-113,393]],boss:'watch',reward:'ha',
   caption:'Derrote o primeiro chefe, ganhe hemaglutinina e explore a Área do núcleo.',
   task:'Limpe a arena e chegue ao marco da hemaglutinina.'},
  {name:'Traqueia',art:1,rx:306,ry:283,spawn:{x:0,y:168},x:0,y:493,exit:{x:0,y:603},tone:'#a9f1e4',
   label:'Marco da neuraminidase',targets:[[-176,280],[158,335],[-124,483],[113,469]],reward:'na',
   mucus:[{x:-75,y:302,rx:85,ry:30},{x:117,y:431,rx:61,ry:25}],
   caption:'Passe pela mucosa e desbloqueie neuraminidase.',
   task:'Atravesse a traqueia larga e chegue ao marco da neuraminidase.'},
  {name:'Brônquios',art:2,rx:317,ry:279,spawn:{x:0,y:166},x:0,y:435,exit:{x:122,y:574},tone:'#edb4ff',
   label:'Bifurcação',targets:[[-156,300],[158,302],[0,478]],boss:'airway',
   study:{x:173,y:236,tone:'#ffda95',label:'Posto de profilaxia'},
   mucus:[{x:-111,y:417,rx:67,ry:30},{x:160,y:458,rx:57,ry:23}],
   caption:'Enfrente a defesa ciliar e encontre o posto de profilaxia.',
   task:'Passe pela bifurcação e enfrente a defesa ciliar.'},
  {name:'Pulmões',art:3,rx:311,ry:291,spawn:{x:0,y:165},x:0,y:430,tone:'#f9adba',
   label:'Entrada dos alvéolos',targets:[[-156,307],[153,303],[-138,469],[128,483]],boss:'lungs',
   mucus:[{x:-136,y:360,rx:64,ry:28},{x:160,y:412,rx:60,ry:27}],
   caption:'Desvie dos pulsos e saia dos campos dourados para vencer o macrófago.',
   task:'Abra caminho pelos alvéolos e enfrente o macrófago.'}
 ];
 const bosses={
  watch:{name:'Vigia da mucosa',x:0,y:473,health:106,r:27,speed:45,wave:89,rank:1},
  airway:{name:'Defesa da traqueia',x:0,y:494,health:167,r:31,speed:49,wave:105,rank:2},
  lungs:{name:'Macrófago alveolar ativado',x:34,y:502,health:242,r:39,speed:53,wave:125,rank:3,
   pressure:{duration:2.6,speedFactor:.74}}
 };
 const questions = [
  {level:'Intermediária', topic:'Barreira respiratória',
   q:'Uma partícula fica presa na camada que recobre o epitélio e depois é levada à faringe. Que material a reteve e que estruturas moveram essa camada?',
   fields:[{label:'Material que reteve a partícula',terms:['Muco','Mucus','Moco','Muco respiratório']},
    {label:'Estruturas que fazem o transporte',terms:['Cílios','Cílios móveis','Cílios do epitélio','Cilios móviles']}],
   note:'O muco retém as partículas. O batimento coordenado dos cílios desloca essa camada para a faringe.'},
  {level:'Difícil',topic:'Defesas respiratórias',
   q:'Uma amostra de epitélio ainda produz muco, mas o material retido deixou de avançar. Como se chama o mecanismo de limpeza comprometido?',
   fields:[{label:'Nome do mecanismo',terms:['Depuração mucociliar','Transporte mucociliar','Clearance mucociliar','Limpeza mucociliar','Aclaramiento mucociliar','Depuración mucociliar']}],
   note:'A depuração mucociliar depende tanto da retenção pelo muco quanto de seu transporte pelos cílios.'},
  {level:'Difícil',topic:'Defesas respiratórias',
   q:'Duas regiões retêm a mesma quantidade de partículas no muco. Em uma delas, os cílios batem com menos coordenação. Qual observação distingue melhor o efeito dessa diferença?',
   answers:['O material retido demora mais a chegar à faringe.','Menos partículas aderem ao muco no instante do contato.','A velocidade de transporte se mantém porque a retenção inicial foi igual.'],
   note:'A comparação mantém a retenção inicial constante. O que muda é o transporte do material já retido.'}
 ];
 const prophylaxis=[
  {level:'Difícil',topic:'Leitura de dados de vacinação',
   q:'Em um exercício, o posto Norte vacinou 54 de 90 pessoas elegíveis e o Sul, 48 de 60. Qual posto teve maior cobertura e qual foi a cobertura dele?',
   fields:[{label:'Posto',terms:['Sul','Posto Sul','Sur','Puesto Sur']},{label:'Cobertura (%)',percent:80}],
   note:'O Norte alcançou 60% (54 ÷ 90) e o Sul, 80% (48 ÷ 60). O denominador é o número de pessoas elegíveis em cada posto.'},
  {level:'Intermediária',topic:'Imunização',
   q:'Um texto compara uma vacina viva atenuada com uma vacina de vírus inteiro inativado. Qual característica distingue o material das duas formulações?',
   answers:['Capacidade de replicação do vírus vacinal.','Presença de antígenos que podem ser reconhecidos pelo sistema imune.','Possibilidade de induzir memória após a vacinação.'],
   note:'Na formulação viva atenuada, o vírus vacinal pode se replicar de forma limitada. A formulação de vírus inteiro inativado apresenta antígenos sem replicação.'}
 ];
 const review = {
  ha:{guide:4,level:'Intermediária',topic:'Leitura de boletim',
   q:'Uma tabela passa de A(H1N1) para A(H3N2). Quais são, por extenso, os nomes das duas proteínas representadas por H e N?',
   fields:[{label:'Proteína H',terms:['Hemaglutinina','Hemagglutinin','Hemaglutinina viral']},
    {label:'Proteína N',terms:['Neuraminidase','Neuraminidasa','Neuraminidase viral']}],
   note:'O H identifica a hemaglutinina e o N, a neuraminidase. Os números identificam seus subtipos.'},
  na:{level:'Difícil',topic:'Nomenclatura',
   q:'Um boletim compara A(H1N1) e A(H3N2). Em que nível de classificação esses registros coincidem e em que nível diferem?',
   fields:[{label:'Classificação em comum',terms:['Tipo','Tipo A','Mesmo tipo','Influenza A','A']},
    {label:'Classificação que difere',terms:['Subtipo','Subtipos','Subtipo de influenza A','Subtipos H e N']}],
   note:'Os dois registros são do tipo A. As combinações H1N1 e H3N2 identificam subtipos diferentes.'},
  pathogenesis:{guide:7,level:'Difícil',topic:'Patogenia e clínica',
   q:'Uma pessoa com gripe apresenta dor muscular e mal-estar. O registro só documenta infecção das vias aéreas. Qual interpretação exige menos suposições?',
   answers:['A resposta inflamatória do hospedeiro pode produzir sintomas gerais.','A dor muscular permite localizar o vírus nos músculos doloridos.','A intensidade do mal-estar permite identificar o subtipo que circula.'],
   note:'Sintomas gerais podem acompanhar a resposta inflamatória a uma infecção respiratória. Sua presença isolada não determina o local do vírus nem o subtipo.'},
  epidemiology:{level:'Difícil',topic:'Vigilância sazonal',
   q:'Em um boletim fictício de influenza, a semana 1 teve 12 testes positivos em 60, e a semana 2 teve 18 em 120. Qual semana teve maior positividade? Calcule o valor.',
   fields:[{label:'Semana de maior positividade',terms:['Semana 1','1','Primeira','Primeira semana','Semana um','Semana uno','Primera semana','1ª semana']},{label:'Positividade nessa semana (%)',percent:20}],
   note:'Na primeira semana, 12 ÷ 60 = 20%. Na segunda, 18 ÷ 120 = 15%. O número absoluto de positivos subiu enquanto a proporção caiu.'}
 };

 const testInterpretation={guide:41,level:'Difícil',topic:'Interpretação de testes',
  q:'Um teste rápido de antígeno para influenza foi negativo e um teste molecular foi positivo. Que propriedade do primeiro teste, quando menor, torna mais prováveis os falsos negativos?',
  fields:[{label:'Propriedade do teste',terms:['Sensibilidade','Sensibilidade diagnóstica','Sensibilidade clínica','Sensibilidad','Sensibilidad diagnóstica','Sensitivity']}],
  note:'Sensibilidade é a proporção de resultados positivos entre as pessoas que têm a condição. Uma sensibilidade menor deixa escapar mais casos.'};
 const influenzaBank = [
  {guide:1,level:'Intermediária',topic:'Classificação',
   q:'Uma ficha menciona o tipo A e o subtipo H3N2. Qual nome de família completa a classificação desse agente?',
   fields:[{label:'Família',terms:['Orthomyxoviridae','Família Orthomyxoviridae','Familia Orthomyxoviridae']}],
   note:'Influenza A pertence à família Orthomyxoviridae. Tipo, subtipo e família são níveis diferentes de descrição.'},
  {guide:2,level:'Intermediária',topic:'Leitura de fichas',
   q:'As fichas de influenza A e B mostram oito segmentos de RNA cada uma. Essa informação, sozinha, permite concluir o quê?',
   answers:['A contagem é compatível com ambos os tipos e não os distingue.','A contagem basta para identificar o tipo A.','A contagem basta para identificar o tipo B.'],
   note:'A e B compartilham essa contagem. É preciso outra informação para distinguir os dois.'},
  {guide:3,level:'Intermediária',topic:'Comparação de genomas',
   q:'Uma ficha de influenza A e outra de VSR dizem “RNA de fita simples negativa”. Qual característica da organização do RNA permite distinguir esses registros?',
   fields:[{label:'Característica',terms:['Segmentação','Segmentação do genoma','Segmentação do RNA','Segmentación','Segmentación del genoma','Genoma segmentado','Número de segmentos']}],
   note:'A ficha da influenza A descreve RNA dividido em segmentos. A do VSR descreve RNA não segmentado.'},
  review.ha,
  {guide:5,level:'Intermediária',topic:'Resposta imune',
   q:'Um relatório separa anticorpos que reconhecem um antígeno daqueles capazes de bloquear a infecção. Como se denomina essa segunda função?',
   fields:[{label:'Função dos anticorpos',terms:['Neutralização','Neutralização viral','Neutralización','Neutralización viral','Atividade neutralizante']}],
   note:'Reconhecer um antígeno é ligação. A capacidade de bloquear a infecção caracteriza a atividade neutralizante.'},
  {guide:6,level:'Intermediária',topic:'Leitura de séries históricas',
   q:'Um boletim descreve pequenas mudanças antigênicas graduais entre temporadas de influenza. Qual termo epidemiológico resume esse padrão?',
   fields:[{label:'Termo técnico',terms:['Deriva antigênica','Deriva antigénica','Deriva','Drift','Antigenic drift']}],
   note:'Deriva antigênica é o nome dado ao padrão gradual observado ao longo do tempo.'},
  review.pathogenesis,
  {guide:8,level:'Difícil',topic:'Leitura de dados de risco',
   q:'Em uma coorte fictícia com gripe, 6 de 30 participantes do grupo X foram internados, contra 10 de 100 do grupo Y. Em qual grupo a proporção de internações foi maior?',
   fields:[{label:'Grupo',terms:['X','Grupo X']},{label:'Proporção nesse grupo (%)',percent:20}],
   note:'O grupo X teve 20% de internações e o Y, 10%. A comparação vale para os grupos descritos no exercício.'},
  {guide:9,level:'Intermediária',topic:'Prevenção',
   q:'Dois boletins trazem composições vacinais sazonais diferentes para períodos distintos. Qual informação é relevante para interpretar a atualização?',
   answers:['A caracterização dos vírus que circulavam e a projeção para a temporada.','A proporção de pessoas já vacinadas, por si só, identifica os antígenos necessários.','A quantidade total de internações identifica sozinha quais antígenos circulam.'],
   note:'A vigilância acompanha os vírus circulantes para informar a composição das vacinas sazonais.'},
  testInterpretation,
  {guide:42,level:'Difícil',topic:'Prevenção e avaliação',
   q:'Depois de uma campanha, houve menos casos notificados e também menos testes. Qual comparação ajuda a interpretar primeiro essa queda?',
   answers:['A proporção de testes positivos antes e depois e quem foi testado em cada período.','A diferença entre contagens brutas, atribuindo toda a queda à campanha.','A população total como único denominador, supondo cobertura de testagem constante.'],
   note:'Mudanças no número de testes e no perfil de quem foi testado alteram a leitura das notificações. A comparação isolada não mede o efeito causal da campanha.'}
 ];
 const practice=[review.epidemiology,testInterpretation,prophylaxis[0],review.ha];
 const mucusQuestions=[...questions,...influenzaBank,review.epidemiology];

 function confine(actor, room) {
  const rx=room.rx-actor.r, ry=room.ry-actor.r, dy=actor.y-size/2;
  const factor=Math.max(1,Math.hypot(actor.x/rx,dy/ry));
  actor.x/=factor;actor.y=size/2+dy/factor;
 }

 function mucusAt(room,{x,y}) {
  return (room.mucus??[]).findIndex(patch=>((x-patch.x)/patch.rx)**2+((y-patch.y)/patch.ry)**2<1);
 }

 function paintRoom(g, atlas, room) {
  g.fillStyle='#39192f';g.fillRect(-size/2,0,size,size);
  if(atlas.complete&&atlas.naturalWidth){
   const tile=atlas.naturalWidth/2;
   const x=room.art%2*tile+2,y=Math.floor(room.art/2)*tile+2;
   g.drawImage(atlas,x,y,tile-4,tile-4,-size/2,0,size,size);
   return;
  }
  const floor=g.createRadialGradient(0,size/2,0,0,size/2,size*.46);
  floor.addColorStop(0,room.tone);floor.addColorStop(1,'#784155');
  g.beginPath();g.ellipse(0,size/2,room.rx+30,room.ry+36,0,0,Math.PI*2);
  g.fillStyle=floor;g.fill();
  g.lineWidth=12;g.strokeStyle='#60304f';g.stroke();
 }

 function drawMucus(g, room, elapsed, active, reduced) {
  for(const [index,patch] of (room.mucus??[]).entries()) {
   const {x,y,rx,ry}=patch;
   const ripple = reduced ? 0 : Math.sin(elapsed*2.8+index*1.9)*2;
   g.beginPath();
   g.ellipse(x,y,rx,ry+ripple,0,0,Math.PI*2);
   g.fillStyle=active===index?'rgba(145,243,218,.62)':'rgba(117,217,193,.34)';
   g.fill();
   g.lineWidth=2.5;
   g.strokeStyle=active===index?'#efffea':'#afedd9';
   g.stroke();
   g.beginPath();
   g.ellipse(x,y+2,rx*.72,ry*.54+ripple*.4,0,3.1,5.88);
   g.strokeStyle='rgba(232,255,238,.76)';
   g.lineWidth=1.6;
   g.stroke();
   g.beginPath();
   g.arc(x-rx*.44,y-ry*.15,3,0,Math.PI*2);
   g.fillStyle='#dff8e8';
   g.fill();
  }
 }

 return {size,mapWidth,mapHeight,stages,bosses,questions,prophylaxis,review,practice,mucusQuestions,confine,mucusAt,paintRoom,drawMucus};
})();
