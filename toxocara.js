export const rotaToxocara = [
  {
    name: 'Solo sombreado',
    summary: 'Percorra a camada de folhas com o ovo e recolha três marcos.',
    form: 'Ovo no ambiente',
    ground: ['#74513c', '#36291f'],
    marks: [[.27, .69], [.55, .32], [.73, .67]],
    guards: [[.35, .26], [.57, .62]],
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
    summary: 'Recolha os marcos do jardim. A lama reduz a velocidade do ovo.',
    form: 'Ovo com larva',
    ground: ['#9b673d', '#503922'],
    marks: [[.25, .31], [.50, .67], [.73, .32]],
    guards: [[.38, .61], [.60, .31], [.77, .69]],
    mud: [[.43,.47,54],[.73,.53,54]],
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
    summary: 'A larva sai do ovo e alcança a passagem que representa a migração.',
    form: 'Larva no hospedeiro acidental',
    ground: ['#984e57', '#472c45'],
    marks: [[.25, .63], [.52, .29], [.72, .63]],
    guards: [[.37, .29], [.54, .59], [.72, .34]],
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
    description: 'Acrescenta uma borda de folhas e 24 pontos de integridade máxima.'
  },
  sulco: {
    name: 'Trilha do sulco',
    kind: 'Adaptação visual',
    description: 'Acrescenta uma faixa âmbar e aumenta a velocidade de movimento em 20%.'
  },
  farejo: {
    name: 'Farejador',
    kind: 'Companheiro',
    description: 'Um mascote inspirado no cão que ajuda a recolher marcos de mais longe.'
  },
  broto: {
    name: 'Broto do jardim',
    kind: 'Companheiro',
    description: 'Um mascote do ambiente que amortece um impacto por arena.'
  }
};

export const cursoToxocara = 'toxocara';
