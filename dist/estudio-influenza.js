import { carregarInfluenza } from './influenza-2d.js';
import { Personagem2D } from './personagem-2d.js';

const canvas = document.querySelector('#arena');
const ctx = canvas.getContext('2d');
const aviso = document.querySelector('#carregamento');
const acao = document.querySelector('#acao');
const controle = document.querySelector('#direcional');
const manete = document.querySelector('#manete');
const atirar = document.querySelector('#atirar');
const esquivar = document.querySelector('#esquivar');
const impacto = document.querySelector('#impacto');
const botoesEscala = [...document.querySelectorAll('[data-escala]')];
const fundo = document.createElement('canvas');
const reduzir = matchMedia('(prefers-reduced-motion: reduce)');
const apontador = matchMedia('(hover: hover)');

const rotulos = {
  idle: 'Flutuando', move: 'Deslocando', shoot: 'Disparando',
  dash: 'Esquivando', hurt: 'Reagindo ao impacto'
};
const teclas = new Set();
const movimento = new Map([
  ['ArrowLeft', [-1, 0]], ['KeyA', [-1, 0]], ['ArrowRight', [1, 0]], ['KeyD', [1, 0]],
  ['ArrowUp', [0, -1]], ['KeyW', [0, -1]], ['ArrowDown', [0, 1]], ['KeyS', [0, 1]]
]);
const heroi = { x: 0, y: 0, lado: 1 };
const toque = { id: null, x: 0, y: 0 };
const projeteis = [];
const rastros = [];
let personagem;
let largura = 0;
let altura = 0;
let ampliado = true;
let mira = null;
let toqueMira = null;
let pulso = null;
let direcaoDisparo = [1, 0];
let direcaoEsquiva = [1, 0];
let rastroEm = 0;

const limitar = (valor, min, max) => Math.max(min, Math.min(max, valor));
function vetor(x, y) {
  const modulo = Math.max(1, Math.hypot(x, y));
  return [x / modulo, y / modulo];
}

function escala() {
  return ampliado ? Math.min(1.55, largura / 195, altura / 165) : .48;
}

function posicao() {
  return { ...heroi, escala: escala() };
}

function limitarHeroi() {
  const tamanho = escala();
  const margemX = Math.min(largura / 2, tamanho * 76);
  const margemY = Math.min(altura / 2, tamanho * 75);
  heroi.x = limitar(heroi.x, margemX, largura - margemX);
  heroi.y = limitar(heroi.y, margemY, altura - margemY * .66);
}

function redimensionar() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const dpr = Math.min(2, devicePixelRatio || 1);
  heroi.x = largura ? heroi.x / largura * w : w * .5;
  heroi.y = altura ? heroi.y / altura * h : h * .52;
  largura = w;
  altura = h;
  canvas.width = fundo.width = Math.round(w * dpr);
  canvas.height = fundo.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const g = fundo.getContext('2d');
  g.scale(dpr, dpr);
  const campo = g.createRadialGradient(w * .49, h * .44, 20, w * .5, h * .49, Math.max(w, h) * .72);
  campo.addColorStop(0, '#f9edcb');
  campo.addColorStop(.58, '#e5e6c6');
  campo.addColorStop(1, '#acbe9f');
  g.fillStyle = campo;
  g.fillRect(0, 0, w, h);

  g.strokeStyle = '#6c9a8327';
  g.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) {
    const y = h * (.04 + i * .19);
    g.beginPath();
    g.moveTo(-18, y);
    g.bezierCurveTo(w * .20, y - 60, w * .22, y + 62, w * .44, y + 36);
    g.bezierCurveTo(w * .69, y + 7, w * .76, y - 76, w + 18, y - 42);
    g.stroke();
  }
  for (let i = 1; i < 57; i++) {
    const x = w * ((i * .618034) % 1);
    const y = h * ((i * .754878) % 1);
    elipse(g, x, y, 1.2 + i%5*.46, .8 + i%3*.37, i%3 ? '#50796324' : '#fffbdf91');
  }
  limitarHeroi();
}

function elipse(g, x, y, rx, ry, cor) {
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.fillStyle = cor;
  g.fill();
}

function direcaoMovimento() {
  let { x, y } = toque;
  for (const tecla of teclas) {
    const direcao = movimento.get(tecla);
    if (direcao) {
      x += direcao[0];
      y += direcao[1];
    }
  }
  return vetor(x, y);
}

function tocar(nome) {
  personagem.tocar(nome);
  acao.value = rotulos[nome];
}

