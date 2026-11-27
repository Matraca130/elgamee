import { CELL, COLUMNS, CLIPS } from './rancho-quadros.js';
import {
  WIDTH, HEIGHT, EXIT, EVOLUTIONS, newRun, nightBonus,
  beginDash, beginAttack, chooseEvolution, lampBeam, stepRun
} from './rancho-modelo.js';

const byId = id => document.getElementById(id);
const field = byId('field');
const ctx = field.getContext('2d');
const dialog = byId('screen');
const panel = byId('panel');
const ui = Object.fromEntries(
  ['pause', 'health', 'health-text', 'objective', 'houses', 'attack', 'dash', 'charge', 'notice']
    .map(id => [id, byId(id)])
);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const keys = new Set();
const directionKeys = {
  KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0],
  KeyW: [0, -1], ArrowUp: [0, -1], KeyS: [0, 1], ArrowDown: [0, 1]
};
const preview = newRun(false);
let run = null;
let mode = 'loading';
let stick = null;
let art = null;
let noticeUntil = 0;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function make(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value) node.textContent = value;
  return node;
}

function button(label, handler, kind = 'quiet') {
  const node = make('button', kind, label);
  node.type = 'button';
  node.addEventListener('click', handler);
  return node;
}

function backLink() {
  const node = make('a', '', 'Voltar ao Atlas');
  node.href = './index.html';
  return node;
}

function openPanel(nextMode, label, title, description) {
  mode = nextMode;
  keys.clear();
  stick = null;
  const heading = make(nextMode === 'intro' ? 'h1' : 'h2', '', title);
  heading.id = 'panel-title';
  panel.replaceChildren(make('p', 'eyebrow', label), heading);
  if (description) panel.append(make('p', '', description));
  if (!dialog.open) dialog.showModal();
  syncHud();
}

function startScreen() {
  openPanel(
    'intro', 'Chagasico', 'Rancho ao entardecer',
    'Entre nas duas casas para recuperar vida e evoluir. Use o dash para escapar do chinelo da senhora.'
  );
  const footer = make('div', 'screen-footer');
  footer.append(button('Jogar', quizScreen, 'primary'), backLink());
  panel.append(footer);
  footer.firstChild.focus();
}

function quizScreen() {
  openPanel(
    'quiz', 'Pergunta de entrada', 'Que moradia é esta?',
    'Como se chama, no contexto de Chagas, a moradia de adobe com frestas onde a vinchuca pode se abrigar?'
  );
  const options = [
    { name: 'Rancho chagásico', correct: true },
    { name: 'Criadouro de mosquitos', correct: false },
    { name: 'Ninho de aves', correct: false }
  ];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  const list = make('div', 'screen-buttons');
  const feedback = make('p', 'muted');
  feedback.setAttribute('role', 'status');
  for (const option of options) {
    const item = button(option.name, () => {
      for (const choice of list.children) choice.disabled = true;
      item.classList.add('selected');
      if (option.correct) item.classList.add('correct');
      feedback.textContent = option.correct
        ? 'Certo. As frestas do adobe podem abrigar a vinchuca.'
        : 'A resposta é rancho chagásico. As frestas oferecem abrigo à vinchuca.';
      const enter = button('Entrar no rancho', () => {
        run = newRun(option.correct);
        resume();
      }, 'primary');
      panel.append(enter);
      enter.focus();
    });
    list.append(item);
  }
  panel.append(list, feedback);
  list.firstChild.focus();
}

function resume() {
  mode = 'play';
  dialog.close();
  field.focus({ preventScroll: true });
  ui.notice.hidden = true;
  syncHud();
}

function evolutionScreen() {
  const visited = run.houses.filter(house => house.visited).length;
  openPanel('evolution', 'Casa de cura', 'Escolha uma evolução', `Vida recuperada · ${visited} de 2 casas`);
  const options = make('div', 'screen-buttons');
  for (const id of run.choices) {
    const trait = EVOLUTIONS[id];
    const choice = button(trait.name, () => {
      if (chooseEvolution(run, id)) resume();
    });
    choice.append(make('small', '', trait.detail));
    options.append(choice);
  }
  panel.append(options);
  options.firstChild.focus();
}

function finishScreen() {
  const won = run.phase === 'won';
  openPanel(
    'finish', 'Chagasico', won ? 'Rancho concluído' : 'Fim da tentativa',
    won ? 'Você passou pelas duas casas e chegou à saída.' : 'Observe o aviso no chão e use o dash para escapar.'
  );
  if (won && nightBonus(run)) panel.append(make('p', 'reward', 'Bônus noturno preparado.'));
  const footer = make('div', 'screen-footer');
  footer.append(button('Jogar de novo', quizScreen, 'primary'), backLink());
  panel.append(footer);
  footer.firstChild.focus();
}

