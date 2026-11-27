const vsrChapter=(()=>{
 const review={
  syncytium:{guide:14,level:'Difícil',topic:'Leitura de lâmina',
   q:'Em uma lâmina de VSR, os núcleos de células vizinhas permanecem distintos após a fusão das membranas. Nomeie a estrutura resultante e o compartimento que passou a ser comum.',
   fields:[{label:'Estrutura observada',terms:['Sincício','Sincícios','Sincitio','Syncytium','Sincício multinucleado']},
    {label:'Compartimento compartilhado',terms:['Citoplasma','Citoplasma celular','Cytoplasm']}],
   note:'O sincício é a estrutura formada pela fusão celular. O achado descrito é o citoplasma compartilhado por vários núcleos.'},
  morphology:{guide:10,level:'Intermediária',topic:'Classificação',
   q:'Duas fichas, de VSR e de metapneumovírus humano, estão na mesma pasta de família. Escreva o nome dessa família e o gênero que identifica especificamente o VSR.',
   fields:[{label:'Gênero',terms:['Orthopneumovirus']},{label:'Família',terms:['Pneumoviridae']}],
   note:'Orthopneumovirus é o gênero do VSR. Pneumoviridae é a família, que também inclui o metapneumovírus humano.'}
 };
 const immunity={level:'Difícil',topic:'Imunização',
  q:'Um lactente recebe anticorpos prontos. Em outro exemplo, o próprio organismo produz anticorpos após uma vacina. Como se classifica a imunidade adquirida em cada situação?',
  fields:[{label:'Anticorpos recebidos',terms:['Passiva','Imunidade passiva','Imunização passiva','Pasiva','Inmunidad pasiva','Inmunización pasiva']},
   {label:'Resposta à vacina',terms:['Ativa','Imunidade ativa','Imunização ativa','Activa','Inmunidad activa','Inmunización activa']}],
  note:'Na imunização passiva, os anticorpos vêm de fora. Na ativa, o sistema imune da própria pessoa responde ao antígeno.'};
 const positiveTests={level:'Difícil',topic:'Vigilância de VSR',
  q:'Dois serviços enviaram amostras para VSR. O Leste teve 9 positivas em 30 e o Oeste, 15 em 75. Qual teve maior positividade e qual foi o valor?',
  fields:[{label:'Serviço',terms:['Leste','Serviço Leste','Este','Servicio Este']},{label:'Positividade (%)',percent:30}],
  note:'O Leste teve 30% de positividade e o Oeste, 20%. Esses valores descrevem as amostras testadas em cada serviço.'};
 const cases={
  care:{x:-160,y:228,tone:'#f2c790',label:'Caso · equipe de saúde',hint:'Caso sobre prevenção · à esquerda da entrada',
   questions:[{level:'Intermediária',topic:'Prevenção no serviço',
    q:'Uma profissional retira as luvas após examinar uma criança e vai atender outra. Qual cuidado com as mãos deve ocorrer entre esses atendimentos?',
    fields:[{label:'Medida de prevenção',terms:['Higiene das mãos','Higienização das mãos','Higienizar as mãos','Lavar as mãos','Lavagem das mãos','Fricção antisséptica das mãos','Higiene de manos','Lavado de manos','Higienização de mãos']}],
    note:'As luvas complementam a proteção. A higiene das mãos está indicada após retirá-las e antes do contato com o próximo paciente.'},immunity]},
  infant:{x:165,y:232,tone:'#f2c790',label:'Caso · lactente',hint:'Caso de bronquiolite · à direita da entrada',
   questions:[{guide:13,level:'Difícil',topic:'Anatomia e clínica',
    q:'Em um caso didático de VSR, o laudo localiza a inflamação nas pequenas vias aéreas entre os brônquios e os alvéolos. Nomeie a estrutura e o quadro inflamatório correspondente.',
    fields:[{label:'Estrutura anatômica',terms:['Bronquíolos','Bronquíolo','Os bronquíolos','Los bronquiolos']},
     {label:'Quadro inflamatório',terms:['Bronquiolite','Bronquiolite aguda','Bronquiolitis','Bronquiolitis aguda']}],
    note:'Os bronquíolos são pequenas vias aéreas. A inflamação dessas estruturas recebe o nome de bronquiolite.'},positiveTests]}
 };
 const practice=[cases.infant.questions[0],immunity,positiveTests,review.syncytium];
 const mucusQuestions=[...respiratory.questions,review.morphology,positiveTests];

 const stages=[
  {name:'Vias superiores',art:0,rx:308,ry:278,spawn:{x:0,y:178},x:0,y:446,exit:{x:0,y:603},
   tone:'#a8e4d6',label:'Marco das correntes',targets:[[-132,252],[147,295],[-105,395]],boss:'vsrWatch',
   unlock:'confluencia',study:cases.care,caption:'Enfrente o vigia e descubra como se forma um sincício.',
   task:'Abra caminho até o marco das correntes.'},
  {name:'Bronquíolos',art:2,rx:317,ry:279,spawn:{x:0,y:167},x:0,y:434,
   tone:'#8be5cb',label:'Curva dos bronquíolos',targets:[[-144,304],[154,309],[-125,468],[116,479]],boss:'vsrBronchi',
   mucus:[{x:-115,y:406,rx:61,ry:27},{x:142,y:428,rx:55,ry:22}],study:cases.infant,
   caption:'Encontre o caso de bronquiolite e vença a defesa bronquiolar.',
   task:'Atravesse os bronquíolos e enfrente a defesa da curva.'}
 ];
 const bosses={
  vsrWatch:{name:'Vigia das correntes',x:0,y:473,health:98,r:27,speed:44,wave:88,rank:1},
  vsrBronchi:{name:'Defesa bronquiolar',x:0,y:490,health:186,r:34,speed:49,wave:108,rank:2,
   pressure:{duration:2.35,speedFactor:.78}}
 };
 return {id:'vsr',title:'Vírus sincicial respiratório',short:'VSR',topic:'Virus sincicial respiratorio',
  lead:'Atravesse duas arenas e investigue o sincício e a bronquiolite.',
  stages,bosses,review,practice,mucusQuestions,fixedGenome:'rnaNegative',
  win:'Você atravessou os bronquíolos e venceu a defesa da curva. +25 moedas.'};
})();
