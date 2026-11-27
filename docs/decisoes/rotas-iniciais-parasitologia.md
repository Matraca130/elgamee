# Rotas iniciais de Chagas e toxoplasmose

**Proposta · 27 de novembro de 2026**

## Contexto

O Atlas Viral explora dois pares de arenas para introduzir a epidemiologia e o ciclo de Chagas e toxoplasmose. A conversa definiu a direção do design e pediu variações visuais para escolher antes da implementação. A escolha da arte, a integração com o personagem jogável e os valores de equilíbrio estão em discussão.

## Sorteio e evolução

- A proposta tem quatro cenários no total, organizados em duas rotas de duas fases. No modo normal, o jogo sorteia uma rota ao começar a partida. As perguntas e os traços têm peso maior quando combinam com a rota, com chance de sair outras opções.
- No modo especial felino, as perguntas e os traços necessários aparecem nos momentos previstos. O jogador ganha o poder se acertar as perguntas e escolher os traços correspondentes.

## Chagas

- A primeira fase é o rancho ao entardecer. A segunda é uma arena rural noturna. Em cada fase, as casinhas recuperam vida e têm uma defesa junto à entrada. A luz pode revelar a posição do personagem para a senhora que lança o chinelo.
- Distribuir duas ou três armadilhas de chinelo por arena, com uma isca marcada por uma gota vermelha. Quando o jogador pisa perto, a sombra do chinelo antecipa o golpe e abre uma janela de esquiva.
- O quiz se chama **Chagasico**. A pergunta Q1 pede o nome da moradia de adobe com frestas onde a vinchuca pode se abrigar. A resposta é **rancho chagásico**. O acerto habilita a condição de entrada do bônus.
- A primeira fase oferece duas evoluções. Se o jogador acertar Q1 e escolher **Refúgio em frestas** e **Atividade noturna**, ganha velocidade nas sombras na segunda fase. Cada traço representa um hábito da vinchuca, o inseto vetor.
- O final da fase noturna mostra a transmissão vetorial em uma animação e uma pergunta. As fezes da vinchuca infectada podem levar *Trypanosoma cruzi* a uma lesão na pele ou a uma mucosa. [Ministério da Saúde da Argentina](https://www.argentina.gob.ar/salud/chagas/chagas-y-la-vinchuca)

## Toxoplasmose

- A primeira fase é o ambiente com a casinha de gato. A passagem ao segundo mapa mostra o felino com uma ave ou um roedor infectado e destaca o cisto no tecido da presa. O quiz aborda carne crua ou malpassada com cistos teciduais e a ingestão de oocistos maduros em água, solo ou alimentos contaminados.
- A segunda fase se passa em três trechos do intestino delgado, duodeno, jejuno e íleo. A abertura mostra os bradizoítos saindo do cisto ingerido. A animação intermediária mostra a entrada na célula intestinal. O encerramento mostra a união dos gametas, a formação do oocisto e sua maturação posterior no ambiente.
- Mamíferos e aves homeotermos podem ser hospedeiros intermediários, com multiplicação assexuada e formação de cistos nos tecidos. O humano é um intermediário acidental porque sua participação no ciclo usual das presas de felinos é incidental. O felino é o hospedeiro definitivo porque nele ocorre o ciclo sexual no intestino delgado. [Ciclo segundo o CDC](https://www.cdc.gov/dpdx/toxoplasmosis/)
- As duas primeiras evoluções aparecem no ambiente. **Adaptação ao hospedeiro** dá vida adicional após a pergunta sobre hospedeiros intermediários. **Cisto tecidual** reduz o dano ambiental após a pergunta sobre a forma ingerida com carne malpassada.
- As duas últimas evoluções aparecem no intestino. **Merogonia** é oferecida pela pergunta sobre os merozoítos produzidos na multiplicação assexuada intestinal. Uma quarta pergunta, ilustrada com a placenta, aborda o taquizoíto na transmissão congênita e oferece um escudo breve. [Multiplicação intestinal](https://pubmed.ncbi.nlm.nih.gov/25757795/) · [Transmissão congênita](https://pmc.ncbi.nlm.nih.gov/articles/PMC4109466/)
- Acertar e escolher as três primeiras evoluções em ordem habilita o poder no trecho final. Uma cópia idêntica usa IA própria e escolhe onde atacar. Os dois fazem seu dano normal e o dano soma quando atingem o mesmo alvo. A divisão em duas e o escudo são mecânicas do jogo. O roxo sinaliza a raridade Especial.

## Direção de arte

O usuário pediu arte arcade mais agressiva, com câmera quase de cima, contornos fortes, silhuetas compactas, cores contrastantes e chão amplo e contínuo. O centro de cada arena fica aberto em todas as direções. As casas, as luzes, os chinelos e as texturas do ambiente dão identidade a cada cena. As pranchas mostram a arte de cenário e usam códigos para a escolha.

| Fase | Opção de arte A | Opção de arte B |
| --- | --- | --- |
| Chagas ao entardecer | C5 · Terra ocre | C6 · Barro vermelho |
| Chagas à noite | C7 · Noite cobalto | C8 · Noite verde-petróleo |
| Toxo no ambiente | T5 · Quintal seco | T6 · Quintal úmido |
| Intestino felino | T7 · Coral e laranja | T8 · Violeta e magenta |

A escolha pendente é uma opção por fase. Os códigos identificam a rodada de arte arcade.
