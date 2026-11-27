export class Personagem2D {
  constructor(modelo) {
    this.modelo = modelo;
    this.tocar('idle');
  }

  tocar(acao) {
    if (this.acao === acao) return;
    this.acao = acao;
    this.clipe = this.modelo.clipes[acao];
    this.tempo = 0;
  }

  pose(tempo = this.tempo, acao = this.acao) {
    const { quadros, duracao, loop } = this.modelo.clipes[acao];
    if (loop) tempo %= duracao;
    const proximo = quadros.findIndex(quadro => quadro.tempo > tempo);
    if (proximo === -1) return quadros.at(-1);
    if (proximo === 0) return quadros[0];
    const a = quadros[proximo - 1];
    const b = quadros[proximo];
    const u = (tempo - a.tempo) / (b.tempo - a.tempo);
    const progresso = u * u * (3 - 2 * u);
    const pose = {};
    for (const chave of Object.keys(this.modelo.neutra)) {
      pose[chave] = a[chave] + (b[chave] - a[chave]) * progresso;
    }
    return pose;
  }

  avancar(delta, emitir) {
    const { duracao, loop, eventos = [] } = this.clipe;
    const anterior = this.tempo;
    const proximo = anterior + delta;
    this.tempo = loop ? proximo % duracao : Math.min(proximo, duracao);
    for (const evento of eventos) {
      if (anterior < evento.tempo && evento.tempo <= this.tempo) {
        emitir(evento.nome, this.pose(evento.tempo));
      }
    }
    return !loop && proximo >= duracao;
  }

  ponto(nome, { x, y, escala, lado }, pose = this.pose()) {
    const [px, py] = this.modelo.pontos[nome];
    const c = Math.cos(pose.giro);
    const s = Math.sin(pose.giro);
    return {
      x: x + (pose.x + px * pose.sx * c - py * pose.sy * s) * escala * lado,
      y: y + (pose.y + px * pose.sx * s + py * pose.sy * c) * escala
    };
  }

  desenhar(ctx, { x, y, escala, lado }, pose = this.pose(), aparencia) {
    ctx.save();
    ctx.translate(x + pose.x * escala * lado, y + pose.y * escala);
    ctx.scale(lado * escala, escala);
    ctx.rotate(pose.giro);
    ctx.scale(pose.sx, pose.sy);
    ctx.lineCap = ctx.lineJoin = 'round';
    this.modelo.desenharCamadas(ctx, pose, aparencia);
    ctx.restore();
  }
}
