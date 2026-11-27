import { Personagem2D } from './personagem-2d.js';
import { modeloToxocara, desenharCompanheiro } from './arte-toxocara.js';
import { cursoToxocara, evolucoesToxocara, rotaToxocara } from './toxocara.js';

const $ = id => document.getElementById(id);
const arena = $('arena');
const ctx = arena.getContext('2d');
const W = arena.width;
const H = arena.height;
const mapa = new Image();
const heroi = new Personagem2D(modeloToxocara);
const movimentoReduzido = matchMedia('(prefers-reduced-motion: reduce)');
const saida = ponto(.9, .5);
const teclas = new Set();
const direcoes = { w:[0,-1], arrowup:[0,-1], s:[0,1], arrowdown:[0,1],
  a:[-1,0], arrowleft:[-1,0], d:[1,0], arrowright:[1,0] };
const etapas = rotaToxocara.map(fase => {
  const item = document.createElement('li');
  item.textContent = fase.name;
  $('etapas').append(item);
  return item;
});

let estado = novaPartida();
let toque = null;
let destino = null;
let ultimo = 0;

function ponto(x, y) { return { x:x*W, y:y*H }; }
function distancia(a, b) { return Math.hypot(a.x-b.x, a.y-b.y); }
function limitar(n, a, b) { return Math.max(a, Math.min(b, n)); }
function unidade(x, y) {
  const comprimento = Math.hypot(x, y);
  return comprimento ? { x:x/comprimento, y:y/comprimento } : { x:0, y:0 };
}

function novaPartida() {
  return { fase:0, modo:'inicio', tempo:0, acertos:0, vida:100, max:100,
    adaptacao:null, companheiro:null };
}

function entrar(fase, modo = 'jogar') {
  const dados = rotaToxocara[fase];
  Object.assign(estado, {
    fase, modo, tempo:0, jogador:ponto(.10,.52), lado:1, rumo:{x:1,y:0},
    marcos:dados.marks.map(([x,y])=>ponto(x,y)),
    lama:(dados.mud??[]).map(([x,y,r])=>({...ponto(x,y),r})),
    guardas:dados.guards.map(([x,y],i)=>{
      const base = ponto(x,y);
      return { ...base, base, onda:i*2.25, trégua:0 };
    }),
    imune:0, recarga:0, dash:0, pulso:0, anel:0, amparo:0,
    broto:estado.companheiro==='broto'
  });
  if (fase === 2) {
    estado.vida = Math.min(estado.max, estado.vida + 15);
    estado.amparo = 3.6;
  }
  limparEntrada();
  heroi.tocar('idle');
  for (const [i, item] of etapas.entries()) {
    if (i === fase) item.setAttribute('aria-current','step');
    else item.removeAttribute('aria-current');
  }
  $('regiao').textContent = dados.name;
  $('forma').textContent = dados.form;
  $('transicao').hidden = modo==='jogar';
  $('pulso').hidden = fase!==2;
  $('pausar').hidden = modo!=='jogar';
  atualizar();
  desenhar();
  if (modo==='jogar') arena.focus({preventScroll:true});
}

function atualizar() {
  const { modo, vida, max, fase, marcos, recarga, pulso, amparo, adaptacao, companheiro } = estado;
  const assinatura = [modo, vida, max, fase, marcos.length, recarga>0, pulso>0, amparo>0, adaptacao, companheiro].join('|');
  if (estado.hud===assinatura) return;
  estado.hud=assinatura;
  const jogando = modo==='jogar';
  $('integridade').max = max;
  $('integridade').value = vida;
  $('pontos-vida').textContent = Math.ceil(vida)+'/'+max;
  $('marcos').textContent = (3-marcos.length)+'/3 marcos';
  $('esquivar').disabled = !jogando || recarga>0;
  $('pulso').disabled = !jogando || pulso>0;
  $('amparo').hidden = amparo<=0;
  $('amparo').textContent = 'Bônus do ciclo canino · até 15 de integridade';
  const equipamentos = [adaptacao,companheiro].filter(Boolean).map(id=>evolucoesToxocara[id].name);
  $('equipamento').hidden = equipamentos.length===0;
  $('equipamento').textContent = equipamentos.join(' · ');
  const objetivo = jogando && marcos.length===0
    ? 'Passagem aberta. Entre no portal à direita.'
    : rotaToxocara[fase].summary;
  if ($('objetivo').textContent!==objetivo) $('objetivo').textContent=objetivo;
}

function limparEntrada() {
  teclas.clear();
  toque = null;
  destino = null;
}