function iniciarDisparo() {
  if (!personagem.clipe.loop) return;
  const dx = mira ? mira.x - heroi.x : heroi.lado;
  const dy = mira ? mira.y - heroi.y : 0;
  const modulo = Math.hypot(dx, dy);
  direcaoDisparo = modulo < .01 ? [heroi.lado, 0] : [dx / modulo, dy / modulo];
  if (Math.abs(direcaoDisparo[0]) > .08) heroi.lado = Math.sign(direcaoDisparo[0]);
  tocar('shoot');
}

function iniciarEsquiva() {
  if (personagem.acao === 'dash' || personagem.acao === 'hurt') return;
  const [dx, dy] = direcaoMovimento();
  const modulo = Math.hypot(dx, dy);
  direcaoEsquiva = modulo < .1 ? [heroi.lado, 0] : [dx / modulo, dy / modulo];
  if (Math.abs(dx) > .1) heroi.lado = Math.sign(dx);
  rastroEm = .08;
  tocar('dash');
}

function emitir(nome, pose) {
  if (nome !== 'disparo') return;
  const origem = personagem.ponto('disparo', posicao(), pose);
  const [dx, dy] = direcaoDisparo;
  projeteis.push({ ...origem, dx, dy, tempo: .82 });
  pulso = { ...origem, tempo: .13 };
}

function avancar(delta) {
  const [dx, dy] = direcaoMovimento();
  const andando = Math.hypot(dx, dy) > .064;
  const locomocao = andando ? 'move' : 'idle';
  if (personagem.clipe.loop) {
    if (andando && Math.abs(dx) > .08) heroi.lado = Math.sign(dx);
    if (personagem.acao !== locomocao) tocar(locomocao);
    if (teclas.has('Space') || toqueMira !== null) iniciarDisparo();
  }

  if (personagem.acao === 'dash') {
    const tempo = personagem.tempo;
    const percurso = t => 1 - (1 - limitar((t - .06) / .24, 0, 1)) ** 2.8;
    const distancia = 132 * (percurso(tempo + delta) - percurso(tempo));
    if (!reduzir.matches && tempo >= rastroEm && tempo < .255) {
      rastros.push({ local: posicao(), pose: personagem.pose(), tempo: .14 });
      rastroEm = tempo + .044;
    }
    heroi.x += direcaoEsquiva[0] * distancia;
    heroi.y += direcaoEsquiva[1] * distancia;
  } else if (andando && personagem.acao !== 'hurt') {
    const velocidade = personagem.acao === 'shoot' ? 94 : 166;
    heroi.x += dx * velocidade * delta;
    heroi.y += dy * velocidade * delta;
  }
  limitarHeroi();

  for (const carga of projeteis) {
    carga.x += carga.dx * 485 * delta;
    carga.y += carga.dy * 485 * delta;
    carga.tempo -= delta;
  }
  for (const rastro of rastros) rastro.tempo -= delta;
  if (pulso) pulso.tempo -= delta;
  while (projeteis[0]?.tempo <= 0) projeteis.shift();
  while (rastros[0]?.tempo <= 0) rastros.shift();
  if (personagem.avancar(delta, emitir)) tocar(locomocao);
}

function desenhar() {
  ctx.drawImage(fundo, 0, 0, largura, altura);
  const local = posicao();
  const s = local.escala;
  const pose = personagem.pose();
  const sombra = 1 + pose.y * .012;
  elipse(ctx, heroi.x, heroi.y + s*46, s*43*sombra, s*7.2*sombra, '#214a492c');
  elipse(ctx, heroi.x, heroi.y + s*46, s*30*sombra, s*4.2*sombra, '#203c3e24');

  for (const rastro of rastros) {
    ctx.globalAlpha = .31 * rastro.tempo / .14;
    personagem.desenhar(ctx, rastro.local, rastro.pose);
  }
  ctx.globalAlpha = 1;
  personagem.desenhar(ctx, local, pose);

  for (const { x, y, dx, dy } of projeteis) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(dy, dx));
    elipse(ctx, -4*s, 0, 14*s, 3.7*s, '#f9bb574f');
    elipse(ctx, 0, 0, 7*s, 4.2*s, '#765835');
    elipse(ctx, s, -.5*s, 5.3*s, 2.8*s, '#ffda7e');
    elipse(ctx, 2*s, -s, 2.9*s, 1.3*s, '#fff8c4');
    ctx.restore();
  }
  if (pulso?.tempo > 0 && !reduzir.matches) {
    const fator = pulso.tempo / .13;
    ctx.globalAlpha = fator;
    elipse(ctx, pulso.x, pulso.y, (16 - fator*5)*s, (12 - fator*4)*s, '#ffd477a8');
    elipse(ctx, pulso.x, pulso.y, 5*s, 3.5*s, '#fff6a8');
    ctx.globalAlpha = 1;
  }
  if (mira && (toqueMira !== null || apontador.matches)) {
    ctx.beginPath();
    ctx.arc(mira.x, mira.y, 7, 0, Math.PI * 2);
    ctx.moveTo(mira.x - 11, mira.y);
    ctx.lineTo(mira.x - 4, mira.y);
    ctx.moveTo(mira.x + 4, mira.y);
    ctx.lineTo(mira.x + 11, mira.y);
    ctx.strokeStyle = '#2457579e';
    ctx.lineWidth = 1.25;
    ctx.stroke();
  }
}

