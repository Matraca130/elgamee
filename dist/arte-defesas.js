// Silhuetas originais em uma prancheta de 96 unidades. Cada sprite é pintado uma vez.
const defenseIllustration = (() => {
  const ink = '#302438';
  const models = {
    cell: {
      eyes: [50, 48, .92],
      layers: [
        ['shade','M23 60 Q17 65 16 75 Q24 80 35 73 L51 73 Q62 80 72 73 L65 58Z'],
        ['base','M20 46 Q17 34 28 25 L48 17 L69 24 Q81 33 78 48 L71 61 L62 69 L39 71 L24 63Z'],
        ['shade','M24 45 L46 36 L72 37 Q76 47 68 59 L57 66 L38 64Z'],
        ['base','M18 40 L29 24 L47 15 L69 22 L78 34 L69 41 L49 38 L36 44 L23 48Z'],
        ['light','M24 36 L32 25 L48 19 L60 23 L46 25 L35 34Z',0],
        ['light','M44 18 L49 11 L57 14 L61 21 L52 24Z'],
        ['shade','M55 27 L68 25 L74 33 L62 35Z',0],
        ['base','M65 54 L78 49 L83 55 L80 64 L67 67 L60 63Z'],
        ['base','M16 43 L30 39 L38 48 L35 64 L24 73 L14 65 L10 52Z'],
        ['light','M15 48 L28 43 L32 46 L19 52 L21 63 L17 60Z',0],
        ['metal','M20 55 L25 49 L30 53 L25 61Z'],
        ['light','M42 62 Q51 65 60 59 L56 65 L47 68Z',0]
      ]
    },
    patrol: {
      eyes: [49, 45, .96],
      layers: [
        ['base','M34 39 Q18 34 5 21 L10 45 L20 58 L37 62Z'],
        ['light','M10 29 L26 41 L32 48 L16 43Z',0],
        ['shade','M62 40 Q76 37 92 21 L86 46 L71 60 L58 60Z'],
        ['light','M68 46 L86 31 L80 45 L67 53Z',0],
        ['base','M25 47 L33 29 L49 15 L60 20 L73 43 L69 55 L54 69 L42 76 L36 64 L21 60Z'],
        ['shade','M28 45 L47 37 L67 40 L65 53 L47 65 L32 60Z'],
        ['light','M29 39 L35 29 L48 17 L48 30 L41 37Z',0],
        ['base','M39 32 L43 18 L54 9 L51 26 L58 22 L54 35 L47 39Z'],
        ['light','M46 23 L51 15 L49 26 L45 31Z',0],
        ['light','M49 58 L57 55 L54 62 L44 70 L44 63Z'],
        ['metal','M68 40 L76 37 L73 43 L68 46Z']
      ]
    },
    watch: {
      eyes: [53, 48, 1.04],
      layers: [
        ['shade','M13 57 L18 40 L37 30 L62 34 L80 45 L84 67 L75 78 L60 76 L46 69 L30 77 L13 69Z'],
        ['base','M19 53 Q16 39 25 28 Q35 17 52 19 Q71 18 78 36 L76 51 L65 66 L42 70 L26 65Z'],
        ['shade','M26 44 L47 35 L73 40 L70 56 L57 65 L38 63Z'],
        ['base','M16 42 Q21 26 34 22 Q35 12 43 11 L54 18 Q65 14 72 24 L80 34 L72 44 L52 37 L31 44 L22 54Z'],
        ['light','M23 36 Q27 25 36 25 L42 29 L32 34 L27 43Z',0],
        ['light','M38 22 L42 14 L52 20 L48 24Z',0],
        ['base','M9 47 L22 37 L33 43 L36 54 L29 73 L17 78 L8 67 Q4 56 9 47Z'],
        ['light','M11 50 L21 42 L28 45 L16 54 L17 65 L12 62Z',0],
        ['shade','M20 57 L26 51 L30 57 L24 67 L20 65Z'],
        ['base','M65 58 L78 49 L87 54 L91 63 L85 74 L72 77 L64 69Z'],
        ['light','M72 59 L79 53 L84 56 L77 62Z',0],
        ['metal','M44 65 L54 61 L61 65 L54 73 L46 72Z']
      ]
    },
    airway: {
      eyes: [49, 48, 1.06],
      layers: [
        ['shade','M23 53 L10 45 L20 43 L8 23 L26 31 L20 11 L38 24 L44 5 L52 23 L64 9 L62 28 L85 18 L75 36 L91 32 L82 52 L66 62Z'],
        ['light','M16 29 L33 40 L27 43Z M26 19 L39 33 L35 38Z M45 13 L49 29 L43 32Z M77 25 L68 39 L61 42Z',0],
        ['base','M20 48 Q25 32 40 31 L61 30 L76 39 L80 54 L70 65 L54 70 L43 78 L37 69 L23 65 L18 58Z'],
        ['shade','M25 47 L42 40 L70 41 L71 54 L59 63 L38 66 L27 60Z'],
        ['base','M18 45 L34 33 L45 34 L52 27 L74 36 L79 43 L67 47 L51 40 L37 46 L24 50Z'],
        ['light','M24 43 L34 37 L41 37 L33 42Z M55 33 L66 36 L71 40 L57 37Z',0],
        ['base','M18 52 L29 56 L29 64 L21 71 L9 65Z M70 57 L82 49 L87 62 L77 70 L65 67Z'],
        ['light','M16 58 L24 59 L20 64 L14 63Z M74 59 L81 55 L83 60 L75 64Z',0],
        ['metal','M36 63 L46 67 L58 62 L54 69 L45 74Z']
      ]
    },
    lungs: {
      eyes: [51, 46, 1.22],
      layers: [
        ['shade','M15 54 Q6 50 11 41 Q4 30 17 27 Q18 15 30 18 Q40 6 49 15 Q62 6 70 18 Q83 15 84 27 Q96 32 87 45 Q97 57 85 64 L74 77 L55 76 L38 82 L20 73Z'],
        ['base','M17 47 Q13 33 26 27 Q30 16 43 21 Q52 13 61 22 Q75 20 79 34 Q87 43 77 58 Q73 72 57 72 Q45 82 32 70 Q19 72 17 59Z'],
        ['light','M20 39 Q19 29 32 27 Q35 20 43 24 L38 29 Q27 29 25 40Z',0],
        ['shade','M24 47 Q34 32 45 38 Q56 33 73 37 L74 47 Q68 58 57 62 L40 59Z'],
        ['base','M22 40 Q22 32 32 31 Q38 25 45 31 L52 35 Q61 23 72 29 L80 38 L69 42 L57 40 L51 43 L44 39 L30 43Z'],
        ['light','M31 34 Q37 29 44 34 L46 36 L38 35Z M60 32 Q67 26 73 33Z',0],
        ['shade','M36 58 Q46 63 63 55 Q60 68 47 69 Q40 68 36 64Z'],
        ['metal','M43 61 Q49 62 58 59 L54 64 L47 65Z',0],
        ['base','M6 55 Q7 45 15 45 Q19 36 27 41 Q36 41 36 52 L32 62 Q30 74 20 75 Q13 78 10 70 Q1 67 6 55Z'],
        ['light','M10 54 Q12 46 18 49 Q20 42 25 44 L27 47 Q18 48 16 56Z',0],
        ['shade','M12 65 Q17 66 20 61 M22 68 Q28 65 29 58',1.6],
        ['base','M70 54 Q74 46 80 48 Q86 43 91 50 L94 59 Q96 66 88 69 Q85 78 77 73 Q67 77 65 68Z'],
        ['light','M74 55 Q78 49 83 52 L87 49 L90 54 Q83 54 78 59Z',0],
        ['shade','M74 68 Q78 68 81 63 M83 69 Q87 66 88 62',1.6]
      ]
    }
  };

  function render(model, colors) {
    const {eyes, layers} = models[model];
    const [base, shade, light] = colors;
    const palette = {base, shade, light, metal:'#ffc66d'};
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 192;
    const g = canvas.getContext('2d');
    g.scale(2, 2);
    g.lineJoin = g.lineCap = 'round';
    for (const [color, drawing, width = 2.8] of layers) {
      const path = new Path2D(drawing);
      g.fillStyle = palette[color];
      g.fill(path);
      if (width) {
        g.lineWidth = width;
        g.strokeStyle = ink;
        g.stroke(path);
      }
    }

    g.translate(eyes[0], eyes[1]);
    g.scale(eyes[2], eyes[2]);
    for (const side of [-1, 1]) {
      g.save();
      g.scale(side, 1);
      const eye = new Path2D('M2 -1 L15 -5 Q16 4 10 5 Q4 6 2 -1Z');
      g.fillStyle = '#fff0bc'; g.fill(eye);
      g.strokeStyle = ink; g.lineWidth = 2.1; g.stroke(eye);
      g.beginPath(); g.ellipse(7, .2, 2.3, 3.1, .12, 0, Math.PI * 2);
      g.fillStyle = ink; g.fill();
      g.restore();
    }
    return canvas;
  }

  return {render};
})();