function mostrar(titulo, texto, modo) {
  estado.modo = modo;
  limparEntrada();
  $('passo').textContent = titulo;
  $('explicacao').textContent = texto;
  $('opcoes').replaceChildren();
  $('resposta').hidden = true;
  $('transicao').hidden = false;
  $('pausar').hidden = true;
  atualizar();
  $('passo').focus();
}

function opcao(titulo, acao, descricao) {
  const botao = document.createElement('button');
  botao.type = 'button';
  const nome = document.createElement('strong');
  nome.textContent = titulo;
  botao.append(nome);
  if (descricao) {
    const texto = document.createElement('span');
    texto.textContent = descricao;
    botao.append(texto);
  }
  botao.addEventListener('click', acao);
  $('opcoes').append(botao);
  return botao;
}

function perguntar() {
  const { question } = rotaToxocara[estado.fase];
  atlasProgress.record(cursoToxocara, estado.fase+1, estado.acertos);
  mostrar(question.title, question.topic, 'pergunta');
  const inicio = (estado.fase+1)%question.answers.length;
  const ordem = [...question.answers.keys()].map(i=>(i+inicio)%question.answers.length);
  for (const i of ordem) {
    opcao(question.answers[i],()=>{
      if (estado.modo!=='pergunta') return;
      estado.modo = 'resposta';
      if (i===0) {
        estado.acertos++;
        estado.vida = Math.min(estado.max, estado.vida+12);
      }
      atlasProgress.record(cursoToxocara, estado.fase+1, estado.acertos);
      $('opcoes').replaceChildren();
      $('resposta').textContent = (i===0?'Resposta certa. ':'Confira o ciclo. ')+question.explanation;
      $('resposta').hidden = false;
      atualizar();
      opcao('Continuar', evoluir).focus();
    });
  }
}

function evoluir() {
  const { choices } = rotaToxocara[estado.fase];
  if (!choices) {
    mostrar('Rota concluída', estado.acertos+' de 3 perguntas certas.', 'fim');
    opcao('Jogar de novo', reiniciar);
    return;
  }
  const adaptacao = estado.fase===0;
  mostrar(adaptacao?'Escolha uma adaptação':'Escolha um companheiro',
    adaptacao?'A escolha muda o visual e os atributos do personagem.':
      'Um mascote pode acompanhar você. A passagem para o humano também ativa o bônus fixo do ciclo canino.',
    'evoluir');
  for (const id of choices) {
    const escolha = evolucoesToxocara[id];
    opcao(escolha.name,()=>{
      if (estado.modo!=='evoluir') return;
      if (adaptacao) {
        estado.adaptacao = id;
        if (id==='folha') { estado.max += 24; estado.vida += 24; }
      } else estado.companheiro = id;
      entrar(estado.fase+1);
    }, escolha.description);
  }
}

function reiniciar() {
  estado = novaPartida();
  entrar(0);
}

function pausar() {
  if (estado.modo==='pausa') {
    estado.modo = 'jogar';
    $('transicao').hidden = true;
    $('pausar').hidden = false;
    atualizar();
    arena.focus({preventScroll:true});
  } else if (estado.modo==='jogar') {
    mostrar('Rota pausada','Retome para continuar da mesma posição.', 'pausa');
    opcao('Retomar', pausar);
  }
}

function esquivar() {
  if (estado.modo!=='jogar' || estado.recarga>0) return;
  estado.dash = .20;
  estado.recarga = 1.65;
  heroi.tocar('dash');
  atualizar();
}

function iniciarPulso() {
  if (estado.modo!=='jogar' || estado.fase!==2 || estado.pulso>0 || estado.dash>0) return;
  estado.pulso = 1.7;
  heroi.tocar('shoot');
  atualizar();
}

function emitir(nome) {
  if (nome!=='pulso') return;
  estado.anel = .31;
  for (const guarda of estado.guardas) {
    if (distancia(guarda, estado.jogador)<126) guarda.trégua = 1.5;
  }
}

function entrada() {
  let x=0, y=0;
  for (const tecla of teclas) {
    const [dx,dy] = direcoes[tecla];
    x+=dx; y+=dy;
  }
  if (!x && !y && destino) {
    x=destino.x-estado.jogador.x; y=destino.y-estado.jogador.y;
    if (Math.hypot(x,y)<8) { destino=null; return {x:0,y:0}; }
  }
  return unidade(x,y);
}

