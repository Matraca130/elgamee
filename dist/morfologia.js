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
  facets:{name:'Facetado',speed:.95,damageTaken:.94}
 };
 const faces={calm:{name:'Tranquila',intensity:0},bold:{name:'Travessa',intensity:1},fierce:{name:'Feroz',intensity:2}};
 const feet={
  light:{name:'Leves',dash:.15,cooldown:2.3},
  strong:{name:'Firmes',dash:.20,cooldown:2.95}
 };
 const defaults={genome:'rnaNegative',body:'round',face:'bold',feet:'light',control:'manual'};
 const controls={manual:{name:'Mira manual'},auto:{name:'Ataque automático'}};

 function stats(config) {
  const genome=genomes[config.genome], shape=bodies[config.body], step=feet[config.feet];
  return {...genome,speed:Math.round(genome.speed*shape.speed),damageTaken:shape.damageTaken,
   dash:step.dash,cooldown:step.cooldown};
 }

 return {genomes,bodies,faces,feet,controls,defaults,stats};
})();
