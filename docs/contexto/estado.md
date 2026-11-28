# Estado do Atlas Viral

Revisado em 28 de novembro de 2026.

- **Influenza** tem quatro arenas, evolução do núcleo, HA, NA e posto de profilaxia.
- **VSR** tem duas arenas, casos de lactente e equipe de saúde e Confluência como recompensa do desafio do sincício.
- **Chagasico** tem um protótipo jogável do rancho ao entardecer com pergunta de entrada, duas casas de cura, armadilhas animadas e uma senhora que lança o chinelo. A [decisão da arena](../decisoes/arena-rancho-chagasico.md) mostra o jogo atual, as referências visuais e os pontos de reuso.
- **Controles de arena** usam o [mesmo módulo](../../dist/controles-arena.js) nos capítulos respiratórios e em Chagasico. O toque esquerdo move e o direito mira e dispara. No computador, o jogador usa teclado e mouse ou J para atacar.
- **Meus cursos** mostra os melhores resultados por capítulo. O servidor usa a identidade do Site para guardar o progresso da conta. A prévia guarda os resultados no navegador.
- **Memória** tem busca por texto, busca por significado com MemPalace e um resumo por tema com decisões, arquivos e histórico. O comando `npm run contexto -- preparar` configura a busca por significado em outra cópia do código.
- **Coedição** usa o [Matraca130/elgamee](https://github.com/Matraca130/elgamee), repositório público com o jogo e a memória. O GitHub recebe propostas por pull request, e a versão jogável é publicada no Site.

## Verificação recente

A compilação do Worker passou. Os capítulos foram testados até a última arena, e o salvamento por conta foi testado localmente com sessões isoladas.

Uma consulta semântica offline em espanhol encontrou a decisão em português sobre preservar o melhor resultado de cada curso.

## Retomar

As regras atuais estão no [AGENTS.md](../../AGENTS.md). Abra o [registro de decisões](../decisoes/README.md) para verificar por que elas existem. Use o histórico do Git para conferir a alteração que entrou no código.
