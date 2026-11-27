const respiratory = (() => {
 const width = 720, height = 970;
 const bounds = [
  [26,120],[62,222],[128,271],[188,232],[222,169],[261,176],
  [310,205],[352,223],[432,229],[487,208],[524,163],[560,206],[617,263],[696,302],
  [826,308],[888,272],[937,196]
 ];
 const stages = [
  {name:'Orofaringe', x:0,y:170,gate:230, tone:'#edaa78', targets:[[-86,132],[86,132]],
   task:'Enfrente as células da orofaringe e chegue ao marco da hemaglutinina.'},
  {name:'Traqueia', x:0,y:449,gate:530, tone:'#8ae1d3', targets:[[-112,352],[107,408],[41,478]],
   task:'Enfrente as células ciliadas e alcance o marco da neuraminidase.'},
  {name:'Pulmões', x:0,y:653,gate:937, tone:'#ddb2ff', targets:[[-130,608],[130,608]],
   task:'Abra caminho até a bifurcação e enfrente a defesa da traqueia e dos pulmões.'}
 ];
 const mucus = [
  {x:0,y:293,rx:137,ry:26},
  {x:-78,y:407,rx:56,ry:22},
  {x:97,y:713,rx:52,ry:26},
  {x:-177,y:766,rx:54,ry:27}
 ];
 const bosses = {
  watch:{name:'Vigia da mucosa', x:0,y:203, health:106,r:27,speed:45,wave:89,color:'#67d8be',look:'shell',rank:1},
  airway:{name:'Defesa da traqueia', x:0,y:696, health:167,r:31,speed:49,wave:105,color:'#7dc8f2',look:'spark',rank:2},
  lungs:{name:'Macrófago alveolar ativado', x:131,y:766, health:242,r:39,speed:53,wave:125,color:'#e5a3ed',rank:3}
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
 const review = {
  ha:{level:'Fácil',topic:'Hemaglutinina',q:'Qual proteína do envoltório ajuda o influenza a se ligar à célula?',
   answers:['Hemaglutinina.','Neuraminidase.','Nucleoproteína.'],
   note:'A hemaglutinina, ou HA, participa do reconhecimento e da ligação à célula.'},
  na:{level:'Intermediária',topic:'Neuraminidase',q:'Qual etapa do ciclo do influenza tem participação da neuraminidase?',
   answers:['A liberação de novas partículas virais.','A leitura do RNA pelos ribossomos.','O transporte de muco pelos cílios.'],
   note:'A neuraminidase, ou NA, ajuda a liberar as partículas recém-formadas.'},
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

 function halfWidth(y) {
  const index = bounds.findIndex(([end]) => end >= y);
  if (index <= 0) return bounds[index === 0 ? 0 : bounds.length - 1][1];
  const [a,u] = bounds[index-1], [b,v] = bounds[index];
  const t = (y-a)/(b-a), blend = t*t*(3-2*t);
  return u+(v-u)*blend;
 }

 function confine(actor, gate = stages.at(-1).gate) {
  actor.y = Math.max(bounds[0][0]+actor.r, Math.min(gate-actor.r,actor.y));
  const extent = halfWidth(actor.y)-actor.r;
  actor.x = Math.max(-extent,Math.min(extent,actor.x));
  actor.y = Math.min(actor.y,887+Math.abs(actor.x)*.9);
 }

 function mucusAt({x,y}) {
  return mucus.findIndex(patch=>((x-patch.x)/patch.rx)**2+((y-patch.y)/patch.ry)**2<1);
 }

 function paintMap(g, image) {
  g.fillStyle='#3b1736';
  g.fillRect(-width/2,0,width,height);
  if(image?.complete && image.naturalWidth) {
   g.drawImage(image,-width/2,0,width,height);
   return;
  }
  const gradient=g.createLinearGradient(0,50,0,height);
  gradient.addColorStop(0,'#a74a68');
  gradient.addColorStop(.38,'#5b8793');
  gradient.addColorStop(.6,'#7f6e94');
  gradient.addColorStop(1,'#ce796f');
  g.beginPath();
  g.moveTo(-bounds[0][1],bounds[0][0]);
  for(const [y,w] of bounds)g.lineTo(-w,y);
  for(const [y,w] of bounds.slice().reverse())g.lineTo(w,y);
  g.closePath();
  g.fillStyle=gradient;
  g.fill();
  g.strokeStyle='#65344e';
  g.lineWidth=5;
  g.stroke();
 }

 function drawMucus(g, elapsed, active, reduced) {
  for(const [index,patch] of mucus.entries()) {
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

 function lock(g, gate) {
  const extent=halfWidth(gate)-6;
  g.beginPath();
  g.moveTo(-extent,gate);g.quadraticCurveTo(0,gate+11,extent,gate);
  g.strokeStyle='#512e49';g.lineWidth=8;g.stroke();
  g.strokeStyle='#ffe0a0';g.lineWidth=2.5;g.setLineDash([8,9]);g.stroke();g.setLineDash([]);
 }
 return {width,height,stages,mucus,bosses,questions,review,influenzaBank,halfWidth,confine,mucusAt,paintMap,drawMucus,marker,lock};
})();
