export function criarDisparoOocisto(origem, jogador, alvo, direcao, { alcance, dano, dourado }) {
  const vx = alvo.x - origem.x;
  const vy = alvo.y - origem.y;
  const comprimento = Math.hypot(vx, vy);
  const dx = comprimento > 0 ? vx / comprimento : direcao.x;
  const dy = comprimento > 0 ? vy / comprimento : direcao.y;
  const ox = origem.x - jogador.x;
  const oy = origem.y - jogador.y;
  const avancado = ox * dx + oy * dy;
  const lateral = ox * dy - oy * dx;
  const restante = Math.max(0, Math.sqrt(Math.max(0, alcance ** 2 - lateral ** 2)) - avancado);
  return {
    ...origem, dx, dy, restante, dano, dourado, percorrido: 0,
    velocidade: dourado ? 740 : 665, raio: dourado ? 7 : 5
  };
}

export function avancarDisparoOocisto(tiro, dt, inimigos, acertar) {
  const passo = Math.min(tiro.restante, tiro.velocidade * dt);
  let primeiro = null;
  let contato = passo;
  for (const inimigo of inimigos) {
    if (inimigo.hp <= 0) continue;
    const x = inimigo.x - tiro.x;
    const y = inimigo.y - tiro.y;
    const aoLongo = x * tiro.dx + y * tiro.dy;
    const lateral = x * tiro.dy - y * tiro.dx;
    const dentro = (inimigo.r + tiro.raio) ** 2 - lateral ** 2;
    if (dentro < 0) continue;
    const margem = Math.sqrt(dentro);
    if (aoLongo + margem < 0) continue;
    const entrada = Math.max(0, aoLongo - margem);
    if (entrada > contato) continue;
    primeiro = inimigo;
    contato = entrada;
  }
  tiro.x += tiro.dx * contato;
  tiro.y += tiro.dy * contato;
  tiro.percorrido += contato;
  tiro.restante -= contato;
  if (primeiro) acertar(primeiro, tiro);
  return !primeiro && tiro.restante > 0;
}
