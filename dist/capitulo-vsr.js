const vsrChapter=(()=>{
 const review={
  syncytium:{guide:14,level:'Intermediária',topic:'Sincício',
   q:'Como se forma um sincício na infecção pelo VSR?',
   answers:['A proteína F pode promover a fusão de células, formando uma estrutura com vários núcleos.','A proteína G divide cada núcleo em vários segmentos de RNA.','Os anticorpos unem os núcleos no interior das células.'],
   note:'Sincícios são estruturas multinucleadas formadas pela fusão de células. A proteína F participa dessa fusão no VSR e a proteína G está associada à ligação à célula.'},
  morphology:{guide:10,level:'Fácil',topic:'Morfologia',
   q:'Como se descreve o genoma do vírus sincicial respiratório?',
   answers:['RNA de fita simples negativa, não segmentado.','RNA de fita simples positiva em oito segmentos.','DNA circular de fita dupla.'],
   note:'O VSR pertence ao gênero Orthopneumovirus, da família Pneumoviridae. Tem envoltório e pode apresentar formas arredondadas e filamentosas.'}
 };
 const cases={
  care:{x:-160,y:228,tone:'#f2c790',label:'Caso · equipe de saúde',hint:'Caso sobre prevenção · à esquerda da entrada',
   questions:[{level:'Fácil',topic:'Prevenção',
    q:'Entre atendimentos de pessoas com sintomas respiratórios, qual ação ajuda a proteger pacientes e equipe?',
    answers:['Higienizar as mãos e seguir as precauções indicadas no serviço.','Usar antibióticos preventivamente em todos os casos.','Adotar precauções apenas se houver febre.'],
    note:'Higiene das mãos e precauções adequadas ajudam a reduzir infecções em serviços de saúde.'}]},
  infant:{x:165,y:232,tone:'#f2c790',label:'Caso · lactente',hint:'Caso de bronquiolite · à direita da entrada',
   questions:[{guide:13,level:'Intermediária',topic:'Bronquiolite',
    q:'Em um lactente com bronquiolite, qual região está inflamada?',
    answers:['Os bronquíolos, as pequenas vias aéreas dos pulmões.','Apenas a orofaringe.','As membranas que revestem o cérebro.'],
    note:'Bronquiolite é a inflamação das pequenas vias aéreas. O VSR é uma causa frequente em lactentes. A gravidade varia com a idade e outros fatores.'}]}
 };
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
  stages,bosses,review,practice:review.morphology,fixedGenome:'rnaNegative',
  win:'Você atravessou os bronquíolos e venceu a defesa da curva. +25 moedas.'};
})();
