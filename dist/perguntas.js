const atlasQuiz = (() => {
  function normalizeTerm(value) {
    return value.normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .trim()
      .replace(/[.!?]+$/u, '')
      .replace(/(\p{L})[-‐‑–](?=\p{L})/gu, '$1 ')
      .replace(/\s+/gu, ' ')
      .trim();
  }

  function matches(field, value) {
    if (field.percent !== undefined) {
      const match = /^(\d+(?:[.,]\d+)?)\s*%?$/u.exec(value.trim());
      return Boolean(match) && Number(match[1].replace(',', '.')) === field.percent;
    }
    const term = normalizeTerm(value);
    const withoutArticle = term.replace(/^(?:o|a|os|as|el|la|los|las) /u, '');
    return term !== '' && field.terms.some(alias => {
      const expected = normalizeTerm(alias);
      return expected === term || expected === withoutArticle;
    });
  }

  function solution(question) {
    return question.fields.map(field => {
      const expected = field.terms?.[0] ?? field.percent.toLocaleString('pt-BR') + '%';
      return field.label + ' — ' + expected;
    }).join(' · ');
  }

  function shuffled(items) {
    const result = [...items];
    for (let last = result.length - 1; last > 0; last--) {
      const other = Math.floor(Math.random() * (last + 1));
      [result[last], result[other]] = [result[other], result[last]];
    }
    return result;
  }

  function nextQuestion(pool, history) {
    const lastSeen = new Map(history.map((entry, index) => [entry.question, index]));
    const age = question => lastSeen.get(question.q) ?? -1;
    const oldest = Math.min(...pool.map(age));
    const candidates = pool.filter(question => age(question) === oldest);
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  function writtenForm(question, onAnswer) {
    const form = document.createElement('form');
    form.className = 'written-answer';
    form.autocomplete = 'off';
    const inputs = question.fields.map(field => {
      const label = document.createElement('label');
      label.textContent = field.label;
      const input = document.createElement('input');
      input.type = 'text';
      input.inputMode = field.percent === undefined ? 'text' : 'decimal';
      input.required = true;
      input.maxLength = 120;
      input.spellcheck = false;
      input.addEventListener('input', () => input.setCustomValidity(''));
      label.append(input);
      form.append(label);
      return input;
    });
    const actions = document.createElement('div');
    actions.className = 'written-actions';
    const check = document.createElement('button');
    check.type = 'submit';
    check.className = 'arena-button';
    check.textContent = 'Conferir resposta';
    const pass = document.createElement('button');
    pass.type = 'button';
    pass.className = 'arena-button ghost';
    pass.textContent = 'Não sei';
    actions.append(check, pass);
    form.append(actions);

    function finish(skipped) {
      if (check.disabled) return;
      const results = inputs.map((input, i) => !skipped && matches(question.fields[i], input.value));
      inputs.forEach((input, i) => {
        input.readOnly = true;
        input.dataset.result = results[i] ? 'correct' : 'wrong';
      });
      check.disabled = pass.disabled = true;
      onAnswer(results);
    }
    form.addEventListener('submit', event => {
      event.preventDefault();
      const empty = inputs.find(input => !input.value.trim());
      if (empty) {
        empty.setCustomValidity('Digite uma resposta curta ou escolha “Não sei”.');
        empty.reportValidity();
        return;
      }
      finish(false);
    });
    pass.addEventListener('click', () => finish(true));
    return form;
  }

  return { matches, solution, shuffled, nextQuestion, writtenForm };
})();
