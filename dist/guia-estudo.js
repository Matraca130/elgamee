'use strict';

const byId = id => document.getElementById(id);

function drawForm(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(canvas.width / 220, canvas.height / 100);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const form = canvas.dataset.form;
  const oval = (x, y, rx, ry, color, tilt = 0) => {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, tilt, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  };

  ctx.strokeStyle = '#57425b';
  ctx.fillStyle = '#e9dbe8';
  ctx.lineWidth = 1.9;
  ctx.beginPath();
  if (form === 'ama') {
    ctx.ellipse(108, 51, 30, 27, -0.25, 0, 2 * Math.PI);
  } else if (form === 'epi') {
    ctx.moveTo(14, 70);
    ctx.bezierCurveTo(46, 51, 72, 31, 99, 34);
    ctx.bezierCurveTo(123, 32, 139, 41, 153, 40);
    ctx.bezierCurveTo(134, 53, 101, 59, 78, 55);
    ctx.bezierCurveTo(52, 54, 32, 68, 14, 70);
  } else {
    ctx.moveTo(19, 65);
    ctx.bezierCurveTo(42, 78, 67, 72, 86, 51);
    ctx.bezierCurveTo(108, 26, 134, 29, 155, 39);
    ctx.bezierCurveTo(134, 35, 121, 44, 100, 64);
    ctx.bezierCurveTo(74, 88, 39, 86, 19, 65);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = '#08766e';
  ctx.lineWidth = 2.25;
  ctx.beginPath();
  if (form === 'ama') {
    oval(101, 55, 12, 10, '#714780', -0.28);
    oval(121, 44, 2.4, 6.2, '#a74b22', 0.3);
    ctx.beginPath();
    ctx.moveTo(123, 41);
    ctx.quadraticCurveTo(130, 40, 137, 37);
  } else if (form === 'epi') {
    oval(84, 45, 10, 6.2, '#714780', -0.15);
    oval(107, 40, 2.2, 5.2, '#a74b22', 0.28);
    ctx.beginPath();
    ctx.moveTo(110, 38);
    ctx.bezierCurveTo(122, 32, 130, 48, 145, 42);
    ctx.bezierCurveTo(163, 35, 179, 14, 194, 24);
    ctx.quadraticCurveTo(203, 31, 211, 19);
  } else {
    oval(94, 54, 9, 5.4, '#714780', -0.65);
    oval(34, 71, 4, 3.8, '#a74b22');
    ctx.beginPath();
    ctx.moveTo(37, 68);
    ctx.bezierCurveTo(49, 74, 62, 74, 74, 57);
    ctx.bezierCurveTo(81, 47, 84, 51, 92, 43);
    ctx.bezierCurveTo(110, 25, 117, 39, 127, 33);
    ctx.bezierCurveTo(140, 28, 148, 43, 158, 37);
    ctx.bezierCurveTo(172, 31, 176, 16, 195, 23);
    ctx.quadraticCurveTo(206, 29, 211, 18);
  }
  ctx.stroke();
}

document.querySelectorAll('canvas[data-form]').forEach(drawForm);

const sourcePanel = byId('documento');
const filePicker = byId('pdf');
const status = byId('pdf-status');
const reader = byId('reader');
const frame = byId('pdf-frame');
const pageLinks = [...document.querySelectorAll('[data-pdf-page]')];
let documentUrl;
let pdfPage = 267;

function showPage(page) {
  pdfPage = page;
  const url = documentUrl + '#page=' + page;
  frame.src = url;
  byId('new-tab').href = url;
  byId('page-label').textContent = 'Pág. ' + (page - 4) + ' impresa · hoja ' + page + ' del PDF';
  reader.hidden = false;
}

for (const link of pageLinks) {
  link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    pdfPage = Number(link.dataset.pdfPage);
    if (documentUrl) {
      showPage(pdfPage);
      byId('new-tab').focus({preventScroll:true});
    } else {
      status.textContent = 'Elegí la guía para abrir la página impresa ' + (pdfPage - 4) + ' (hoja ' + pdfPage + ' del PDF).';
      filePicker.focus({preventScroll:true});
    }
    sourcePanel.scrollIntoView({block:'start'});
  });
}

