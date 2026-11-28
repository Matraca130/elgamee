import { desenharAdaptacao } from './arte-toxocara.js?v=oocisto-animacao';

export const oocistoAtlas = new Image();
oocistoAtlas.src = new URL('./oocisto-personagem.webp', import.meta.url).href;

const neutra = { x: 0, y: 0, giro: 0, sx: 1, sy: 1, guarda: 0, luz: 0, piscar: 0 };
const quadroPose = (tempo, pose = {}) => ({ ...neutra, ...pose, tempo });
const repouso = quadroPose(0);
const detalhesFormas = [
  { olho: [12.5, -4.1], casca: '#45685a' },
  { olho: [15.2, -8.3], casca: '#6a7449' },
  { olho: [13.8, -7.4], casca: '#6d7146' }
];
const soltura = .18;
export const poseSolturaOocisto = quadroPose(soltura, { x: 4.6, y: -1.35, giro: .125, sx: 1.14, sy: .87, guarda: 1, luz: .68 });
export const duracaoMutacao = .64;

function quadro(ctx, index, x, y, size) {
  if (!oocistoAtlas.complete || !oocistoAtlas.naturalWidth) return false;
  const tile = oocistoAtlas.naturalWidth / 2;
  ctx.drawImage(oocistoAtlas, index % 2 * tile, Math.floor(index / 2) * tile,
    tile, tile, x - size / 2, y - size / 2, size, size);
  return true;
}

function elipse(ctx, x, y, rx, ry, cor, giro = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, giro, 0, Math.PI * 2);
  ctx.fillStyle = cor;
  ctx.fill();
}

function corpo(ctx, pose, nivel) {
  const { olho: [x, y], casca } = detalhesFormas[nivel];
  if (!quadro(ctx, nivel, 0, 0, 59)) {
    elipse(ctx, 0, 0, 24, 27, '#352d30', .55);
    elipse(ctx, 0, 0, 20.5, 24, nivel ? '#b78b42' : casca, .55);
    elipse(ctx, x, y, 4.8, 2.8, '#ffe586', .25);
  }
  if (pose.piscar > .15) {
    elipse(ctx, x, y + 1, 4.7, pose.piscar * 2.8, casca, .24);
  }
}

function crescente(ctx, pose) {
  ctx.save();
  const { guarda } = pose;
  ctx.translate(24 + guarda * (guarda < 0 ? 8 : 4), -1 - 3 * Math.max(0, guarda));
  ctx.rotate(-.22 + guarda * .46);
  if (pose.luz > 0) {
    elipse(ctx, 0, 0, 14, 12, 'rgba(255,214,118,' + pose.luz * .35 + ')');
  }
  lamina(ctx, 23);
  ctx.restore();
}

function lamina(ctx, tamanho) {
  if (quadro(ctx, 3, 0, 0, tamanho)) return;
  const r = tamanho * .44;
  ctx.beginPath();
  ctx.moveTo(-r * .7, -r);
  ctx.quadraticCurveTo(r * 2.6, -r * .25, -r * .7, r);
  ctx.quadraticCurveTo(r * .9, 0, -r * .7, -r);
  ctx.fillStyle = '#f5ba50';
  ctx.fill();
}