function pause() {
  if (mode !== 'play' || run?.phase !== 'play') return;
  openPanel('pause', 'Rancho ao entardecer', 'Partida pausada');
  const footer = make('div', 'screen-footer');
  footer.append(button('Continuar', resume, 'primary'), backLink());
  panel.append(footer);
  footer.firstChild.focus();
}

function currentInput() {
  if (stick) {
    const dx = stick.x - stick.startX;
    const dy = stick.y - stick.startY;
    const length = Math.max(24, Math.hypot(dx, dy));
    return { x: dx / length, y: dy / length };
  }
  const vector = { x: 0, y: 0 };
  for (const code of keys) {
    const [x, y] = directionKeys[code];
    vector.x += x;
    vector.y += y;
  }
  return vector;
}

function dashNow() {
  if (mode !== 'play') return;
  const input = currentInput();
  const length = Math.hypot(input.x, input.y);
  if (!beginDash(run)) return;
  if (length > .05) {
    run.hero.dx = input.x / length;
    run.hero.dy = input.y / length;
    if (Math.abs(input.x) > .01) run.hero.side = Math.sign(input.x);
  }
}

function attackNow(target = null) {
  if (mode === 'play') beginAttack(run, target);
}

function pointer(event) {
  const box = field.getBoundingClientRect();
  return { x: event.clientX - box.left, y: event.clientY - box.top, width: box.width, height: box.height };
}