function avancar(dt) {
  const p = estado.jogador;
  estado.tempo+=dt;
  for (const chave of ['imune','recarga','dash','pulso','anel','amparo']) {
    estado[chave]=Math.max(0,estado[chave]-dt);
  }
  const comando=entrada();
  const andando=Boolean(comando.x||comando.y);
  if (andando && estado.dash===0) {
    estado.rumo=comando;
    if (Math.abs(comando.x)>.08) estado.lado=Math.sign(comando.x);
  }
  const direcao=estado.dash>0?estado.rumo:comando;
  const atolado=estado.lama.some(poça=>distancia(p,poça)<poça.r);
  const velocidade=(estado.adaptacao==='sulco'?205:171)*(estado.dash>0?2.7:1)*(atolado?.62:1);
  p.x=limitar(p.x+direcao.x*velocidade*dt,25,W-26);
  p.y=limitar(p.y+direcao.y*velocidade*dt,32,H-25);
  if (heroi.clipe.loop) heroi.tocar(andando?'move':'idle');
  if (heroi.avancar(dt,emitir)) heroi.tocar(andando?'move':'idle');

  const alcance=estado.companheiro==='farejo'?56:29;
  estado.marcos=estado.marcos.filter(marco=>distancia(marco,p)>alcance);
  for (const guarda of estado.guardas) {
    guarda.trégua=Math.max(0,guarda.trégua-dt);
    if (estado.fase<2) {
      const ritmo=estado.tempo*(estado.fase===0?.9:1.35)+guarda.onda;
      guarda.x=guarda.base.x+Math.sin(ritmo)*48;
      guarda.y=guarda.base.y+Math.cos(ritmo)*31;
    } else if (!guarda.trégua) {
      const rumo=unidade(p.x-guarda.x,p.y-guarda.y);
      guarda.x+=rumo.x*68*dt;
      guarda.y+=rumo.y*68*dt;
    }
    if (distancia(guarda,p)<32 && !guarda.trégua && !estado.imune && !estado.dash) {
      if (estado.broto) estado.broto=false;
      else { estado.vida=Math.max(0,estado.vida-14); heroi.tocar('hurt'); }
      estado.imune=.82;
    }
  }
  if (estado.vida===0) {
    mostrar('A rota foi interrompida','Tente outra adaptação e use a esquiva para passar pelos obstáculos.', 'fim');
    opcao('Jogar de novo', reiniciar);
  } else if (!estado.marcos.length && distancia(p,saida)<39) perguntar();
  atualizar();
}

function disco(x,y,r,cor,contorno) {
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
  if (cor) { ctx.fillStyle=cor; ctx.fill(); }
  if (contorno) { ctx.lineWidth=2.5; ctx.strokeStyle=contorno; ctx.stroke(); }
}

function desenharGuarda(g) {
  const interno=estado.fase===2;
  const cor=interno?'#a65480':estado.fase===1?'#846256':'#af6340';
  disco(g.x,g.y+6,20,'#261d28a0');
  ctx.beginPath();
  for (let i=0;i<8;i++) {
    const a=i*Math.PI/4, r=i%2===0?21:17;
    ctx.lineTo(g.x+Math.cos(a)*r,g.y+Math.sin(a)*r);
  }
  ctx.closePath(); ctx.fillStyle=g.trégua?'#8a7584':cor; ctx.fill();
  ctx.lineWidth=3;ctx.strokeStyle='#442d37';ctx.stroke();
  if (interno) {
    disco(g.x-5,g.y-4,3,'#f9d8b8');
    disco(g.x+5,g.y-4,3,'#f9d8b8');
  } else disco(g.x-4,g.y-6,4,'#efb17e');
}

