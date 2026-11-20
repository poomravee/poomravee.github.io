(() => {
  const bench = document.querySelector('#workbench');
  if (typeof bench.showModal !== 'function') return;
  const projectButtons = [...bench.querySelectorAll('[data-load]')];
  const panels = [...bench.querySelectorAll('[data-panel]')];
  const board = bench.querySelector('.game-board');
  const status = bench.querySelector('.game-status');
  const map = ['#########', '#..#...L#', '#....#..#', '#H......#', '#########'];
  const snakePath = [[6,1], [6,2], [6,3], [6,2]];
  const directions = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };
  const keys = { ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right' };
  const spriteFolder = 'assets/lobster-hunting/';
  let player, turn, carrying, finished, currentProject;
  const cells = [];
  for (const tile of map.join('')) {
    const cell = document.createElement('span');
    if (tile === '#') cell.style.backgroundImage = 'url('+spriteFolder+'tree.png)';
    if (tile === 'H') cell.style.backgroundImage = 'url('+spriteFolder+'home.png)';
    board.append(cell);
    cells.push(cell);
  }
  function addSprite(x,y,name) {
    const image = document.createElement('img');
    image.src = spriteFolder + name + '.png';
    image.alt = '';
    cells[y*9+x].append(image);
  }
  function render(message) {
    board.querySelectorAll('img').forEach(sprite => sprite.remove());
    if (!carrying) addSprite(7,1,'lobster');
    const [sx,sy] = snakePath[turn % snakePath.length];
    addSprite(sx,sy,'snakeright');
    addSprite(...player,'girlright');
    board.setAttribute('aria-label', 'Forest grid. You are at column '+(player[0]+1)+', row '+(player[1]+1)+'. Snake at column '+(sx+1)+', row '+(sy+1)+'.');
    status.textContent = message;
    bench.querySelectorAll('[data-step]').forEach(button => button.disabled = finished);
  }
  function restart() {
    player = [1,3];
    turn = 0;
    carrying = finished = false;
    render('Find the lobster in the upper right.');
  }
  function move(direction) {
    if (finished) return;
    const [dx,dy] = directions[direction];
    const x = player[0]+dx, y = player[1]+dy;
    if (map[y]?.[x] === '#') { status.textContent = 'Trees ahead. Try another direction.'; return; }
    const previousSnake = snakePath[turn % snakePath.length];
    const snake = snakePath[++turn % snakePath.length];
    const crossed = x === previousSnake[0] && y === previousSnake[1] && player[0] === snake[0] && player[1] === snake[1];
    player = [x,y];
    if (crossed || (x === snake[0] && y === snake[1])) {
      finished = true;
      render('The snake caught you. Restart to try again.');
      return;
    }
    if (map[y][x] === 'L') carrying = true;
    finished = carrying && map[y][x] === 'H';
    render(finished ? 'Home with the lobster! You finished in '+turn+' steps.' : carrying ? 'Lobster collected. Return to the house.' : 'Find the lobster in the upper right.');
  }
  function select(project) {
    currentProject = project;
    projectButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.load === project)));
    panels.forEach(panel => panel.hidden = panel.dataset.panel !== project);
    if (project === 'game' && !player) restart();
  }
  document.querySelectorAll('[data-open]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => {
      select(button.dataset.open);
      bench.showModal();
      bench.querySelector('[data-load="'+currentProject+'"]').focus();
    });
  });
  projectButtons.forEach(button => button.addEventListener('click', () => select(button.dataset.load)));
  bench.querySelector('.close-bench').addEventListener('click', () => bench.close());
  bench.querySelector('.restart').addEventListener('click',restart);
  bench.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => move(button.dataset.step)));
  bench.addEventListener('keydown', event => {
    if (currentProject === 'game' && keys[event.key]) {
      event.preventDefault();
      move(keys[event.key]);
    }
  });
  const spend = bench.querySelector('#spend');
  const dollars = new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});
  spend.addEventListener('input', () => {
    const amount = Number(spend.value);
    bench.querySelector('#spend-total').value = dollars.format(amount);
    bench.querySelector('#savings-total').textContent = dollars.format(2000-amount);
    bench.querySelector('.budget-bar i').style.width = (amount/2000*100)+'%';
  });
})();
