import { useCallback, useEffect, useRef, useState } from 'react';

type Piece = { shape: number[][]; color: number };
type ActivePiece = Piece & { x: number; y: number };
const W = 10;
const H = 20;
const SHAPES: number[][][][] = [
  [[1, 1, 1, 1]],
  [
    [1, 1],
    [1, 1],
  ],
  [
    [0, 1, 0],
    [1, 1, 1],
  ],
  [
    [1, 0, 0],
    [1, 1, 1],
  ],
  [
    [0, 0, 1],
    [1, 1, 1],
  ],
  [
    [0, 1, 1],
    [1, 1, 0],
  ],
  [
    [1, 1, 0],
    [0, 1, 1],
  ],
];
const COLORS = [
  '#42d9f4',
  '#ffe36e',
  '#b58aff',
  '#ff9b58',
  '#6887ff',
  '#65e6a6',
  '#ff6d91',
];
const emptyBoard = () =>
  Array.from({ length: H }, () => Array(W).fill(0) as number[]);
function randomPiece(): Piece {
  const i = Math.floor(Math.random() * SHAPES.length);
  return { shape: SHAPES[i], color: i + 1 };
}
function collides(
  board: number[][],
  piece: ActivePiece,
  dx = 0,
  dy = 0,
  shape = piece.shape
) {
  return shape.some((row, ry) =>
    row.some((cell, rx) => {
      if (!cell) return false;
      const x = piece.x + rx + dx;
      const y = piece.y + ry + dy;
      return x < 0 || x >= W || y >= H || (y >= 0 && board[y][x] !== 0);
    })
  );
}
function rotate(shape: number[][]) {
  return shape[0].map((_, x) => shape.map(row => row[x]).reverse());
}

