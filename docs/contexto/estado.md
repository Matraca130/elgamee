# Estado do Atlas Viral

Revisado em 26 de novembro de 2026.

- **Influenza** tem quatro arenas, evolução do núcleo, HA, NA e posto de profilaxia.
- **VSR** tem duas arenas, casos de lactente e equipe de saúde e Confluência como recompensa do desafio do sincício.
- **Meus cursos** mostra os melhores resultados por capítulo. O servidor usa a identidade do Site para guardar o progresso da conta. A prévia guarda os resultados no navegador.
- **Perguntas** alternam recordação e interpretação. Cada capítulo tem um treino de quatro questões digitadas. As arenas e as novas missões de Brisa e Nimbo também aceitam respostas curtas com correção local.
- **Arte da arena** tem cinco silhuetas de defesa, com paletas de capítulo, três marcos ilustrados e o personagem desenhado em camadas.
- **Memória** tem busca por texto, busca por significado com MemPalace e um resumo por tema com decisões, arquivos e histórico. O comando `npm run contexto -- preparar` configura a busca por significado em outra cópia do código.
- **Coedição** usa o [Matraca130/elgamee](https://github.com/Matraca130/elgamee), repositório público com o jogo e a memória. O GitHub recebe propostas por pull request, e a versão jogável é publicada no Site.

## Verificação recente

A compilação do Worker e os cinco testes de perguntas passaram. O treino dos dois capítulos foi verificado em navegador com teclado e tela de toque emulada. Cenários de teste cobriram os marcos e as recompensas das seis arenas. Na base, uma missão antiga e uma digitada preservaram o bônus e o resgate único. O teste anterior de salvamento por conta usou sessões locais isoladas.

Uma consulta semântica offline em espanhol encontrou a decisão em português sobre preservar o melhor resultado de cada curso.

## Retomar

As regras atuais estão no [AGENTS.md](../../AGENTS.md). Abra o [registro de decisões](../decisoes/README.md) para verificar por que elas existem. Use o histórico do Git para conferir a alteração que entrou no código.
