const pergunta = (q, answers, note) => ({ q, answers, note, topic: 'Oocisto de Toxoplasma', level: 'Morfologia e ciclo' });

export const formasOocisto = {
  'oocisto-i': {
    id: 'oocisto-i', name: 'Oocisto I', level: 1, kind: 'parasite-form', rarity: 'rare',
    kicker: 'Morfologia', color: '#69733b', icon: '⬡', defense: .9,
    desc: 'Forma a casca oval. Reduz o dano recebido em 10%.',
    questions: [
      pergunta('Que grupo de hospedeiros elimina oocistos de Toxoplasma gondii nas fezes?',
        ['Felinos', 'Triatomíneos', 'Cães'],
        'Os felinos são os hospedeiros definitivos. A fase sexuada ocorre no intestino do felino.'),
      pergunta('Em que estado o oocisto recém-eliminado pelo gato chega ao ambiente?',
        ['Ainda não esporulado', 'Esporulado, com dois esporocistos maduros', 'Como um cisto tecidual com bradizoítos'],
        'O oocisto é eliminado não esporulado e amadurece no ambiente.'),
      pergunta('Qual parte do ciclo do Toxoplasma leva à formação de oocistos?',
        ['A fase sexuada no intestino dos felinos', 'A formação de cistos nos músculos', 'A multiplicação dos taquizoítos nos tecidos'],
        'A fase sexuada no intestino dos felinos origina os oocistos.')
    ]
  },
  'oocisto-ii': {
    id: 'oocisto-ii', name: 'Oocisto II', level: 2, kind: 'parasite-form', rarity: 'epic',
    kicker: 'Morfologia', color: '#896335', icon: '⬡', defense: .8,
    desc: 'Reforça a casca na mesma vaga. Reduz o dano recebido em 20%.',
    questions: [
      pergunta('Quantos esporocistos há em um oocisto esporulado de Toxoplasma gondii?',
        ['Dois', 'Um', 'Quatro'],
        'O oocisto esporulado contém dois esporocistos. A casca do personagem é uma interpretação visual para a arena.'),
      pergunta('Onde o oocisto de Toxoplasma adquire sua forma esporulada?',
        ['No ambiente, depois da eliminação pelo felino', 'Dentro de uma hemácia humana', 'No interior de um cisto muscular'],
        'O oocisto amadurece no ambiente. A forma esporulada pode contaminar água, solo e alimentos.'),
      pergunta('Qual forma está associada à ingestão de água contaminada por Toxoplasma?',
        ['Oocisto esporulado', 'Bradizoíto em cisto muscular', 'Tripomastigota'],
        'Água contaminada pode conter oocistos esporulados. Os bradizoítos estão nos cistos teciduais.')
    ]
  }
};

export const proximaFormaOocisto = active => active === null
  ? formasOocisto['oocisto-i'] : active === 'oocisto-i' ? formasOocisto['oocisto-ii'] : null;

export function sortearPergunta(questions, history, random = Math.random) {
  const novas = questions.filter(question => !history.some(answer => answer.question === question.q));
  const pool = novas.length ? novas : questions;
  return pool[Math.floor(random() * pool.length)];
}

export const perguntasCrescente = [
  {
    q: 'Qual forma de Toxoplasma tem a silhueta de meia-lua e se multiplica na fase aguda?',
    answers: ['Taquizoíto', 'Oocisto', 'Cisto tecidual'],
    note: 'A meia-lua do taquizoíto inspira o disparo dourado. O golpe pertence à fantasia da arena.',
    level: 'Morfologia', topic: 'Ataque em crescente'
  },
  {
    q: 'Qual forma de Toxoplasma está associada à multiplicação rápida na fase aguda?',
    answers: ['Taquizoíto', 'Bradizoíto', 'Oocisto esporulado'],
    note: 'O taquizoíto é a forma associada à fase aguda. A silhueta dessa forma serve de referência para o crescente.',
    level: 'Morfologia', topic: 'Ataque em crescente'
  }
];
