const tinta = '#18313b';
const neutra = {
  x: 0, y: 0, giro: 0, sx: 1, sy: 1,
  hastes: 0, nadadeiras: 0, olhos: 0, foco: .15, boca: 0, pulso: 0
};

const quadro = (tempo, mudancas = {}) => ({ ...neutra, ...mudancas, tempo });
const clipe = (duracao, loop, quadros, eventos) => ({ duracao, loop, quadros, eventos });

const clipes = {
  idle: clipe(1.9, true, [
    quadro(0), quadro(.61, { y: -4, giro: -.025, sy: 1.025, hastes: -.08, nadadeiras: -.11 }),
    quadro(1.11, { y: -1, hastes: .05 }), quadro(1.17, { y: 0, olhos: 1 }),
    quadro(1.24, { y: 1, olhos: 0 }), quadro(1.55, { y: 2.5, sx: 1.018, sy: .976, nadadeiras: .09 }),
    quadro(1.9)
  ]),
  move: clipe(.52, true, [
    quadro(0, { x: 1, y: -2, giro: .075, foco: .35, hastes: -.12, nadadeiras: -.14 }),
    quadro(.13, { x: 3, y: -6, giro: .12, sy: 1.06, foco: .35, hastes: -.24, nadadeiras: .20 }),
    quadro(.34, { x: 2, y: 2, giro: .048, sx: 1.03, sy: .94, foco: .35, hastes: .08, nadadeiras: -.34 }),
    quadro(.52, { x: 1, y: -2, giro: .075, foco: .35, hastes: -.12, nadadeiras: -.14 })
  ]),
  dash: clipe(.36, false, [
    quadro(0, { foco: .5 }),
    quadro(.08, { x: -6, y: 6, giro: -.13, sx: .82, sy: 1.04, foco: .82, hastes: .24, nadadeiras: -.35 }),
    quadro(.145, { x: 8, y: 5, giro: .12, sx: 1.37, sy: .65, foco: .9, olhos: .27, hastes: -.52, nadadeiras: .39 }),
    quadro(.23, { x: 6, y: 3, giro: .16, sx: 1.23, sy: .76, foco: .8, hastes: -.39, nadadeiras: .25 }),
    quadro(.305, { y: -3, giro: -.05, sx: .94, sy: 1.07, hastes: .14, nadadeiras: -.17 }),
    quadro(.36)
  ]),
  shoot: clipe(.49, false, [
    quadro(0),
    quadro(.122, { x: -10, y: -2, giro: -.16, sx: .85, sy: 1.105, foco: .97, hastes: .24, nadadeiras: -.22, pulso: .8 }),
    quadro(.173, { x: 8, y: -1, giro: .155, sx: 1.15, sy: .92, foco: 1, hastes: -.38, nadadeiras: .32, boca: 1, pulso: 1 }),
    quadro(.236, { x: -7, y: -2, giro: -.1, sx: .89, sy: 1.06, foco: .8, hastes: .26, nadadeiras: -.14, boca: .56 }),
    quadro(.36, { x: 2, giro: .04, sx: 1.03, sy: .97, foco: .38, hastes: -.11, nadadeiras: .13 }),
    quadro(.49)
  ], [{ nome: 'disparo', tempo: .173 }]),
  hurt: clipe(.34, false, [
    quadro(0),
    quadro(.069, { x: -9, y: -7, giro: -.23, sx: 1.13, sy: .82, olhos: .94, foco: .87, boca: .75, hastes: -.36, nadadeiras: .36, pulso: .55 }),
    quadro(.143, { x: -4, y: -1, giro: .14, sx: .91, sy: 1.12, olhos: .65, foco: .46, boca: .44, hastes: .24 }),
    quadro(.24, { x: 1, y: 1, giro: -.06, foco: .25, hastes: -.12, nadadeiras: .11 }),
    quadro(.34)
  ])
};

function pintar(ctx, preenchimento, contorno, largura = 2.5) {
  ctx.fillStyle = preenchimento;
  ctx.fill();
  if (contorno) {
    ctx.strokeStyle = contorno;
    ctx.lineWidth = largura;
    ctx.stroke();
  }
}

function elipse(ctx, x, y, rx, ry, preenchimento, contorno, largura, angulo = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, angulo, 0, Math.PI * 2);
  pintar(ctx, preenchimento, contorno, largura);
}

