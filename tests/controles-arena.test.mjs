import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const read = name => readFileSync(new URL(`../dist/${name}`, import.meta.url), 'utf8');
const context = vm.createContext({});
vm.runInContext(read('controles-arena.js'), context);
const { atlasControls } = context;

function arena({ mode = 'manual', coarse = false, maxTouchPoints = 0 } = {}) {
  const keyboard = new EventTarget();
  keyboard.navigator = { maxTouchPoints };
  keyboard.matchMedia = () => ({ matches: coarse });

  const canvas = new EventTarget();
  const rect = { left: 30, top: 40, width: 600, height: 400 };
  canvas.clientWidth = rect.width;
  canvas.clientHeight = rect.height;
  canvas.getBoundingClientRect = () => rect;
  canvas.ownerDocument = { activeElement: canvas };
  canvas.tagName = 'CANVAS';
  canvas.focus = () => { canvas.ownerDocument.activeElement = canvas; };
  const captures = [];
  canvas.setPointerCapture = id => captures.push(id);
  canvas.hasPointerCapture = id => captures.includes(id);
  canvas.releasePointerCapture = id => {
    const index = captures.indexOf(id);
    if (index !== -1) captures.splice(index, 1);
  };

  let active = true;
  const fired = { dash: 0, tap: 0, pause: 0, clear: 0 };
  const controls = atlasControls.create(canvas, {
    isActive: () => active,
    controlMode: () => mode,
    screenPosition: () => ({ x: 180, y: 110 }),
    onDash: () => ++fired.dash,
    onAimTap: () => ++fired.tap,
    onPause: () => { fired.pause++; return true; },
    onClear: () => ++fired.clear,
    keyboard
  });

  function send(target, type, fields) {
    const event = Object.assign(new Event(type, { cancelable: true }), fields);
    target.dispatchEvent(event);
    return event;
  }

  return {
    controls, canvas, fired, captures,
    active(value) { active = value; },
    pointer(type, pointerId, x, y, options = {}) {
      return send(canvas, type, {
        pointerId, clientX: x + rect.left, clientY: y + rect.top,
        pointerType: 'touch', button: 0, isPrimary: pointerId === 1, ...options
      });
    },
    key(type, key, options = {}) {
      return send(keyboard, type, { key, code: key === ' ' ? 'Space' : '', repeat: false, ...options });
    },
    blur: () => send(keyboard, 'blur', {})
  };
}

function vector(actual, x, y) {
  assert.ok(actual, 'O vetor deve existir.');
  assert.ok(Math.abs(actual.x - x) < 1e-7, `X esperado ${x}, recebido ${actual.x}`);
  assert.ok(Math.abs(actual.y - y) < 1e-7, `Y esperado ${y}, recebido ${actual.y}`);
}

