# Estado do Atlas Viral

Revisado em 28 de novembro de 2026.

- **Influenza** tem quatro arenas, evolução do núcleo, HA, NA e posto de profilaxia.
- **Animação 2D** equipa a influenza na campanha com o [modelo do estúdio](../prototipo-influenza.md), poses articuladas e disparo sincronizado.
- **VSR** tem duas arenas, casos de lactente e equipe de saúde e Confluência como recompensa do desafio do sincício.
- **Parasitos zoonóticos** começam com a [rota de Toxocara canis](../decisoes/rotas-de-parasitos.md), no mesmo menu e motor das rotas virais. O ovo atravessa duas arenas ambientais e a larva entra no hospedeiro acidental com as escolhas de adaptação e companheiro.
- **Oocisto** tem uma [proposta jogável no caminho A](../decisoes/caminhos-da-morfologia.md), com duas cascas sequenciais e o Crescente dourado na vaga de ataque. As três arenas foram concluídas com a Forma II e o Crescente. O caminho B, Taquizoíto, está reservado.
- **Meus cursos** mostra os melhores resultados por capítulo. O servidor usa a identidade do Site para guardar o progresso da conta. A prévia guarda os resultados no navegador.
- **Memória** tem busca por texto, busca por significado com MemPalace e um resumo por tema com decisões, arquivos e histórico. O comando `npm run contexto -- preparar` configura a busca por significado em outra cópia do código.
- **Coedição** usa o [Matraca130/elgamee](https://github.com/Matraca130/elgamee), repositório público com o jogo e a memória. O GitHub recebe propostas por pull request, e a versão jogável é publicada no Site.
- **Prévia jogável** tem um [endereço fixo no GitHub Pages](https://matraca130.github.io/elgamee/) e publica a revisão registrada em `gh-pages/versao.json`.

## Verificação recente

A compilação do Worker passou. Os capítulos foram testados até a última arena, e o salvamento por conta foi testado localmente com sessões isoladas.

A rota de Toxocara foi concluída com as duas adaptações e os dois companheiros em partidas de teste. O movimento por toque e a esquiva foram conferidos no celular simulado.

Uma consulta semântica offline em espanhol encontrou a decisão em português sobre preservar o melhor resultado de cada curso.

## Retomar

As regras atuais estão no [AGENTS.md](../../AGENTS.md). Abra o [registro de decisões](../decisoes/README.md) para verificar por que elas existem. Use o histórico do Git para conferir a alteração que entrou no código.
