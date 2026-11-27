# Protótipo de animação da influenza

Rode `npm run dev` na raiz do projeto e abra `/estudio-influenza.html` na prévia. Mova com WASD, setas ou o direcional de toque. Aponte e atire na arena usando mouse ou toque, ou atire com espaço. Use Shift para esquivar e o botão **Testar impacto** para reproduzir a reação ao dano. Alterne para **No jogo** para conferir a silhueta na escala da partida.

Na campanha, entre no curso **Influenza** para usar o mesmo personagem com as regras da arena. Use Espaço para esquivar e o mouse, o toque direito ou J para disparar. As hastes ficam douradas quando a hemaglutinina é equipada, e o núcleo da arte acompanha o genoma e o perfil escolhidos.

## Como montar o próximo personagem

1. Comece com uma silhueta própria que se leia em cerca de 50 pixels. Use uma membrana WebP com transparência. Na influenza, a cor principal é turquesa, a sombra é azul-petróleo e as hastes são douradas. Mantenha a luz no alto e à esquerda da pintura.
2. Separe as peças em `desenharCamadas` e escolha um ponto de rotação para cada uma. O ponto (0, 0) é o centro da membrana. Desenhe nadadeiras e hastes por trás da membrana. Sobre ela, desenhe núcleo, olhos e boca. Cada peça pode reagir a uma pose com rotação, escala ou mudança de forma.
3. Defina a pose neutra e os clipes `idle`, `move`, `dash`, `shoot` e `hurt`. Cada quadro guarda o instante em segundos e os valores que mudam naquela pose. Para ciclos contínuos, repita a pose inicial no último quadro. Nos golpes, distancie os quadros de preparação e aproxime os de soltura e recuo para o movimento ganhar impacto.
4. Posicione o ponto `disparo` junto à boca e marque um evento com esse nome no quadro de soltura. O protótipo usa .173 segundo. `Personagem2D` interpola a pose e transforma esse ponto com o mesmo giro, escala e espelhamento da arte. Assim o projétil acompanha a peça e sai uma vez por ataque quando a animação cruza esse instante.
5. Abra o estúdio para conferir a leitura em tamanho de jogo e o tempo entre pressionar **Atirar**, ver a preparação e ver o projétil sair. Teste também andando, virado para a esquerda e com dois toques simultâneos. Ajuste as peças e os tempos no modelo e preserve o controlador para o próximo teste.

| Arquivo | Função |
| --- | --- |
| [influenza-2d.js](../dist/influenza-2d.js) | Peças da influenza, poses, clipes e ponto de disparo |
| [influenza-membrana.webp](../dist/influenza-membrana.webp) | Pintura da membrana na escala-base do modelo |
| [personagem-2d.js](../dist/personagem-2d.js) | Interpolação, articulação e eventos reaproveitáveis |
| [estudio-influenza.js](../dist/estudio-influenza.js) | Comandos, simulação dos projéteis e área de teste |
