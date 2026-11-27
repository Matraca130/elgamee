export const rotaToxocara = [
  {
    name: 'Solo sombreado',
    summary: 'Derrote as defesas do solo e alcance o marco de maturação.',
    form: 'Ovo no ambiente',
    spawn: {x:0,y:178}, x:0,y:440, tone:'#f4bd86',
    exit: {x:0,y:596}, label: 'Marco de maturação',
    targets: [[-126,249],[132,290],[-104,387]],
    question: {
      topic: 'Ciclo no ambiente',
      title: 'Em que lugar o ovo de Toxocara se desenvolve até a fase infectante?',
      answers: ['No ambiente, como no solo.', 'No interior de um mosquito.', 'No músculo humano.'],
      explanation: 'Ovos eliminados nas fezes do cão passam por desenvolvimento no ambiente. Na primeira passagem do jogo, a larva aparece dentro do ovo.'
    },
    choices: ['folha', 'sulco']
  },
  {
    name: 'Terra do jardim',
    summary: 'Limpe o caminho até o marco de ingestão. A lama reduz a velocidade.',
    form: 'Ovo com larva',
    spawn: {x:0,y:170}, x:0,y:479, tone:'#a5edc0',
    exit: {x:0,y:600}, label:'Marco de ingestão',
    targets: [[-143,281],[152,329],[-108,436],[122,458]],
    mucus: [{x:-118,y:343,rx:68,ry:37},{x:133,y:412,rx:56,ry:32}],
    surface: { speedFactor:.62, label:'Lama · movimento mais lento' },
    postoCrescente: {x:109,y:225, label:'Crescente dourado', hint:'Marco de ataque · à direita da entrada'},
    question: {
      topic: 'Transmissão',
      title: 'Nesta rota, como a infecção pelo Toxocara chega ao ser humano?',
      answers: ['Pela ingestão de ovos infectantes.', 'Pela picada de um mosquito.', 'Pela inalação de larvas no ar.'],
      explanation: 'A ingestão de ovos infectantes é a via ilustrada nesta rota. Toxocara canis não depende de um vetor.'
    },
    choices: ['farejo', 'broto']
  },
  {
    name: 'Passagem intestinal',
    summary: 'Abra caminho para a migração. O terceiro disparo libera um pulso de fuga.',
    form: 'Larva no hospedeiro acidental',
    spawn: {x:0,y:171}, x:0,y:482, tone:'#ffd2ae',
    label:'Marco da migração', targets: [[-141,280],[132,301],[-132,431],[118,458]],
    escapePulse:true,
    question: {
      topic: 'Hospedeiros',
      title: 'Por que o humano é um hospedeiro acidental neste ciclo?',
      answers: ['A larva pode migrar, mas não se torna verme adulto no humano.', 'O verme adulto no humano elimina ovos.', 'O humano é um vetor que carrega ovos para o cão.'],
      explanation: 'As larvas podem alcançar tecidos como fígado, pulmões, músculos ou olhos. No humano elas não completam o ciclo. O cão é hospedeiro definitivo de Toxocara canis.'
    }
  }
];

export const evolucoesToxocara = {
  folha: {
    name: 'Casca de folha',
    kind: 'Adaptação visual',
    description: 'Acrescenta uma borda de folhas e 24 pontos de integridade máxima.',
    slot:'adaptacao', color:'#517342', icon:'✦', hp:24
  },
  sulco: {
    name: 'Trilha do sulco',
    kind: 'Adaptação visual',
    description: 'Acrescenta uma faixa âmbar e aumenta a velocidade de movimento em 20%.',
    slot:'adaptacao', color:'#956134', icon:'»', speedFactor:1.2
  },
  farejo: {
    name: 'Farejador',
    kind: 'Companheiro',
    description: 'Um mascote inspirado no cão que atrai fragmentos de mais longe.',
    slot:'companheiro', color:'#885c45', icon:'✦', reach:30
  },
  broto: {
    name: 'Broto do jardim',
    kind: 'Companheiro',
    description: 'Um mascote do ambiente que absorve um impacto por arena.',
    slot:'companheiro', color:'#4b7453', icon:'⬡', shield:true
  }
};

const stages=rotaToxocara.map((stage,art)=>({
  ...stage,art,rx:310,ry:280,task:stage.summary,
  question:{...stage.question,q:stage.question.title,note:stage.question.explanation,level:'Ciclo zoonótico'}
}));

export const toxocaraChapter={
  id:'toxocara',title:'Parasitos zoonóticos',short:'Toxocara',
  lead:'Acompanhe Toxocara canis em duas arenas no solo e na passagem intestinal.',
  stats:{hp:100,speed:171,attack:19,interval:.61,delay:.55,dash:.19,cooldown:2.1,damageTaken:1},
  stages,bosses:{},review:{},practice:stages[0].question,
  win:'O ovo cruzou o ambiente e a larva chegou ao marco da migração. +25 moedas.'
};