field.addEventListener('pointerdown', event => {
  if (mode !== 'play' || !event.isPrimary && event.pointerType === 'mouse') return;
  const p = pointer(event);
  if (event.pointerType === 'mouse') {
    if (event.button === 0) attackNow({ x: p.x / p.width * WIDTH, y: p.y / p.height * HEIGHT });
  } else if (!stick) {
    event.preventDefault();
    field.setPointerCapture(event.pointerId);
    stick = { id: event.pointerId, x: p.x, y: p.y, startX: p.x, startY: p.y };
  }
});
field.addEventListener('pointermove', event => {
  if (stick?.id !== event.pointerId) return;
  const p = pointer(event);
  stick.x = p.x;
  stick.y = p.y;
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  field.addEventListener(type, event => {
    if (stick?.id === event.pointerId) stick = null;
  });
}

window.addEventListener('keydown', event => {
  if (mode !== 'play') return;
  if (Object.hasOwn(directionKeys, event.code)) {
    keys.add(event.code);
    event.preventDefault();
  } else if (event.code === 'Space' && event.target.tagName !== 'BUTTON') {
    event.preventDefault();
    if (!event.repeat) dashNow();
  } else if (event.code === 'KeyK' && !event.repeat) {
    attackNow();
  } else if (event.code === 'Escape') pause();
});
window.addEventListener('keyup', event => keys.delete(event.code));
window.addEventListener('blur', () => {
  keys.clear();
  stick = null;
});
dialog.addEventListener('cancel', event => {
  event.preventDefault();
  if (mode === 'pause') resume();
});
ui.dash.addEventListener('click', dashNow);
ui.attack.addEventListener('click', () => attackNow());
ui.pause.addEventListener('click', pause);

function setText(node, value) {
  if (node.textContent !== value) node.textContent = value;
}

function syncHud() {
  const state = run ?? preview;
  const { hero } = state;
  const visited = state.houses.filter(house => house.visited).length;
  const playing = mode === 'play' && state.phase === 'play';
  const charge = Math.max(0, hero.dashReady - state.time);
  ui.health.max = hero.maxHp;
  ui.health.value = hero.hp;
  setText(ui['health-text'], `${hero.hp} / ${hero.maxHp}`);
  setText(ui.houses, `${visited} / 2`);
  setText(ui.objective, state.rewards.size === 2 ? 'Siga para a saída ao norte' : 'Visite as duas casas');
  setText(ui.charge, charge ? `${charge.toFixed(1)}s` : '');
  ui.pause.disabled = !playing;
  ui.dash.disabled = !playing || charge > 0;
  ui.attack.disabled = !playing || state.time < hero.attackReady;
}

function sprite(name, age, x, y, size, { side = 1, spin = 0, anchor = .5, loop = true } = {}) {
  const clip = CLIPS[name];
  const elapsed = Math.floor(age * clip.fps);
  const index = clip.first + (loop ? elapsed % clip.count : Math.min(clip.count - 1, elapsed));
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.scale(side, 1);
  ctx.drawImage(
    art.poses, (index % COLUMNS) * CELL, Math.floor(index / COLUMNS) * CELL, CELL, CELL,
    -size / 2, -size * anchor, size, size
  );
  ctx.restore();
}

function ellipse(x, y, rx, ry, color, outline = null, width = 2) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (color) {
    ctx.fillStyle = color;
    ctx.fill();
  }
  if (outline) {
    ctx.strokeStyle = outline;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

function groundWarning(x, y, radius, progress) {
  ellipse(x, y, radius, radius * .71, '#7a233591', '#ffd08a', 3);
  ellipse(x, y, radius * (.42 + progress * .5), radius * .71 * (.42 + progress * .5), null, '#ff945d', 3);
}

function groundLabel(label, x, y, color) {
  ctx.font = '800 19px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 5.5;
  ctx.strokeStyle = '#382029';
  ctx.strokeText(label, x, y);
  ctx.fillStyle = color;
  ctx.fillText(label, x, y);
}

function drawGround(state) {
  ctx.drawImage(art.terrain, 0, 0, WIDTH, HEIGHT);
  for (const [index, house] of state.houses.entries()) {
    const beam = lampBeam(state, index);
    ctx.beginPath();
    ctx.moveTo(beam.x, beam.y);
    ctx.arc(beam.x, beam.y, beam.reach, beam.angle - beam.width, beam.angle + beam.width);
    ctx.closePath();
    const light = ctx.createRadialGradient(beam.x, beam.y, 0, beam.x, beam.y, beam.reach);
    light.addColorStop(0, '#ffe8a250');
    light.addColorStop(1, '#ffd36e13');
    ctx.fillStyle = light;
    ctx.fill();
    const pulse = reducedMotion ? 0 : Math.sin(state.time * 4.2 + index) * 2;
    ellipse(house.x, house.y, 26 + pulse, 17 + pulse, house.visited ? '#34302530' : '#7de87040',
      house.visited ? '#eae0a157' : '#d0ff94', 2.5);
    if (!house.visited) groundLabel('Cura', house.x, house.y + 42, '#e8ffc7');
  }
  if (state.rewards.size === 2) {
    ellipse(EXIT.x, EXIT.y, 37, 25, '#753d9080', '#f0cbff', 4);
    ellipse(EXIT.x, EXIT.y, 25, 17, null, '#c68bf1', 3);
    groundLabel('Saída', EXIT.x, EXIT.y - 34, '#f6dcff');
  }
  const guard = state.guard;
  const windup = CLIPS.ladyAttack.event / CLIPS.ladyAttack.fps;
  if (guard.action === 'attack' && !guard.released && guard.aim) {
    groundWarning(guard.aim.x, guard.aim.y, 41, Math.min(1, guard.age / windup));
  }
  for (const trap of state.traps) {
    if (trap.phase === 'spring' && !trap.struck) {
      groundWarning(trap.x, trap.y, 61, Math.min(1, trap.age / .25));
    }
  }
}

function drawActors(state) {
  const { hero, guard } = state;
  const hurtAge = state.time - hero.hitTime;
  const dashClip = CLIPS.playerDash;
  const animation = hero.dash > 0 ? ['playerDash', dashClip.count / dashClip.fps - hero.dash, false]
    : hurtAge < CLIPS.playerHit.count / CLIPS.playerHit.fps ? ['playerHit', hurtAge, false]
    : hero.attack ? ['playerAttack', hero.attack.age, false]
    : hero.moving ? ['playerMove', state.time, true] : ['playerIdle', state.time, true];
  const actors = [
    {
      y: hero.y, draw() {
        ellipse(hero.x, hero.y, 22, 9, '#43263974');
        if (hero.dash > 0) ellipse(hero.x, hero.y - 3, 27, 15, null, '#f4ffd089', 3);
        sprite(animation[0], animation[1], hero.x, hero.y - 6, 128,
          { side: hero.side, anchor: .53, loop: animation[2] });
      }
    },
    {
      y: guard.y, draw() {
        ellipse(guard.x, guard.y, 24, 8, '#38213388');
        const attacking = guard.action === 'attack';
        sprite(attacking ? 'ladyAttack' : 'ladyIdle', guard.age, guard.x, guard.y, 153,
          { side: guard.side, anchor: .75, loop: !attacking });
      }
    }
  ];
  for (const trap of state.traps) {
    actors.push({
      y: trap.y, draw() {
        ellipse(trap.x, trap.y, 22, 7, '#40233182');
        ctx.save();
        if (trap.phase === 'spent') ctx.globalAlpha = .57;
        const striking = trap.phase === 'spring';
        sprite(striking ? 'trapHit' : 'trapIdle', trap.age, trap.x, trap.y, 147,
          { side: trap.facing, anchor: .72, loop: !striking });
        ctx.restore();
      }
    });
  }
  actors.sort((a, b) => a.y - b.y);
  for (const actor of actors) actor.draw();
}

function drawEffects(state) {
  for (const projectile of state.projectiles) {
    if (projectile.kind === 'sandal') {
      ellipse(projectile.x, projectile.y, 16, 6, '#43263964');
      sprite('sandal', 0, projectile.x, projectile.y - projectile.z, 113, { spin: projectile.age * 18 });
    } else {
      ellipse(projectile.x, projectile.y - 13, 11, 8, '#baffd3', '#3f7265', 3);
      ellipse(projectile.x, projectile.y - 13, 5, 4, '#fffee0');
    }
  }
  for (const effect of state.effects) {
    const t = effect.age / effect.ttl;
    ctx.save();
    ctx.globalAlpha = 1 - t;
    if (effect.type === 'damage') {
      groundLabel(`−${effect.value}`, effect.x, effect.y - 26 - t * 30, '#ffd29d');
    } else if (effect.type === 'heal') {
      ellipse(effect.x, effect.y, 22 + 38 * t, 13 + 23 * t, null, '#d9ffac', 4);
    } else if (effect.type === 'dash') {
      if (!reducedMotion) ellipse(effect.x, effect.y, 11 + 30 * t, 7 + 15 * t, null, '#fff2b4', 3);
    } else {
      const color = effect.type === 'pulse' ? '#bcffd7' : '#ffda98';
      ellipse(effect.x, effect.y, 10 + 51 * t, 7 + 35 * t, null, color, 3);
      if (!reducedMotion) {
        for (let i = 0; i < 5; i++) {
          const angle = i * Math.PI * .4 + .21;
          ellipse(effect.x + Math.cos(angle) * 69 * t,
            effect.y + Math.sin(angle) * 39 * t, 3, 2, color);
        }
      }
    }
    ctx.restore();
  }
}

function draw(state) {
  ctx.setTransform(field.width / WIDTH, 0, 0, field.height / HEIGHT, 0, 0);
  drawGround(state);
  drawActors(state);
  drawEffects(state);
  if (stick) {
    const bounds = field.getBoundingClientRect();
    ctx.setTransform(field.width / bounds.width, 0, 0, field.height / bounds.height, 0, 0);
    const input = currentInput();
    ellipse(stick.startX, stick.startY, 33, 33, '#26192d66', '#ffe5b4ad', 2);
    ellipse(stick.startX + input.x * 22, stick.startY + input.y * 22, 13, 13, '#ffe5b4c8');
  }
}

function fit() {
  const rect = field.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio, 2);
  field.width = Math.max(1, Math.round(rect.width * dpr));
  field.height = Math.max(1, Math.round(rect.height * dpr));
}

let clock = 0;
let accumulator = 0;
function frame(now) {
  const elapsed = Math.min(.06, clock ? (now - clock) / 1000 : 0);
  clock = now;
  if (!run) {
    preview.time += elapsed;
    preview.guard.age += elapsed;
  }
  if (mode === 'play') {
    accumulator += elapsed;
    while (accumulator >= 1 / 60) {
      stepRun(run, currentInput(), 1 / 60);
      accumulator -= 1 / 60;
    }
    if (run.notices.length) {
      ui.notice.textContent = run.notices.at(-1);
      run.notices.length = 0;
      ui.notice.hidden = false;
      noticeUntil = now + 1400;
    } else if (now > noticeUntil) ui.notice.hidden = true;
    if (run.phase === 'evolution') evolutionScreen();
    if (run.phase === 'won' || run.phase === 'lost') finishScreen();
    syncHud();
  } else accumulator = 0;
  draw(run ?? preview);
  requestAnimationFrame(frame);
}

dialog.showModal();
Promise.all([loadImage('./rancho-arena.webp'), loadImage('./rancho-poses.webp')])
  .then(([terrain, poses]) => {
    art = { terrain, poses };
    new ResizeObserver(fit).observe(field);
    fit();
    startScreen();
    requestAnimationFrame(frame);
  })
  .catch(() => {
    openPanel('error', 'Chagasico', 'O rancho não carregou', 'Recarregue a página para tentar outra vez.');
    panel.append(button('Recarregar', () => location.reload(), 'primary'), backLink());
  });
