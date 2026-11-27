# Corrigir respostas curtas no navegador

**Aceita · 26 de novembro de 2026**

## Contexto

Alternativas muito distantes facilitavam o acerto por eliminação. O treino da abertura repetia um enunciado por capítulo. A equipe quer poder escrever novas questões e revisar o que conta como acerto.

## Decisão

Usar campos curtos para nomes, classificações e porcentagens. Cada pergunta define o termo esperado e os equivalentes aceitos, inclusive em espanhol quando cadastrados. O corretor compara o termo inteiro, normaliza maiúsculas, espaços, pontuação final e acentos. Nos campos de porcentagem, aceita ponto ou vírgula decimal e o sinal de porcentagem opcional. Todos os campos precisam estar corretos para contar o acerto. O navegador dá o resultado e a explicação imediatamente.

Casos que exigem escolher uma interpretação mais longa usam alternativas. As tentativas livres ficam em “Treinar perguntas”. Cada treino sorteia uma vez as quatro questões do capítulo e mostra seu próprio resultado. A arena registra o recorde do curso. Missões já iniciadas preservam o formato e as recompensas com que foram sorteadas.

## Manutenção

As perguntas ficam nos arquivos de cada capítulo, e a correção compartilhada fica em `dist/perguntas.js`. Use `fields` com um `label` e uma lista `terms` ou um número `percent`. O primeiro termo é o gabarito exibido na revisão. Um novo sinônimo pode ser acrescentado na própria pergunta. Execute `npm test` para verificar as regras e os bancos dos capítulos.

Referências para o conteúdo desta revisão. [Tipos de influenza](https://www.cdc.gov/flu/about/viruses-types.html) · [Interpretação dos testes de influenza](https://www.cdc.gov/flu/hcp/testing-methods/index.html) · [VSR na OMS](https://www.who.int/news-room/fact-sheets/detail/respiratory-syncytial-virus-%28RSV%29) · [Higiene das mãos](https://www.cdc.gov/clean-hands/hcp/clinical-safety/index.html)
