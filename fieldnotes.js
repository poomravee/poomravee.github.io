/* The plot is drawn only when its settings change. Coordinates are in drawing units. */
(() => {
  const paper = '#142e29';
  const tau = 2 * Math.PI;
  const width = 540, height = 330;

  function drawing(mode, phase) {
    const paths = [];
    function trace(points, stroke, weight, fill = null) {
      paths.push({ points, stroke, weight, fill });
    }
    const mint = '#c7efab', copper = '#ff976a', faint = '#426455';
    if (mode === 'Orbit') {
      for (let ring = 0; ring < 65; ring++) {
        const a = tau * ring / 65 + phase;
        const points = [];
        for (let i = 0; i <= 150; i++) {
          const b = tau * i / 150;
          const rad = 104 + 40 * Math.cos(b + 2 * a);
          const x = rad * Math.cos(a), y = rad * Math.sin(a), z = 52 * Math.sin(b + 2 * a);
          points.push([270 + 1.17*x + 0.3*y, 162 + 0.63*y - z - 0.24*x]);
        }
        trace(points, ring % 13 === 0 ? copper : mint, 1.05);
      }
    } else {
      for (let row = 0; row <= 48; row++) {
        const v = -1 + row / 24;
        const points = [];
        for (let i = 0; i <= 150; i++) {
          const u = -1 + i / 75;
          const lift = mode === 'Terrain'
            ? 139*Math.exp(-4.3*(u-.18*Math.sin(phase))**2-3.1*(v+.08)**2) *
              (.91+.13*Math.cos(5.2*u-2.3*v+phase)) +
              41*Math.exp(-10*(u+.68)**2-4*(v-.15)**2)
            : 72*(.65+.35*Math.cos(2.6*v+phase)) * Math.sin(5.2*u+3.1*v+phase) *
              Math.exp(-.7*u*u-.8*v*v);
          points.push([270 + u*164 - v*55, 211 + u*24 + v*60 - lift]);
        }
        const left = points[0], right = points[points.length-1];
        trace([...points, [right[0],right[1]+11], [left[0],left[1]+11]], null, 0, paper);
        trace(points, row === 32 ? copper : row % 6 === 0 ? '#f0f9cb' : mint,
          row === 32 ? 2.8 : 1.2);
      }
    }
    for (const [x,y] of [[28,25],[512,25],[28,305],[512,305]]) {
      trace([[x-4,y],[x+4,y]],faint,1);
      trace([[x,y-4],[x,y+4]],faint,1);
    }
    return paths;
  }

  if (typeof document === 'undefined') {
    if (typeof module !== 'undefined') module.exports = drawing;
    return;
  }
  const plot = document.querySelector('.plot');
  const canvas = plot.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const modes = [...plot.querySelectorAll('[data-mode]')];
  const phase = plot.querySelector('input');
  const readout = plot.querySelector('output');
  const status = plot.querySelector('.plot-name');
  let selected = 'Terrain';
  function draw() {
    const value = Number(phase.value);
    const scale = 2;
    canvas.width = width*scale;
    canvas.height = height*scale;
    ctx.scale(scale,scale);
    ctx.lineJoin = 'round';
    for (const path of drawing(selected,value*Math.PI/180)) {
      ctx.beginPath();
      path.points.forEach(([x,y],i)=> i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
      if (path.fill) { ctx.closePath(); ctx.fillStyle=path.fill; ctx.fill(); }
      if (path.stroke) { ctx.strokeStyle=path.stroke; ctx.lineWidth=path.weight; ctx.stroke(); }
    }
    readout.value = value+'°';
  }
  modes.forEach(button => button.addEventListener('click', () => {
    selected = button.dataset.mode;
    modes.forEach(item => item.setAttribute('aria-pressed',String(item === button)));
    status.textContent = selected + ' study';
    canvas.setAttribute('aria-label', selected + ' line drawing');
    draw();
  }));
  let frame = 0;
  phase.addEventListener('input', () => {
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; draw(); });
  });
  draw();
  plot.classList.add('ready');
})();