function nadadeira(ctx, x, y, escala, angulo) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angulo);
  ctx.scale(escala, Math.abs(escala));
  const cor = ctx.createLinearGradient(4, -11, -13, 22);
  cor.addColorStop(0, '#9ee2b1');
  cor.addColorStop(.42, '#49aa9b');
  cor.addColorStop(1, '#205e6b');
  ctx.beginPath();
  ctx.moveTo(11, -4);
  ctx.quadraticCurveTo(-12, -17, -34, -6);
  ctx.lineTo(-25, 1);
  ctx.lineTo(-32, 14);
  ctx.lineTo(-21, 12);
  ctx.lineTo(-17, 22);
  ctx.quadraticCurveTo(-6, 14, 13, 8);
  ctx.closePath();
  pintar(ctx, cor, tinta, 3.4);
  ctx.beginPath();
  ctx.moveTo(-22, 9);
  ctx.lineTo(-5, 4);
  ctx.lineTo(-19, -4);
  ctx.strokeStyle = '#96dbc2';
  ctx.lineWidth = 1.9;
  ctx.stroke();
  ctx.restore();
}

function haste(ctx, x, y, angulo, altura, curva, ativa) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angulo + curva *.32);
  const ponta = curva * 9;
  const cor = ctx.createLinearGradient(-6, 0, 6, -altura);
  cor.addColorStop(0, ativa ? '#a75c30' : '#2f766f');
  cor.addColorStop(.6, ativa ? '#e6a34c' : '#64afa1');
  cor.addColorStop(1, ativa ? '#ffd67e' : '#a2dbc0');
  ctx.beginPath();
  ctx.moveTo(-3.8, 5);
  ctx.quadraticCurveTo(-5, -altura*.47, ponta - 2.6, -altura + 1);
  ctx.lineTo(ponta + 3.7, -altura + 1);
  ctx.quadraticCurveTo(2.8, -altura*.45, 4.5, 5);
  ctx.closePath();
  pintar(ctx, cor, tinta, 3.1);
  ctx.translate(ponta, -altura);
  ctx.rotate(curva*.56);
  ctx.beginPath();
  ctx.moveTo(-5, 3);
  ctx.quadraticCurveTo(-12, 1, -14, -5);
  ctx.quadraticCurveTo(-13, -12, -1, -13);
  ctx.quadraticCurveTo(11, -13, 14, -7);
  ctx.quadraticCurveTo(13, 0, 5, 3);
  ctx.closePath();
  pintar(ctx, ativa ? '#eb9c46' : '#73bfa3', tinta, 3.1);
  elipse(ctx, -1.5, -6.4, 10.1, 3.7, ativa ? '#ffd475' : '#b9e8cd', null, 0, -.08);
  ctx.restore();
}

function rosto(ctx, { olhos, boca, foco }, temper = 1) {
  const expressao = Math.max(0, Math.min(1, foco + (temper - 1) * .28));
  for (const [x, y, rx, ry, lado] of [[-3, -8, 11.8, 10.8, 1], [23, -9, 8.8, 10.2, -1]]) {
    const abertura = ry * (1 - olhos * .91);
    const inclina = (3.8 + expressao * 5) * lado;
    ctx.beginPath();
    ctx.moveTo(x - rx, y - abertura * .62 - inclina);
    ctx.lineTo(x + rx, y - abertura * .62 + inclina);
    ctx.quadraticCurveTo(x + rx * .62, y + abertura * 1.43, x, y + abertura);
    ctx.quadraticCurveTo(x - rx * .70, y + abertura, x - rx, y - abertura * .62 - inclina);
    ctx.closePath();
    pintar(ctx, '#fff3d5', tinta, 2.8);
    if (olhos < .62) {
      ctx.save();
      ctx.clip();
      elipse(ctx, x + rx * .32, y + .5, rx * .38, abertura * .78, tinta);
      elipse(ctx, x + rx * .28, y - abertura * .25, 1.6, 1.6, '#fffbee');
      ctx.restore();
    }
    ctx.beginPath();
    ctx.moveTo(x - rx - 2, y - abertura * .62 - inclina - 2);
    ctx.lineTo(x + rx + 1, y - abertura * .62 + inclina);
    ctx.strokeStyle = tinta;
    ctx.lineWidth = 5.4;
    ctx.stroke();
  }

  if (boca > .13) {
    elipse(ctx, 28, 11.5, 3.4 + boca * 5.5, 1.4 + boca * 7, tinta, '#38615e', 1.6, -.17);
    elipse(ctx, 28.5, 14, 1.6 + boca * 2.5, 1.4, '#df9469');
  } else {
    ctx.beginPath();
    ctx.moveTo(19, 11);
    ctx.quadraticCurveTo(25, 17 - foco * 10.5, 32, 9.5 + foco * 3);
    ctx.strokeStyle = tinta;
    ctx.lineWidth = 2.9;
    ctx.stroke();
  }
}

