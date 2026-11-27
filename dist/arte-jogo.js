const arenaArt = (() => {
 const turn = Math.PI * 2;
 const ink = '#301e39';

 function paint(g, fill, outline, width = 2) {
  g.fillStyle = fill;
  g.fill();
  if (outline) {
   g.strokeStyle = outline;
   g.lineWidth = width;
   g.stroke();
  }
 }

 function oval(g, x, y, rx, ry, fill, outline, width = 2, rotation = 0) {
  g.beginPath();
  g.ellipse(x, y, rx, ry, rotation, 0, turn);
  paint(g, fill, outline, width);
 }

 function polygon(g, points, fill, outline, width) {
  g.beginPath();
  g.moveTo(...points[0]);
  for (const point of points.slice(1)) g.lineTo(...point);
  g.closePath();
  paint(g, fill, outline, width);
 }

 function hexagon(g, radius) {
  g.beginPath();
  for (let i = 0; i < 6; i++) {
   const a = (i - 1.5) * turn / 6;
   const x = Math.cos(a) * radius, y = Math.sin(a) * radius;
   if (i === 0) g.moveTo(x, y);
   else g.lineTo(x, y);
  }
  g.closePath();
 }

 function channelBend(angle) {
  return Math.cos(angle * 6) >= 0 ? 15 : -15;
 }

 function vessel(g, angle, length, bend) {
  const x = Math.cos(angle), y = Math.sin(angle);
  g.moveTo(0, 0);
  g.quadraticCurveTo(x * length / 2 - y * bend * 2, y * length / 2 + x * bend * 2, x * length, y * length);
 }

 function portal(g, point) {
  g.save();
  g.translate(point.x, point.y);
  g.rotate(Math.atan2(point.y, point.x) + Math.PI / 2);
  oval(g, 0, 4, 27, 22, 'rgba(61,24,45,.36)');
  oval(g, 0, 0, 23, 19, '#b35c70', '#6d3049', 3);
  oval(g, 0, -4, 17, 13, '#612b51', '#f4ad87', 4);
  oval(g, 0, -3, 11, 7, '#9f5271', '#74314f', 1.5);
  oval(g, -5, -4, 4, 2.5, '#db8693', null, 0, -.25);
  oval(g, -15, 11, 8, 7, '#ac4261', '#682440', 2.5);
  oval(g, -16, 9, 3, 2, '#f28d88');
  oval(g, 15, 11, 8, 7, '#71b8a1', '#3a5960', 2.5);
  oval(g, 14, 9, 3, 2, '#c7e6b3');
  g.restore();
 }

 function vein(g) {
  oval(g, 0, 4, 37, 32, 'rgba(83,23,53,.30)');
  oval(g, 0, 0, 33, 28, '#e59083', '#7c3a5a', 3);
  oval(g, 0, -1, 26, 21, '#884469', '#f7b292', 3);
  oval(g, 0, 0, 21, 16, '#532c52', '#703654', 2);
  g.beginPath();
  g.ellipse(0, -2, 16, 10, 0, 3.3, 5.95);
  g.strokeStyle = '#c17293';
  g.lineWidth = 2;
  g.stroke();
 }

 function paintArena(g, radius, portals, edgeAt, texture) {
  g.save();
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.save();
  hexagon(g, radius + 7);
  g.clip();
  const ground = g.createRadialGradient(0, -56, 28, 0, 0, radius + 20);
  ground.addColorStop(0, '#f7bb98');
  ground.addColorStop(1, '#ad4f67');
  g.fillStyle = ground;
  g.fillRect(-radius - 10, -radius - 10, 2 * radius + 20, 2 * radius + 20);
  if (texture?.complete && texture.naturalWidth) {
   const halfWidth = radius * .95;
   g.drawImage(texture, -halfWidth, -radius, halfWidth * 2, radius * 2);
  }
  g.beginPath();
  for (let i = 0; i < 24; i++) {
   const a = (i + .5) * turn / 24;
   vessel(g, a, edgeAt(a) - 11, channelBend(a));
  }
  g.strokeStyle = 'rgba(116,48,78,.28)';
  g.lineWidth = 10;
  g.stroke();
  g.strokeStyle = 'rgba(255,188,161,.43)';
  g.lineWidth = 4;
  g.stroke();
  g.beginPath();
  portals.forEach(({x,y}, i) => vessel(g, Math.atan2(y, x), Math.hypot(x, y), i % 2 ? -25 : 25));
  g.strokeStyle = '#843c5b';
  g.lineWidth = 21;
  g.stroke();
  g.strokeStyle = '#b75b75';
  g.lineWidth = 16;
  g.stroke();
  g.strokeStyle = '#db8490';
  g.lineWidth = 3;
  g.stroke();
  g.restore();
  hexagon(g, radius + 7);
  g.strokeStyle = '#582840';
  g.lineWidth = 3;
  g.stroke();
  for (const point of portals) portal(g, point);
  vein(g);
  g.restore();
 }

 function drawBlood(g, cells, portals, clock) {
  for (const b of cells) {
   const t = b.r / b.length;
   const bend = 4 * t * (1 - t) * channelBend(b.a);
   const x = b.r * Math.cos(b.a) - bend * Math.sin(b.a);
   const y = b.r * Math.sin(b.a) + bend * Math.cos(b.a);
   oval(g, x, y, 4.8, 3, '#d55f69', '#883751', 1, b.a);
   oval(g, x - .65, y - .8, 1.9, 1, '#f5a58a', null, 0, b.a);
  }
  g.save();
  const pulse = (Math.sin(clock * 2.5) + 1) / 2;
  g.strokeStyle = 'rgba(255,178,192,.42)';
  g.lineWidth = 1.5;
  g.beginPath();
  g.ellipse(0, 0, 5 + pulse * 12, 3 + pulse * 7, 0, 0, turn);
  g.stroke();
  for (const [i, {x,y}] of portals.entries()) {
   const glow = (Math.sin(clock * 2.4 + i * 1.2) + 1) / 2;
   oval(g, x, y - 3, 3 + glow * 4, 2 + glow * 3, 'rgba(252,174,158,.62)');
  }
  g.restore();
 }

 const crests = {
  orbit: [[15,31,5],[23,20,5],[37,16,5],[52,21,5],[57,34,4]],
  tuft: [[21,23,6],[30,17,7],[41,16,8],[50,24,5]],
  gem: [[36,17,8],[17,38,5],[56,38,5]],
  wing: [[25,23,5],[45,23,5]],
  drop: [[46,21,6]],
  scallop: [[16,37,6],[23,27,8],[33,23,8],[45,23,8],[54,31,7],[57,40,5]],
  shell: [[23,26,6],[31,22,6],[40,18,6],[48,22,6]],
  reed: [[29,20,5],[36,16,6],[46,17,6]],
  spark: [[15,34,6],[22,23,6],[41,17,7],[52,25,7]],
  twins: [[24,25,10],[48,24,9]],
  box: [[17,29,5],[22,21,5],[49,22,5],[55,31,5]],
  crown: [[16,30,6],[24,20,6],[37,15,7],[51,22,6],[56,35,5]]
 };

 function body(g, look, fill, outline) {
  if (look === 'gem' || look === 'box') {
   const points = look === 'gem'
    ? [[36,16],[53,25],[59,41],[49,54],[37,57],[22,53],[14,40],[22,26]]
    : [[25,21],[48,21],[57,30],[57,48],[46,55],[24,54],[15,46],[15,32]];
   polygon(g, points, fill, outline, 2.7);
   return;
  }
  if (look === 'drop') {
   g.beginPath();
   g.moveTo(38, 18);
   g.bezierCurveTo(42, 29, 57, 30, 56, 43);
   g.bezierCurveTo(54, 62, 17, 62, 16, 43);
   g.bezierCurveTo(16, 33, 31, 23, 38, 18);
   g.closePath();
   paint(g, fill, outline, 2.7);
   return;
  }
  oval(g, 36, 39, look === 'shell' ? 24 : 21, 17, fill, outline, 2.7);
 }

 function costume(g, rank) {
  if (rank >= 1) {
   polygon(g, [[16,49],[24,54],[48,54],[56,49],[51,57],[22,58]], '#43867b', ink, 2);
   polygon(g, [[47,55],[53,54],[55,63],[48,61]], '#68ad98', ink, 2);
  }
  if (rank >= 2) {
   polygon(g, [[34,51],[40,55],[35,61],[30,55]], '#ffd588', '#775136', 1.8);
  }
  if (rank >= 3) {
   polygon(g, [[23,22],[21,12],[30,16],[36,8],[42,16],[51,12],[48,22]],
    '#f6c670', '#77433b', 2.2);
  }
 }

 function creature(species, rank = 0, hostile = false) {
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const g = c.getContext('2d');
  g.scale(4 / 3, 4 / 3);
  g.lineJoin = g.lineCap = 'round';
  const [base, shade, light] = species.colors;
  const {look} = species;

  for (const x of [25, 47]) oval(g, x, 55, 9, 5, shade, ink, 2.5);
  for (const [x,y,r] of crests[look]) {
   oval(g, x, y, r, r * .92, shade, ink, 2.3);
   oval(g, x - r * .22, y - r * .25, r * .55, r * .42, light);
  }
  if (look === 'wing') {
   polygon(g, [[21,34],[5,23],[8,38],[20,49],[28,44]], light, ink, 2.4);
   polygon(g, [[51,34],[67,23],[64,38],[52,49],[44,44]], light, ink, 2.4);
  }
  const coat = g.createLinearGradient(0, 22, 0, 57);
  coat.addColorStop(0, light);
  coat.addColorStop(.43, base);
  coat.addColorStop(1, shade);
  body(g, look, coat, ink);
  oval(g, 27, 29, 6, 2.8, light, null, 0, -.38);
  oval(g, 18, 46, 6, 5, base, ink, 2);
  oval(g, 54, 46, 6, 5, base, ink, 2);
  for (const x of [29, 44]) {
   oval(g, x, 39, 5.1, 6.4, '#fff5db', ink, 1.8);
   oval(g, x + .8, 39.5, 2.4, 3.6, ink);
  }
  if (hostile) {
   g.beginPath();
   g.moveTo(23, 33); g.lineTo(33, 37);
   g.moveTo(39, 37); g.lineTo(49, 33);
   g.strokeStyle = ink; g.lineWidth = 2.5; g.stroke();
  }
  g.beginPath();
  g.moveTo(33, 46);
  g.quadraticCurveTo(36.5, hostile ? 43 : 51, 40, 46);
  g.strokeStyle = ink; g.lineWidth = 1.6; g.stroke();
  costume(g, rank);
  return c;
 }

 const arenaCreatures = {
  kupffer: {look:'shell', colors:['#eea852','#aa5b39','#ffd697']},
  dane: {look:'orbit', colors:['#6bc3ad','#317c81','#b7eccd']},
  sentinel: {look:'spark', rank:1, colors:['#e49352','#9f4e39','#ffd58e']},
  guardian: {look:'wing', rank:2, colors:['#b080cf','#684386','#ebc5f1']},
  focus: {look:'crown', rank:3, colors:['#5cbaa2','#316779','#bcdf9f']}
 };
 const arenaSprites = new Map();

 function drawActor(g, image, x, y, radius, lift, flash = false) {
  const size = radius * 3.15;
  oval(g, x, y + radius * .6, radius * 1.04, radius * .34,
   flash ? 'rgba(255,230,184,.50)' : 'rgba(66,24,51,.31)');
  g.drawImage(image, x - size / 2, y - size * .58 - lift, size, size);
 }

 function drawCreature(g, type, member, reducedMotion) {
  if (!arenaSprites.has(type)) {
   const species = arenaCreatures[type];
   arenaSprites.set(type, creature(species, species.rank, type !== 'kupffer'));
  }
  const lift = reducedMotion ? 0 : Math.sin(member.ph * 1.9) * member.r * .085;
  drawActor(g, arenaSprites.get(type), member.x, member.y, member.r, lift, member.hit > 0);
 }

 function drawParticle(g, e, reducedMotion) {
  const rotation = reducedMotion ? 0 : e.ph * .3;
  const x = e.x, y = e.y;
  const width = e.r * (e.fil ? 1.6 : .82), height = e.r * (e.fil ? .65 : .79);
  oval(g, x, y + 4, width, height * .61, 'rgba(60,28,57,.24)', null, 0, rotation);
  oval(g, x, y, width, height, e.hit > 0 ? '#fff7ef' : '#c1cced', '#51476d', 1.7, rotation);
  oval(g, x - 2.4, y - 2.3, width * .34, height * .31, '#f8ebff', null, 0, rotation);
 }

 function drawFragment(g, orb, reducedMotion) {
  const lift = reducedMotion ? 0 : Math.sin(orb.t) * 2.2;
  const {x} = orb, y = orb.y - lift;
  oval(g, x, orb.y + 4, 5, 1.8, 'rgba(56,22,49,.30)');
  polygon(g, [[x,y-6],[x+4.5,y],[x,y+6],[x-4.5,y]], '#b48ae0', '#613779', 1.3);
  polygon(g, [[x,y-5],[x+1,y],[x-3,y]], '#f4d8ff');
 }

 return {paintArena, drawBlood, creature, drawActor, drawCreature, drawParticle, drawFragment};
})();
