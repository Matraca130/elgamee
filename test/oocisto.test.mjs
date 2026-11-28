import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Personagem2D } from '../dist/personagem-2d.js';
import { avancarDisparoOocisto, criarDisparoOocisto } from '../dist/combate-oocisto.js';

globalThis.Image = class {};
const { modeloOocisto, poseSolturaOocisto } = await import('../dist/arte-oocisto.js');
delete globalThis.Image;

test('a preparação só emite um disparo, no quadro de soltura', () => {
  const personagem = new Personagem2D(modeloOocisto);
  personagem.tocar('shoot');
  const eventos = [];
  const registrar = (nome, pose) => eventos.push({ nome, pose });
  personagem.avancar(.14, registrar);
  assert.equal(eventos.length, 0);
  personagem.avancar(.067, registrar);
  assert.equal(personagem.avancar(.2, registrar), true);
  personagem.avancar(.1, registrar);
  assert.equal(eventos.length, 1);
  assert.equal(eventos[0].nome, 'disparo');
  for (const chave of Object.keys(modeloOocisto.neutra)) {
    assert.equal(eventos[0].pose[chave], poseSolturaOocisto[chave]);
  }
});

test('o ponto de saída acompanha a lâmina ao inverter o lado', () => {
  const personagem = new Personagem2D(modeloOocisto);
  const local = { x: 40, y: 60, escala: 24 / 27, lado: 1 };
  const direita = personagem.ponto('disparo', local, poseSolturaOocisto);
  const esquerda = personagem.ponto('disparo', { ...local, lado: -1 }, poseSolturaOocisto);
  assert.ok(direita.x > local.x && esquerda.x < local.x);
  assert.equal(direita.x + esquerda.x, 2 * local.x);
  assert.equal(direita.y, esquerda.y);
});

test('o dano só chega no contato com a primeira defesa viva', () => {
  const tiro = criarDisparoOocisto({ x: 28, y: 0 }, { x: 0, y: 0 }, { x: 150, y: 0 }, { x: 1, y: 0 },
    { alcance: 175, dano: 23, dourado: true });
  const longe = { x: 124, y: 0, r: 6, hp: 28 };
  const primeiro = { x: 81, y: 0, r: 6, hp: 28 };
  const derrotado = { x: 53, y: 0, r: 6, hp: 0 };
  const inimigos = [longe, derrotado, primeiro];
  const acertar = (inimigo, impacto) => { inimigo.hp -= impacto.dano; };
  assert.equal(avancarDisparoOocisto(tiro, .04, inimigos, acertar), true);
  assert.equal(primeiro.hp, 28);
  assert.equal(avancarDisparoOocisto(tiro, .12, inimigos, acertar), false);
  assert.equal(tiro.x, 68);
  assert.equal(primeiro.hp, 5);
  assert.equal(longe.hp, 28);
  assert.equal(derrotado.hp, 0);
});

test('a mira manual pode errar e o disparo para no limite de alcance', () => {
  const tiro = criarDisparoOocisto({ x: -28, y: 0 }, { x: 0, y: 0 }, { x: -140, y: 0 }, { x: -1, y: 0 },
    { alcance: 175, dano: 19, dourado: false });
  const foraDoTrajeto = { x: -80, y: 42, r: 13, hp: 28 };
  const foraDoAlcance = { x: -198, y: 0, r: 13, hp: 28 };
  assert.equal(avancarDisparoOocisto(tiro, .35, [foraDoTrajeto, foraDoAlcance],
    () => assert.fail('Disparo acertou fora da trajetória ou do alcance')), false);
  assert.equal(tiro.x, -175);
});