function nucleo(ctx, pulso, aparencia) {
  const { segmented, genome, core } = aparencia ?? {};
  elipse(ctx, -12, 23, 22, 13.5, '#1b4c64', segmented?.accent ?? '#59979c', core ? 3.8 : 1.6, -.19);
  const cor = pulso > .5 ? '#fff5bc' : segmented?.color ?? genome?.color ?? '#a5d9ff';
  ctx.lineWidth = 2.5 + pulso * .6;
  ctx.strokeStyle = cor;
  if (genome && !segmented) {
    for (let i = 0; i < genome.strands; i++) {
      const y = 22 + (i * 2 - genome.strands + 1) * 2.5;
      ctx.beginPath();
      ctx.moveTo(-25, y + 3);
      ctx.bezierCurveTo(-19, y - 4, -15, y + 4, -9, y - 2);
      ctx.stroke();
    }
    if (genome.polarity) {
      ctx.font = 'bold 13px system-ui';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = cor;
      ctx.fillText(genome.polarity, -6, 23);
    }
    return;
  }
  for (let i = 0; i < (segmented?.segments ?? 8); i++) {
    const x = -23 + (i % 4) * 7;
    const y = 20 + Math.floor(i / 4) * 6.8 - i%2*1.5;
    ctx.beginPath();
    ctx.moveTo(x - 1, y + 1.5);
    ctx.quadraticCurveTo(x - 1.7, y - 1.6, x + 1.2, y - 1.75);
    ctx.stroke();
  }
}

const hastes = [
  [-20, -24, -.49, 29], [4, -33, .015, 37], [26, -29, .52, 29],
  [-38, -13, -.94, 19], [39, -19, .92, 17]
];

export function poseInfluenza(pose, corpo) {
  if (corpo === 'filament') return { ...pose, sx: pose.sx * .72, sy: pose.sy * 1.14 };
  return pose;
}

function membranaFacetada(ctx) {
  ctx.beginPath();
  ctx.moveTo(-42, -9);
  ctx.lineTo(-20, -23);
  ctx.lineTo(4, -37);
  ctx.lineTo(28, -36);
  ctx.lineTo(45, -22);
  ctx.lineTo(51, 3);
  ctx.lineTo(39, 27);
  ctx.lineTo(12, 39);
  ctx.lineTo(-18, 36);
  ctx.lineTo(-44, 18);
  ctx.closePath();
}

function traco(ctx, cor, largura) {
  ctx.lineWidth = largura + 2.8;
  ctx.strokeStyle = tinta;
  ctx.stroke();
  ctx.lineWidth = largura;
  ctx.strokeStyle = cor;
  ctx.stroke();
}

function fibras(ctx, tipo, movimento) {
  const alcance = tipo === 'long' ? 13 : 6;
  const pontos = [[-43, 6],[-34, -13],[-25, -20],[-7, -30],[27, -37],[40, -24],[49, -8],[44, 23],[-29, 25]];
  for (const [i, [x, y]] of pontos.entries()) {
    const comprimento = Math.hypot(x, y);
    const dx = x / comprimento * alcance, dy = y / comprimento * alcance;
    ctx.beginPath();
    ctx.moveTo(x * .92, y * .92);
    ctx.quadraticCurveTo(x + dx * .58 + movimento * 5, y + dy * .55, x + dx, y + dy + i%2*2);
    traco(ctx, '#bfecdd', 2.2);
  }
}

