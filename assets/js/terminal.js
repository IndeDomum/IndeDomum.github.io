// Hidden terminal with three mini games. Loaded on demand by personal.js.
(() => {
  'use strict';
  if (window.IndeTerminal) return;

  const EMAIL = 'bolhoevetim@gmail.com';
  const SCORE_KEY = 'indedomum-terminal-scores';
  const MONO = '"DM Mono", ui-monospace, monospace';
  const SANS = '"Space Grotesk", sans-serif';
  const C = {
    bg: '#081b2b',
    paper: '#f8f4ed',
    coral: '#f16f5f',
    muted: '#a6b7c8',
    faint: 'rgba(255, 255, 255, .14)',
    green: '#60b889',
    blueA: '#5a4cf5',
    blueB: '#62c9f2',
  };

  const GAMES = {
    orbit: { title: 'Orbit Switch', blurb: 'switch rings to dodge the triangles', unit: 'pts', start: orbitGame },
    packet: { title: 'Packet Route', blurb: 'rotate tiles to connect the systems', unit: 'levels', start: packetGame },
    truck: { title: 'Load the Truck', blurb: 'pack the trailer before it departs', unit: '% full', start: truckGame },
  };

  const FILES = {
    'about.txt': [
      'Tim Bolhoeve, full-stack software engineer at GDB Logistics.',
      'Builds integrations (SnapLogic) and internal web apps (OutSystems).',
      'Previously: Python & Django. Based in Obdam, the Netherlands.',
    ],
    'skills.txt': [
      'integrations   SnapLogic',
      'low-code       OutSystems',
      'high-code      Python, Django',
      'data           Power BI, Excel',
      'workflow       AI-assisted development',
    ],
  };

  const PROJECTS = [
    ['system-integrations/', 'connecting apps and data flows'],
    ['low-code-apps/', 'internal OutSystems applications'],
    ['python-django/', 'high-code web applications'],
    ['full-stack/', 'frontend, backend and in between'],
  ];

  const rand = (n) => Math.floor(Math.random() * n);
  const pick = (list) => list[rand(list.length)];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const wrap = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));
  const shuffle = (list) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = rand(i + 1);
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  };

  function readScores() {
    try { return JSON.parse(localStorage.getItem(SCORE_KEY)) || {}; } catch { return {}; }
  }

  function recordScore(id, score) {
    const scores = readScores();
    const previous = scores[id] || 0;
    if (score > previous) {
      scores[id] = score;
      try { localStorage.setItem(SCORE_KEY, JSON.stringify(scores)); } catch { /* storage blocked */ }
    }
    return { isBest: score > previous, best: Math.max(score, previous) };
  }

  /* ---------- Terminal ---------- */

  let ui = null;
  let isOpen = false;
  let lastFocus = null;
  let game = null;
  const history = [];
  let historyIndex = 0;

  function promptNode() {
    const node = el('span', 'term-ps');
    node.append(el('span', 'term-user', 'visitor@indedomum'), el('span', 'term-path', ':~$'));
    return node;
  }

  function build() {
    const overlay = el('div', 'term-overlay');
    overlay.hidden = true;

    const win = el('div', 'term-window');
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-modal', 'true');
    win.setAttribute('aria-label', 'Terminal');

    const bar = el('div', 'term-bar');
    const dots = el('span', 'term-dots');
    dots.setAttribute('aria-hidden', 'true');
    dots.append(el('i'), el('i'), el('i'));
    const title = el('span', 'term-title', 'visitor@indedomum: ~');
    const close = el('button', 'term-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close terminal');
    bar.append(dots, title, close);

    const body = el('div', 'term-body');
    const output = el('div', 'term-output');
    output.setAttribute('aria-live', 'polite');
    const form = el('form', 'term-input-row');
    const label = el('label', 'term-prompt');
    label.htmlFor = 'term-input';
    label.append(promptNode());
    const input = el('input', 'term-input');
    Object.assign(input, { id: 'term-input', type: 'text', autocomplete: 'off', spellcheck: false });
    input.setAttribute('autocapitalize', 'off');
    form.append(label, input);
    body.append(output, form);

    const gameView = el('div', 'term-game');
    gameView.hidden = true;
    const hud = el('div', 'term-hud');
    const hudTitle = el('span', 'term-hud-title');
    const hudScore = el('span', 'term-hud-score');
    const quit = el('button', 'term-btn', 'Quit (Esc)');
    quit.type = 'button';
    hud.append(hudTitle, hudScore, quit);
    const stage = el('div', 'term-stage');
    const canvas = el('canvas');
    canvas.tabIndex = 0;
    stage.append(canvas);
    const controls = el('div', 'term-controls');
    gameView.append(hud, stage, controls);

    win.append(bar, body, gameView);
    overlay.append(win);
    document.body.append(overlay);

    close.addEventListener('click', closeTerminal);
    quit.addEventListener('click', quitGame);
    overlay.addEventListener('pointerdown', (event) => { if (event.target === overlay) closeTerminal(); });
    body.addEventListener('click', () => { if (!String(window.getSelection())) input.focus(); });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const line = input.value;
      input.value = '';
      run(line);
    });
    input.addEventListener('keydown', onInputKey);
    // On US-International layouts the backtick that opened the terminal is a dead key,
    // so it lands in the input together with the next letter typed ("`h").
    input.addEventListener('input', () => {
      if (!input.value.includes('`')) return;
      const caret = input.selectionStart - (input.value.slice(0, input.selectionStart).split('`').length - 1);
      input.value = input.value.replace(/`/g, '');
      input.setSelectionRange(caret, caret);
    });

    ui = { overlay, title, body, output, input, gameView, hudTitle, hudScore, stage, canvas, controls };

    print('Inde Domum terminal v1.0', 'term-ok');
    print("Type 'help' to see what you can do. Esc closes this window.", 'term-dim');
    print('');
  }

  function scrollDown() {
    ui.body.scrollTop = ui.body.scrollHeight;
  }

  function print(text = '', cls) {
    ui.output.append(el('div', cls ? `term-line ${cls}` : 'term-line', text));
    scrollDown();
  }

  function printRows(rows, width) {
    rows.forEach(([key, value]) => {
      const line = el('div', 'term-line');
      line.append(el('span', 'term-key', key.padEnd(width)), value);
      ui.output.append(line);
    });
    scrollDown();
  }

  const COMMANDS = {
    help() {
      printRows([
        ['help', 'show this list'],
        ['whoami', 'who is logged in'],
        ['ls [dir]', 'list files (try: ls games)'],
        ['cat <file>', 'print a file'],
        ['play <game>', 'start a game: orbit, packet or truck'],
        ['scores', 'your best scores'],
        ['sudo hire-tim', 'you know you want to'],
        ['clear', 'clear the screen'],
        ['exit', 'close the terminal'],
      ], 15);
    },
    whoami() {
      print('visitor');
      print("…but this is Tim's machine. Try 'cat about.txt'.", 'term-dim');
    },
    ls(args) {
      const target = (args[0] || '').replace(/\/$/, '');
      if (!target) return print('about.txt  games/  projects/  skills.txt');
      if (target === 'games') {
        printRows(Object.entries(GAMES).map(([id, def]) => [id, `${def.title}: ${def.blurb}`]), 9);
        return print('Start one with: play <name>', 'term-dim');
      }
      if (target === 'projects') return printRows(PROJECTS, 22);
      if (FILES[target]) return print(target);
      print(`ls: cannot access '${target}': No such file or directory`, 'term-error');
    },
    cat(args) {
      const name = (args[0] || '').replace(/\/$/, '');
      if (!name) return print('cat: missing file name', 'term-error');
      if (name === 'games' || name === 'projects') return print(`cat: ${name}: Is a directory`, 'term-error');
      if (!FILES[name]) return print(`cat: ${name}: No such file or directory`, 'term-error');
      FILES[name].forEach((line) => print(line));
    },
    play(args) {
      const id = (args[0] || '').toLowerCase();
      if (GAMES[id]) return startGame(id);
      if (id) print(`play: unknown game '${id}'`, 'term-error');
      COMMANDS.ls(['games']);
    },
    scores() {
      const scores = readScores();
      printRows(Object.entries(GAMES).map(([id, def]) => [def.title, scores[id] ? `${scores[id]} ${def.unit}` : '-']), 16);
    },
    sudo(args) {
      if (args.join(' ') !== 'hire-tim') {
        return print('visitor is not in the sudoers file. This incident will be reported.', 'term-error');
      }
      print('[sudo] password for visitor: ********', 'term-dim');
      print('Access granted. Opening a fresh email…', 'term-ok');
      const line = el('div', 'term-line');
      const link = el('a', 'term-link', EMAIL);
      link.href = `mailto:${EMAIL}?subject=${encodeURIComponent('I found your terminal')}`;
      line.append('→ ', link);
      ui.output.append(line);
      scrollDown();
      setTimeout(() => { window.location.href = link.href; }, 700);
    },
    clear() { ui.output.replaceChildren(); },
    exit() { closeTerminal(); },
    cd() { print('cd: permission denied. Nice try.', 'term-error'); },
    rm() { print("rm: let's not.", 'term-error'); },
    echo(args) { print(args.join(' ')); },
  };
  COMMANDS.quit = COMMANDS.exit;

  function run(raw) {
    const echo = el('div', 'term-line');
    echo.append(promptNode(), ` ${raw}`);
    ui.output.append(echo);
    const line = raw.trim();
    if (line) {
      history.push(line);
      historyIndex = history.length;
      const [name, ...args] = line.split(/\s+/);
      const command = COMMANDS[name.toLowerCase()];
      if (command) command(args);
      else print(`${name}: command not found. Type 'help' for options.`, 'term-error');
    }
    if (ui.gameView.hidden) scrollDown();
  }

  function onInputKey(event) {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      if (!history.length) return;
      event.preventDefault();
      historyIndex = clamp(historyIndex + (event.key === 'ArrowUp' ? -1 : 1), 0, history.length);
      ui.input.value = history[historyIndex] || '';
    } else if (event.key === 'Tab') {
      event.preventDefault();
      complete();
    } else if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault();
      COMMANDS.clear();
    }
  }

  function complete() {
    const parts = ui.input.value.split(' ');
    const word = parts[parts.length - 1];
    const options = parts.length === 1 ? ['help', 'whoami', 'ls', 'cat', 'play', 'scores', 'sudo', 'clear', 'exit']
      : { play: Object.keys(GAMES), ls: ['games/', 'projects/'], cat: Object.keys(FILES), sudo: ['hire-tim'] }[parts[0]] || [];
    const matches = options.filter((option) => option.startsWith(word));
    if (matches.length === 1) {
      parts[parts.length - 1] = matches[0];
      ui.input.value = parts.join(' ') + (parts.length === 1 ? ' ' : '');
    } else if (matches.length > 1) {
      print(matches.join('  '), 'term-dim');
    }
  }

  function openTerminal() {
    if (!ui) build();
    if (isOpen) return;
    isOpen = true;
    lastFocus = document.activeElement;
    ui.overlay.hidden = false;
    document.documentElement.classList.add('term-locked');
    window.addEventListener('keydown', onWindowKey, true);
    ui.input.focus();
  }

  function closeTerminal() {
    if (!isOpen) return;
    if (game) quitGame();
    isOpen = false;
    ui.overlay.hidden = true;
    document.documentElement.classList.remove('term-locked');
    window.removeEventListener('keydown', onWindowKey, true);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function onWindowKey(event) {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    if (game) quitGame();
    else closeTerminal();
  }

  /* ---------- Game runner ---------- */

  function stopGame() {
    if (game) game.stop();
    game = null;
  }

  function quitGame() {
    const id = game && game.id;
    stopGame();
    ui.gameView.hidden = true;
    ui.body.hidden = false;
    ui.controls.replaceChildren();
    ui.title.textContent = 'visitor@indedomum: ~';
    if (id) print(`[${GAMES[id].title}] exited.`, 'term-dim');
    ui.input.focus();
  }

  function startGame(id) {
    stopGame();
    const def = GAMES[id];
    ui.body.hidden = true;
    ui.gameView.hidden = false;
    ui.title.textContent = `visitor@indedomum: ~/games/${id}`;
    ui.hudTitle.textContent = def.title;
    ui.hudScore.textContent = '';
    ui.controls.replaceChildren();

    const { canvas } = ui;
    canvas.style.width = '0';
    canvas.style.height = '0';
    const W = Math.max(280, Math.floor(ui.stage.clientWidth));
    const H = Math.max(240, Math.floor(ui.stage.clientHeight));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    canvas.setAttribute('aria-label', `${def.title} game`);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cleanups = [];
    let frame = 0;
    const session = {
      id,
      stopped: false,
      stop() {
        session.stopped = true;
        cancelAnimationFrame(frame);
        cleanups.splice(0).forEach((fn) => fn());
      },
    };
    game = session;

    const api = {
      ctx, canvas, W, H,
      on(target, type, fn, options) {
        target.addEventListener(type, fn, options);
        cleanups.push(() => target.removeEventListener(type, fn, options));
      },
      loop(step) {
        let last = performance.now();
        const tick = (now) => {
          if (session.stopped) return;
          const dt = Math.min((now - last) / 1000, 0.05);
          last = now;
          step(dt);
          if (!session.stopped) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      hud(text) { ui.hudScore.textContent = text; },
      button(text, fn) {
        const button = el('button', 'term-btn', text);
        button.type = 'button';
        button.addEventListener('click', () => { fn(); canvas.focus(); });
        ui.controls.append(button);
      },
      point(event) {
        const rect = canvas.getBoundingClientRect();
        return { x: (event.clientX - rect.left) * W / rect.width, y: (event.clientY - rect.top) * H / rect.height };
      },
      over(score, headline) {
        session.stop();
        ui.controls.replaceChildren();
        const { isBest, best } = recordScore(id, score);
        drawGameOver(ctx, W, H, headline, `${score} ${def.unit}`,
          isBest && score > 0 ? 'New best!' : `Best: ${best} ${def.unit}`);
        // Short delay so a key mashed during play doesn't instantly restart.
        const readyAt = performance.now() + 500;
        const again = (event) => {
          if (event.type === 'keydown' && event.key !== ' ' && event.key !== 'Enter') return;
          if (performance.now() < readyAt) return;
          event.preventDefault();
          startGame(id);
        };
        api.on(window, 'keydown', again);
        api.on(canvas, 'pointerdown', again);
      },
    };

    def.start(api);
    canvas.focus();
  }

  function drawGameOver(ctx, W, H, headline, score, best) {
    ctx.fillStyle = 'rgba(8, 27, 43, .84)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = C.coral;
    ctx.font = `500 13px ${MONO}`;
    ctx.fillText(headline.toUpperCase(), W / 2, H / 2 - 50);
    ctx.fillStyle = C.paper;
    ctx.font = `700 36px ${SANS}`;
    ctx.fillText(score, W / 2, H / 2 - 10);
    ctx.fillStyle = C.muted;
    ctx.font = `400 13px ${MONO}`;
    ctx.fillText(best, W / 2, H / 2 + 26);
    ctx.font = `400 12px ${MONO}`;
    ctx.fillText('space / tap: again · esc: quit', W / 2, H / 2 + 58);
  }

  function triangle(ctx, x, y, size, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.6, size * 0.85);
    ctx.lineTo(-size * 0.6, -size * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* ---------- Game 1: Orbit Switch ---------- */

  function orbitGame(api) {
    const { ctx, W, H } = api;
    const cx = W / 2;
    const cy = H / 2;
    const base = Math.min(W, H);
    const rings = [base * 0.24, base * 0.4];
    const player = { ring: 0, angle: -Math.PI / 2, r: rings[0] };
    const foes = [];
    let time = 0;
    let spawnIn = 1;

    const toggle = () => { player.ring = 1 - player.ring; };
    api.on(window, 'keydown', (event) => {
      if ([' ', 'Enter', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.preventDefault();
        toggle();
      }
    });
    api.on(api.canvas, 'pointerdown', (event) => { event.preventDefault(); toggle(); });

    function spawn(relativeSpeed) {
      const angle = player.angle + 2.4 + Math.random() * 0.6;
      // Foes on opposite rings need enough spacing that switching between them stays possible.
      const gap = 0.3 * relativeSpeed;
      const crowded = (ring) => foes.some((foe) => foe.ring === ring && Math.abs(wrap(foe.angle - angle)) < gap);
      let ring = rand(2);
      if (crowded(1 - ring)) ring = 1 - ring;
      if (crowded(1 - ring)) return;
      foes.push({ ring, angle, color: pick([C.blueA, C.blueB]) });
    }

    api.loop((dt) => {
      time += dt;
      const pace = 1 + time / 35;
      player.angle += 1.5 * pace * dt;
      player.r += (rings[player.ring] - player.r) * Math.min(1, dt * 18);

      spawnIn -= dt;
      if (spawnIn <= 0) {
        spawn(2.2 * pace);
        spawnIn = Math.max(0.38, 1.1 - time / 80) * (0.75 + Math.random() * 0.5);
      }

      const px = cx + Math.cos(player.angle) * player.r;
      const py = cy + Math.sin(player.angle) * player.r;
      for (let i = foes.length - 1; i >= 0; i--) {
        const foe = foes[i];
        foe.angle -= 0.7 * pace * dt;
        if (wrap(foe.angle - player.angle) < -0.5) foes.splice(i, 1);
      }

      const score = Math.floor(time * 10);
      api.hud(`${score} pts`);

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(241, 111, 95, .6)';
      ctx.beginPath();
      ctx.arc(cx, cy, rings[0], 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, .22)';
      ctx.beginPath();
      ctx.arc(cx, cy, rings[1], 0, Math.PI * 2);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(248, 244, 237, .12)';
      ctx.font = `700 ${Math.round(base * 0.14)}px ${SANS}`;
      ctx.fillText(score, cx, cy);

      let hit = false;
      foes.forEach((foe) => {
        const fx = cx + Math.cos(foe.angle) * rings[foe.ring];
        const fy = cy + Math.sin(foe.angle) * rings[foe.ring];
        ctx.fillStyle = foe.color;
        triangle(ctx, fx, fy, 10, foe.angle - Math.PI / 2);
        if (Math.hypot(fx - px, fy - py) < 14) hit = true;
      });

      ctx.fillStyle = 'rgba(241, 111, 95, .25)';
      ctx.beginPath();
      ctx.arc(px, py, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.coral;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();

      if (time < 3) {
        ctx.fillStyle = C.muted;
        ctx.font = `400 12px ${MONO}`;
        ctx.fillText('space / tap: switch rings', cx, H - 18);
      }

      if (hit) api.over(score, 'Hit a triangle');
    });
  }

  /* ---------- Game 2: Packet Route ---------- */

  function packetGame(api) {
    const { ctx, W, H } = api;
    const SYSTEMS = ['ERP', 'WMS', 'TMS', 'FMS', 'CRM', 'EDI', 'API', 'BI'];
    // Tile openings as bits: N=1, E=2, S=4, W=8.
    const DIRS = [
      { bit: 1, dr: -1, dc: 0, opp: 4 },
      { bit: 2, dr: 0, dc: 1, opp: 8 },
      { bit: 4, dr: 1, dc: 0, opp: 1 },
      { bit: 8, dr: 0, dc: -1, opp: 2 },
    ];
    const rotate = (mask) => ((mask << 1) | (mask >> 3)) & 15;

    let level = 0;
    let n = 4;
    let tiles = [];
    let src = [0, 0];
    let dst = [0, 0];
    let names = [];
    let timeLeft = 0;
    let timeTotal = 1;
    let cursor = [0, 0];
    let showCursor = false;
    let solvedFor = 0;
    let lit = new Set();
    let cell = 0;
    let gx = 0;
    let gy = 0;

    const key = (r, c) => r * n + c;
    const inside = (r, c) => r >= 0 && c >= 0 && r < n && c < n;

    function findPath() {
      const seen = new Set([key(...src)]);
      const path = [src];
      const walk = ([r, c]) => {
        if (r === dst[0] && c === dst[1]) return true;
        for (const d of shuffle(DIRS.slice())) {
          const next = [r + d.dr, c + d.dc];
          if (!inside(...next) || seen.has(key(...next))) continue;
          seen.add(key(...next));
          path.push(next);
          if (walk(next)) return true;
          path.pop();
        }
        return false;
      };
      walk(src);
      return path;
    }

    function flow() {
      const seen = new Set();
      if (!(tiles[src[0]][src[1]] & 8)) return { seen, solved: false };
      const queue = [src];
      seen.add(key(...src));
      while (queue.length) {
        const [r, c] = queue.shift();
        DIRS.forEach((d) => {
          const nr = r + d.dr;
          const nc = c + d.dc;
          if (!(tiles[r][c] & d.bit) || !inside(nr, nc) || !(tiles[nr][nc] & d.opp) || seen.has(key(nr, nc))) return;
          seen.add(key(nr, nc));
          queue.push([nr, nc]);
        });
      }
      return { seen, solved: seen.has(key(...dst)) && Boolean(tiles[dst[0]][dst[1]] & 2) };
    }

    function newLevel() {
      level++;
      n = Math.min(7, 4 + Math.floor((level - 1) / 2));
      src = [rand(n), 0];
      dst = [rand(n), n - 1];
      names = shuffle(SYSTEMS.slice()).slice(0, 2);
      tiles = Array.from({ length: n }, () => Array.from({ length: n }, () => pick([5, 3, 3, 7, 5])));

      const path = findPath();
      const towards = (a, b) => DIRS.find((d) => a[0] + d.dr === b[0] && a[1] + d.dc === b[1]).bit;
      path.forEach((at, i) => {
        const from = i === 0 ? 8 : towards(at, path[i - 1]);
        const to = i === path.length - 1 ? 2 : towards(at, path[i + 1]);
        tiles[at[0]][at[1]] = from | to;
      });
      tiles.forEach((row) => row.forEach((mask, c) => {
        let turned = mask;
        for (let k = rand(4); k > 0; k--) turned = rotate(turned);
        row[c] = turned;
      }));
      if (flow().solved) tiles[src[0]][src[1]] = rotate(tiles[src[0]][src[1]]);

      timeTotal = timeLeft = Math.round(12 + n * n * 0.9 - level);
      cursor = [...src];
      lit = flow().seen;
      cell = Math.floor(Math.min((W - 120) / n, (H - 40) / n));
      gx = Math.round((W - cell * n) / 2);
      gy = Math.round((H - cell * n) / 2) - 4;
    }

    function turn(r, c) {
      if (solvedFor > 0) return;
      tiles[r][c] = rotate(tiles[r][c]);
      const result = flow();
      lit = result.seen;
      if (result.solved) solvedFor = 1.1;
    }

    api.on(api.canvas, 'pointerdown', (event) => {
      event.preventDefault();
      const p = api.point(event);
      const c = Math.floor((p.x - gx) / cell);
      const r = Math.floor((p.y - gy) / cell);
      if (!inside(r, c)) return;
      showCursor = false;
      cursor = [r, c];
      turn(r, c);
    });
    api.on(window, 'keydown', (event) => {
      const moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
      if (moves[event.key]) {
        event.preventDefault();
        showCursor = true;
        cursor = [clamp(cursor[0] + moves[event.key][0], 0, n - 1), clamp(cursor[1] + moves[event.key][1], 0, n - 1)];
      } else if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        showCursor = true;
        turn(...cursor);
      }
    });

    function systemBox(text, x, y, active) {
      ctx.strokeStyle = active ? C.coral : C.muted;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - 21, y - 12, 42, 24);
      ctx.fillStyle = active ? C.coral : C.muted;
      ctx.font = `500 12px ${MONO}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y);
    }

    function draw() {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      const solved = solvedFor > 0;
      const pipe = Math.max(4, cell * 0.18);

      const sy = gy + src[0] * cell + cell / 2;
      const dy = gy + dst[0] * cell + cell / 2;
      ctx.lineWidth = pipe;
      ctx.lineCap = 'butt';
      ctx.strokeStyle = solved ? C.green : C.coral;
      ctx.beginPath();
      ctx.moveTo(gx - 30, sy);
      ctx.lineTo(gx, sy);
      ctx.stroke();
      ctx.strokeStyle = solved ? C.green : 'rgba(166, 183, 200, .55)';
      ctx.beginPath();
      ctx.moveTo(gx + n * cell, dy);
      ctx.lineTo(gx + n * cell + 30, dy);
      ctx.stroke();
      systemBox(names[0], gx - 34, sy, true);
      systemBox(names[1], gx + n * cell + 34, dy, solved);

      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const x = gx + c * cell;
          const y = gy + r * cell;
          const mx = x + cell / 2;
          const my = y + cell / 2;
          ctx.fillStyle = 'rgba(255, 255, 255, .035)';
          ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
          const on = lit.has(key(r, c));
          ctx.strokeStyle = ctx.fillStyle = on ? (solved ? C.green : C.coral) : 'rgba(166, 183, 200, .55)';
          ctx.lineWidth = pipe;
          DIRS.forEach((d) => {
            if (!(tiles[r][c] & d.bit)) return;
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(mx + d.dc * cell / 2, my + d.dr * cell / 2);
            ctx.stroke();
          });
          ctx.beginPath();
          ctx.arc(mx, my, pipe * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (showCursor) {
        ctx.strokeStyle = C.paper;
        ctx.lineWidth = 2;
        ctx.strokeRect(gx + cursor[1] * cell + 2, gy + cursor[0] * cell + 2, cell - 4, cell - 4);
      }

      ctx.fillStyle = C.faint;
      ctx.fillRect(gx, gy + n * cell + 10, n * cell, 3);
      ctx.fillStyle = timeLeft < 5 ? C.coral : C.muted;
      ctx.fillRect(gx, gy + n * cell + 10, n * cell * clamp(timeLeft / timeTotal, 0, 1), 3);
    }

    newLevel();
    api.loop((dt) => {
      if (solvedFor > 0) {
        solvedFor -= dt;
        if (solvedFor <= 0) {
          solvedFor = 0;
          newLevel();
        }
      } else {
        timeLeft -= dt;
      }
      api.hud(`level ${level} · ${Math.max(0, Math.ceil(timeLeft))}s`);
      draw();
      if (timeLeft <= 0) api.over(level - 1, 'Packet timed out');
    });
  }

  /* ---------- Game 3: Load the Truck ---------- */

  function truckGame(api) {
    const { ctx, W, H } = api;
    const COLS = 10;
    const ROWS = 6;
    const SIZES = [[1, 1], [2, 1], [1, 2], [2, 2], [3, 1], [3, 2], [2, 3], [1, 1], [2, 1]];
    const SHADES = ['#d7b69d', '#c9a184', '#e2c7b0', '#bf9474'];
    const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    const placed = [];
    const cell = Math.floor(Math.min((W - 40) / (COLS + 2), (H - 24) / (ROWS + 4.4)));
    const tw = COLS * cell;
    const th = ROWS * cell;
    const tx = Math.round((W - tw - cell * 1.6) / 2);
    const ty = Math.round(H - th - cell * 0.9 - 8);

    const newCrate = (col = 4) => {
      const [w, h] = pick(SIZES);
      return { w, h, col: clamp(col, 0, COLS - w), shade: pick(SHADES) };
    };
    let crate = newCrate();
    let next = newCrate();
    let time = 75;
    let misses = 0;
    let filled = 0;
    let drop = null;
    let flash = 0;

    const fits = (c, top) => {
      for (let r = top; r < top + c.h; r++) {
        for (let k = c.col; k < c.col + c.w; k++) {
          if (r >= ROWS || k >= COLS || grid[r][k]) return false;
        }
      }
      return true;
    };
    const landing = (c) => {
      if (!fits(c, 0)) return -1;
      let top = 0;
      while (fits(c, top + 1)) top++;
      return top;
    };
    const aim = (col) => { crate.col = clamp(col, 0, COLS - crate.w); };
    const turn = () => {
      if (drop) return;
      [crate.w, crate.h] = [crate.h, crate.w];
      aim(crate.col);
    };
    const advance = () => {
      crate = { ...next, col: clamp(crate.col, 0, COLS - next.w) };
      next = newCrate();
    };
    const percent = () => Math.round(filled / (COLS * ROWS) * 100);
    const finish = (headline) => {
      draw();
      api.over(percent(), headline);
    };

    function release() {
      if (drop) return;
      const top = landing(crate);
      if (top < 0) {
        misses++;
        flash = 0.9;
        if (misses >= 3) return finish('Trailer departed');
        return advance();
      }
      drop = { crate, y: -crate.h - 0.25, to: top };
    }

    const colAt = (event) => Math.round((api.point(event).x - tx) / cell - crate.w / 2);
    api.on(api.canvas, 'pointermove', (event) => { if (event.pointerType === 'mouse' && !drop) aim(colAt(event)); });
    api.on(api.canvas, 'pointerdown', (event) => {
      event.preventDefault();
      if (drop) return;
      aim(colAt(event));
      release();
    });
    api.on(window, 'keydown', (event) => {
      const actions = {
        ArrowLeft: () => aim(crate.col - 1),
        ArrowRight: () => aim(crate.col + 1),
        ArrowUp: turn,
        r: turn,
        R: turn,
        ' ': release,
        Enter: release,
        ArrowDown: release,
      };
      if (!actions[event.key]) return;
      event.preventDefault();
      if (!drop) actions[event.key]();
    });
    api.button('Rotate crate (R)', turn);

    function drawCrate(c, x, y, size, alpha = 1) {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = c.shade;
      ctx.fillRect(x + 1.5, y + 1.5, c.w * size - 3, c.h * size - 3);
      ctx.strokeStyle = 'rgba(8, 27, 43, .35)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 1.5, y + 1.5, c.w * size - 3, c.h * size - 3);
      ctx.fillStyle = 'rgba(248, 244, 237, .35)';
      ctx.fillRect(x + 1.5, y + c.h * size / 2 - 2, c.w * size - 3, 4);
      ctx.globalAlpha = 1;
    }

    function draw() {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      const groundY = ty + th + cell * 0.9;
      ctx.strokeStyle = C.faint;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(W, groundY);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, .04)';
      ctx.fillRect(tx, ty, tw, th);
      ctx.strokeStyle = 'rgba(255, 255, 255, .06)';
      for (let k = 1; k < COLS; k++) {
        ctx.beginPath();
        ctx.moveTo(tx + k * cell, ty);
        ctx.lineTo(tx + k * cell, ty + th);
        ctx.stroke();
      }

      const cabX = tx + tw + cell * 0.15;
      const cabW = cell * 1.3;
      const cabH = th * 0.62;
      ctx.fillStyle = C.coral;
      ctx.fillRect(cabX, ty + th - cabH, cabW, cabH);
      ctx.fillStyle = 'rgba(248, 244, 237, .7)';
      ctx.fillRect(cabX + cabW * 0.45, ty + th - cabH + cell * 0.25, cabW * 0.4, cabH * 0.32);

      const wheelY = ty + th + cell * 0.45;
      [tx + cell * 1.2, tx + tw - cell * 1.4, cabX + cabW / 2].forEach((x) => {
        ctx.fillStyle = '#0b1f31';
        ctx.strokeStyle = C.muted;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, wheelY, cell * 0.38, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      placed.forEach((c) => drawCrate(c, tx + c.col * cell, ty + c.top * cell, cell));

      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 2;
      ctx.strokeRect(tx, ty, tw, th);

      if (drop) {
        drawCrate(drop.crate, tx + drop.crate.col * cell, ty + drop.y * cell, cell);
      } else {
        const top = landing(crate);
        if (top >= 0) {
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = C.coral;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(tx + crate.col * cell + 2, ty + top * cell + 2, crate.w * cell - 4, crate.h * cell - 4);
          ctx.setLineDash([]);
        }
        drawCrate(crate, tx + crate.col * cell, ty - (crate.h + 0.25) * cell, cell, top >= 0 ? 1 : 0.45);
      }

      const mini = Math.max(6, cell * 0.35);
      ctx.fillStyle = C.muted;
      ctx.font = `400 11px ${MONO}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('next', 10, 10);
      drawCrate(next, 10, 28, mini);

      if (flash > 0) {
        ctx.fillStyle = C.coral;
        ctx.font = `500 14px ${MONO}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("Doesn't fit!", tx + tw / 2, ty + th / 2);
      }
    }

    api.loop((dt) => {
      time -= dt;
      flash = Math.max(0, flash - dt);
      if (drop) {
        drop.y += dt * 22;
        if (drop.y >= drop.to) {
          const c = drop.crate;
          for (let r = drop.to; r < drop.to + c.h; r++) {
            for (let k = c.col; k < c.col + c.w; k++) grid[r][k] = true;
          }
          placed.push({ ...c, top: drop.to });
          filled += c.w * c.h;
          drop = null;
          if (filled === COLS * ROWS) return finish('Perfect load!');
          advance();
        }
      }
      if (time <= 0) return finish('Trailer departed');
      api.hud(`${percent()}% full · ${Math.ceil(time)}s · misses ${misses}/3`);
      draw();
    });
  }

  window.IndeTerminal = { open: openTerminal, close: closeTerminal, isOpen: () => isOpen };
})();