function apontar(evento) {
  const caixa = canvas.getBoundingClientRect();
  mira = { x: evento.clientX - caixa.left, y: evento.clientY - caixa.top };
}

function moverControle(evento) {
  const { left, top, width, height } = controle.getBoundingClientRect();
  const raio = width * .33;
  [toque.x, toque.y] = vetor((evento.clientX - left - width/2) / raio, (evento.clientY - top - height/2) / raio);
  manete.style.transform = 'translate(' + toque.x*raio + 'px, ' + toque.y*raio + 'px)';
}

function soltarControle() {
  Object.assign(toque, { id: null, x: 0, y: 0 });
  manete.style.transform = '';
}

function instalarComandos() {
  canvas.addEventListener('pointermove', evento => {
    if (evento.pointerId === toqueMira || (toqueMira === null && evento.pointerType === 'mouse')) apontar(evento);
  });
  canvas.addEventListener('pointerdown', evento => {
    if (evento.button !== 0 || toqueMira !== null) return;
    canvas.focus({ preventScroll: true });
    toqueMira = evento.pointerId;
    canvas.setPointerCapture(evento.pointerId);
    apontar(evento);
    iniciarDisparo();
  });
  for (const tipo of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(tipo, evento => {
      if (evento.pointerId !== toqueMira) return;
      toqueMira = null;
      if (evento.pointerType !== 'mouse') mira = null;
    });
    controle.addEventListener(tipo, evento => {
      if (evento.pointerId === toque.id) soltarControle();
    });
  }
  canvas.addEventListener('pointerleave', () => {
    if (toqueMira === null) mira = null;
  });
  controle.addEventListener('pointerdown', evento => {
    if (evento.button !== 0 || toque.id !== null) return;
    toque.id = evento.pointerId;
    controle.setPointerCapture(evento.pointerId);
    moverControle(evento);
  });
  controle.addEventListener('pointermove', evento => {
    if (evento.pointerId === toque.id) moverControle(evento);
  });
  atirar.addEventListener('click', iniciarDisparo);
  esquivar.addEventListener('click', iniciarEsquiva);
  impacto.addEventListener('click', () => tocar('hurt'));
  for (const botao of botoesEscala) {
    botao.addEventListener('click', () => {
      ampliado = botao.dataset.escala === 'ampliado';
      for (const outro of botoesEscala) outro.setAttribute('aria-pressed', String(outro === botao));
      limitarHeroi();
    });
  }
  addEventListener('keydown', evento => {
    if (evento.metaKey || evento.ctrlKey || evento.altKey) return;
    const tecla = evento.code;
    if (tecla === 'Space' && evento.target instanceof Element && evento.target.closest('a, button')) return;
    if (tecla === 'ShiftLeft' || tecla === 'ShiftRight') {
      if (!evento.repeat) iniciarEsquiva();
    } else if (movimento.has(tecla) || tecla === 'Space') {
      evento.preventDefault();
      teclas.add(tecla);
      if (tecla === 'Space' && !evento.repeat) iniciarDisparo();
    }
  });
  addEventListener('keyup', evento => teclas.delete(evento.code));
  addEventListener('blur', () => {
    teclas.clear();
    toqueMira = mira = null;
    soltarControle();
  });
}

carregarInfluenza().then(modelo => {
  if (!ctx) throw new Error('Contexto Canvas indisponível');
  personagem = new Personagem2D(modelo);
  redimensionar();
  new ResizeObserver(redimensionar).observe(canvas);
  instalarComandos();
  for (const botao of [atirar, esquivar, impacto]) botao.disabled = false;
  aviso.hidden = true;
  tocar('idle');

  let ultimo = performance.now();
  function quadro(agora) {
    const delta = limitar((agora - ultimo) / 1000, 0, .035);
    ultimo = agora;
    avancar(delta);
    desenhar();
    requestAnimationFrame(quadro);
  }
  requestAnimationFrame(quadro);
}).catch(erro => {
  acao.value = 'Indisponível';
  aviso.textContent = 'Não foi possível carregar o personagem.';
  console.error(erro);
});
