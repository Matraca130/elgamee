# Atlas Viral

- O jogador é sempre um vírus. Ele atravessa regiões do corpo, enfrenta defesas do hospedeiro e evolui com habilidades inspiradas nos vírus estudados. O linfócito é uma defesa do hospedeiro.
- Use a fluidez de Vampire Survivors como referência de jogabilidade: movimento direto com teclado ou toque, ataques em tempo real e um dash. Use Kingdom Rush como referência visual para arte cartunesca original, silhuetas legíveis, contorno forte, cenário ilustrado e golpes com antecipação e impacto. Use Hades como referência para escolhas e sinergias. Crie personagens, mapas, animações e efeitos próprios.
- Mantenha Comum, Rara e Especial. Use roxo para Especial. Na fase da influenza, garanta hemaglutinina e neuraminidase durante a progressão, com melhorias nas ofertas seguintes.
- O envoltório tem até quatro espaços funcionais: ataque, pulso, defesa e apoio. Nucleocapsídeo, movimento e status têm um espaço cada. Cada espaço aceita uma habilidade por partida, com melhorias de nível. Uma fusão pode acrescentar um terceiro poder sem ocupar o espaço de suas duas habilidades de origem. Mostre as escolhas no visual do vírus.
- A fase respiratória tem quatro arenas separadas: orofaringe, traqueia, brônquios e pulmões. As evoluções são oferecidas após vencer cada arena. As correntes de ar levam de uma sala para outra. Renderize só a arena ativa.
- Use a mucosa como defesa que atrasa o jogador e abre uma pergunta. A resposta correta preserva a integridade. Na última arena, o macrófago alveolar é o chefe e os anticorpos são uma defesa adaptativa distinta. O bônus jogável de fim de fase ainda está em discussão.
- A morfologia tem corpo, face, pés, núcleo visível e envoltório. Use azul-claro para o envoltório respiratório, pinos dourados para HA, ramos para NA e violeta para a fusão. Dê uma forma visual própria às habilidades equipadas. Trate a expressão do personagem como característica de jogo.
- Os perfis fictícios de genoma mudam o ritmo dos ataques, a integridade e a movimentação. Use um traço para RNA de fita simples, dois traços de outra cor para DNA de fita dupla e um sinal para a polaridade de RNA. Na ficha científica, influenza A tem RNA segmentado de fita simples negativa. Os atributos de jogo pertencem à ficção.
- Ofereça a morfologia interna da influenza na Área do núcleo, depois da orofaringe. Uma pergunta libera sete ou oito segmentos. Uma pergunta bônus permite escolher C com sete ou A/B com oito. Conserve a morfologia anterior se o jogador errar. Mostre na arte o número de segmentos e diferencie os perfis por cor.
- A morfologia interna pode liberar um poder exclusivo por partida. A tem as opções Deriva e Salto, B tem Deriva e C tem Passo discreto. Detectabilidade é o alcance da visão das patrulhas da arena. Variabilidade é a chance de sortear uma forma temporária ao entrar em outra arena. A forma admite bônus ou penalidade e modifica visualmente o personagem. Os números são atributos do jogo.
- Ofereça mira manual com dois toques independentes. O lado esquerdo move, o direito mira e dispara. Suporte teclado e mouse no computador e deixe ataque automático disponível como opção.
- Diferencie as fichas de biologia das metáforas do combate. Revise a parte científica em fontes confiáveis. Dê às perguntas um tema e uma dificuldade. Relacione as revisões de cada recompensa à característica recebida e inclua epidemiologia no banco de perguntas. Use o Taller 14 do Tutor de Integração como matriz do conteúdo respiratório. Na traqueia, varie tema e dificuldade. Mantenha os 43 enunciados nesse caderno e acrescente desafios jogáveis conforme cada vírus ganha sua fase. As fusões, os atributos e os efeitos dos golpes pertencem à ficção; mantenha a mecânica abstrata e preserve os conceitos científicos nas fichas.
- Mantenha o jogo acessível no celular e com teclado. Preserve a base dos auxiliares e seus dados salvos. Audite controles, objetivos e progressão ao mexer na arena.
- Quando o usuário firmar uma nova regra permanente de jogabilidade, arte ou conteúdo, atualize este arquivo junto com a mudança. Use a instrução mais recente do usuário para resolver divergências.

## Onde acrescentar conteúdo

- Defina as arenas, os pontos de saída, os chefes e as perguntas em `dist/fase-influenza.js`.
- Configure perfis e atributos em `dist/morfologia.js` e as camadas visuais em `dist/arte-jogo.js`.
- Configure segmentos, perfis, poderes, perguntas do núcleo e chances das formas em `dist/nucleo-influenza.js`.
- Registre as novas habilidades, fusões e efeitos de jogo em `dist/jogo.js`.