function desenhar() {
  const { fase, jogador:p, lado, adaptacao, companheiro, guardas, marcos, lama, anel, tempo, imune }=estado;
  const cores=rotaToxocara[fase].ground;
  const fundo=ctx.createLinearGradient(0,0,W,H);
  fundo.addColorStop(0,cores[0]); fundo.addColorStop(1,cores[1]);
  ctx.fillStyle=fundo; ctx.fillRect(0,0,W,H);
  if (mapa.complete && mapa.naturalWidth) {
    const w=mapa.naturalWidth/2, h=mapa.naturalHeight/2;
    ctx.drawImage(mapa,(fase%2)*w,Math.floor(fase/2)*h,w,h,0,0,W,H);
  }
  ctx.fillStyle='#30222c37';ctx.fillRect(0,0,W,H);
  for (const poça of lama) {
    disco(poça.x,poça.y,poça.r,'#48615e9e','#d4c3a691');
    disco(poça.x,poça.y,poça.r-13,null,'#d4c3a643');
  }
  const aberta=marcos.length===0;
  disco(saida.x,saida.y,25,aberta?'#2c7d6b':'#3e3041',aberta?'#b9f1a0':'#bdafa9');
  ctx.beginPath();ctx.moveTo(saida.x-7,saida.y);ctx.lineTo(saida.x+7,saida.y);
  ctx.lineTo(saida.x+1,saida.y-6);ctx.moveTo(saida.x+7,saida.y);ctx.lineTo(saida.x+1,saida.y+6);
  ctx.strokeStyle=aberta?'#fff5b7':'#dbcac8';ctx.lineWidth=2.8;ctx.stroke();
  for (const marco of marcos) {
    disco(marco.x,marco.y,12,'#633f3c','#fff0ad');
    ctx.beginPath();ctx.moveTo(marco.x,marco.y-8);ctx.lineTo(marco.x+6,marco.y);
    ctx.lineTo(marco.x,marco.y+8);ctx.lineTo(marco.x-6,marco.y);ctx.closePath();
    ctx.fillStyle='#ffd476';ctx.fill();
  }
  for (const guarda of guardas) desenharGuarda(guarda);
  if (anel>0) disco(p.x,p.y,126-(anel/.31)*88,null,'#fff2ae');
  if (destino && estado.modo==='jogar') disco(destino.x,destino.y,7,null,'#fff4c7');
  if (companheiro) desenharCompanheiro(ctx,companheiro,p.x-37*lado,p.y+12+(movimentoReduzido.matches?0:Math.sin(tempo*6)*2));
  disco(p.x,p.y+14,20,'#29212a82');
  if (imune>.6) disco(p.x,p.y,31,null,'#ffdeb2');
  heroi.desenhar(ctx,{...p,lado,escala:fase===2?1.04:1},movimentoReduzido.matches?modeloToxocara.neutra:heroi.pose(),
    {fase,adaptacao});
}

arena.addEventListener('pointerdown',evento=>{
  if (estado.modo!=='jogar' || evento.button!==0 || toque!==null) return;
  toque=evento.pointerId;
  arena.setPointerCapture(toque);
  arena.focus({preventScroll:true});
  apontar(evento);
});
arena.addEventListener('pointermove',evento=>{if(evento.pointerId===toque)apontar(evento);});
for (const tipo of ['pointerup','pointercancel','lostpointercapture']) {
  arena.addEventListener(tipo,evento=>{if(evento.pointerId===toque)toque=null;});
}
function apontar(evento) {
  const caixa=arena.getBoundingClientRect();
  destino=ponto((evento.clientX-caixa.left)/caixa.width,(evento.clientY-caixa.top)/caixa.height);
  destino.x=limitar(destino.x,25,W-26);
  destino.y=limitar(destino.y,32,H-25);
}
window.addEventListener('keydown',evento=>{
  if (evento.metaKey||evento.ctrlKey||evento.altKey) return;
  const tecla=evento.key.toLowerCase();
  if (tecla==='escape' && ['jogar','pausa'].includes(estado.modo)) { pausar(); return; }
  if (estado.modo!=='jogar') return;
  if (Object.hasOwn(direcoes,tecla)) { evento.preventDefault(); destino=null; teclas.add(tecla); }
  if (evento.repeat) return;
  if (evento.code==='Space' && !evento.target.closest?.('button, a, summary')) {
    evento.preventDefault(); esquivar();
  } else if (tecla==='j') iniciarPulso();
});
window.addEventListener('keyup',evento=>teclas.delete(evento.key.toLowerCase()));
window.addEventListener('blur',limparEntrada);
$('esquivar').addEventListener('click',esquivar);
$('pulso').addEventListener('click',iniciarPulso);
$('pausar').addEventListener('click',pausar);
$('comecar').addEventListener('click',reiniciar);

atlasProgress.init(atlasCourseLimits,()=>{
  const {cleared,correct}=atlasProgress.read(cursoToxocara);
  const modo=atlasProgress.status();
  const local={account:'na conta',saving:'salvando',connecting:'consultando'};
  $('historico').textContent='Recordes '+(local[modo]??'neste navegador')+' · '+cleared+'/3 arenas · '+correct+'/3 acertos';
});
mapa.addEventListener('load',desenhar);
mapa.src='./terrenos-toxocara.webp';
entrar(0,'inicio');
function quadro(agora) {
  const dt=limitar((agora-ultimo)/1000,0,.05);
  ultimo=agora;
  if (estado.modo==='jogar') { avancar(dt); desenhar(); }
  requestAnimationFrame(quadro);
}
requestAnimationFrame(quadro);
