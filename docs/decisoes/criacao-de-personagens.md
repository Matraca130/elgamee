# Criar personagens no Atlas Viral

**Aceita · 27 de novembro de 2026**

Todo personagem jogável novo entra no mesmo motor de arena e usa o controlador `Personagem2D`. Influenza e Toxocara mostram como reaproveitar esse controlador com silhuetas, movimentos e formas próprios. Registre as decisões da espécie junto do código para retomar o trabalho em outro chat ou editor.

## Anotar as características

Receba a descrição por voz ou por escrito e converta em uma ficha curta. Registre as ideias abertas como propostas. Use a guia indicada para o curso e anote a página ou seção para cada afirmação biológica. Quando a fonte não cobrir uma ideia, deixe o dado pendente de revisão.

| Campo | O que registrar |
| --- | --- |
| Identidade | Nome e espécie, papel na arena e o que o jogador deve reconhecer |
| Aparência | Silhueta, paleta, peças articuladas e traços que precisam aparecer na escala do jogo |
| Forma e rota | Forma inicial, mudanças de forma e momento da transição. Para parasitos, indique o ambiente, o hospedeiro e o vetor quando fizerem parte do ciclo |
| Habilidades | Ataque, esquiva e evoluções. Para cada efeito de jogo, indique como se ganha, onde funciona, quanto dura e qual mudança aparece na arte |
| Fonte | Documento ou link acessível à equipe, página impressa e folha do leitor quando for PDF |

## Montar o personagem

1. **Desenhe a silhueta.** Trabalhe na escala da arena, cerca de 50 pixels. Use um contorno legível, luz no alto à esquerda e uma paleta que distinga o personagem. Separe corpo e peças que se mexem. Defina o centro do corpo e o ponto de rotação de cada peça.
2. **Anime as peças.** Use os clipes `idle`, `move`, `dash`, `shoot` e `hurt`. Repita a primeira pose no fim dos ciclos contínuos. No ataque, mostre preparação, soltura e recuo. Use o evento `disparo` no quadro de soltura e o ponto de saída de mesmo nome para alinhar o efeito com a peça animada.
3. **Use a arte na partida.** Ligue as formas e evoluções aos dados do capítulo. A arena, o retrato e a evolução devem mostrar a forma correspondente. Reaproveite a mira manual e automática, a esquiva e a transição entre arenas. Quando criar um curso, registre o limite de arenas no progresso do navegador e do servidor.
4. **Valide no jogo.** Confira a leitura no tamanho da arena, o disparo único por ação, o espelhamento da mira e a resposta ao impacto. Teste teclado e mouse, movimento e mira com dois toques e as transições de forma e evolução. Rode `npm run build` e jogue da entrada de **Meus cursos** até a tela de conclusão com as habilidades equipadas. Registre a partida e os controles validados.

| Referência | Onde conferir |
| --- | --- |
| Controlador de poses e eventos | [Personagem2D](../../dist/personagem-2d.js) |
| Guia de montagem e estúdio | [Protótipo de animação da influenza](../prototipo-influenza.md) |
| Modelos em uso | [Influenza](../../dist/influenza-2d.js) · [Toxocara](../../dist/arte-toxocara.js) |
| Exemplo de formas, arenas e evoluções | [Rota de Toxocara](../../dist/toxocara.js) |
