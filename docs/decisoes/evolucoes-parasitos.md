# Evoluções, arenas internas e progressão roguelike dos parasitos

**Proposta · 27 de novembro de 2026**

Revisada em 28 de novembro de 2026 para consulta e discussão pela equipe.

## Contexto

A [proposta de introduções](https://github.com/Matraca130/elgamee/pull/7) descreve duas rotas, com duas fases de epidemiologia por rota. O [PR do rancho Chagasico](https://github.com/Matraca130/elgamee/pull/9) oferece uma versão jogável e independente da primeira introdução. A segunda introdução é descrita no PR das rotas. Depois delas vêm as arenas internas. O intestino do gato já tem função na rota do felino. Use as arenas, personagens e controles do Atlas Viral como base. O hospedeiro, o objetivo e a reação dos oponentes dão a função de cada arena.

## Direção confirmada pelo usuário

- **Uma morfologia ativa.** A partida pode registrar várias formas conhecidas. Uma melhoria em sequência ocupa a mesma vaga. Ataque, movimento, defesa e outros traços compatíveis seguem seus próprios limites. A [regra de vagas](https://github.com/Matraca130/elgamee/pull/6) e a decisão do Oocisto A no MemPalace são a referência.
- **Ordem de etapas fixa, com variação de cenário.** As aberturas sempre convergem em um trecho comum. As características da partida viajam com o jogador quando forem compatíveis com a forma seguinte. Seis ou sete aberturas e sangue como arena comum são ideias em discussão.
- **Habilidade entre arenas, consequência ao terminar.** O jogador escolhe a habilidade na passagem, usa durante a próxima arena e, ao concluí-la, decide a consequência para sua partida.

## Proposta para a transição entre arenas

O [motor atual](https://github.com/Matraca130/elgamee/blob/main/dist/jogo.js#L464-L527) já oferece cartas de evolução depois de vencer. Use essa transição para resolver duas decisões. Primeiro, escolha a consequência da habilidade que acabou de usar. Depois, veja a próxima arena e escolha uma habilidade compatível para levar. A carta antecipa o efeito e o que o jogador precisa fazer para abrir suas consequências.

No rancho de Chagas, Chagasico, Refúgio em frestas e Atividade noturna já orientam o uso das sombras. Na arena noturna, a luz expõe o jogador à senhora do chinelo. Como teste, completar o objetivo com a habilidade de sombra oferece duas consequências. Proteção absorve o primeiro golpe no trecho comum. Impulso fortalece o primeiro desvio. É a mesma arena de chegada, com decisões de combate diferentes. A quantidade de ofertas, seus efeitos e suas condições são parâmetros de teste.

O [precedente jogável de Toxocara](https://github.com/Matraca130/elgamee/pull/3) já combina opções de adaptação e companhia antes de uma passagem intestinal fixa. As duas introduções de Chagas fornecem o primeiro exemplo de como testar uso e consequência com arte e mecânicas já desenhadas.

## Chagas

O amastigota se multiplica dentro de células do mamífero. O tripomastigota sanguíneo circula e invade outras células. O epimastigota se multiplica no intestino médio do barbeiro (vinchuca). No intestino posterior do inseto surge o tripomastigota metacíclico. Sanguíneo e metacíclico são variantes de tripomastigota para o registro da partida.

| Forma | Arena e pista visual | Mecânica proposta |
| --- | --- | --- |
| Amastigota | Interior de uma célula no músculo ou no mapa cerebral. Corpo arredondado, flagelo reduzido. O músculo cardíaco é candidato a um teste de arena interna. | A habilidade de divisão cria um eco, totalizando dois personagens. Com a dupla em campo, três eliminações carregam a próxima divisão, que acrescenta um eco, até três personagens no total. Uma proteção breve durante a divisão dá tempo para se posicionar. Os ecos terminam com a troca de arena ou de forma. |
| Tripomastigota | Corrente sanguínea. Cinetoplasto atrás do núcleo. O flagelo acompanha a membrana ondulante e fica livre na ponta da frente. | O flagelo aumenta a velocidade de movimento. A animação da membrana marca a hora de usar um impulso curvo para contornar as defesas que interceptam o trajeto. |
| Epimastigota | Intestino médio do barbeiro. Cinetoplasto à frente do núcleo e membrana ondulante mais curta. | Pontos da arena permitem criar ecos fixos. As patrulhas convergem para o ponto de divisão, e o jogador precisa decidir onde manter posição. |

Use uma associação entre forma, cenário e função em cada transição. Por exemplo, no músculo o jogador identifica o amastigota e usa o eco no interior da célula. Ao ganhar a saída para o vaso, identifica o tripomastigota pelo cinetoplasto posterior e passa a usar o flagelo para se mover. Uma resposta incorreta conserva a forma anterior e mostra uma pista.

| Desafio em discussão | Requisito proposto além das três formas registradas | Recompensa proposta |
| --- | --- | --- |
| Sangue | Traço de ciclo **Saída da célula**. Ordenar a multiplicação intracelular do amastigota, a saída como tripomastigota para a circulação e a invasão de uma nova célula. | **Poder do Sangue**, Especial. Com tripomastigota ativo, o impulso acompanha a corrente e atinge oponentes no trajeto. |
| Barbeiro | Traço do vetor **Triatomíneo**. Associar epimastigota à multiplicação no intestino e tripomastigota metacíclico à forma eliminada nas fezes. | Avatar **Barbeiro** com **Picada**, ataque de curto alcance que evolui no desafio. A ficha mostra a transmissão vetorial por contaminação com fezes do barbeiro na pele lesionada ou em mucosas. |

A proposta anterior tratava Sangue e Barbeiro como finais separados. A convergência agora é requisito. Discutir com o usuário a função desses desafios no percurso comum antes de definir sua posição. Uma opção é que sejam recompensas especiais que mudam o modo de jogar o mesmo trecho.

## Toxoplasmose

**Escopo aceito no MemPalace.** O primeiro desenvolvimento é o Oocisto A, com [implementação em rascunho](https://github.com/Matraca130/elgamee/pull/8). Oocisto I e II avançam na mesma vaga. O Crescente dourado ocupa a vaga de ataque e tem um marco próprio na segunda arena. O Taquizoíto B segue reservado para desenvolvimento posterior como alternativa morfológica. Se a equipagem do Crescente passar para a tela de transição, alinhar primeiro o efeito disso sobre sua descoberta na segunda arena.

| Forma | Arena e pista visual | Mecânica proposta |
| --- | --- | --- |
| Oocisto | Formação no ciclo intestinal do felino, maturação no ambiente. A versão esporulada revela dois esporocistos. | Na fase introdutória ambiental, a carapaça atravessa obstáculos. A esporulação avança a forma na mesma vaga. Ao ser ingerido, o oocisto libera esporozoítos. |
| Taquizoíto | Fase ativa nos tecidos do hospedeiro. Silhueta em crescente. | A sequência de entradas em células no mapa carrega o impulso seguinte, representando o avanço associado à multiplicação rápida. |
| Bradizoíto em cisto tecidual | Músculo ou cérebro. Formas em crescente aparecem agrupadas dentro de uma parede visível. | A forma persistente permite fechar o cisto temporariamente e absorver um golpe ao custo de mobilidade. |

O intestino humano aproveita a arena introdutória como ponto de entrada para os tecidos. O intestino felino usa um enterócito como objetivo do ciclo sexual. Exemplo de combate com a mesma patrulha: no humano, o jogador libera a passagem para os tecidos. No felino, a patrulha fecha o acesso ao enterócito enquanto o jogador tenta alcançar o objetivo.

A proposta para o avatar **Gato** usa três traços. O de morfologia identifica **bradizoítos no cisto tecidual**. O de epidemiologia identifica a **presa com cisto**, por exemplo um roedor. O de ciclo identifica o **felino como hospedeiro definitivo**, com a etapa sexual no intestino. Após a fase humana, uma transição pela presa leva de volta à arena felina. Completar o objetivo libera o Gato com um salto seguido de patada. O fechamento do ciclo mostra a eliminação de oocistos ainda não esporulados e a esporulação no ambiente.

## Primeiro teste e decisões pendentes

Para testar o roguelike, use a arena noturna que já foi desenhada e compare duas partidas que chegam à mesma arena com consequências diferentes. Confira se o jogador consegue perceber pela carta, pelo efeito e pelo combate qual escolha fez. Para testar a morfologia interna em outro momento, use o trecho da célula muscular ao vaso. O limite de três personagens, a carga por três eliminações e a proteção breve são parâmetros desse segundo teste.

Antes de implementar, definir com o usuário se a convergência é por parasito ou compartilhada por Chagas e toxoplasmose, se a abertura é sorteada após escolher o parasito e onde ficam os desafios especiais. O seletor de rota do PR #3 e o modo normal com sorteio do PR #7 são precedentes que precisam ser conciliados. Conferir também a relação entre a proposta de avatar Gato e o poder de cópia já descrito no PR #7. O modo de documentar é registrar o contexto anterior, a divergência, o que foi decidido e o que segue como proposta.

Ao retomar este trabalho, consulte as [instruções do projeto](../../AGENTS.md), o [registro de decisões](README.md), as decisões vigentes no MemPalace e o código da arena. Registre as entregas do Atlas Viral no [repositório compartilhado](memoria-no-repositorio.md). Confirmar se cada referência está em uso ou ainda em PR. Diante de conflito com uma decisão aceita, apresentar as opções e o efeito de cada uma ao usuário antes de escolher. O motor de arenas e cartas está em `dist/jogo.js`. A arte está em `dist/arte-jogo.js`. Os ecos reaproveitam os perfis de `dist/replicacao.js`.

## Referências de biologia

- CDC DPDx. [Tripanossomíase americana](https://www.cdc.gov/dpdx/trypanosomiasisAmerican/)
- Fiocruz. [Organização estrutural de Trypanosoma cruzi](https://chagas.fiocruz.br/en/parasite/structural-organization/)
- CDC DPDx. [Toxoplasmose](https://www.cdc.gov/dpdx/toxoplasmosis/)
- CONICET e Universidad Nacional de La Plata. [Toxoplasma gondii, Atlas comentado de protozoología](https://ri.conicet.gov.ar/server/api/core/bitstreams/71029d99-625e-4205-9cb3-2c7388f26ff0/content)
