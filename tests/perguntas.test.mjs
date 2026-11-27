import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const context = vm.createContext({});
for (const script of ['perguntas', 'fase-influenza', 'capitulo-vsr', 'nucleo-influenza']) {
  vm.runInContext(readFileSync(new URL('../dist/' + script + '.js', import.meta.url), 'utf8'), context);
}
const { quiz, flu, vsr, core } = vm.runInContext(
  '({quiz:atlasQuiz, flu:respiratory, vsr:vsrChapter, core:influenzaCore})', context);

test('um termo curto aceita equivalências cadastradas e conserva distinções clínicas', () => {
  const diagnosis = vsr.practice[0].fields[1];
  for (const value of [' BRONQUIOLITE! ', 'Bronquiolitis aguda', 'a bronquiolite']) {
    assert.ok(quiz.matches(diagnosis, value), value);
  }
  for (const value of ['', 'bronquite', 'não é bronquiolite', 'bronquiolite ou pneumonia']) {
    assert.equal(quiz.matches(diagnosis, value), false, value);
  }
  const negative = core.signatures.quiet.question.fields[1];
  assert.ok(quiz.matches(negative, '−'));
  assert.equal(quiz.matches(negative, '+'), false);
});

test('porcentagens aceitam vírgula, ponto e símbolo, sem extrair números de uma frase', () => {
  const field = flu.review.epidemiology.fields[1];
  for (const value of ['20', '20,0', '20.00 %', '20%']) assert.ok(quiz.matches(field, value));
  for (const value of ['0,2', '120', '-20', '20 ou 15%', '20 % a menos', '']) {
    assert.equal(quiz.matches(field, value), false, value);
  }
  assert.ok(quiz.matches({percent:12.5}, '12,50%'));
});

test('a questão de dois campos exige que cada valor esteja no campo correto', () => {
  const [first, second] = flu.review.ha.fields;
  assert.ok(quiz.matches(first, 'HEMAGLUTININA') && quiz.matches(second, 'neuraminidasa'));
  assert.equal(quiz.matches(first, 'neuraminidase'), false);
  assert.equal(quiz.matches(second, 'hemaglutinina'), false);
});

test('os sorteios esgotam as inéditas e depois voltam à questão mais antiga', () => {
  const pool = vsr.mucusQuestions;
  const history = [];
  for (let i = 0; i < pool.length; i++) {
    const question = quiz.nextQuestion(pool, history);
    assert.ok(!history.some(entry => entry.question === question.q));
    history.push({question:question.q});
  }
  assert.equal(quiz.nextQuestion(pool, history).q, history[0].question);
  const deck = quiz.shuffled(pool);
  assert.equal(deck.length, pool.length);
  assert.equal(new Set(deck).size, pool.length);
  deck.pop();
  assert.equal(deck.length + 1, pool.length);
});

test('cada entrada jogável tem enunciado, explicação e uma forma de correção completa', () => {
  const questions = new Set([
    ...flu.mucusQuestions, ...flu.practice, ...flu.prophylaxis, ...Object.values(flu.review),
    ...vsr.mucusQuestions, ...vsr.practice, ...Object.values(vsr.review),
    ...vsr.stages.flatMap(stage => stage.study.questions),
    ...[...Object.values(core.layouts), ...Object.values(core.profiles), ...Object.values(core.signatures)]
        .map(item => item.question)
  ]);
  for (const question of questions) {
    assert.ok(question.q && question.level && question.topic && question.note);
    assert.notEqual(Boolean(question.fields), Boolean(question.answers), question.q);
    if (question.fields) {
      assert.ok(question.fields.length && quiz.solution(question));
      for (const field of question.fields) {
        assert.ok(field.label);
        const model = field.terms?.[0] ?? String(field.percent);
        assert.ok(quiz.matches(field, model), question.q);
        assert.equal(quiz.matches(field, '   '), false);
      }
    } else {
      assert.ok(question.answers.length >= 2 && question.answers.every(Boolean));
      assert.equal(new Set(question.answers).size, question.answers.length);
    }
  }
});
