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

 function drawActor(g, image, x, y, radius, lift, flash = false) {
  const size = radius * 3.15;
  oval(g, x, y + radius * .6, radius * 1.04, radius * .34,
   flash ? 'rgba(255,230,184,.50)' : 'rgba(66,24,51,.31)');
  g.drawImage(image, x - size / 2, y - size * .58 - lift, size, size);
 }

 function drawFragment(g, orb, reducedMotion) {
  const lift = reducedMotion ? 0 : Math.sin(orb.t) * 2.2;
  const {x} = orb, y = orb.y - lift;
  oval(g, x, orb.y + 4, 5, 1.8, 'rgba(56,22,49,.30)');
  polygon(g, [[x,y-6],[x+4.5,y],[x,y+6],[x-4.5,y]], '#b48ae0', '#613779', 1.3);
  polygon(g, [[x,y-5],[x+1,y],[x-3,y]], '#f4d8ff');
 }

 return {creature, drawActor, drawFragment};
})();
