# Salvar o progresso por conta e por curso

**Aceita · registrada em 26 de novembro de 2026**

## Contexto

O jogador precisa encontrar o avanço de cada curso ao entrar em outro dispositivo. Os cursos têm números de arenas e perguntas diferentes.

## Decisão

Usar o login de ChatGPT do Site. Cada conta guarda o maior número de arenas superadas e o maior número de acertos em cada curso. Ao sincronizar, o Worker mantém o maior valor de cada campo.

## Consequências

Uma partida curta em outro dispositivo preserva os recordes já salvos. A interface indica quando o progresso está na conta e quando está apenas no navegador. O cadastro de um novo curso deve incluir seus limites no jogo e no servidor.

Arquivos relacionados. [Interface de progresso](../../dist/progresso.js) · [Worker](../../worker/index.js) · [Tabela de progresso](../../drizzle/0000_course_progress.sql)
