globalThis.atlasControls = (() => {
  const TAP_SECONDS = .34;
  const MORPH_SAVE = 'atlas-viral-morfologia-v1';
  const directions = new Set(['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd']);

  function unit(x, y, deadZone) {
    const length = Math.hypot(x, y);
    return length > deadZone ? { x: x / length, y: y / length } : null;
  }

  function create(canvas, {
    isActive, controlMode, screenPosition, onDash, onPause, onAimTap, onClear, keyboard = window
  }) {
    const keys = new Set();
    const move = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
    const sight = { ...move, mouse: false };
    let touch = !!keyboard.matchMedia?.('(pointer: coarse)').matches || (keyboard.navigator?.maxTouchPoints ?? 0) > 0;

    function movement() {
      let x = 0, y = 0;
      if (move.id !== null) {
        const dx = move.x - move.ox, dy = move.y - move.oy;
        const length = Math.hypot(dx, dy);
        if (length > 5) {
          const power = Math.min(1, length / 38);
          x = dx / length * power;
          y = dy / length * power;
        }
      }
      x += Number(keys.has('arrowright') || keys.has('d')) - Number(keys.has('arrowleft') || keys.has('a'));
      y += Number(keys.has('arrowdown') || keys.has('s')) - Number(keys.has('arrowup') || keys.has('w'));
      const length = Math.max(1, Math.hypot(x, y));
      return { x: x / length, y: y / length };
    }

    function aim() {
      if (controlMode() !== 'manual' || sight.id === null) return null;
      const origin = sight.mouse ? screenPosition() : { x: sight.ox, y: sight.oy };
      return unit(sight.x - origin.x, sight.y - origin.y, sight.mouse ? 2 : 7);
    }

    function release(stick) {
      const id = stick.id;
      stick.id = null;
      if (id !== null && canvas.hasPointerCapture?.(id)) canvas.releasePointerCapture(id);
    }

    function clear() {
      release(move);
      release(sight);
      sight.mouse = false;
      keys.clear();
      onClear?.();
    }

    function relative(event) {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top, width: rect.width };
    }

    canvas.addEventListener('pointerdown', event => {
      if (!isActive() || event.pointerId === move.id || event.pointerId === sight.id) return;
      const mouse = event.pointerType === 'mouse';
      if (mouse && event.button !== 0) return;
      if (!mouse) touch = true;
      const { x, y, width } = relative(event);
      const aiming = controlMode() === 'manual' && (mouse || x >= width / 2);
      if (mouse && !aiming) return;
      const stick = aiming ? sight : move;
      if (stick.id !== null) return;
      Object.assign(stick, { id: event.pointerId, ox: x, oy: y, x, y, mouse });
      try { canvas.setPointerCapture(event.pointerId); } catch {}
      canvas.focus({ preventScroll: true });
      event.preventDefault();
    });
    canvas.addEventListener('pointermove', event => {
      for (const stick of [move, sight]) {
        if (event.pointerId !== stick.id) continue;
        const { x, y } = relative(event);
        Object.assign(stick, { x, y });
      }
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      canvas.addEventListener(type, event => {
        if (event.pointerId === move.id) release(move);
        if (event.pointerId !== sight.id) return;
        const tapped = type === 'pointerup' && !sight.mouse && isActive() && !aim();
        release(sight);
        sight.mouse = false;
        if (tapped) onAimTap?.();
      });
    }

    keyboard.addEventListener('keydown', event => {
      const key = event.key?.toLowerCase();
      if (key === 'escape' || key === 'p') {
        if (!event.repeat && onPause?.()) event.preventDefault();
        return;
      }
      if (!isActive()) return;
      if (directions.has(key) || key === 'j') {
        keys.add(key);
        event.preventDefault();
      }
      if (event.code === 'Space' && canvas.ownerDocument?.activeElement?.tagName !== 'BUTTON') {
        event.preventDefault();
        if (!event.repeat) onDash?.();
      }
    });
    keyboard.addEventListener('keyup', event => keys.delete(event.key?.toLowerCase()));
    keyboard.addEventListener('blur', clear);

    return {
      movement, aim, clear,
      isAttackHeld: () => keys.has('j'),
      hasTouch: () => touch,
      isMouseAiming: () => sight.mouse,
      drawSticks(ctx, width, height) {
        if (!touch || !isActive()) return;
        const edge = Math.max(44, Math.min(116, width * .2));
        paintStick(ctx, move, edge, height - 72, 'rgba(213,237,243,.77)');
        if (controlMode() === 'manual' && !sight.mouse) {
          paintStick(ctx, sight, width - edge, height - 72, 'rgba(255,210,211,.79)');
        }
      }
    };
  }

  function paintStick(ctx, stick, x, y, color) {
    const active = stick.id !== null;
    if (active) ({ ox: x, oy: y } = stick);
    const dx = active ? stick.x - x : 0, dy = active ? stick.y - y : 0;
    const vector = unit(dx, dy, 1);
    const radius = Math.min(33, Math.hypot(dx, dy));
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 35, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(51,32,57,.39)';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + (vector?.x ?? 0) * radius, y + (vector?.y ?? 0) * radius, 13, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  function drawAim(ctx, origin, aim) {
    if (!aim) return;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(origin.x + aim.x * 24, origin.y + aim.y * 24);
    ctx.lineTo(origin.x + aim.x * 154, origin.y + aim.y * 154);
    ctx.setLineDash([7, 5]);
    ctx.strokeStyle = 'rgba(255,249,215,.79)';
    ctx.lineWidth = 2.1;
    ctx.stroke();
    ctx.restore();
  }

  function instructions(mode) {
    return mode === 'manual'
      ? 'Arraste à esquerda para andar e à direita para mirar e atacar. No computador, use WASD ou setas e segure o mouse ou J para atacar. Espaço ou Dash desvia.'
      : 'Arraste ou use WASD e setas para andar. O ataque mira no alvo mais próximo. Use Espaço ou Dash para desviar.';
  }

  return {
    create, drawAim, instructions, MORPH_SAVE, TAP_SECONDS,
    drawSticks: (ctx, controls, width, height) => controls.drawSticks(ctx, width, height)
  };
})();
