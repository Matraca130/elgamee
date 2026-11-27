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
  {level:'Fácil', topic:'Mucosa', q:'Qual é a função do muco nas vias aéreas?',
   answers:['Reter partículas e microrganismos.','Produzir linfócitos no interior da traqueia.','Fazer a troca de oxigênio no lugar dos alvéolos.'],
   note:'O muco ajuda a reter partículas e microrganismos na superfície da via aérea.'},
  {level:'Intermediária', topic:'Depuração mucociliar', q:'O que leva para a faringe o muco das vias aéreas ciliadas?',
   answers:['O batimento coordenado dos cílios.','A contração dos glóbulos vermelhos.','O movimento de anticorpos no sangue.'],
   note:'Os cílios batem em conjunto e transportam o muco ao longo do epitélio em direção à faringe.'},
  {level:'Difícil', topic:'Defesas respiratórias', q:'Se o muco continuar retendo partículas, mas os cílios pararem de bater, o que ocorre com essa defesa?',
   answers:['A retenção ainda pode ocorrer, mas a remoção fica prejudicada.','A remoção continua normalmente só pela presença de muco.','Os anticorpos passam a mover mecanicamente o muco.'],
   note:'Reter e transportar são funções complementares. Sem o batimento ciliar, o transporte de muco pelo epitélio perde eficiência.'}
 ];
 const prophylaxis=[
  {level:'Fácil',topic:'Calendário vacinal',q:'O que um calendário de vacinação orienta?',
   answers:['Quais vacinas são indicadas em cada idade ou grupo, de acordo com a autoridade local.','Quais sintomas cada pessoa terá durante uma infecção.','Como identificar um vírus pela forma de seu capsídeo.'],
   note:'Os calendários organizam as indicações por faixa etária, grupos e situações específicas. As recomendações variam entre países.'},
  {level:'Intermediária',topic:'Tipos de vacina',q:'Qual a diferença entre uma vacina viva atenuada e uma inativada?',
   answers:['Uma usa vírus vivo enfraquecido. A outra contém vírus inativado ou componentes dele.','As duas contêm vírus vivo. A diferença é só o lugar da aplicação.','O nome indica apenas a idade de quem recebe a vacina.'],
   note:'Existem vacinas contra influenza inativadas, recombinantes e vivas atenuadas. A indicação depende da formulação e das orientações locais.'}
 ];
 const review = {
  ha:{level:'Fácil',topic:'Hemaglutinina',q:'Qual proteína do envoltório ajuda o influenza a se ligar à célula?',
   answers:['Hemaglutinina.','Neuraminidase.','Nucleoproteína.'],
   note:'A hemaglutinina, ou HA, participa do reconhecimento e da ligação à célula.'},
  na:{level:'Intermediária',topic:'Neuraminidase',q:'Qual é o principal papel da neuraminidase (NA) no ciclo do influenza?',
   answers:['A liberação de novas partículas virais.','A leitura do RNA pelos ribossomos.','O transporte de muco pelos cílios.'],
   note:'A NA é uma proteína do envoltório que facilita a liberação das novas partículas virais.'},
  pathogenesis:{guide:7,level:'Intermediária',topic:'Patogenia e clínica',
   q:'Se a infecção está nas vias aéreas, o que pode explicar o mal-estar no corpo todo durante a gripe?',
   answers:['Sinais da resposta inflamatória do hospedeiro.','A perda de cílios explica sozinha todos os sintomas gerais.','O movimento do muco produz o mal-estar no corpo todo.'],
   note:'A lesão do epitélio e a inflamação contribuem para a doença. Sinais da resposta do hospedeiro podem causar sintomas gerais, como mal-estar.'},
  epidemiology:{level:'Fácil',topic:'Epidemiologia',q:'Quais tipos de influenza causam epidemias sazonais em humanos?',
   answers:['Influenza A e B.','Influenza C e D.','Somente influenza D.'],
   note:'Os vírus influenza A e B causam epidemias sazonais de gripe em humanos.'}
 };

 const influenzaBank = [
  {guide:1, level:'Fácil',topic:'Classificação',q:'A que família pertence o vírus influenza?',
   answers:['Orthomyxoviridae.','Pneumoviridae.','Adenoviridae.'],
   note:'Os vírus influenza pertencem à família Orthomyxoviridae.'},
  {guide:2, level:'Intermediária',topic:'Morfologia',q:'O que os vírus influenza A e B têm em comum?',
   answers:['Envoltório e oito segmentos de RNA de polaridade negativa.','Capsídeo nu e genoma de DNA circular.','Envoltório e uma molécula única de RNA de polaridade positiva.'],
   note:'Influenza A e B são vírus envelopados com oito segmentos de RNA de fita simples e polaridade negativa.'},
  {guide:3, level:'Intermediária',topic:'Variação viral',q:'Qual característica descreve a organização do genoma do influenza A?',
   answers:['O genoma é segmentado.','O genoma é um cromossomo circular de DNA.','O vírus usa uma fita contínua de RNA de polaridade positiva.'],
   note:'O RNA do influenza A está dividido em segmentos. A variação viral é acompanhada na vigilância da gripe.'},
  {guide:4, level:'Fácil',topic:'Subtipos',q:'O que o H e o N identificam em um subtipo de influenza A?',
   answers:['A hemaglutinina e a neuraminidase.','Duas proteínas do núcleo da célula humana.','Duas proteínas da matriz viral.'],
   note:'Os subtipos de influenza A são nomeados pela hemaglutinina (H) e pela neuraminidase (N).'},
  {guide:5, level:'Intermediária',topic:'Resposta imune',q:'Como anticorpos contra a hemaglutinina podem neutralizar o influenza?',
   answers:['Podem impedir que o vírus se ligue à célula.','Transportam o muco mecanicamente para a faringe.','Produzem neuraminidase para a célula.'],
   note:'A HA participa da ligação à célula. Anticorpos contra ela podem bloquear essa interação.'},
  {guide:6, level:'Difícil',topic:'Variação antigênica',q:'Mudanças antigênicas graduais acumuladas ao longo do tempo correspondem a qual fenômeno?',
   answers:['Deriva antigênica (drift).','Salto antigênico (shift).','Depuração mucociliar.'],
   note:'O drift descreve mudanças graduais. O shift é uma mudança antigênica mais abrupta no influenza A.'},
  {guide:7, level:'Difícil',topic:'Patogenia',q:'O que ajuda a explicar os sintomas quando o influenza envolve o epitélio respiratório?',
   answers:['A lesão do epitélio e a resposta inflamatória do hospedeiro.','A troca de gases passa a acontecer no muco da garganta.','O vírus substitui os anticorpos por hemácias.'],
   note:'A lesão local e os sinais da resposta imune ajudam a explicar manifestações respiratórias e gerais da gripe.'},
  {guide:8, level:'Fácil',topic:'Epidemiologia',q:'Quem pode pegar influenza e quem tem maior risco de doença grave?',
   answers:['Todas as idades podem ser afetadas. Crianças pequenas, idosos, gestantes e pessoas com certas doenças crônicas têm maior risco.','A influenza se limita a crianças em idade escolar.','Ter a mesma idade implica sempre o mesmo risco de complicações.'],
   note:'Ocorrer em qualquer faixa etária é diferente de ter o mesmo risco de complicações em todas elas.'},
  {guide:9, level:'Intermediária',topic:'Prevenção',q:'Por que a vacina contra a gripe é atualizada regularmente?',
   answers:['Os vírus circulantes mudam e a formulação acompanha essa variação.','Cada dose precisa ensinar o epitélio a produzir muco.','A vacina passa a prevenir apenas resfriados comuns.'],
   note:'A vigilância observa a evolução dos vírus circulantes e informa a composição das vacinas sazonais.'},
  {guide:41, level:'Intermediária',topic:'Diagnóstico',q:'Qual método direto pode detectar material genético do influenza em uma amostra respiratória?',
   answers:['Um teste molecular como RT-PCR.','Um hemograma comum.','A contagem de anticorpos totais.'],
   note:'Os testes moleculares detectam material genético viral. A escolha clínica do teste depende do contexto.'},
  {guide:42, level:'Fácil',topic:'Prevenção',q:'Qual conjunto inclui medidas de prevenção de viroses respiratórias?',
   answers:['Vacinação quando indicada, higiene das mãos e ventilação dos espaços.','Uso rotineiro de antibióticos para prevenir vírus.','Evitar apenas alimentos frios.'],
   note:'A vacinação quando indicada, a higiene e a ventilação ajudam a reduzir riscos relacionados a infecções respiratórias.'}
 ];

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

 function marker(g, area, title, ready, clock, reduced) {
  const pulse=reduced?0:Math.sin(clock*3.2)*4;
  g.lineWidth=2;
  g.beginPath();
  g.ellipse(area.x,area.y,27+pulse,17+pulse*.45,0,0,Math.PI*2);
  g.fillStyle='#4d254b';
  g.fill();
  g.strokeStyle=ready?'#fff3d2':area.tone;
  g.stroke();
  g.beginPath();
  g.moveTo(area.x,area.y-15);g.lineTo(area.x+10,area.y);
  g.lineTo(area.x,area.y+11);g.lineTo(area.x-10,area.y);g.closePath();
  g.fillStyle=area.tone;g.fill();
  g.textBaseline='middle';g.textAlign='center';
  g.font='800 18px system-ui, sans-serif';g.lineWidth=5;
  g.strokeStyle='#48243d';g.strokeText(title,area.x,area.y+33);
  g.fillStyle='#fff7e7';g.fillText(title,area.x,area.y+33);
 }

 return {size,mapWidth,mapHeight,stages,bosses,questions,prophylaxis,review,influenzaBank,confine,mucusAt,paintRoom,drawMucus,marker};
})();
