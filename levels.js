// levels.js — 20 levels across 4 chapters
// grid cell values: 0=empty, 1=obstacle(tree), 'S'=start, 'E'=end, 'G'=gas station

const CHAPTERS = [
  { name: '🌱 学会直线和转弯', levels: [1,2,3,4,5] },
  { name: '⛰️ 绕过障碍',       levels: [6,7,8,9,10] },
  { name: '🏔️ 高手挑战',       levels: [11,12,13,14,15] },
  { name: '🔥 燃料挑战',       levels: [16,17,18,19,20] },
];

const LEVELS = [
  // ==================== Chapter 1: 🌱 学会直线和转弯 ====================
  // 1-1: 纯直线 S→E
  {
    rows: 5, cols: 5,
    grid: [
      [0, 0, 0, 0, 0],
      [0,'S', 0, 'E',0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ],
    startDir: 'right',
    pieces: { 'straight-h': 2 },
    stars: [2, 3],
  },
  // 1-2: 更长直线 6列
  {
    rows: 5, cols: 6,
    grid: [
      [0, 0, 0, 0, 0, 0],
      [0,'S', 0, 0,'E', 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ],
    startDir: 'right',
    pieces: { 'straight-h': 3 },
    stars: [3, 4],
  },
  // 1-3: L形右下 S(1,1)→E(3,3)
  {
    rows: 5, cols: 5,
    grid: [
      [0, 0, 0, 0, 0],
      [0,'S', 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0,'E', 0],
      [0, 0, 0, 0, 0],
    ],
    startDir: 'right',
    pieces: { 'straight-h': 2, 'straight-v': 2, 'turn-ld': 1 },
    stars: [5, 6],
  },
  // 1-4: L形右上 S(3,1)→E(1,3)
  {
    rows: 5, cols: 5,
    grid: [
      [0, 0, 0, 0, 0],
      [0, 0, 0,'E', 0],
      [0, 0, 0, 0, 0],
      [0,'S', 0, 0, 0],
      [0, 0, 0, 0, 0],
    ],
    startDir: 'right',
    pieces: { 'straight-h': 2, 'straight-v': 2, 'turn-lu': 1 },
    stars: [5, 6],
  },
  // 1-5: Z字形 S(1,1)→E(3,4)
  {
    rows: 5, cols: 6,
    grid: [
      [0, 0, 0, 0, 0, 0],
      [0,'S', 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0,'E', 0],
      [0, 0, 0, 0, 0, 0],
    ],
    startDir: 'right',
    pieces: { 'straight-h': 4, 'straight-v': 1, 'turn-ld': 1, 'turn-ru': 1 },
    stars: [6, 8],
  },

  // ==================== Chapter 2: ⛰️ 绕过障碍 ====================
  // 2-1: U形绕行
  {
    rows: 5, cols: 6,
    grid: [
      [0, 0, 0, 0, 0, 0],
      [0,'S', 0, 1, 'E',0],
      [0, 0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ],
    startDir: 'right',
    pieces: { 'straight-h': 3, 'straight-v': 2, 'turn-ld': 1, 'turn-ru': 1, 'turn-lu': 1 },
    stars: [6, 8],
  },
  // 2-2: 起点向下出发
  {
    rows: 5, cols: 6,
    grid: [
      [0, 0, 0, 0, 0, 0],
      [0,'S', 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0],
      [0, 0, 0, 0,'E', 0],
      [0, 0, 0, 0, 0, 0],
    ],
    startDir: 'down',
    pieces: { 'straight-h': 3, 'straight-v': 1, 'turn-rd': 1, 'turn-lu': 1 },
    stars: [5, 7],
  },
  // 2-3: S形弯道 7列
  {
    rows: 5, cols: 7,
    grid: [
      [0, 0, 0, 0, 0, 0, 0],
      [0,'S', 0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0,'E', 0],
      [0, 0, 0, 0, 0, 0, 0],
    ],
    startDir: 'right',
    pieces: { 'straight-h': 4, 'straight-v': 2, 'turn-ld': 1, 'turn-ru': 1, 'turn-rd': 1, 'turn-lu': 1 },
    stars: [8, 11],
  },
  // 2-4: 山间穿行
  {
    rows: 5, cols: 6,
    grid: [
      [0, 0, 0, 0, 0, 0],
      [0,'S', 1, 0, 0, 0],
      [0, 0, 0, 0, 1, 0],
      [0, 1, 0, 0,'E', 0],
      [0, 0, 0, 0, 0, 0],
    ],
    startDir: 'down',
    pieces: { 'straight-h': 3, 'straight-v': 2, 'turn-rd': 1, 'turn-ld': 1, 'turn-ru': 1, 'turn-lu': 1 },
    stars: [7, 9],
  },
  // 2-5: 绕过2x2大障碍块
  {
    rows: 5, cols: 7,
    grid: [
      [0, 0, 0, 0, 0, 0, 0],
      [0,'S', 0, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 0, 0],
      [0, 0, 0, 0, 0,'E', 0],
      [0, 0, 0, 0, 0, 0, 0],
    ],
    startDir: 'right',
    pieces: { 'straight-h': 3, 'straight-v': 3, 'turn-ld': 1, 'turn-ru': 1, 'turn-rd': 1, 'turn-lu': 1 },
    stars: [8, 11],
  },

  // ==================== Chapter 3: 🏔️ 高手挑战 ====================
  // 3-1: 山谷蜿蜒
  {
    rows: 6, cols: 6,
    grid: [
      [0, 0, 0, 0, 0, 0],
      [0,'S', 0, 1, 0, 0],
      [0, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 0],
      [0, 0, 1, 0,'E', 0],
      [0, 0, 0, 0, 0, 0],
    ],
    startDir: 'right',
    pieces: { 'straight-h': 3, 'straight-v': 3, 'turn-ld': 2, 'turn-ru': 2, 'turn-rd': 1, 'turn-lu': 1 },
    stars: [9, 12],
  },
  // 3-2: 精打细算（零件刚好够）
  {
    rows: 5, cols: 6,
    grid: [
      [0, 0, 0, 0, 0, 0],
      [0,'S', 0, 0, 0, 0],
      [0, 1, 0, 1, 0, 0],
      [0, 0, 0, 0,'E', 0],
      [0, 0, 0, 0, 0, 0],
    ],
    startDir: 'right',
    pieces: { 'straight-h': 3, 'straight-v': 2, 'turn-ld': 1, 'turn-rd': 1, 'turn-lu': 1, 'turn-ru': 1 },
    stars: [7, 9],
  },
  // 3-3: 螺旋路线
  {
    rows: 6, cols: 6,
    grid: [
      [0, 0, 0, 0, 0, 0],
      [0,'S', 0, 0, 0, 0],
      [0, 0, 1, 1, 0, 0],
      [0, 0, 1, 1, 0, 0],
      [0, 0, 0, 0,'E', 0],
      [0, 0, 0, 0, 0, 0],
    ],
    startDir: 'right',
    pieces: { 'straight-h': 4, 'straight-v': 4, 'turn-rd': 1, 'turn-ld': 1, 'turn-ru': 1, 'turn-lu': 1 },
    stars: [10, 13],
  },
  // 3-4: 峡谷之字路
  {
    rows: 7, cols: 6,
    grid: [
      [0, 0, 0, 0, 0, 0],
      [0,'S', 0, 0, 1, 0],
      [0, 1, 1, 0, 0, 0],
      [0, 0, 0, 0, 1, 0],
      [0, 1, 0, 0, 0, 0],
      [0, 0, 0,'E', 1, 0],
      [0, 0, 0, 0, 0, 0],
    ],
    startDir: 'right',
    pieces: { 'straight-h': 4, 'straight-v': 4, 'turn-rd': 2, 'turn-ld': 2, 'turn-ru': 2, 'turn-lu': 2 },
    stars: [12, 16],
  },
  // 3-5: 终极迷宫 7x7
  {
    rows: 7, cols: 7,
    grid: [
      [0, 0, 0, 0, 0, 0, 0],
      [0,'S', 0, 1, 0, 0, 0],
      [0, 1, 0, 0, 0, 1, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 0, 0, 1, 0],
      [0, 0, 0, 0, 0,'E', 0],
      [0, 0, 0, 0, 0, 0, 0],
    ],
    startDir: 'right',
    pieces: { 'straight-h': 5, 'straight-v': 5, 'turn-rd': 2, 'turn-ld': 2, 'turn-ru': 2, 'turn-lu': 2 },
    stars: [14, 18],
  },

  // ==================== Chapter 4: 🔥 燃料挑战 ====================
  // 4-1: 认识加油站
  {
    rows: 5, cols: 6,
    fuel: 8,
    grid: [
      [0, 0, 0, 0, 0, 0],
      [0,'S', 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0,'G', 0,'E', 0],
      [0, 0, 0, 0, 0, 0],
    ],
    startDir: 'right',
    pieces: { 'straight-h': 3, 'straight-v': 2, 'turn-ld': 1, 'turn-ru': 1 },
    stars: [6, 8],
  },
  // 4-2: 两个加油站
  {
    rows: 5, cols: 7,
    fuel: 7,
    grid: [
      [0, 0, 0, 0, 0, 0, 0],
      [0,'S', 0, 1, 0, 0, 0],
      [0, 0,'G', 0, 0, 1, 0],
      [0, 0, 0, 0,'G','E', 0],
      [0, 0, 0, 0, 0, 0, 0],
    ],
    startDir: 'down',
    pieces: { 'straight-h': 4, 'straight-v': 3, 'turn-rd': 1, 'turn-ld': 1, 'turn-ru': 1, 'turn-lu': 1 },
    stars: [8, 11],
  },
  // 4-3: 认识十字交叉
  {
    rows: 6, cols: 7,
    fuel: 12,
    grid: [
      [0, 0, 0, 0, 0, 0, 0],
      [0,'S', 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 1, 0],
      [0, 0,'G', 0, 0,'E', 0],
      [0, 0, 0, 0, 0, 0, 0],
    ],
    startDir: 'right',
    pieces: { 'straight-h': 5, 'straight-v': 3, 'turn-rd': 1, 'turn-ld': 1, 'turn-ru': 1, 'turn-lu': 1, 'cross': 1 },
    stars: [10, 13],
  },
  // 4-4: 8x8大迷宫
  {
    rows: 8, cols: 8,
    fuel: 9,
    grid: [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0,'S', 0, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 1, 0, 0],
      [0, 1, 0,'G', 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 0, 1, 0],
      [0, 0, 1, 0, 0,'G', 0, 0],
      [0, 0, 0, 0, 0, 0,'E', 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    startDir: 'right',
    pieces: { 'straight-h': 5, 'straight-v': 5, 'turn-rd': 2, 'turn-ld': 2, 'turn-ru': 2, 'turn-lu': 2, 'cross': 1 },
    stars: [14, 18],
  },
  // 4-5: 9x9终极挑战
  {
    rows: 9, cols: 9,
    fuel: 7,
    grid: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0,'S', 0, 0, 1, 0, 0, 0, 0],
      [0, 1, 0,'G', 0, 0, 1, 0, 0],
      [0, 0, 0, 0, 1, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0, 1, 0, 0],
      [0, 0, 0, 0,'G', 0, 0, 0, 0],
      [0, 1, 0, 0, 0, 1, 0,'G', 0],
      [0, 0, 0, 0, 0, 0, 0,'E', 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    startDir: 'right',
    pieces: { 'straight-h': 7, 'straight-v': 7, 'turn-rd': 3, 'turn-ld': 3, 'turn-ru': 3, 'turn-lu': 3, 'cross': 2 },
    stars: [18, 24],
  },
];
