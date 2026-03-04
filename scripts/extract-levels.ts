/**
 * One-time script: extract hardcoded LEVELS from levels.js into individual JSON files.
 * Run with: bun run scripts/extract-levels.ts
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const CHAPTERS = [
  { name: "🌱 学会直线和转弯", levels: [1, 2, 3, 4, 5] },
  { name: "⛰️ 绕过障碍", levels: [6, 7, 8, 9, 10] },
  { name: "🏔️ 高手挑战", levels: [11, 12, 13, 14, 15] },
  { name: "🔥 燃料挑战", levels: [16, 17, 18, 19, 20] },
];

// Paste the LEVELS array here directly (copy from levels.js, lines 11-318)
// This is a one-time migration; we copy the data literally.
const LEVELS: any[] = [
  // === Chapter 1 ===
  {
    rows: 5, cols: 5,
    grid: [[0,0,0,0,0],[0,"S",0,"E",0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],
    startDir: "right",
    pieces: { "straight-h": 2 },
    stars: [2, 3],
  },
  {
    rows: 5, cols: 6,
    grid: [[0,0,0,0,0,0],[0,"S",0,0,"E",0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0]],
    startDir: "right",
    pieces: { "straight-h": 3 },
    stars: [3, 4],
  },
  {
    rows: 5, cols: 5,
    grid: [[0,0,0,0,0],[0,"S",0,0,0],[0,0,0,0,0],[0,0,0,"E",0],[0,0,0,0,0]],
    startDir: "right",
    pieces: { "straight-h": 2, "straight-v": 2, "turn-ld": 1 },
    stars: [5, 6],
  },
  {
    rows: 5, cols: 5,
    grid: [[0,0,0,0,0],[0,0,0,"E",0],[0,0,0,0,0],[0,"S",0,0,0],[0,0,0,0,0]],
    startDir: "right",
    pieces: { "straight-h": 2, "straight-v": 2, "turn-lu": 1 },
    stars: [5, 6],
  },
  {
    rows: 5, cols: 6,
    grid: [[0,0,0,0,0,0],[0,"S",0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,"E",0],[0,0,0,0,0,0]],
    startDir: "right",
    pieces: { "straight-h": 4, "straight-v": 1, "turn-ld": 1, "turn-ru": 1 },
    stars: [6, 8],
  },
  // === Chapter 2 ===
  {
    rows: 5, cols: 6,
    grid: [[0,0,0,0,0,0],[0,"S",0,1,"E",0],[0,0,0,1,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0]],
    startDir: "right",
    pieces: { "straight-h": 3, "straight-v": 2, "turn-ld": 1, "turn-ru": 1, "turn-lu": 1 },
    stars: [6, 8],
  },
  {
    rows: 5, cols: 6,
    grid: [[0,0,0,0,0,0],[0,"S",0,0,0,0],[0,0,1,0,0,0],[0,0,0,0,"E",0],[0,0,0,0,0,0]],
    startDir: "down",
    pieces: { "straight-h": 3, "straight-v": 1, "turn-rd": 1, "turn-lu": 1 },
    stars: [5, 7],
  },
  {
    rows: 5, cols: 7,
    grid: [[0,0,0,0,0,0,0],[0,"S",0,0,1,0,0],[0,0,0,0,0,0,0],[0,0,1,0,0,"E",0],[0,0,0,0,0,0,0]],
    startDir: "right",
    pieces: { "straight-h": 4, "straight-v": 2, "turn-ld": 1, "turn-ru": 1, "turn-rd": 1, "turn-lu": 1 },
    stars: [8, 11],
  },
  {
    rows: 5, cols: 6,
    grid: [[0,0,0,0,0,0],[0,"S",1,0,0,0],[0,0,0,0,1,0],[0,1,0,0,"E",0],[0,0,0,0,0,0]],
    startDir: "down",
    pieces: { "straight-h": 3, "straight-v": 2, "turn-rd": 1, "turn-ld": 1, "turn-ru": 1, "turn-lu": 1 },
    stars: [7, 9],
  },
  {
    rows: 5, cols: 7,
    grid: [[0,0,0,0,0,0,0],[0,"S",0,1,1,0,0],[0,0,0,1,1,0,0],[0,0,0,0,0,"E",0],[0,0,0,0,0,0,0]],
    startDir: "right",
    pieces: { "straight-h": 3, "straight-v": 3, "turn-ld": 1, "turn-ru": 1, "turn-rd": 1, "turn-lu": 1 },
    stars: [8, 11],
  },
  // === Chapter 3 ===
  {
    rows: 6, cols: 6,
    grid: [[0,0,0,0,0,0],[0,"S",0,1,0,0],[0,1,0,0,0,0],[0,0,0,0,1,0],[0,0,1,0,"E",0],[0,0,0,0,0,0]],
    startDir: "right",
    pieces: { "straight-h": 3, "straight-v": 3, "turn-ld": 2, "turn-ru": 2, "turn-rd": 1, "turn-lu": 1 },
    stars: [9, 12],
  },
  {
    rows: 5, cols: 6,
    grid: [[0,0,0,0,0,0],[0,"S",0,0,0,0],[0,1,0,1,0,0],[0,0,0,0,"E",0],[0,0,0,0,0,0]],
    startDir: "right",
    pieces: { "straight-h": 3, "straight-v": 2, "turn-ld": 1, "turn-rd": 1, "turn-lu": 1, "turn-ru": 1 },
    stars: [7, 9],
  },
  {
    rows: 6, cols: 6,
    grid: [[0,0,0,0,0,0],[0,"S",0,0,0,0],[0,0,1,1,0,0],[0,0,1,1,0,0],[0,0,0,0,"E",0],[0,0,0,0,0,0]],
    startDir: "right",
    pieces: { "straight-h": 4, "straight-v": 4, "turn-rd": 1, "turn-ld": 1, "turn-ru": 1, "turn-lu": 1 },
    stars: [10, 13],
  },
  {
    rows: 7, cols: 6,
    grid: [[0,0,0,0,0,0],[0,"S",0,0,1,0],[0,1,1,0,0,0],[0,0,0,0,1,0],[0,1,0,0,0,0],[0,0,0,"E",1,0],[0,0,0,0,0,0]],
    startDir: "right",
    pieces: { "straight-h": 4, "straight-v": 4, "turn-rd": 2, "turn-ld": 2, "turn-ru": 2, "turn-lu": 2 },
    stars: [12, 16],
  },
  {
    rows: 7, cols: 7,
    grid: [[0,0,0,0,0,0,0],[0,"S",0,1,0,0,0],[0,1,0,0,0,1,0],[0,0,0,1,0,0,0],[0,0,1,0,0,1,0],[0,0,0,0,0,"E",0],[0,0,0,0,0,0,0]],
    startDir: "right",
    pieces: { "straight-h": 5, "straight-v": 5, "turn-rd": 2, "turn-ld": 2, "turn-ru": 2, "turn-lu": 2 },
    stars: [14, 18],
  },
  // === Chapter 4 ===
  {
    rows: 5, cols: 6, fuel: 8,
    grid: [[0,0,0,0,0,0],[0,"S",0,0,0,0],[0,0,0,0,0,0],[0,0,"G",0,"E",0],[0,0,0,0,0,0]],
    startDir: "right",
    pieces: { "straight-h": 3, "straight-v": 2, "turn-ld": 1, "turn-ru": 1 },
    stars: [6, 8],
  },
  {
    rows: 5, cols: 7, fuel: 7,
    grid: [[0,0,0,0,0,0,0],[0,"S",0,1,0,0,0],[0,0,"G",0,0,1,0],[0,0,0,0,"G","E",0],[0,0,0,0,0,0,0]],
    startDir: "down",
    pieces: { "straight-h": 4, "straight-v": 3, "turn-rd": 1, "turn-ld": 1, "turn-ru": 1, "turn-lu": 1 },
    stars: [8, 11],
  },
  {
    rows: 6, cols: 7, fuel: 12,
    grid: [[0,0,0,0,0,0,0],[0,"S",0,0,0,0,0],[0,0,0,1,0,0,0],[0,0,0,0,0,1,0],[0,0,"G",0,0,"E",0],[0,0,0,0,0,0,0]],
    startDir: "right",
    pieces: { "straight-h": 5, "straight-v": 3, "turn-rd": 1, "turn-ld": 1, "turn-ru": 1, "turn-lu": 1, "cross": 1 },
    stars: [10, 13],
  },
  {
    rows: 8, cols: 8, fuel: 9,
    grid: [[0,0,0,0,0,0,0,0],[0,"S",0,1,0,0,0,0],[0,0,0,0,0,1,0,0],[0,1,0,"G",0,0,0,0],[0,0,0,0,1,0,1,0],[0,0,1,0,0,"G",0,0],[0,0,0,0,0,0,"E",0],[0,0,0,0,0,0,0,0]],
    startDir: "right",
    pieces: { "straight-h": 5, "straight-v": 5, "turn-rd": 2, "turn-ld": 2, "turn-ru": 2, "turn-lu": 2, "cross": 1 },
    stars: [14, 18],
  },
  {
    rows: 9, cols: 9, fuel: 7,
    grid: [[0,0,0,0,0,0,0,0,0],[0,"S",0,0,1,0,0,0,0],[0,1,0,"G",0,0,1,0,0],[0,0,0,0,1,0,0,0,0],[0,0,1,0,0,0,1,0,0],[0,0,0,0,"G",0,0,0,0],[0,1,0,0,0,1,0,"G",0],[0,0,0,0,0,0,0,"E",0],[0,0,0,0,0,0,0,0,0]],
    startDir: "right",
    pieces: { "straight-h": 7, "straight-v": 7, "turn-rd": 3, "turn-ld": 3, "turn-ru": 3, "turn-lu": 3, "cross": 2 },
    stars: [18, 24],
  },
];

// Write chapters.json
const chaptersOut = CHAPTERS.map((ch, ci) => ({
  name: ch.name,
  levels: ch.levels.map((n) => {
    const chapterNum = ci + 1;
    return `chapter${chapterNum}/level-${String(n).padStart(2, "0")}.json`;
  }),
}));
writeFileSync(
  join("levels", "chapters.json"),
  JSON.stringify(chaptersOut, null, 2) + "\n"
);
console.log("Wrote levels/chapters.json");

// Write individual level files
LEVELS.forEach((lv, i) => {
  const chapterNum = Math.floor(i / 5) + 1;
  const levelNum = i + 1;
  const levelInChapter = (i % 5) + 1;
  const id = `${chapterNum}-${levelInChapter}`;

  const out = {
    id,
    rows: lv.rows,
    cols: lv.cols,
    grid: lv.grid,
    startDir: lv.startDir,
    pieces: lv.pieces,
    stars: lv.stars,
    fuel: lv.fuel ?? null,
    metadata: {
      difficulty: chapterNum <= 2 ? "easy" : chapterNum === 3 ? "medium" : "hard",
      generatedBy: "manual",
    },
  };

  const dir = join("levels", `chapter${chapterNum}`);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `level-${String(levelNum).padStart(2, "0")}.json`);
  writeFileSync(path, JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote ${path}`);
});
