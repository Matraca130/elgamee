const ink = '#352230';
const neutra = { x: 0, y: 0, giro: 0, sx: 1, sy: 1, curva: 0, olhos: 0 };
const q = (tempo, ajustes = {}) => ({ ...neutra, ...ajustes, tempo });
const idle = q(0);
const clipes = {
  idle: { duracao: 1.4, loop: true, quadros: [idle, q(.55, { y: -1, curva: .19 }), q(.88, { olhos: .94 }), q(1.02), q(1.4)] },
  move: { duracao: .5, loop: true, quadros: [
    q(0, { giro: .1, curva: -.7 }), q(.23, { y: -2, sx: 1.06, sy: .94, curva: .73 }), q(.5, { giro: .1, curva: -.7 })
  ] },
  dash: { duracao: .24, quadros: [idle, q(.08, { x: 5, giro: .14, sx: 1.3, sy: .73, curva: -.9 }), q(.24)] },
  hurt: { duracao: .28, quadros: [idle, q(.073, { x: -4, giro: -.21, sx: .83, sy: 1.13, olhos: .94 }), q(.28)] },
  shoot: { duracao: .36, quadros: [
    idle, q(.105, { x: -6, sx: .84, sy: 1.16, curva: -.8, olhos: .28 }),
    q(.15, { x: 6, sx: 1.24, sy: .79, giro: .12, curva: 1 }), q(.36)
  ], eventos: [{ nome: 'disparo', tempo: .15 }] }
};

function preencher(ctx, cor, linha = ink, grossura = 2.5) {
  ctx.fillStyle = cor;
  ctx.fill();
  if (linha) {
    ctx.strokeStyle = linha;
    ctx.lineWidth = grossura;
    ctx.stroke();
  }
}

function oval(ctx, x, y, rx, ry, cor, linha, grossura, giro = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, giro, 0, Math.PI * 2);
  preencher(ctx, cor, linha, grossura);
}

function olhos(ctx, x, y, piscar) {
  for (const dx of [-4.5, 4.5]) {
    const h = 4.8 * (1 - piscar * .82);
    oval(ctx, x + dx, y, 3.7, h, '#fff5c7', ink, 1.3);
    if (h > 2) oval(ctx, x + dx + 1, y + .5, 1.3, h * .57, ink, null);
  }
}

function desenharOvo(ctx, pose, madura) {
  const cor = ctx.createLinearGradient(-16, -19, 11, 20);
  cor.addColorStop(0, madura ? '#f4d88e' : '#ffe1a0');
  cor.addColorStop(.52, '#d78f57');
  cor.addColorStop(1, '#844b43');
  oval(ctx, 0, 0, 20, 25, cor, ink, 3, .16);
  oval(ctx, -5, -5, 13.2, 15.3, '#ffe29d76', '#ffebad', 1.25, .18);
  for (const [x, y] of [[-12,-15],[12,-12],[16,2],[9,16],[-9,15],[-15,7]]) {
    oval(ctx, x, y, 1.6, 2.2, '#834b44a5', null);
  }
  if (madura) {
    ctx.beginPath();
    ctx.moveTo(8, 7);
    ctx.bezierCurveTo(11, 21, -14, 15, -10, 2);
    ctx.bezierCurveTo(-8, -9, 4, -7, 5, 1 + pose.curva);
    ctx.strokeStyle = '#7a4449';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = '#f8c288';
    ctx.stroke();
  }
  olhos(ctx, 3, -4, pose.olhos);
}

function desenharLarva(ctx, pose) {
  ctx.beginPath();
  ctx.moveTo(-34, 15 + pose.curva * 7);
  ctx.bezierCurveTo(-18, 21, -16, 2 + pose.curva * 4, -7, 0);
  ctx.bezierCurveTo(3, -2, 5, 9, 12, 4);
  ctx.bezierCurveTo(16, 1, 12, -8, 21, -13);
  ctx.bezierCurveTo(30, -17, 39, -8, 33, 1);
  ctx.bezierCurveTo(28, 9, 27, 15, 17, 18);
  ctx.bezierCurveTo(4, 23, 0, 12, -9, 14);
  ctx.bezierCurveTo(-17, 16, -27, 25, -34, 15 + pose.curva * 7);
  ctx.closePath();
  const cor = ctx.createLinearGradient(6, -16, 7, 23);
  cor.addColorStop(0, '#ffdea3');
  cor.addColorStop(.55, '#e8a87a');
  cor.addColorStop(1, '#a95a62');
  preencher(ctx, cor);
  ctx.beginPath();
  ctx.moveTo(-21, 15);
  ctx.bezierCurveTo(-12, 7, -5, 3, 7, 10);
  ctx.strokeStyle = '#ffdcaac8';
  ctx.lineWidth = 2;
  ctx.stroke();
  olhos(ctx, 23, -6, pose.olhos);
}

function adornar(ctx, adaptacao, larva) {
  if (!adaptacao) return;
  ctx.save();
  ctx.translate(larva ? 3 : -3, larva ? 10 : 13);
  if (adaptacao === 'folha') {
    oval(ctx, -5, 1, 9, 4.6, '#94bd65', '#365a42', 2, .46);
    oval(ctx, 3, 1, 4.5, 9, '#b4cf76', '#365a42', 2, .79);
  } else {
    oval(ctx, 0, 0, larva ? 13 : 16, 3.5, '#f5b553', '#8b573c', 1.8, -.12);
  }
  ctx.restore();
}

export const modeloToxocara = {
  neutra, clipes, pontos: { disparo: [18, -2] },
  desenharCamadas(ctx, pose, { fase, adaptacao }) {
    const larva = fase === 2;
    if (larva) desenharLarva(ctx, pose);
    else desenharOvo(ctx, pose, fase === 1);
    adornar(ctx, adaptacao, larva);
  }
};

export function desenharCompanheiro(ctx, nome, x, y) {
  if (nome === 'farejo') {
    oval(ctx, x - 8, y, 4.6, 7.5, '#935847', ink, 1.6, .45);
    oval(ctx, x + 8, y, 4.6, 7.5, '#935847', ink, 1.6, -.45);
    oval(ctx, x, y, 8.8, 7.5, '#f3bc78', ink, 1.8);
    oval(ctx, x + 1, y + 3, 4.2, 2.4, '#ffead1', ink, 1.15);
    oval(ctx, x + 1.5, y + 2, 1.9, 1.3, ink, null);
  } else {
    oval(ctx, x - 4.6, y - 3, 3.9, 7.5, '#a6d17c', ink, 1.6, -.66);
    oval(ctx, x + 4.2, y - 5, 3.9, 8.2, '#bae592', ink, 1.6, .63);
    oval(ctx, x, y + 2.6, 5, 5.7, '#73a861', ink, 1.7);
  }
}
