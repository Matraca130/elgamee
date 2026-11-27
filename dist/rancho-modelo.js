import { CLIPS } from './rancho-quadros.js';

export const WIDTH = 1200;
export const HEIGHT = 800;
export const EXIT = { x: 600, y: 104, radius: 38 };

export const EVOLUTIONS = {
  refuge: { name: 'Refúgio em frestas', detail: 'Sofra 20% menos dano.', weight: 5 },
  night: { name: 'Atividade noturna', detail: 'Mova-se 12% mais rápido.', weight: 5 },
  shell: { name: 'Casca firme', detail: 'Ganhe 20 pontos de vida máxima.', weight: 2 },
  dash: { name: 'Impulso curto', detail: 'Recupere o dash 25% mais rápido.', weight: 2 }
};

const HOUSE_POINTS = [
  { x: 209, y: 747, lampX: 191, lampY: 682 },
  { x: 1067, y: 215, lampX: 1016, lampY: 113 }
];
const TRAP_POINTS = [{ x: 275, y: 473, facing: 1 }, { x: 854, y: 301, facing: -1 }];
const OBSTACLES = [
  { x: 0, y: 0, width: 122, height: 166 },
  { x: 0, y: 528, width: 252, height: 191 },
  { x: 916, y: 0, width: 284, height: 177 },
  { x: 1085, y: 672, width: 115, height: 128 }
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const duration = clip => CLIPS[clip].count / CLIPS[clip].fps;

export function newRun(quizCorrect, random = Math.random) {
  return {
    time: 0, phase: 'play', quizCorrect, random, choices: [], rewards: new Set(),
    houses: HOUSE_POINTS.map(point => ({ ...point, visited: false })),
    traps: TRAP_POINTS.map(point => ({ ...point, age: 0, phase: 'armed', struck: false })),
    guard: { x: 250, y: 735, side: 1, age: 0, action: 'idle', next: .5, aim: null, released: false },
    hero: {
      x: 598, y: 572, hp: 100, maxHp: 100, radius: 13, side: 1, dx: 1, dy: 0,
      moving: false, dash: 0, dashReady: 0, attack: null, attackReady: 0,
      safeUntil: 0, hitTime: -5
    },
    projectiles: [], effects: [], notices: []
  };
}

export function nightBonus(run) {
  return run.quizCorrect && run.rewards.has('refuge') && run.rewards.has('night');
}

export function beginDash(run) {
  const p = run.hero;
  if (run.phase !== 'play' || run.time < p.dashReady) return false;
  p.dash = duration('playerDash');
  p.dashReady = run.time + (run.rewards.has('dash') ? 1.42 : 1.9);
  p.attack = null;
  run.effects.push({ type: 'dash', x: p.x, y: p.y, age: 0, ttl: .32 });
  return true;
}

export function beginAttack(run, target = null) {
  const p = run.hero;
  if (run.phase !== 'play' || p.dash > 0 || run.time < p.attackReady) return false;
  const x = target ? target.x - p.x : p.dx;
  const y = target ? target.y - p.y : p.dy;
  const length = Math.hypot(x, y);
  if (length < .001) return false;
  p.attack = { age: 0, dx: x / length, dy: y / length, released: false };
  p.attackReady = run.time + .49;
  if (Math.abs(x) > .01) p.side = Math.sign(x);
  return true;
}

export function chooseEvolution(run, id) {
  if (run.phase !== 'evolution' || !run.choices.includes(id)) return false;
  run.rewards.add(id);
  if (id === 'shell') {
    run.hero.maxHp += 20;
    run.hero.hp += 20;
  }
  run.choices = [];
  run.phase = 'play';
  run.hero.safeUntil = Math.max(run.hero.safeUntil, run.time + .5);
  run.notices.push(run.rewards.size === 2 ? 'Saída disponível ao norte.' : EVOLUTIONS[id].name);
  return true;
}

function offerChoices(run) {
  const options = Object.keys(EVOLUTIONS).filter(id => !run.rewards.has(id));
  const choices = [];
  while (choices.length < 2) {
    let roll = run.random() * options.reduce((sum, id) => sum + EVOLUTIONS[id].weight, 0);
    const index = options.findIndex(id => (roll -= EVOLUTIONS[id].weight) < 0);
    choices.push(options.splice(Math.max(0, index), 1)[0]);
  }
  return choices;
}

function damage(run, amount, notice) {
  const p = run.hero;
  if (p.dash > 0 || run.time < p.safeUntil) return false;
  const damagePoints = Math.round(amount * (run.rewards.has('refuge') ? .8 : 1));
  p.hp = Math.max(0, p.hp - damagePoints);
  p.hitTime = run.time;
  p.safeUntil = run.time + .68;
  run.effects.push({ type: 'damage', x: p.x, y: p.y, value: damagePoints, age: 0, ttl: .68 });
  run.notices.push(notice);
  if (!p.hp) run.phase = 'lost';
  return true;
}

function moveHero(run, input, dt) {
  const p = run.hero;
  const length = Math.hypot(input.x, input.y);
  p.moving = length > .045;
  const dashed = p.dash > 0;
  if (p.moving && !dashed) {
    p.dx = input.x / length;
    p.dy = input.y / length;
    if (Math.abs(p.dx) > .09 && !p.attack) p.side = Math.sign(p.dx);
  }
  const lamp = lampBeam(run, 1);
  const exposed = Math.abs(lampAngleTo(p, lamp)) < lamp.width && distance(p, lamp) < lamp.reach;
  const speed = (run.rewards.has('night') ? 293 : 262) * (dashed ? 2.65 : exposed ? .68 : 1);
  const strength = dashed ? 1 : Math.min(length, 1);
  if (dashed || p.moving) {
    moveAxis(p, 'x', strength * p.dx * speed * dt, WIDTH);
    moveAxis(p, 'y', strength * p.dy * speed * dt, HEIGHT);
  }
  p.dash = p.dash > dt + 1e-9 ? p.dash - dt : 0;
}

function moveAxis(player, axis, delta, limit) {
  const start = player[axis];
  player[axis] = clamp(start + delta, player.radius, limit - player.radius);
  if (OBSTACLES.some(block => {
    const x = clamp(player.x, block.x, block.x + block.width);
    const y = clamp(player.y, block.y, block.y + block.height);
    return Math.hypot(player.x - x, player.y - y) < player.radius;
  })) player[axis] = start;
}

function lampAngleTo(point, beam) {
  const delta = Math.atan2(point.y - beam.y, point.x - beam.x) - beam.angle;
  return Math.atan2(Math.sin(delta), Math.cos(delta));
}

export function lampBeam(run, index) {
  const house = run.houses[index];
  return index === 0
    ? { x: house.lampX, y: house.lampY, angle: .75, reach: 143, width: .28 }
    : { x: house.lampX, y: house.lampY, angle: 1.51 + Math.sin(run.time * 1.56) * .58, reach: 170, width: .20 };
}

function updateGuard(run, dt) {
  const guard = run.guard;
  guard.age += dt;
  if (guard.action === 'idle') {
    if (run.time < guard.next || distance(guard, run.hero) > 316) return;
    const hero = run.hero;
    guard.side = hero.x < guard.x ? -1 : 1;
    guard.aim = {
      x: clamp(hero.x + (hero.moving ? hero.dx * 22 : 0), 20, WIDTH - 20),
      y: clamp(hero.y + (hero.moving ? hero.dy * 22 : 0), 20, HEIGHT - 20)
    };
    guard.age = 0;
    guard.action = 'attack';
    guard.released = false;
    return;
  }
  if (!guard.released && guard.age >= CLIPS.ladyAttack.event / CLIPS.ladyAttack.fps) {
    guard.released = true;
    const from = { x: guard.x + guard.side * 30, y: guard.y - 8 };
    run.projectiles.push({
      kind: 'sandal', ...from, from, to: guard.aim, z: 33, age: 0,
      ttl: clamp(distance(from, guard.aim) / 405, .27, .72)
    });
  }
  if (guard.age >= duration('ladyAttack')) {
    guard.action = 'idle';
    guard.age = 0;
    guard.next = run.time + 1.03;
  }
}

function updateAttack(run, dt) {
  const p = run.hero;
  const attack = p.attack;
  if (!attack) return;
  attack.age += dt;
  if (!attack.released && attack.age >= CLIPS.playerAttack.event / CLIPS.playerAttack.fps) {
    attack.released = true;
    run.projectiles.push({
      kind: 'pulse', x: p.x + attack.dx * 15, y: p.y + attack.dy * 15, age: 0,
      dx: attack.dx, dy: attack.dy, ttl: .47
    });
  }
  if (attack.age >= duration('playerAttack')) p.attack = null;
}

function updateTraps(run, dt) {
  for (const trap of run.traps) {
    trap.age += dt;
    if (trap.phase === 'armed' && distance(run.hero, trap) <= 56) {
      trap.phase = 'spring';
      trap.age = 0;
      trap.struck = false;
    }
    if (trap.phase === 'spring') {
      if (!trap.struck && trap.age >= CLIPS.trapHit.event / CLIPS.trapHit.fps) {
        trap.struck = true;
        run.effects.push({ type: 'impact', x: trap.x, y: trap.y, age: 0, ttl: .38 });
        if (distance(run.hero, trap) <= 65) damage(run, 19, 'A armadilha de chinelo acertou.');
      }
      if (trap.age >= duration('trapHit')) {
        trap.phase = 'spent';
        trap.age = 0;
      }
    }
    if (trap.phase === 'spent' && trap.age > 2.15 && distance(run.hero, trap) > 67) {
      trap.phase = 'armed';
      trap.age = 0;
    }
  }
}

function updateProjectiles(run, dt) {
  for (const projectile of run.projectiles) {
    projectile.age += dt;
    if (projectile.kind === 'pulse') {
      projectile.x += projectile.dx * 580 * dt;
      projectile.y += projectile.dy * 580 * dt;
      for (const trap of run.traps) {
        if (trap.phase === 'armed' || (trap.phase === 'spring' && !trap.struck)) {
          if (distance(projectile, trap) <= 30) {
            trap.phase = 'spent';
            trap.age = 0;
            projectile.age = projectile.ttl;
            run.effects.push({ type: 'pulse', x: trap.x, y: trap.y, age: 0, ttl: .4 });
            run.notices.push('Armadilha desarmada.');
            break;
          }
        }
      }
      continue;
    }
    const progress = Math.min(1, projectile.age / projectile.ttl);
    projectile.x = projectile.from.x + (projectile.to.x - projectile.from.x) * progress;
    projectile.y = projectile.from.y + (projectile.to.y - projectile.from.y) * progress;
    projectile.z = 33 * (1 - progress) + Math.sin(progress * Math.PI) * 48;
    const atFeet = distance(projectile, run.hero) < 33 && projectile.z < 39;
    if (atFeet && damage(run, 26, 'O chinelo da senhora acertou.')) projectile.age = projectile.ttl;
    if (projectile.age >= projectile.ttl) {
      run.effects.push({ type: 'impact', x: projectile.x, y: projectile.y, age: 0, ttl: .36 });
    }
  }
  run.projectiles = run.projectiles.filter(projectile => projectile.age < projectile.ttl);
}

export function stepRun(run, input, dt) {
  if (run.phase !== 'play') return;
  run.time += dt;
  moveHero(run, input, dt);
  updateAttack(run, dt);
  updateGuard(run, dt);
  updateTraps(run, dt);
  updateProjectiles(run, dt);
  run.effects = run.effects.filter(effect => (effect.age += dt) < effect.ttl);
  if (run.phase !== 'play') return;
  for (const house of run.houses) {
    if (!house.visited && distance(run.hero, house) < 40) {
      house.visited = true;
      run.hero.hp = Math.min(run.hero.maxHp, run.hero.hp + 45);
      run.effects.push({ type: 'heal', x: house.x, y: house.y, age: 0, ttl: .62 });
      run.choices = offerChoices(run);
      run.phase = 'evolution';
      return;
    }
  }
  if (run.rewards.size === 2 && distance(run.hero, EXIT) < EXIT.radius) run.phase = 'won';
}
