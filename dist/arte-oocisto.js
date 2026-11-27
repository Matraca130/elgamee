export const oocistoAtlas = new Image();
oocistoAtlas.src = new URL('./oocisto-personagem.webp', import.meta.url).href;

function quadro(ctx, index, x, y, size) {
  if (!oocistoAtlas.complete || !oocistoAtlas.naturalWidth) return false;
  const tile = oocistoAtlas.naturalWidth / 2;
  ctx.drawImage(oocistoAtlas, index % 2 * tile, Math.floor(index / 2) * tile,
    tile, tile, x - size / 2, y - size / 2, size, size);
  return true;
}

export const desenharOocisto = (ctx, level) => quadro(ctx, level, 0, 0, 59);
export const desenharCrescente = (ctx, size) => quadro(ctx, 3, 0, 0, size);
