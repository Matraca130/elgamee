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
  if(fill)paint(g,fill,outline,width);
  else if(outline){g.strokeStyle=outline;g.lineWidth=width;g.stroke();}
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

 function outlineBody(g, body, fill, rim) {
  if(body==='facets') {
   polygon(g, [[-15,-20],[4,-24],[19,-16],[23,0],[16,16],[-4,20],[-21,11],[-23,-7]],fill,rim,2.8);
   return;
  }
  if(body==='filament'){
   oval(g,0,-2,18,27,fill,rim,2.8);
   return;
  }
  oval(g,0,-2,23,22,fill,rim,2.8);
 }

 const fiberAngles=[.43,1.07,1.97,2.66,3.34,4.02,4.95,5.67];
 function surfaceFibers(g,body,long,clock,color) {
  const rx=body==='filament'?17:21,ry=body==='filament'?25:20;
  for(const [i,angle] of fiberAngles.entries()){
   const x=Math.cos(angle),y=Math.sin(angle),span=long?11:6;
   const bend=Math.sin(clock*2.7+i)*.9;
   g.beginPath();g.moveTo(x*rx,y*ry-2);
   g.quadraticCurveTo(x*(rx+span*.7)-y*bend,y*(ry+span*.7)-2,x*(rx+span),y*(ry+span)-2);
   g.lineWidth=3.1;g.strokeStyle=ink;g.stroke();
   g.lineWidth=1.65;g.strokeStyle=color;g.stroke();
   oval(g,x*(rx+span),y*(ry+span)-2,1.7,1.7,color,ink,.75);
  }
 }

 function neuraminidase(g,clock,rank,fused) {
  const angles=[.27,2.88,3.82,5.65].slice(0,rank>=2?4:3);
  for(const [i,angle] of angles.entries()){
   const bend=Math.sin(clock*3.1+i)*2.4;
   g.save();g.rotate(angle);
   for(const [width,color] of [[5,ink],[2.8,fused?'#dba8ff':'#a2f7eb']]){
    g.beginPath();
    g.moveTo(19,-1);g.quadraticCurveTo(28,-5,31,bend);
    g.quadraticCurveTo(32,4,36,bend+5);
    g.moveTo(31,bend);g.quadraticCurveTo(33,-4,36,bend-4);
    g.lineWidth=width;g.strokeStyle=color;g.stroke();
   }
   g.restore();
  }
 }

 function hemagglutinin(g,rank) {
  for(const x of (rank>1?[-14,-5,5,14]:[-10,2,13])){
   const base=-20+Math.abs(x)*.24;
   g.beginPath();g.moveTo(x,base+2);g.lineTo(x*1.16,base-6);
   g.strokeStyle=ink;g.lineWidth=4.6;g.stroke();
   g.strokeStyle='#df974c';g.lineWidth=2.2;g.stroke();
   oval(g,x*1.16,base-6,3.7,3.4,'#ffd99b',ink,1.7);
  }
 }

 function spiralAntenna(g,clock,lit) {
  const x=Math.sin(clock*4)*1.5;
  if(lit)oval(g,x+4,-32,10,7,'rgba(255,176,146,.32)');
  for(const [width,color] of [[5,ink],[2.7,lit?'#ffd3a9':'#ed8b89']]){
   g.beginPath();g.moveTo(-2,-21);
   g.bezierCurveTo(-2,-31,x-4,-37,x+3,-38);
   g.bezierCurveTo(x+(lit?13:10),-39,x+12,-28,x+5,-29);
   g.quadraticCurveTo(x+1,-30,x+5,-34);
   g.lineWidth=width;g.strokeStyle=color;g.stroke();
  }
  if(lit)polygon(g,[[x+15,-39],[x+17,-36],[x+15,-33],[x+13,-36]],'#fff0b4',ink,1);
 }

 function nucleocapsid(g,genome,rank,clock) {
  if(rank)polygon(g,[[-10,2],[-5,-2],[5,-2],[10,3],[7,12],[-7,12]],'#454263','#222542',1.8);
  else oval(g,0,5,12,7,'rgba(82,75,108,.67)','#807e9e',1.4);
  for(let i=0;i<genome.strands;i++){
   const y=4+i*3;
   g.beginPath();g.moveTo(-7,y);
   g.bezierCurveTo(-3,y-3,1,y+3,7,y);
   g.lineWidth=1.7;g.strokeStyle=genome.color;g.stroke();
  }
  if(genome.polarity){
   g.fillStyle=genome.color;g.textAlign='left';g.textBaseline='middle';
   g.font='800 7px system-ui, sans-serif';g.fillText(genome.polarity,6,8);
  }
  if(rank>1)oval(g,0,11,2.4+Math.sin(clock)*.5,1.7,'#dec8ff');
 }

 function segmentedNucleocapsid(g,shape,rank) {
  const edge=shape.accent??'#8d86ad';
  if(rank)polygon(g,[[-12,1],[-7,-1],[8,-1],[13,4],[11,12],[6,15],[-8,15],[-14,9]],'#31293f',edge,1.3);
  else oval(g,0,7,13.5,8,'#31293f',edge,1.3);
  for(const [row,count] of [4,shape.segments-4].entries()){
   for(let i=0;i<count;i++){
    const x=(i-(count-1)/2)*5.25,y=4+row*5.65+(i%2)*.35;
    g.beginPath();g.moveTo(x-1.1,y+1.25);g.quadraticCurveTo(x-1.6,y-.3,x+1.05,y-1.5);
    g.strokeStyle=shape.color;g.lineWidth=1.8;g.stroke();
   }
  }
  if(shape.accent){
   for(const x of [-15.8,15.8]){
    polygon(g,[[x,2],[x+1.9,5],[x,8],[x-1.9,5]],shape.accent,ink,.9);
   }
  }
 }

 function expression(g,value,gaze) {
  for(const x of [-7,7]){
   oval(g,x,-7,4.8,value===2?4.9:5.8,'#fff0db',ink,1.75);
   oval(g,x+gaze*1.15,-7,2.25,3.3,'#29203f');
   oval(g,x+gaze*.9-.6,-8.1,.8,.8,'#fff8e9');
   if(value){
    const lean=x<0?1:-1;
    g.beginPath();g.moveTo(x-lean*5,-13-value);g.lineTo(x+lean*4,-12+value*1.7);
    g.lineWidth=value===2?2.7:2.0;g.strokeStyle=ink;g.stroke();
   }
  }
  g.beginPath();g.moveTo(-2.7,-1);g.quadraticCurveTo(0,value===2?-2.4:1.4,3.3,-1.4);
  g.lineWidth=1.45;g.strokeStyle=ink;g.stroke();
 }

 function drawVirus(g,x,y,r,appearance,pose={}) {
  const {morph,ha=0,na=0,core=0,defense=false,magnet=false,reserve=false,fused=false,segmented,variation,antenna=false,vsr=false,confluence=false}=appearance;
  const {clock=0,stride=0,lift=0,facing=1,streak=0,flash=false,antennaLit=false,temper=viralMorphology.faces[morph.face].intensity}=pose;
  const unit=r/24;
  g.save();g.translate(x,y);g.scale(unit,unit);g.lineCap=g.lineJoin='round';
  oval(g,0,19,23,7,flash?'rgba(255,219,172,.60)':'rgba(38,19,43,.32)');
  if(fused){
   const aura=g.createRadialGradient(0,4,10,0,4,35);
   aura.addColorStop(0,'rgba(154,62,197,.12)');aura.addColorStop(.62,'rgba(189,87,224,.42)');
   aura.addColorStop(1,'rgba(229,171,255,0)');
   oval(g,0,1,36,32,aura);
   oval(g,0,18,27,8,null,'#e8b9ff',1.6);
  }
  const hover=4+Math.sin(clock*2.7)*1.5;
  g.translate(0,-lift-hover);g.scale(facing*(1+streak),1-streak*.55);g.rotate(stride*.022);
  if(morph.surface&&morph.surface!=='float'){
   surfaceFibers(g,morph.body,morph.surface==='long',clock,vsr?'#bdf7d6':'#c2eef1');
  }
  if(na)neuraminidase(g,clock,na,fused);
  if(ha)hemagglutinin(g,ha);
  if(antenna)spiralAntenna(g,clock,antennaLit);
  const coat=g.createLinearGradient(-14,-22,12,23);
  coat.addColorStop(0,vsr?'#dbf9e7':fused?'#8973b8':'#d1f6fb');
  coat.addColorStop(.47,vsr?'#6cc9b8':fused?'rgba(91,66,146,.88)':'rgba(100,202,230,.84)');
  coat.addColorStop(1,vsr?'#3b7985':fused?'#533f87':'#407ea7');
  outlineBody(g,morph.body,coat,fused?'#302044':'#232d4d');
  oval(g,0,-1,morph.body==='filament'?14.5:18.6,16.4,fused?'rgba(52,36,95,.42)':'rgba(209,247,243,.28)',
   defense?'#d9f6f9':'rgba(209,243,252,.68)',defense?2.5:1.55);
  oval(g,-13,-14,4.4,2.2,'rgba(246,254,255,.83)',null,0,-.43);
  oval(g,15,-8,2.7,1.7,'rgba(246,254,255,.61)',null,0,.7);
  if(variation?.attackOffset){
   for(const side of [-1,1]){
    polygon(g,[[side*17,-14],[side*22,-20],[side*24,-14],[side*20,-10]],variation.color,ink,1.4);
   }
  }
  if(variation?.cooldownFactor)oval(g,0,19,13,3,null,variation.color,1.7);
  if(segmented)segmentedNucleocapsid(g,segmented,core);
  else nucleocapsid(g,viralMorphology.genomes[morph.genome],core,clock);
  expression(g,temper,.4);
  if(magnet)oval(g,-17,9,3.2,3.2,'#ffda94',ink,1.3);
  if(reserve)oval(g,17,9,3.2,3.2,'#ffadc8',ink,1.3);
  if(confluence){
   oval(g,-13,13,4.5,3.4,'#b9f7e2',ink,1.2);
   oval(g,-8,15,4.5,3.4,'#e1b8f6',ink,1.2);
  }
  g.restore();
 }

 return {creature, drawActor, drawFragment, drawVirus};
})();