function ramos(ctx, na, movimento, fused) {
  const pontos = [[-36, 11, -1.77], [42, 9, 1.63], [20, 32, 2.71], [-24, 26, -2.49]];
  for (const [x, y, angulo] of pontos.slice(0, na + 1)) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angulo + movimento * .4);
    ctx.beginPath();
    ctx.moveTo(0, 9);
    ctx.quadraticCurveTo(-3, -3, 0, -13);
    ctx.quadraticCurveTo(2, -18, 8, -21);
    ctx.moveTo(0, -13);
    ctx.quadraticCurveTo(-2, -20, -7, -21);
    traco(ctx, fused ? '#e4b4fa' : '#91f2dd', 3.9);
    ctx.restore();
  }
}

function espiral(ctx, movimento, acesa) {
  ctx.beginPath();
  ctx.moveTo(28, -31);
  ctx.bezierCurveTo(32, -47, 33 + movimento * 6, -66, 46, -65);
  ctx.bezierCurveTo(62, -64, 55, -47, 46, -51);
  ctx.quadraticCurveTo(40, -55, 48, -58);
  traco(ctx, acesa ? '#ffe4a3' : '#f1958c', 4.2);
}

export async function carregarInfluenza(fonte = new URL('./influenza-membrana.webp', import.meta.url)) {
  const membrana = new Image();
  membrana.src = fonte;
  await membrana.decode();
  const ressonante = document.createElement('canvas');
  ressonante.width = membrana.naturalWidth;
  ressonante.height = membrana.naturalHeight;
  const cor = ressonante.getContext('2d');
  cor.drawImage(membrana, 0, 0);
  cor.globalCompositeOperation = 'source-atop';
  cor.fillStyle = 'rgba(121,63,172,.66)';
  cor.fillRect(0, 0, ressonante.width, ressonante.height);

  return {
    neutra,
    clipes,
    pontos: { disparo: [45, 10] },
    desenharCamadas(ctx, pose, aparencia) {
      const { morph, ha = 0, na, fused, antenna, antennaLit, defense, magnet, reserve, variation, flash } = aparencia ?? {};
      if (fused) elipse(ctx, 0, 0, 65, 52, '#9863af45', '#dbb2f8a0', 2.8);
      nadadeira(ctx, -37, 6, 1, pose.nadadeiras);
      nadadeira(ctx, 41, 8, -.62, -pose.nadadeiras * .80 - .14);
      if (morph?.surface && morph.surface !== 'float') fibras(ctx, morph.surface, pose.hastes);
      if (na) ramos(ctx, na, pose.hastes, fused);
      if (antenna) espiral(ctx, pose.hastes, antennaLit);
      for (const [x, y, angulo, altura] of hastes.slice(0, 2 + Math.max(1, ha))) {
        haste(ctx, x, y, angulo, altura + ha * 2, pose.hastes * (1 + x/120), !aparencia || ha > 0);
      }
      const facetada = morph?.body === 'facets';
      if (facetada) {
        ctx.save();
        membranaFacetada(ctx);
        ctx.clip();
      }
      ctx.drawImage(fused ? ressonante : membrana, -54, -44, 108, 88);
      if (facetada) {
        ctx.restore();
        membranaFacetada(ctx);
        ctx.strokeStyle = tinta;
        ctx.lineWidth = 4.2;
        ctx.stroke();
      }
      if (defense || flash) {
        if (facetada) membranaFacetada(ctx);
        else {
          ctx.beginPath();
          ctx.ellipse(0, 0, 54, 43, -.15, 0, Math.PI * 2);
        }
        ctx.strokeStyle = flash ? '#ffe0ac' : '#a5e1d9';
        ctx.lineWidth = flash ? 3.1 : 2.6;
        ctx.stroke();
      }
      nucleo(ctx, pose.pulso, aparencia);
      rosto(ctx, pose, aparencia?.temper);
      if (magnet) elipse(ctx, -35, 13, 5.2, 5.2, '#ffda94', tinta);
      if (reserve) elipse(ctx, 33, 19, 5.4, 4.2, '#ffadc8', tinta);
      if (variation?.attackOffset) elipse(ctx, -19, -21, 7.4, 3.6, variation.color, tinta);
      if (variation?.cooldownFactor) elipse(ctx, 0, 39, 21, 3.6, variation.color, tinta);
    }
  };
}