filePicker.addEventListener('change', async () => {
  const file = filePicker.files[0];
  reader.hidden = true;
  frame.removeAttribute('src');
  byId('new-tab').removeAttribute('href');
  for (const link of pageLinks) link.href = '#documento';
  if (documentUrl) URL.revokeObjectURL(documentUrl);
  documentUrl = undefined;
  if (!file) {
    status.textContent = 'Elegí tu copia de la guía para consultar una página.';
    return;
  }
  if (file.size !== Number(sourcePanel.dataset.bytes)) {
    status.textContent = 'El archivo pertenece a otra edición. Elegí el PDF original indicado arriba.';
    return;
  }
  status.textContent = 'Verificando la edición de la guía…';
  try {
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    if (filePicker.files[0] !== file) return;
    const hash = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
    if (hash !== byId('source-sha').textContent.trim()) {
      status.textContent = 'El contenido difiere de la guía de referencia. Elegí la edición indicada arriba.';
      return;
    }
    documentUrl = URL.createObjectURL(file.type === 'application/pdf' ? file : file.slice(0, file.size, 'application/pdf'));
    for (const link of pageLinks) link.href = documentUrl + '#page=' + link.dataset.pdfPage;
    showPage(pdfPage);
    status.textContent = 'Edición verificada. Podés recorrer la guía desde las referencias de la ficha.';
  } catch {
    if (filePicker.files[0] === file) status.textContent = 'Este navegador no pudo verificar el archivo. Podés consultar tu copia usando las páginas impresas de la ficha.';
  }
});

const steps = [
  {scene:'Intestino de la vinchuca', question:'¿Qué forma se multiplica en este ambiente?', choices:['Amastigote','Epimastigote','Tripomastigote sanguíneo'], answer:'Epimastigote', note:'Desbloqueaste Huella de vinchuca para la próxima pregunta del vector.'},
  {scene:'Salida de la vinchuca', question:'¿Qué forma aparece en las deyecciones del insecto?', choices:['Tripomastigote metacíclico','Tripomastigote sanguíneo','Amastigote'], answer:'Tripomastigote metacíclico', note:'Reconociste la forma metacíclica. Ahora el recorrido pasa al mamífero.'},
  {scene:'Célula del mamífero', question:'¿En qué forma se multiplica el parásito dentro de la célula?', choices:['Epimastigote','Tripomastigote metacíclico','Amastigote'], answer:'Amastigote', note:'El amastigote es la forma de multiplicación intracelular.'},
  {scene:'Sangre del mamífero', question:'¿Qué forma circula entre los tejidos?', choices:['Tripomastigote sanguíneo','Amastigote','Epimastigote'], answer:'Tripomastigote sanguíneo', note:'El tripomastigote sanguíneo puede alcanzar otras células.'}
];
let currentStep = 0;
const answers = byId('answers');
const trial = byId('trial');
const advance = byId('advance');
const hint = byId('hint');
const feedback = byId('feedback');

function showStep() {
  const step = steps[currentStep];
  byId('scene').textContent = (currentStep + 1) + ' de ' + steps.length + ' · ' + step.scene;
  byId('question').textContent = step.question;
  answers.replaceChildren();
  feedback.textContent = '';
  hint.hidden = currentStep !== 1;
  byId('hint-text').hidden = true;
  advance.hidden = true;
  for (const choice of step.choices) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = choice;
    button.addEventListener('click', () => {
      if (choice !== step.answer) {
        feedback.textContent = 'Volvé a mirar en qué hospedador y en qué lugar estás. Podés intentarlo otra vez.';
        return;
      }
      for (const option of answers.children) option.disabled = true;
      hint.hidden = true;
      byId('hint-text').hidden = true;
      feedback.textContent = step.note;
      advance.textContent = currentStep === steps.length - 1 ? 'Terminar' : 'Continuar';
      advance.hidden = false;
      advance.focus();
    });
    answers.append(button);
  }
  byId('question').focus();
}

byId('training').hidden = false;
byId('start-trial').addEventListener('click', () => {
  currentStep = 0;
  byId('start-trial').hidden = true;
  byId('challenge-intro').hidden = true;
  trial.hidden = false;
  showStep();
});
hint.addEventListener('click', () => {
  byId('hint-text').hidden = false;
  hint.hidden = true;
  answers.firstElementChild.focus();
});
advance.addEventListener('click', () => {
  currentStep += 1;
  if (currentStep < steps.length) {
    showStep();
    return;
  }
  trial.hidden = true;
  byId('challenge-intro').textContent = 'Completaste las cuatro escenas del ciclo.';
  byId('challenge-intro').hidden = false;
  byId('start-trial').hidden = false;
  byId('start-trial').textContent = 'Volver a jugar';
  byId('start-trial').focus();
});

const copy = byId('copy');
copy.hidden = false;
copy.addEventListener('click', async () => {
  const prompt = byId('editor-prompt');
  try {
    await navigator.clipboard.writeText(prompt.textContent.trim() + '\n' + byId('repo-rules').href);
    byId('copy-status').textContent = 'Instrucción copiada.';
  } catch {
    const range = document.createRange();
    range.selectNodeContents(prompt);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    byId('copy-status').textContent = 'Usá Copiar sobre el texto seleccionado.';
  }
});