export const modeloOocisto = {
  neutra,
  pontos: { disparo: [28, -4] },
  clipes: {
    idle: { duracao: 1.85, loop: true, quadros: [
      repouso, quadroPose(.59, { y: -.9, sx: .99, sy: 1.025, guarda: -.16 }),
      quadroPose(1.26, { y: .5, sx: 1.018, sy: .986 }),
      quadroPose(1.37, { piscar: 1 }), quadroPose(1.46), quadroPose(1.85)
    ] },
    move: { duracao: .46, loop: true, quadros: [
      quadroPose(0, { y: 1.5, giro: .12, sx: 1.07, sy: .94, guarda: -.27 }),
      quadroPose(.13, { x: 1, y: -2, giro: .15, sy: 1.035, guarda: -.4 }),
      quadroPose(.28, { x: 1.6, y: -.8, giro: .035, sx: .985, sy: 1.035, guarda: .24 }),
      quadroPose(.46, { y: 1.5, giro: .12, sx: 1.07, sy: .94, guarda: -.27 })
    ] },
    dash: { duracao: .24, quadros: [
      quadroPose(0, { x: -2.7, y: 2.7, giro: -.12, sx: .94, sy: .91, guarda: -.42 }),
      quadroPose(.055, { x: 3.7, y: -1, giro: .31, sx: 1.27, sy: .77, guarda: -.67 }),
      quadroPose(.145, { x: 3.1, y: 1, giro: .24, sx: 1.19, sy: .82, guarda: .25 }),
      quadroPose(.24)
    ] },
    shoot: { duracao: .37, quadros: [
      repouso,
      quadroPose(.098, { x: -4, y: 1.9, giro: -.2, sx: .9, sy: 1.085, guarda: -.87, luz: .36 }),
      quadroPose(.148, { x: -5, y: .5, giro: -.21, sx: .89, sy: 1.105, guarda: -.96, luz: 1 }),
      poseSolturaOocisto,
      quadroPose(.224, { x: -2.8, y: 1, giro: -.076, sx: .95, sy: 1.045, guarda: -.24 }),
      quadroPose(.37)
    ], eventos: [{ nome: 'disparo', tempo: soltura }] },
    hurt: { duracao: .26, quadros: [
      quadroPose(0, { x: -2, y: 1.4, giro: -.12, guarda: -.22, piscar: .86 }),
      quadroPose(.051, { x: -5.1, y: 2, giro: -.28, sx: .89, sy: 1.1, guarda: -.82, piscar: 1 }),
      quadroPose(.16, { x: 1.5, giro: .075, sx: 1.04, sy: .96, guarda: .24, piscar: .27 }),
      quadroPose(.26)
    ] }
  },
  desenharCamadas(ctx, pose, { nivelMorfologia = 0, adaptacao, mudanca, flash = 0, crescente: equipado, encaixe = 0 }) {
    if (mudanca) {
      corpo(ctx, pose, mudanca.de);
      ctx.save();
      ctx.globalAlpha *= mudanca.t;
      corpo(ctx, pose, nivelMorfologia);
      ctx.restore();
    } else {
      corpo(ctx, pose, nivelMorfologia);
    }
    desenharAdaptacao(ctx, adaptacao);
    if (pose.luz > 0 && !equipado) {
      elipse(ctx, 22, -4, 5 + pose.luz * 2, 3 + pose.luz * 1.5, 'rgba(218,255,217,' + pose.luz * .6 + ')');
    }
    if (equipado) crescente(ctx, { ...pose, luz: Math.max(encaixe, pose.luz) });
    if (flash > 0) {
      elipse(ctx, -6, -13, 13, 2.4, 'rgba(255,218,185,' + flash * .6 + ')', -.68);
    }
  }
};

export function desenharMudaOocisto(ctx, x, y, t) {
  const tamanho = 16 + t * 20;
  ctx.save();
  ctx.globalAlpha *= Math.sin(t * Math.PI) * .84;
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = '#ffdc8b';
  ctx.beginPath();
  ctx.ellipse(x, y, tamanho * .81, tamanho, .48, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const a = i * 1.37 + .4 + t * .6;
    elipse(ctx, x + Math.cos(a) * tamanho, y + Math.sin(a) * tamanho, 2.5, 1.7, '#fff2b5', a);
  }
  ctx.restore();
}

export function desenharTrilhaOocisto(ctx, x, y, fx, fy) {
  ctx.save();
  ctx.translate(x, y + 6);
  ctx.rotate(Math.atan2(fy, fx));
  elipse(ctx, -24, -6, 24, 2.6, 'rgba(205,245,228,.36)');
  elipse(ctx, -31, 6, 20, 1.4, 'rgba(242,208,137,.64)');
  ctx.restore();
}

export function desenharDisparoOocisto(ctx, tiro, reduzir) {
  const { x, y, dx, dy, dourado } = tiro;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.atan2(dy, dx));
  if (!reduzir) {
    const comprimento = Math.min(dourado ? 21 : 14, tiro.percorrido);
    elipse(ctx, -comprimento / 2, 0, 4 + comprimento / 2, 2.9, dourado ? '#f9bf5770' : '#b8f4ca70');
  }
  if (dourado) {
    lamina(ctx, 23);
  } else {
    elipse(ctx, 0, 0, 7, 4.2, '#294755');
    elipse(ctx, .8, -.4, 5.4, 2.8, '#9fe7b6');
    elipse(ctx, 1.5, -1.2, 2.5, .9, '#efffd5');
  }
  ctx.restore();
}

export function desenharImpactoOocisto(ctx, { x, y, dx, dy, dourado }, t, reduzir) {
  const raio = (dourado ? 9 : 7) + (reduzir ? 0 : t * 14);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.atan2(dy, dx));
  ctx.lineWidth = 2;
  ctx.strokeStyle = dourado ? '#ffcf71' : '#c4f7ca';
  ctx.beginPath();
  ctx.ellipse(0, 0, raio * .48, raio, 0, 0, Math.PI * 2);
  ctx.stroke();
  elipse(ctx, 0, 0, 5.3 * (1 - t), 3.4 * (1 - t), '#fff4cb');
  if (!reduzir) {
    for (const lado of [-1, 1]) {
      elipse(ctx, -raio * .5, lado * raio * .73, 3, 1.4, ctx.strokeStyle, lado * .54);
      elipse(ctx, raio * .63, lado * raio * .44, 1.8, 1.2, '#fff1b7');
    }
  }
  ctx.restore();
}
