const viralMorphology = (() => {
 const genomes={
  rnaNegative:{name:'RNA de fita simples (−)',strands:1,polarity:'−',color:'#ffb6cf',attack:19,interval:.67,delay:.72,hp:100,speed:152,
   note:'Golpe mais forte · preparação mais longa.'},
  rnaPositive:{name:'RNA de fita simples (+)',strands:1,polarity:'+',color:'#ffb6cf',attack:13,interval:.46,delay:.22,hp:100,speed:152,
   note:'Disparo mais rápido · menor dano por golpe.'},
  dna:{name:'DNA de fita dupla',strands:2,polarity:'',color:'#8fecd3',attack:15,interval:.64,delay:.50,hp:120,speed:141,
   note:'Mais integridade · movimento mais lento.'}
 };
 const bodies={
  round:{name:'Arredondado',speed:1,damageTaken:1},
  facets:{name:'Facetado',speed:.95,damageTaken:.94},
  filament:{name:'Filamentoso',speed:1,damageTaken:1}
 };
 const faces={calm:{name:'Tranquila',intensity:0},bold:{name:'Travessa',intensity:1},fierce:{name:'Feroz',intensity:2}};
 const appendages={
  float:{name:'Flutuante',dash:.15,cooldown:2.3},
  short:{name:'Flutuante · fibras curtas',dash:.15,cooldown:2.3},
  long:{name:'Flutuante · fibras longas',dash:.15,cooldown:2.3}
 };
 const defaults={genome:'rnaNegative',body:'round',face:'bold',surface:'float',control:'manual',replication:'steady'};
 const controls={manual:{name:'Mira manual'},auto:{name:'Ataque automático'}};

 function stats(config) {
  const genome=genomes[config.genome], shape=bodies[config.body], step=appendages[config.surface??defaults.surface];
  return {...genome,speed:Math.round(genome.speed*shape.speed),damageTaken:shape.damageTaken,
   dash:step.dash,cooldown:step.cooldown};
 }

 return {genomes,bodies,faces,appendages,controls,defaults,stats};
})();
