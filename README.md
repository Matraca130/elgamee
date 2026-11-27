# Atlas Viral

Jogo de virologia com cursos interativos de influenza e vírus sincicial respiratório. O código da arena e das fichas está em `dist/`. O servidor do site e o progresso por conta estão em `worker/`.

## Rodar e revisar

Com Node.js instalado, execute `npm run dev` e abra a URL exibida. Na prévia local, o avanço fica no navegador. Execute `npm run build` para gerar o Worker que serve o jogo e o progresso por conta no site.

Para continuar em outro chat ou editor, abra o repositório na raiz e consulte as [instruções do projeto](AGENTS.md). O [registro de decisões](docs/decisoes/README.md) explica as escolhas que ainda orientam o código.

## Editar em dupla

Quando os dois têm edição no mesmo Site, cada pessoa pode abrir o Atlas em Sites e revisar sua mudança na prévia. Para colaboração em um Git privado, os dois abrem o mesmo repositório e podem usar uma branch por tarefa para revisar as mudanças antes de reunir o código na branch principal.

A URL do Atlas é publicada a partir do repositório vinculado ao Site. Se a equipe editar em outro repositório, aplique a revisão combinada no repositório do Site antes de publicar. As configurações da conta e os resultados dos jogadores ficam na hospedagem.