export default function App() {
  const [board, setBoard] = useState<number[][]>(emptyBoard);
  const [piece, setPiece] = useState<ActivePiece>(() => ({
    ...randomPiece(),
    x: 3,
    y: 0,
  }));
  const [next, setNext] = useState<Piece>(() => randomPiece());
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const [sound, setSound] = useState(false);
  const boardRef = useRef(board);
  const pieceRef = useRef(piece);
  boardRef.current = board;
  pieceRef.current = piece;

  const spawn = useCallback((currentBoard: number[][], upcoming: Piece) => {
    const fresh = { ...upcoming, x: 3, y: 0 };
    const newNext = randomPiece();
    setNext(newNext);
    if (collides(currentBoard, fresh)) {
      setOver(true);
      setRunning(false);
    } else {
      setPiece(fresh);
    }
  }, []);

  const lockPiece = useCallback(
    (currentBoard: number[][], currentPiece: ActivePiece) => {
      const merged = currentBoard.map(row => [...row]);
      currentPiece.shape.forEach((row, y) =>
        row.forEach((cell, x) => {
          const by = currentPiece.y + y;
          const bx = currentPiece.x + x;
          if (cell && by >= 0 && by < H && bx >= 0 && bx < W)
            merged[by][bx] = currentPiece.color;
        })
      );
      const remaining = merged.filter(row => row.some(cell => cell === 0));
      const cleared = H - remaining.length;
      const newBoard = [
        ...Array.from({ length: cleared }, () => Array(W).fill(0) as number[]),
        ...remaining,
      ];
      setBoard(newBoard);
      if (cleared) {
        setLines(old => {
          const total = old + cleared;
          setLevel(Math.floor(total / 10) + 1);
          return total;
        });
        setScore(old => old + [0, 100, 300, 500, 800][cleared] * level);
      }
      spawn(newBoard, next);
    },
    [level, next, spawn]
  );

  const move = useCallback(
    (dx: number, dy: number) => {
      if (!running || over) return;
      const p = pieceRef.current;
      const b = boardRef.current;
      if (!collides(b, p, dx, dy)) {
        setPiece({ ...p, x: p.x + dx, y: p.y + dy });
        if (dy > 0) setScore(old => old + 1);
      } else if (dy > 0) {
        lockPiece(b, p);
      }
    },
    [lockPiece, over, running]
  );

  const turn = useCallback(() => {
    if (!running || over) return;
    const p = pieceRef.current;
    const rotated = rotate(p.shape);
    for (const kick of [0, -1, 1, -2, 2]) {
      if (!collides(boardRef.current, p, kick, 0, rotated)) {
        setPiece({ ...p, x: p.x + kick, shape: rotated });
        break;
      }
    }
  }, [over, running]);

  const hardDrop = useCallback(() => {
    if (!running || over) return;
    let p = pieceRef.current;
    const b = boardRef.current;
    while (!collides(b, p, 0, 1)) p = { ...p, y: p.y + 1 };
    setScore(old => old + Math.max(0, p.y - pieceRef.current.y) * 2);
    lockPiece(b, p);
  }, [lockPiece, over, running]);

  const startGame = () => {
    const freshBoard = emptyBoard();
    setBoard(freshBoard);
    setPiece({ ...randomPiece(), x: 3, y: 0 });
    setNext(randomPiece());
    setScore(0);
    setLines(0);
    setLevel(1);
    setOver(false);
    setRunning(true);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const keys = [
        'ArrowLeft',
        'ArrowRight',
        'ArrowDown',
        'ArrowUp',
        ' ',
        'Spacebar',
      ];
      if (keys.includes(event.key)) event.preventDefault();
      if (event.key === 'Enter' && (!running || over)) startGame();
      if (event.key === 'p' || event.key === 'P' || event.key === 'Escape')
        setRunning(value => !value);
      if (event.key === 'ArrowLeft') move(-1, 0);
      if (event.key === 'ArrowRight') move(1, 0);
      if (event.key === 'ArrowDown') move(0, 1);
      if (event.key === 'ArrowUp') turn();
      if (event.key === ' ' || event.key === 'Spacebar') hardDrop();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hardDrop, move, over, running, turn]);

  useEffect(() => {
    if (!running || over) return;
    const timer = window.setInterval(
      () => move(0, 1),
      Math.max(100, 720 - (level - 1) * 55)
    );
    return () => window.clearInterval(timer);
  }, [level, move, over, running]);

  const display = board.map(row => [...row]);
  piece.shape.forEach((row, y) =>
    row.forEach((cell, x) => {
      const by = piece.y + y;
      const bx = piece.x + x;
      if (cell && by >= 0 && by < H && bx >= 0 && bx < W)
        display[by][bx] = piece.color;
    })
  );
  const nextGrid = Array.from({ length: 4 }, (_, y) =>
    Array.from({ length: 4 }, (_, x) => next.shape[y]?.[x] || 0)
  );

  return (
    <main className="page-shell">
      <div className="game-wrap">
        <header className="topbar">
          <div className="brand-mark">▦</div>
          <div>
            <div className="eyebrow">ARCADE CLASSIC</div>
            <h1>
              BLOCK <span>DROP</span>
            </h1>
          </div>
          <button
            className={'sound-btn ' + (sound ? 'active' : '')}
            onClick={() => setSound(v => !v)}
            aria-label="Toggle sound effects"
          >
            {sound ? '♪' : '♫'}
          </button>
        </header>
        <nav className="site-nav" aria-label="Site navigation">
          <a href="#play">Play</a>
          <a href="#how-to-play">How to play</a>
          <a href="#about">About</a>
          <a href="#privacy">Privacy</a>
          <a href="#contact">Contact</a>
        </nav>
        <section className="intro">
          <span className="live-dot" /> READY WHEN YOU ARE{' '}
          <span className="intro-line" />
        </section>
        <div className="game-layout">
          <section className="board-frame" id="play" aria-label="Block Drop game board">
            <div className="board-top">
              <span>PLAYFIELD</span>
              <span>
                {running ? '● LIVE' : over ? '■ GAME OVER' : 'Ⅱ STANDBY'}
              </span>
            </div>
            <div className="board" role="grid" aria-label="Game grid">
              {display.flatMap((row, y) =>
                row.map((cell, x) => (
                  <div
                    role="gridcell"
                    key={y * W + x}
                    className={'cell ' + (cell ? 'filled c' + cell : '')}
                    style={
                      cell
                        ? {
                            backgroundColor: COLORS[cell - 1],
                            boxShadow:
                              'inset 0 0 0 1px rgba(255,255,255,.28), 0 0 9px ' +
                              COLORS[cell - 1] +
                              '35',
                          }
                        : undefined
                    }
                  />
                ))
              )}
              {!running && (
                <div className="board-overlay">
                  <div className="overlay-symbol">{over ? '✦' : '▦'}</div>
                  <h2>{over ? 'NICE RUN!' : 'READY TO STACK?'}</h2>
                  <p>
                    {over
                      ? 'Every great player tries again.'
                      : 'Clear lines. Beat your best.'}
                  </p>
                  <button className="primary-btn" onClick={startGame}>
                    {over ? 'PLAY AGAIN' : 'START GAME'} <span>→</span>
                  </button>
                </div>
              )}
              {running && (
                <div className="board-status">
                  LEVEL {level.toString().padStart(2, '0')}
                </div>
              )}
            </div>
            <div className="board-bottom">
              <span>10 × 20 GRID</span>
              <span>BLOCK DROP / 001</span>
            </div>
          </section>
          <aside className="side-panel">
            <div className="stat-card score-card">
              <div className="card-label">
                TOTAL SCORE <span>↗</span>
              </div>
              <div className="score-number">
                {score.toString().padStart(6, '0')}
              </div>
              <div className="score-foot">
                <span className="tiny-dot" /> KEEP IT GOING
              </div>
            </div>
            <div className="stat-row">
              <div className="stat-card mini-card">
                <div className="card-label">LINES</div>
                <div className="mini-number">
                  {lines.toString().padStart(2, '0')}
                </div>
              </div>
              <div className="stat-card mini-card">
                <div className="card-label">LEVEL</div>
                <div className="mini-number">
                  {level.toString().padStart(2, '0')}
                </div>
              </div>
            </div>
            <div className="stat-card next-card">
              <div className="card-label">
                UP NEXT <span>◈</span>
              </div>
              <div className="next-piece">
                {nextGrid.flatMap((row, y) =>
                  row.map((cell, x) => (
                    <div
                      key={y * 4 + x}
                      className={'next-cell ' + (cell ? 'on' : '')}
                      style={
                        cell
                          ? {
                              backgroundColor: COLORS[next.color - 1],
                              boxShadow:
                                '0 0 8px ' + COLORS[next.color - 1] + '55',
                            }
                          : undefined
                      }
                    />
                  ))
                )}
              </div>
              <p>PLAN YOUR NEXT MOVE</p>
            </div>
            <div className="controls-card">
              <div className="card-label">CONTROLS</div>
              <div className="key-row">
                <kbd>←</kbd>
                <kbd>↓</kbd>
                <kbd>→</kbd>
                <span>MOVE</span>
              </div>
              <div className="key-row">
                <kbd>↑</kbd>
                <span>ROTATE</span>
                <kbd className="wide">SPACE</kbd>
                <span>DROP</span>
              </div>
              <div className="key-row">
                <kbd>P</kbd>
                <span>PAUSE</span>
              </div>
            </div>
            <div className="side-actions">
              <button
                className="action-btn"
                onClick={() => setRunning(v => !v)}
                disabled={over || (!running && score === 0 && lines === 0)}
              >
                {running ? 'Ⅱ  PAUSE' : '▶  RESUME'}
              </button>
              <button className="action-btn restart" onClick={startGame}>
                ↻ RESTART
              </button>
            </div>
          </aside>
        </div>
        <section className="mobile-controls" aria-label="Touch controls">
          <div className="dpad">
            <button onClick={() => move(-1, 0)} aria-label="Move left">
              ←
            </button>
            <button onClick={() => move(0, 1)} aria-label="Soft drop">
              ↓
            </button>
            <button onClick={() => move(1, 0)} aria-label="Move right">
              →
            </button>
          </div>
          <div className="touch-actions">
            <button onClick={turn}>
              ↻<small>ROTATE</small>
            </button>
            <button onClick={hardDrop}>
              ⇊<small>DROP</small>
            </button>
          </div>
        </section>
        <section className="content-section" id="how-to-play">
          <div className="section-kicker">PLAYER GUIDE</div>
          <h2>How to Play Block Drop</h2>
          <p>Move each falling block into place to build complete horizontal lines. A completed line disappears and earns points. Keep the stack below the top of the board for as long as you can.</p>
          <div className="info-grid">
            <article className="info-card">
              <h3>Controls</h3>
              <ul>
                <li><strong>Left / Right arrows:</strong> move a block sideways.</li>
                <li><strong>Down arrow:</strong> soft drop one row.</li>
                <li><strong>Up arrow:</strong> rotate the block.</li>
                <li><strong>Space:</strong> hard drop the block.</li>
                <li><strong>P or Escape:</strong> pause or resume.</li>
                <li><strong>Touch controls:</strong> use the on-screen buttons on mobile.</li>
              </ul>
            </article>
            <article className="info-card">
              <h3>Scoring</h3>
              <ul>
                <li><strong>1 line:</strong> 100 points × current level.</li>
                <li><strong>2 lines:</strong> 300 points × current level.</li>
                <li><strong>3 lines:</strong> 500 points × current level.</li>
                <li><strong>4 lines:</strong> 800 points × current level.</li>
                <li>Soft drops earn 1 point per row; hard drops earn 2 points per row.</li>
                <li>The level increases after every 10 lines cleared.</li>
              </ul>
            </article>
          </div>
          <h3>Tips for a better run</h3>
          <ul>
            <li>Keep the stack low and avoid leaving holes that are difficult to fill.</li>
            <li>Check the next-piece preview before committing to a placement.</li>
            <li>Use rotation and the pause control to plan your next move.</li>
            <li>Try to clear several lines at once when the board gives you a safe opportunity.</li>
          </ul>
        </section>
        <section className="content-section" id="about">
          <div className="section-kicker">ABOUT THE GAME</div>
          <h2>A simple falling-block puzzle</h2>
          <p>Block Drop is a free browser-based falling-block puzzle made for quick, focused play on desktop and mobile. It includes a 10-by-20 playfield, colored pieces, a next-piece preview, score and level tracking, keyboard input, and touch controls.</p>
          <p>You can start a round without creating an account or installing software. The game runs in your browser, and scores are currently kept only in the active game session; this version does not provide accounts, online leaderboards, or cloud score saving.</p>
          <p>The aim is straightforward: place blocks carefully, clear lines, and see how long you can keep the board from filling.</p>
        </section>
        <section className="content-section" id="privacy">
          <div className="section-kicker">SITE INFORMATION</div>
          <h2>Privacy Policy</h2>
          <p><strong>Last updated: October 29, 2026</strong></p>
          <h3>Information used by the game</h3>
          <p>Block Drop does not ask you to create an account, and the current game code does not send your score or gameplay actions to a game server. Your score and board state are used to run the game in your browser and are not saved as an online profile.</p>
          <h3>Hosting and technical information</h3>
          <p>When you visit a website, the hosting provider and your browser may process technical information needed to deliver and secure the page, such as network and device information. This site also loads web fonts from Google Fonts, which may involve requests to Google's services.</p>
          <h3>Advertising and cookies</h3>
          <p>Google AdSense advertising is not enabled on this site yet. If advertising is enabled in the future, Google and its partners may use cookies or similar technologies to deliver, measure, and protect ads, subject to applicable settings, consent requirements, and Google's policies. You can learn more in <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer">Google's advertising information</a> and <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google's Privacy Policy</a>.</p>
          <h3>Your choices</h3>
          <p>You can control cookies through your browser settings. Blocking some cookies or external resources may affect how parts of the site load. If advertising is added, the site owner should update this policy to describe the actual ad settings and any consent tools used.</p>
          <h3>Policy updates</h3>
          <p>This policy may be updated when the site changes. The date above will be revised when material changes are made.</p>
        </section>
        <section className="content-section" id="contact">
          <div className="section-kicker">GET IN TOUCH</div>
          <h2>Contact</h2>
          <p>For questions about Block Drop, privacy, or reporting a problem, please contact the site owner.</p>
          <p>For questions about Block Drop, privacy, or reporting a problem, email <a href="mailto:vjanllier@gmail.com">vjanllier@gmail.com</a>.</p>
        </section>
        <footer>
          <span>MADE FOR THE LOVE OF THE GAME</span>
          <span>
            STACK SMART. STAY SHARP. <b>✦</b>
          </span>
          <nav className="footer-nav" aria-label="Footer navigation">
            <a href="#play">Play</a>
            <a href="#how-to-play">How to play</a>
            <a href="#about">About</a>
            <a href="#privacy">Privacy policy</a>
            <a href="#contact">Contact</a>
          </nav>
        </footer>
      </div>
    </main>
  );
}
