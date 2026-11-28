# Versionar a memória com o código

**Aceita · 26 de novembro de 2026 · atualizada em 28 de novembro de 2026**

## Contexto

Os desenvolvedores precisam conseguir abrir o projeto em suas contas e entender as escolhas anteriores. Chats diferentes podem ter partes diferentes da conversa.

## Decisão

Manter as instruções vigentes em `AGENTS.md` e registrar o motivo das decisões importantes nesta pasta. Cada alteração relevante leva consigo a decisão correspondente. O arquivo `CLAUDE.md` importa as instruções existentes para manter a mesma orientação em Claude Code.

## Consequências

O contexto acompanha o código e pode ser revisado no Git. Uma conversa nova começa pelas instruções e pelas decisões relacionadas à área que vai mudar.

O [Matraca130/elgamee](https://github.com/Matraca130/elgamee) é o repositório público de colaboração. Registre as propostas de design, as mudanças no jogo e os materiais de cada entrega em uma branch do projeto, com um pull request para revisão da equipe. Registre no mesmo PR as decisões confirmadas e os pontos que ainda dependem de alinhamento. A versão online do jogo é publicada no Site com as mudanças aprovadas.

## Consultas

O comando `retomar` reúne o estado atual, as decisões e os commits recentes de um tema. A busca textual encontra trechos em decisões e código. A busca por significado usa um índice MemPalace gerado localmente a partir dos documentos versionados.

O comando `preparar` instala a versão do MemPalace usada pelo projeto e obtém os arquivos públicos do modelo. A indexação e a consulta usam esses arquivos em modo offline. O índice é reconstruído a partir da memória versionada sempre que uma decisão ou regra vigente mudar. O Git conserva a sequência das decisões e permite voltar ao contexto de uma versão anterior.

Arquivos relacionados. [Instruções do projeto](../../AGENTS.md) · [Importação para Claude Code](../../CLAUDE.md) · [Como colaborar](../../README.md)