test('rancho e cursos carregam o mesmo controle antes do código da arena', () => {
  for (const [page, game] of [['index.html', 'jogo.js'], ['rancho-chagasico.html', 'rancho-chagasico.js']]) {
    const scripts = [...read(page).matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
      .map(([, source]) => source.split('/').pop());
    const shared = scripts.indexOf('controles-arena.js');
    assert.ok(shared >= 0 && scripts.indexOf(game) > shared, page);
    assert.match(read(game), /\batlasControls\.create\s*\(/, game);
  }
});

test('dois dedos movem e miram juntos e mantêm os papéis até soltar', () => {
  const a = arena();
  assert.equal(a.controls.hasTouch(), false);

  a.pointer('pointerdown', 1, 290, 250);
  a.pointer('pointerdown', 2, 495, 270);
  assert.equal(a.controls.hasTouch(), true);
  assert.deepEqual(a.captures, [1, 2]);
  assert.equal(a.controls.aim(), null);

  a.pointer('pointermove', 1, 309, 250);
  a.pointer('pointermove', 2, 495, 230);
  vector(a.controls.movement(), .5, 0);
  vector(a.controls.aim(), 0, -1);

  a.pointer('pointercancel', 1, 309, 250);
  vector(a.controls.movement(), 0, 0);
  vector(a.controls.aim(), 0, -1);

  a.pointer('pointerup', 2, 495, 230);
  assert.equal(a.controls.aim(), null);
  assert.equal(a.fired.tap, 0);
});

test('toque breve no lado direito gera um ataque assistido e o cancelamento não gera', () => {
  const a = arena({ maxTouchPoints: 2 });
  assert.equal(a.controls.hasTouch(), true);
  assert.equal(atlasControls.TAP_SECONDS, .34);

  a.pointer('pointerdown', 1, 100, 320);
  a.pointer('pointermove', 1, 150, 320);
  for (const [id, end] of [[2, 'pointerup'], [3, 'pointercancel'], [4, 'lostpointercapture']]) {
    a.pointer('pointerdown', id, 430, 320);
    a.pointer(end, id, 430, 320);
    assert.equal(a.fired.tap, 1);
    vector(a.controls.movement(), 1, 0);
    assert.equal(a.controls.aim(), null);
  }
});

test('mouse mira enquanto o botão principal está pressionado', () => {
  const a = arena();
  a.pointer('pointerdown', 1, 200, 110, { pointerType: 'mouse', button: 2 });
  assert.equal(a.controls.aim(), null);

  a.pointer('pointerdown', 1, 200, 110, { pointerType: 'mouse' });
  assert.equal(a.controls.isMouseAiming(), true);
  vector(a.controls.aim(), 1, 0);
  a.pointer('pointermove', 1, 180, 130, { pointerType: 'mouse' });
  vector(a.controls.aim(), 0, 1);
  vector(a.controls.movement(), 0, 0);

  a.pointer('pointerup', 1, 180, 130, { pointerType: 'mouse' });
  assert.equal(a.controls.isMouseAiming(), false);
  assert.equal(a.controls.aim(), null);
  assert.equal(a.fired.tap, 0);
});

test('WASD, setas, J e Espaço seguem o padrão e o desfoque limpa a entrada', () => {
  const a = arena();
  a.key('keydown', 'd');
  a.key('keydown', 'ArrowRight');
  a.key('keydown', 'W');
  a.key('keydown', 'J');
  vector(a.controls.movement(), Math.SQRT1_2, -Math.SQRT1_2);
  assert.equal(a.controls.isAttackHeld(), true);

  a.key('keydown', ' ');
  a.key('keydown', ' ', { repeat: true });
  assert.equal(a.fired.dash, 1);

  a.canvas.ownerDocument.activeElement = { tagName: 'BUTTON' };
  a.key('keydown', ' ');
  assert.equal(a.fired.dash, 1);
  a.key('keyup', 'j');
  assert.equal(a.controls.isAttackHeld(), false);
  a.key('keydown', 'p');
  assert.equal(a.fired.pause, 1);

  a.pointer('pointerdown', 1, 440, 260);
  a.pointer('pointermove', 1, 490, 260);
  a.key('keydown', 'j');
  a.blur();
  assert.equal(a.fired.clear, 1);
  vector(a.controls.movement(), 0, 0);
  assert.equal(a.controls.aim(), null);
  assert.equal(a.controls.isAttackHeld(), false);

  a.active(false);
  a.key('keydown', 'a');
  a.key('keydown', ' ');
  a.pointer('pointerdown', 2, 390, 230);
  vector(a.controls.movement(), 0, 0);
  assert.equal(a.controls.aim(), null);
  assert.equal(a.fired.dash, 1);
});

test('modo automático permite mover pelo lado direito e mantém o mouse livre', () => {
  const a = arena({ mode: 'auto', coarse: true });
  assert.equal(a.controls.hasTouch(), true);
  a.pointer('pointerdown', 1, 450, 350, { pointerType: 'mouse' });
  assert.equal(a.controls.isMouseAiming(), false);

  a.pointer('pointerdown', 2, 500, 350);
  a.pointer('pointermove', 2, 500, 310);
  vector(a.controls.movement(), 0, -1);
  assert.equal(a.controls.aim(), null);
  a.pointer('pointerup', 2, 500, 310);
  assert.equal(a.fired.tap, 0);
});
