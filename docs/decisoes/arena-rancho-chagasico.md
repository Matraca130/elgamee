# Usar poses articuladas na arena de Chagasico

**Aceita · 27 de novembro de 2026**

## Contexto

O rancho ao entardecer segue a prancha arcade T5–T8. O chão laranja é aberto e as duas casas de adobe ficam nas bordas. A proposta original inclui uma senhora com chinelo, iscas vermelhas e uma pergunta sobre a moradia. [Proposta das rotas](https://github.com/Matraca130/elgamee/pull/7)

## Decisão

- Abrir a arena pelo botão Chagasico em Meus cursos. O personagem pode andar, atacar e usar o dash com teclado ou toque.
- Reusar o método definido para Influenza e Toxocara. O desenho é formado por peças 2D articuladas no Blender, exportadas em poses transparentes. O jogador usa repouso, deslocamento, esquiva, ataque e reação ao dano. A senhora tem repouso, preparação, soltura e recuperação. Cada armadilha tem repouso, compressão e golpe.
- Usar o quadro marcado de soltura para disparar o projétil. A senhora mira no chão durante a preparação e o chinelo percorre um arco ao sair da mão. A armadilha mostra o alcance antes do impacto. Um ataque do jogador pode interromper a armadilha.
- Recuperar vida e oferecer uma evolução na primeira visita a cada casa. As opções de Refúgio em frestas e Atividade noturna recebem peso maior no sorteio. O acerto da pergunta inicial e a escolha das duas opções preparam o bônus noturno. Visitar as duas casas abre a saída. [Transmissão e hábitos da vinchuca](https://www.argentina.gob.ar/salud/chagas/chagas-y-la-vinchuca)

## Editar o rig

O [arquivo Blender](../../art/rancho/rancho-animacoes.blend) contém a senhora, a armadilha, o personagem e o chinelo em voo. Os marcadores da linha do tempo indicam a soltura e o impacto. O [script do rig](../../art/rancho/montar-rig.py) gera o arquivo Blender, a folha de poses e o manifesto usado pela arena.

```sh
blender -b -t 4 -P art/rancho/montar-rig.py -- /tmp/rancho-poses.png
magick /tmp/rancho-poses.png -strip -define webp:lossless=true dist/rancho-poses.webp
npm run build
```

O [modelo da partida](../../dist/rancho-modelo.js) usa o manifesto para marcar a soltura e o golpe. A [página da arena](../../dist/rancho-chagasico.html) usa a folha de poses para desenhar os personagens sobre o cenário.
