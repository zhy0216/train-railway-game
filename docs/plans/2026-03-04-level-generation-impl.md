# Level Generation System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract level data into individual JSON files, build a CSP-based level generator that produces harder puzzles, and wire up a Bun build pipeline.

**Architecture:** Reverse the game's path validator into a solver that enumerates all solutions via backtracking with constraint propagation. A generator script creates random board layouts (S, E, obstacles), assigns track pieces, runs the solver to count solutions, scores difficulty, and outputs qualifying levels as JSON. A build script bundles all JSONs back into a `dist/levels.js` for the browser game.

**Tech Stack:** Bun (runtime + test runner), TypeScript (scripts), vanilla JS (game)

---

### Task 1: Initialize Bun project and directory structure

**Files:**
- Create: `package.json`
- Create: `bunfig.toml`
- Create: `tsconfig.json`
- Create: directories `levels/chapter1/` through `levels/chapter4/`, `scripts/`, `dist/`

**Step 1: Create package.json**

```json
{
  "name": "train-railway-game",
  "version": "1.0.0",
  "scripts": {
    "generate": "bun run scripts/generate.ts",
    "build": "bun run scripts/build-levels.ts",
    "test": "bun test"
  },
  "devDependencies": {
    "@types/bun": "latest"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "outDir": "./dist",
    "rootDir": ".",
    "types": ["bun-types"]
  },
  "include": ["scripts/**/*.ts"]
}
```

**Step 3: Create directory structure**

```bash
mkdir -p levels/chapter1 levels/chapter2 levels/chapter3 levels/chapter4 scripts dist src
```

**Step 4: Move game source files to `src/`**

```bash
mv index.html src/
mv game.js src/
mv styles.css src/
mv sound.js src/
```

**Step 5: Install dependencies**

```bash
bun install
```

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: init Bun project, reorganize into src/ directory"
```

---

### Task 2: Extract existing 20 levels into individual JSON files

**Files:**
- Read: `levels.js` (current)
- Create: `levels/chapters.json`
- Create: `levels/chapter1/level-01.json` through `levels/chapter4/level-20.json`
- Create: `scripts/extract-levels.ts` (one-time migration script)
- Delete: `levels.js` (after migration)

**Step 1: Write the extraction script**

Create `scripts/extract-levels.ts`:

```typescript
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
    const li = n - 1; // 0-indexed
    const chapterNum = ci + 1;
    const levelInChapter = n - ci * 5;
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
```

**Step 2: Run the extraction**

```bash
bun run scripts/extract-levels.ts
```

Expected: 20 JSON files created in `levels/chapter1-4/` plus `levels/chapters.json`.

**Step 3: Verify output**

```bash
ls levels/chapter1/ levels/chapter2/ levels/chapter3/ levels/chapter4/
cat levels/chapters.json
cat levels/chapter1/level-01.json
```

**Step 4: Delete old levels.js**

```bash
rm levels.js
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: extract 20 levels into individual JSON files"
```

---

### Task 3: Build script — bundle JSON levels into dist/levels.js

**Files:**
- Create: `scripts/build-levels.ts`

**Step 1: Write the build script**

Create `scripts/build-levels.ts`:

```typescript
/**
 * Reads chapters.json + all level JSONs → outputs dist/levels.js
 * Also copies src/ files to dist/.
 * Run with: bun run build
 */
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from "fs";
import { join, dirname } from "path";

const ROOT = join(import.meta.dir, "..");
const LEVELS_DIR = join(ROOT, "levels");
const SRC_DIR = join(ROOT, "src");
const DIST_DIR = join(ROOT, "dist");

// Read chapters.json
const chapters: { name: string; levels: string[] }[] = JSON.parse(
  readFileSync(join(LEVELS_DIR, "chapters.json"), "utf-8")
);

// Read all level files in chapter order
const allLevels: any[] = [];
const chapterDefs: { name: string; levels: number[] }[] = [];

let globalIdx = 1;
for (const chapter of chapters) {
  const levelIndices: number[] = [];
  for (const relPath of chapter.levels) {
    const fullPath = join(LEVELS_DIR, relPath);
    if (!existsSync(fullPath)) {
      console.error(`Missing level file: ${fullPath}`);
      process.exit(1);
    }
    const levelData = JSON.parse(readFileSync(fullPath, "utf-8"));

    // Strip metadata for the browser build (not needed at runtime)
    const { metadata, ...runtimeData } = levelData;
    // Also strip the id field — the game uses array index
    const { id, ...rest } = runtimeData;
    allLevels.push(rest);
    levelIndices.push(globalIdx);
    globalIdx++;
  }
  chapterDefs.push({ name: chapter.name, levels: levelIndices });
}

// Generate dist/levels.js
const output = `// levels.js — Auto-generated by build-levels.ts. DO NOT EDIT MANUALLY.
// grid cell values: 0=empty, 1=obstacle(tree), 'S'=start, 'E'=end, 'G'=gas station

const CHAPTERS = ${JSON.stringify(chapterDefs, null, 2)};

const LEVELS = ${JSON.stringify(allLevels, null, 2)};
`;

mkdirSync(DIST_DIR, { recursive: true });
writeFileSync(join(DIST_DIR, "levels.js"), output);
console.log(`Wrote dist/levels.js (${allLevels.length} levels, ${chapterDefs.length} chapters)`);

// Copy src/ files to dist/
for (const file of ["index.html", "game.js", "styles.css", "sound.js"]) {
  const src = join(SRC_DIR, file);
  if (existsSync(src)) {
    cpSync(src, join(DIST_DIR, file));
    console.log(`Copied src/${file} → dist/${file}`);
  }
}

console.log("Build complete!");
```

**Step 2: Run the build**

```bash
bun run build
```

Expected: `dist/levels.js` with CHAPTERS and LEVELS constants, plus all src/ files copied.

**Step 3: Verify the game still works**

Open `dist/index.html` in a browser and play level 1-1 through 1-2. Verify all 20 levels load in the level select screen.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add build-levels.ts to bundle JSON into dist/"
```

---

### Task 4: Core types and track connection constants

**Files:**
- Create: `scripts/types.ts`

**Step 1: Write shared types**

Create `scripts/types.ts`:

```typescript
/** Grid cell values */
export type Cell = 0 | 1 | "S" | "E" | "G";

/** Track piece types */
export type TrackType =
  | "straight-h"
  | "straight-v"
  | "turn-rd"
  | "turn-ld"
  | "turn-ru"
  | "turn-lu"
  | "cross";

export type Direction = "left" | "right" | "up" | "down";

/** Which directions a track piece connects */
export const TRACK_CONNECTIONS: Record<TrackType, Direction[]> = {
  "straight-h": ["left", "right"],
  "straight-v": ["up", "down"],
  "turn-rd": ["right", "down"],
  "turn-ld": ["left", "down"],
  "turn-ru": ["right", "up"],
  "turn-lu": ["left", "up"],
  cross: ["left", "right", "up", "down"],
};

export const OPPOSITE: Record<Direction, Direction> = {
  left: "right",
  right: "left",
  up: "down",
  down: "up",
};

export const DIR_DELTA: Record<Direction, [number, number]> = {
  left: [0, -1],
  right: [0, 1],
  up: [-1, 0],
  down: [1, 0],
};

export const ALL_TRACK_TYPES: TrackType[] = [
  "straight-h",
  "straight-v",
  "turn-rd",
  "turn-ld",
  "turn-ru",
  "turn-lu",
  "cross",
];

export interface LevelData {
  id: string;
  rows: number;
  cols: number;
  grid: Cell[][];
  startDir: Direction;
  pieces: Partial<Record<TrackType, number>>;
  stars: [number, number];
  fuel: number | null;
  metadata: {
    difficulty: string;
    difficultyScore?: number;
    solutionCount?: number;
    optimalPieceCount?: number;
    pathLength?: number;
    turnCount?: number;
    generatedBy: string;
    generatedAt?: string;
    seed?: number;
  };
}

/** Difficulty preset names */
export type Difficulty = "easy" | "medium" | "hard" | "extreme";

/** Difficulty preset configuration */
export interface DifficultyPreset {
  gridRange: { minRows: number; maxRows: number; minCols: number; maxCols: number };
  obstacleDensity: { min: number; max: number }; // fraction of empty cells
  maxSolutions: number;
  surplusPieces: { min: number; max: number };
  fuel: boolean;
}

export const DIFFICULTY_PRESETS: Record<Difficulty, DifficultyPreset> = {
  easy: {
    gridRange: { minRows: 5, maxRows: 6, minCols: 5, maxCols: 6 },
    obstacleDensity: { min: 0.05, max: 0.1 },
    maxSolutions: 5,
    surplusPieces: { min: 2, max: 3 },
    fuel: false,
  },
  medium: {
    gridRange: { minRows: 7, maxRows: 10, minCols: 7, maxCols: 10 },
    obstacleDensity: { min: 0.1, max: 0.2 },
    maxSolutions: 3,
    surplusPieces: { min: 1, max: 2 },
    fuel: false,
  },
  hard: {
    gridRange: { minRows: 10, maxRows: 13, minCols: 10, maxCols: 13 },
    obstacleDensity: { min: 0.15, max: 0.25 },
    maxSolutions: 2,
    surplusPieces: { min: 0, max: 1 },
    fuel: false,
  },
  extreme: {
    gridRange: { minRows: 13, maxRows: 16, minCols: 13, maxCols: 16 },
    obstacleDensity: { min: 0.2, max: 0.3 },
    maxSolutions: 1,
    surplusPieces: { min: 0, max: 0 },
    fuel: true,
  },
};
```

**Step 2: Commit**

```bash
git add scripts/types.ts
git commit -m "feat: add shared types and track connection constants"
```

---

### Task 5: Backtracking solver — core algorithm

**Files:**
- Create: `scripts/solver.ts`
- Create: `scripts/solver.test.ts`

This is the most critical component. The solver takes a grid + piece set and returns all valid solutions (capped at a max count).

**Step 1: Write the failing test**

Create `scripts/solver.test.ts`:

```typescript
import { describe, test, expect } from "bun:test";
import { solve } from "./solver";
import type { Cell, TrackType } from "./types";

describe("solver", () => {
  test("solves trivial 5x5 straight line (level 1-1)", () => {
    const grid: Cell[][] = [
      [0, 0, 0, 0, 0],
      [0, "S", 0, "E", 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ];
    const pieces: Partial<Record<TrackType, number>> = { "straight-h": 2 };
    const results = solve({ grid, rows: 5, cols: 5, startDir: "right", pieces, maxSolutions: 10 });
    expect(results.length).toBe(1);
    // The only solution places straight-h at (1,2) and (1,3) — but (1,3) is E, so only (1,2)
    // Actually: S is at (1,1), E is at (1,3). Train goes right from S.
    // Next cell is (1,2) — needs straight-h. Then (1,3) is E. Done.
    // But we have 2 straight-h pieces. Only 1 is needed for the path.
    // The solver should find solutions where the path works, regardless of leftover pieces.
    expect(results[0].pathLength).toBeGreaterThanOrEqual(2); // S + track + E
  });

  test("solves L-shape (level 1-3)", () => {
    const grid: Cell[][] = [
      [0, 0, 0, 0, 0],
      [0, "S", 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, "E", 0],
      [0, 0, 0, 0, 0],
    ];
    const pieces: Partial<Record<TrackType, number>> = {
      "straight-h": 2,
      "straight-v": 2,
      "turn-ld": 1,
    };
    const results = solve({ grid, rows: 5, cols: 5, startDir: "right", pieces, maxSolutions: 10 });
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  test("returns 0 solutions for impossible layout", () => {
    const grid: Cell[][] = [
      [0, 0, 0, 0, 0],
      [0, "S", 1, "E", 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ];
    // Only vertical pieces — can't go right past obstacle
    const pieces: Partial<Record<TrackType, number>> = { "straight-v": 3 };
    const results = solve({ grid, rows: 5, cols: 5, startDir: "right", pieces, maxSolutions: 10 });
    expect(results.length).toBe(0);
  });

  test("respects maxSolutions cap", () => {
    // A wide open grid with many pieces should have many solutions
    const grid: Cell[][] = [
      [0, 0, 0, 0, 0],
      [0, "S", 0, "E", 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ];
    const pieces: Partial<Record<TrackType, number>> = {
      "straight-h": 5,
      "straight-v": 5,
      "turn-rd": 3,
      "turn-ld": 3,
      "turn-ru": 3,
      "turn-lu": 3,
    };
    const results = solve({ grid, rows: 5, cols: 5, startDir: "right", pieces, maxSolutions: 4 });
    expect(results.length).toBeLessThanOrEqual(4);
  });

  test("handles fuel and gas stations", () => {
    const grid: Cell[][] = [
      [0, 0, 0, 0, 0, 0],
      [0, "S", 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, "G", 0, "E", 0],
      [0, 0, 0, 0, 0, 0],
    ];
    const pieces: Partial<Record<TrackType, number>> = {
      "straight-h": 3,
      "straight-v": 2,
      "turn-ld": 1,
      "turn-ru": 1,
    };
    const results = solve({
      grid, rows: 5, cols: 6, startDir: "right", pieces, maxSolutions: 10, fuel: 8
    });
    expect(results.length).toBeGreaterThanOrEqual(1);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
bun test scripts/solver.test.ts
```

Expected: FAIL — `solve` not found.

**Step 3: Implement the solver**

Create `scripts/solver.ts`:

```typescript
import {
  type Cell,
  type TrackType,
  type Direction,
  TRACK_CONNECTIONS,
  OPPOSITE,
  DIR_DELTA,
  ALL_TRACK_TYPES,
} from "./types";

export interface SolveInput {
  grid: Cell[][];
  rows: number;
  cols: number;
  startDir: Direction;
  pieces: Partial<Record<TrackType, number>>;
  maxSolutions: number;
  fuel?: number;
}

export interface Solution {
  /** Map of "row,col" → TrackType for each placed piece on the path */
  placement: Map<string, TrackType>;
  pathLength: number;
  turnCount: number;
  piecesUsed: number;
}

/**
 * Find all valid solutions for the given level configuration.
 *
 * Strategy: simulate the train's path from S. At each step, if the next cell
 * is empty (0 or G), try placing each available piece type there and recurse.
 * This is efficient because we only explore cells the train actually visits,
 * not all empty cells on the grid.
 */
export function solve(input: SolveInput): Solution[] {
  const { grid, rows, cols, startDir, maxSolutions } = input;
  const maxFuel = input.fuel ?? 0;

  // Find S and E
  let startRow = -1, startCol = -1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === "S") { startRow = r; startCol = c; }
    }
  }

  // Available pieces (mutable copy)
  const available: Record<string, number> = {};
  for (const [k, v] of Object.entries(input.pieces)) {
    available[k] = v!;
  }

  const solutions: Solution[] = [];
  const placement = new Map<string, TrackType>();
  const visited = new Set<string>();

  function simulate(
    row: number,
    col: number,
    dir: Direction,
    fuel: number,
    pathLen: number,
    turns: number,
    piecesUsed: number
  ): void {
    if (solutions.length >= maxSolutions) return;

    const [dr, dc] = DIR_DELTA[dir];
    const nr = row + dr;
    const nc = col + dc;

    // Out of bounds
    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) return;

    // Reached end
    if (grid[nr][nc] === "E") {
      if (maxFuel > 0 && fuel - 1 < 0) return; // not enough fuel
      solutions.push({
        placement: new Map(placement),
        pathLength: pathLen + 1,
        turnCount: turns,
        piecesUsed,
      });
      return;
    }

    // Hit obstacle
    if (grid[nr][nc] === 1) return;

    // Check fuel
    let newFuel = fuel;
    if (maxFuel > 0) {
      newFuel = fuel - 1;
      if (newFuel < 0) return;
    }

    // Refuel at gas station (fuel is refilled after consuming 1)
    if (maxFuel > 0 && grid[nr][nc] === "G") {
      newFuel = maxFuel;
    }

    const key = `${nr},${nc}`;

    // Check if we already placed a track here (from a different branch that shares cells)
    const existingTrack = placement.get(key);
    if (existingTrack) {
      // Validate the existing track accepts entry from our direction
      const enterDir = OPPOSITE[dir];
      const conns = TRACK_CONNECTIONS[existingTrack];
      if (!conns.includes(enterDir)) return;

      const exitDir = existingTrack === "cross" ? dir : conns.find((d) => d !== enterDir);
      if (!exitDir) return;

      const visitKey = `${nr},${nc},${exitDir}`;
      if (visited.has(visitKey)) return;

      const isTurn = exitDir !== dir;
      visited.add(visitKey);
      simulate(nr, nc, exitDir, newFuel, pathLen + 1, turns + (isTurn ? 1 : 0), piecesUsed);
      visited.delete(visitKey);
      return;
    }

    // Try each available piece type
    const enterDir = OPPOSITE[dir];
    for (const trackType of ALL_TRACK_TYPES) {
      if ((available[trackType] ?? 0) <= 0) continue;

      const conns = TRACK_CONNECTIONS[trackType];
      if (!conns.includes(enterDir)) continue;

      const exitDir = trackType === "cross" ? dir : conns.find((d) => d !== enterDir);
      if (!exitDir) continue;

      const visitKey = `${nr},${nc},${exitDir}`;
      if (visited.has(visitKey)) continue;

      // Place the piece
      placement.set(key, trackType);
      available[trackType]--;
      visited.add(visitKey);

      simulate(nr, nc, exitDir, newFuel, pathLen + 1, turns + (exitDir !== dir ? 1 : 0), piecesUsed + 1);

      // Backtrack
      visited.delete(visitKey);
      available[trackType]++;
      placement.delete(key);

      if (solutions.length >= maxSolutions) return;
    }
  }

  visited.add(`${startRow},${startCol},${startDir}`);
  simulate(startRow, startCol, startDir, maxFuel, 1, 0, 0);

  return solutions;
}
```

**Step 4: Run tests**

```bash
bun test scripts/solver.test.ts
```

Expected: All 5 tests PASS.

**Step 5: Commit**

```bash
git add scripts/solver.ts scripts/solver.test.ts
git commit -m "feat: implement backtracking solver with fuel support"
```

---

### Task 6: Difficulty scoring module

**Files:**
- Create: `scripts/difficulty.ts`
- Create: `scripts/difficulty.test.ts`

**Step 1: Write the failing test**

Create `scripts/difficulty.test.ts`:

```typescript
import { describe, test, expect } from "bun:test";
import { scoreDifficulty, calculateStars } from "./difficulty";

describe("scoreDifficulty", () => {
  test("short easy path scores low", () => {
    const score = scoreDifficulty({
      pathLength: 3,
      turnCount: 0,
      obstacleProximity: 0,
      piecePrecision: 0.5,
    });
    expect(score).toBeLessThan(3);
  });

  test("long winding path with exact pieces scores high", () => {
    const score = scoreDifficulty({
      pathLength: 20,
      turnCount: 8,
      obstacleProximity: 0.8,
      piecePrecision: 1.0,
    });
    expect(score).toBeGreaterThan(7);
  });
});

describe("calculateStars", () => {
  test("optimal count gets 3 stars", () => {
    expect(calculateStars(5, 5)).toEqual([5, 7]);
  });

  test("larger optimal count scales thresholds", () => {
    const [s3, s2] = calculateStars(12, 12);
    expect(s3).toBe(12);
    expect(s2).toBeGreaterThan(12);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
bun test scripts/difficulty.test.ts
```

**Step 3: Implement difficulty scoring**

Create `scripts/difficulty.ts`:

```typescript
export interface DifficultyInput {
  pathLength: number;
  turnCount: number;
  obstacleProximity: number; // 0-1: how close obstacles are to the path
  piecePrecision: number;    // 0-1: 1 = exact pieces, 0 = many surplus
}

/**
 * Score difficulty on a 0-10 scale.
 * Formula: pathLength×0.3 + turnCount×0.2 + obstacleProximity×0.2 + piecePrecision×0.3
 * Each factor is normalized to 0-10 before weighting.
 */
export function scoreDifficulty(input: DifficultyInput): number {
  const { pathLength, turnCount, obstacleProximity, piecePrecision } = input;

  // Normalize pathLength: 2=0, 30+=10
  const normPath = Math.min(10, Math.max(0, (pathLength - 2) / 2.8));

  // Normalize turnCount: 0=0, 12+=10
  const normTurns = Math.min(10, Math.max(0, turnCount / 1.2));

  // obstacleProximity and piecePrecision are already 0-1, scale to 0-10
  const normObstacle = obstacleProximity * 10;
  const normPrecision = piecePrecision * 10;

  return normPath * 0.3 + normTurns * 0.2 + normObstacle * 0.2 + normPrecision * 0.3;
}

/**
 * Calculate star thresholds based on optimal piece count.
 * Returns [3-star-max, 2-star-max].
 * 3 stars = use exactly optimal count.
 * 2 stars = use up to optimal + ceil(optimal * 0.3).
 */
export function calculateStars(
  optimalPieceCount: number,
  totalPiecesGiven: number
): [number, number] {
  const s3 = optimalPieceCount;
  const s2 = optimalPieceCount + Math.max(1, Math.ceil(optimalPieceCount * 0.3));
  return [s3, Math.min(s2, totalPiecesGiven)];
}

/**
 * Calculate obstacle proximity: fraction of path-adjacent cells that are obstacles.
 */
export function calcObstacleProximity(
  grid: (0 | 1 | "S" | "E" | "G")[][],
  rows: number,
  cols: number,
  pathCells: [number, number][]
): number {
  if (pathCells.length === 0) return 0;

  let adjacentCount = 0;
  let obstacleAdjacentCount = 0;
  const pathSet = new Set(pathCells.map(([r, c]) => `${r},${c}`));

  for (const [pr, pc] of pathCells) {
    for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nr = pr + dr;
      const nc = pc + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (pathSet.has(`${nr},${nc}`)) continue;
      adjacentCount++;
      if (grid[nr][nc] === 1) obstacleAdjacentCount++;
    }
  }

  return adjacentCount === 0 ? 0 : obstacleAdjacentCount / adjacentCount;
}
```

**Step 4: Run tests**

```bash
bun test scripts/difficulty.test.ts
```

Expected: All tests PASS.

**Step 5: Commit**

```bash
git add scripts/difficulty.ts scripts/difficulty.test.ts
git commit -m "feat: add difficulty scoring and star calculation"
```

---

### Task 7: Level generator — board creation and validation

**Files:**
- Create: `scripts/generator.ts`
- Create: `scripts/generator.test.ts`

**Step 1: Write the failing test**

Create `scripts/generator.test.ts`:

```typescript
import { describe, test, expect } from "bun:test";
import { generateBoard, assignPieces, generateLevel } from "./generator";

describe("generateBoard", () => {
  test("creates a grid with S and E", () => {
    const board = generateBoard({ rows: 6, cols: 6, obstacleDensity: 0.1, seed: 42 });
    let hasS = false, hasE = false;
    for (const row of board.grid) {
      for (const cell of row) {
        if (cell === "S") hasS = true;
        if (cell === "E") hasE = true;
      }
    }
    expect(hasS).toBe(true);
    expect(hasE).toBe(true);
    expect(board.grid.length).toBe(6);
    expect(board.grid[0].length).toBe(6);
  });

  test("S and E have minimum Manhattan distance", () => {
    const board = generateBoard({ rows: 8, cols: 8, obstacleDensity: 0.15, seed: 123 });
    let sr = -1, sc = -1, er = -1, ec = -1;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board.grid[r][c] === "S") { sr = r; sc = c; }
        if (board.grid[r][c] === "E") { er = r; ec = c; }
      }
    }
    const dist = Math.abs(sr - er) + Math.abs(sc - ec);
    expect(dist).toBeGreaterThanOrEqual(4);
  });

  test("obstacles do not block S or E", () => {
    for (let seed = 0; seed < 20; seed++) {
      const board = generateBoard({ rows: 7, cols: 7, obstacleDensity: 0.2, seed });
      let sr = -1, sc = -1;
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (board.grid[r][c] === "S") { sr = r; sc = c; }
        }
      }
      // S should have at least one non-obstacle neighbor
      let hasOpenNeighbor = false;
      for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
        const nr = sr + dr, nc = sc + dc;
        if (nr >= 0 && nr < 7 && nc >= 0 && nc < 7 && board.grid[nr][nc] !== 1) {
          hasOpenNeighbor = true;
        }
      }
      expect(hasOpenNeighbor).toBe(true);
    }
  });
});

describe("generateLevel", () => {
  test("generates a solvable easy level", () => {
    const level = generateLevel({
      difficulty: "easy",
      seed: 42,
      maxAttempts: 100,
    });
    expect(level).not.toBeNull();
    if (level) {
      expect(level.metadata.solutionCount).toBeGreaterThanOrEqual(1);
      expect(level.rows).toBeGreaterThanOrEqual(5);
      expect(level.rows).toBeLessThanOrEqual(6);
    }
  });

  test("generates a solvable medium level", () => {
    const level = generateLevel({
      difficulty: "medium",
      seed: 99,
      maxAttempts: 200,
    });
    expect(level).not.toBeNull();
    if (level) {
      expect(level.metadata.solutionCount).toBeGreaterThanOrEqual(1);
    }
  });
});
```

**Step 2: Run test to verify it fails**

```bash
bun test scripts/generator.test.ts
```

**Step 3: Implement the generator**

Create `scripts/generator.ts`:

```typescript
import {
  type Cell,
  type TrackType,
  type Direction,
  type Difficulty,
  type LevelData,
  DIFFICULTY_PRESETS,
  ALL_TRACK_TYPES,
  DIR_DELTA,
} from "./types";
import { solve, type Solution } from "./solver";
import {
  scoreDifficulty,
  calculateStars,
  calcObstacleProximity,
} from "./difficulty";

/** Seeded PRNG (mulberry32) */
function createRng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface BoardConfig {
  rows: number;
  cols: number;
  obstacleDensity: number;
  seed: number;
  fuel?: number;
  gasStations?: number;
}

export interface Board {
  grid: Cell[][];
  startDir: Direction;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export function generateBoard(config: BoardConfig): Board {
  const { rows, cols, obstacleDensity, seed } = config;
  const rng = createRng(seed);

  // Initialize empty grid
  const grid: Cell[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

  // Place S and E with minimum Manhattan distance (at least rows/2 + cols/2 / 2)
  const minDist = Math.max(4, Math.floor((rows + cols) / 3));
  let sr: number, sc: number, er: number, ec: number;

  // Keep S and E away from edges (1 cell border)
  do {
    sr = 1 + Math.floor(rng() * (rows - 2));
    sc = 1 + Math.floor(rng() * (cols - 2));
    er = 1 + Math.floor(rng() * (rows - 2));
    ec = 1 + Math.floor(rng() * (cols - 2));
  } while (
    (sr === er && sc === ec) ||
    Math.abs(sr - er) + Math.abs(sc - ec) < minDist
  );

  grid[sr][sc] = "S";
  grid[er][ec] = "E";

  // Determine start direction based on S→E general direction
  let startDir: Direction;
  const dr = er - sr;
  const dc = ec - sc;
  if (Math.abs(dc) >= Math.abs(dr)) {
    startDir = dc > 0 ? "right" : "left";
  } else {
    startDir = dr > 0 ? "down" : "up";
  }

  // Place gas stations if fuel mode
  if (config.fuel && config.gasStations) {
    let placed = 0;
    let attempts = 0;
    while (placed < config.gasStations && attempts < 200) {
      const gr = 1 + Math.floor(rng() * (rows - 2));
      const gc = 1 + Math.floor(rng() * (cols - 2));
      if (grid[gr][gc] === 0) {
        grid[gr][gc] = "G";
        placed++;
      }
      attempts++;
    }
  }

  // Place obstacles
  const totalCells = rows * cols;
  const targetObstacles = Math.floor(totalCells * obstacleDensity);
  let obstaclesPlaced = 0;
  let attempts = 0;

  while (obstaclesPlaced < targetObstacles && attempts < targetObstacles * 10) {
    const r = Math.floor(rng() * rows);
    const c = Math.floor(rng() * cols);
    if (grid[r][c] !== 0) { attempts++; continue; }

    // Don't place adjacent to S (need at least one exit)
    if (Math.abs(r - sr) + Math.abs(c - sc) <= 1) { attempts++; continue; }
    // Don't place adjacent to E
    if (Math.abs(r - er) + Math.abs(c - ec) <= 1) { attempts++; continue; }

    grid[r][c] = 1;
    obstaclesPlaced++;
    attempts++;
  }

  // Verify S has open neighbor in startDir
  const [ddr, ddc] = DIR_DELTA[startDir];
  const frontR = sr + ddr;
  const frontC = sc + ddc;
  if (frontR >= 0 && frontR < rows && frontC >= 0 && frontC < cols) {
    if (grid[frontR][frontC] === 1) {
      grid[frontR][frontC] = 0; // Clear obstacle in front of start
    }
  }

  return { grid, startDir, startRow: sr, startCol: sc, endRow: er, endCol: ec };
}

/**
 * Given a solution, determine which pieces were used and add surplus/distractor pieces.
 */
export function assignPieces(
  solution: Solution,
  surplusCount: number,
  rng: () => number
): Partial<Record<TrackType, number>> {
  // Count pieces in the solution
  const needed: Record<string, number> = {};
  for (const type of solution.placement.values()) {
    needed[type] = (needed[type] ?? 0) + 1;
  }

  // Start with exactly the needed pieces
  const result: Partial<Record<TrackType, number>> = { ...needed };

  // Add surplus/distractor pieces
  for (let i = 0; i < surplusCount; i++) {
    // Pick a random track type (prefer "similar but wrong" types)
    const idx = Math.floor(rng() * ALL_TRACK_TYPES.length);
    const type = ALL_TRACK_TYPES[idx];
    result[type] = (result[type] ?? 0) + 1;
  }

  return result;
}

export interface GenerateLevelConfig {
  difficulty: Difficulty;
  seed: number;
  maxAttempts?: number;
  rows?: number;
  cols?: number;
  fuel?: boolean;
}

export function generateLevel(config: GenerateLevelConfig): LevelData | null {
  const preset = DIFFICULTY_PRESETS[config.difficulty];
  const maxAttempts = config.maxAttempts ?? 100;
  const rng = createRng(config.seed);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const attemptSeed = config.seed * 1000 + attempt;

    // Pick grid size
    const rows = config.rows ?? (preset.gridRange.minRows +
      Math.floor(createRng(attemptSeed)() * (preset.gridRange.maxRows - preset.gridRange.minRows + 1)));
    const cols = config.cols ?? (preset.gridRange.minCols +
      Math.floor(createRng(attemptSeed + 1)() * (preset.gridRange.maxCols - preset.gridRange.minCols + 1)));

    // Pick obstacle density
    const density = preset.obstacleDensity.min +
      createRng(attemptSeed + 2)() * (preset.obstacleDensity.max - preset.obstacleDensity.min);

    // Fuel config
    const useFuel = config.fuel ?? preset.fuel;
    const fuelAmount = useFuel ? Math.floor(rows * cols * 0.3) : undefined;
    const gasStations = useFuel ? Math.max(1, Math.floor((rows + cols) / 6)) : undefined;

    // Generate board
    const board = generateBoard({
      rows, cols,
      obstacleDensity: density,
      seed: attemptSeed,
      fuel: fuelAmount,
      gasStations,
    });

    // Give generous pieces first to find any solution
    const generousPieces: Partial<Record<TrackType, number>> = {};
    const maxPieces = rows * cols;
    for (const t of ALL_TRACK_TYPES) {
      generousPieces[t] = maxPieces;
    }

    // Find solutions with generous pieces (to find the optimal path)
    const generousSolutions = solve({
      grid: board.grid,
      rows, cols,
      startDir: board.startDir,
      pieces: generousPieces,
      maxSolutions: 1,
      fuel: fuelAmount,
    });

    if (generousSolutions.length === 0) continue; // No path possible

    // Use the first solution as reference for piece assignment
    const refSolution = generousSolutions[0];
    const surplusCount = preset.surplusPieces.min +
      Math.floor(createRng(attemptSeed + 3)() * (preset.surplusPieces.max - preset.surplusPieces.min + 1));
    const pieces = assignPieces(refSolution, surplusCount, createRng(attemptSeed + 4));

    // Now solve with the actual pieces to count solutions
    const solutions = solve({
      grid: board.grid,
      rows, cols,
      startDir: board.startDir,
      pieces,
      maxSolutions: preset.maxSolutions + 1,
      fuel: fuelAmount,
    });

    if (solutions.length === 0) continue;
    if (solutions.length > preset.maxSolutions) continue;

    // Find optimal solution (fewest pieces used)
    const optimal = solutions.reduce((best, s) =>
      s.piecesUsed < best.piecesUsed ? s : best
    );

    // Calculate difficulty score
    const pathCells: [number, number][] = Array.from(optimal.placement.keys())
      .map(k => k.split(",").map(Number) as [number, number]);
    const obstacleProx = calcObstacleProximity(board.grid, rows, cols, pathCells);

    const totalPieces = Object.values(pieces).reduce((a, b) => a + (b ?? 0), 0);
    const piecePrecision = optimal.piecesUsed / totalPieces;

    const diffScore = scoreDifficulty({
      pathLength: optimal.pathLength,
      turnCount: optimal.turnCount,
      obstacleProximity: obstacleProx,
      piecePrecision,
    });

    const [s3, s2] = calculateStars(optimal.piecesUsed, totalPieces);

    return {
      id: "",
      rows,
      cols,
      grid: board.grid,
      startDir: board.startDir,
      pieces,
      stars: [s3, s2],
      fuel: fuelAmount ?? null,
      metadata: {
        difficulty: config.difficulty,
        difficultyScore: Math.round(diffScore * 10) / 10,
        solutionCount: solutions.length,
        optimalPieceCount: optimal.piecesUsed,
        pathLength: optimal.pathLength,
        turnCount: optimal.turnCount,
        generatedBy: "csp-solver-v1",
        generatedAt: new Date().toISOString(),
        seed: attemptSeed,
      },
    };
  }

  return null; // Failed to generate after maxAttempts
}
```

**Step 4: Run tests**

```bash
bun test scripts/generator.test.ts
```

Expected: All tests PASS. Note: the `generateLevel` tests may take a second or two for medium difficulty.

**Step 5: Commit**

```bash
git add scripts/generator.ts scripts/generator.test.ts
git commit -m "feat: add level generator with board creation and piece assignment"
```

---

### Task 8: CLI entry point — generate.ts

**Files:**
- Create: `scripts/generate.ts`

**Step 1: Implement CLI**

Create `scripts/generate.ts`:

```typescript
/**
 * Level generation CLI.
 *
 * Usage:
 *   bun run scripts/generate.ts --difficulty medium --count 5 --output levels/chapter5/
 *   bun run scripts/generate.ts --rows 12 --cols 12 --difficulty hard --count 3
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { parseArgs } from "util";
import { generateLevel } from "./generator";
import type { Difficulty } from "./types";

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    difficulty: { type: "string", default: "medium" },
    count: { type: "string", default: "5" },
    rows: { type: "string" },
    cols: { type: "string" },
    fuel: { type: "string", default: "false" },
    output: { type: "string", default: "levels/generated/" },
    seed: { type: "string" },
    "max-attempts": { type: "string", default: "200" },
  },
});

const difficulty = values.difficulty as Difficulty;
const count = parseInt(values.count!, 10);
const rows = values.rows ? parseInt(values.rows, 10) : undefined;
const cols = values.cols ? parseInt(values.cols, 10) : undefined;
const fuel = values.fuel === "true";
const outputDir = values.output!;
const baseSeed = values.seed ? parseInt(values.seed, 10) : Date.now();
const maxAttempts = parseInt(values["max-attempts"]!, 10);

mkdirSync(outputDir, { recursive: true });

console.log(`Generating ${count} ${difficulty} levels...`);
console.log(`Grid: ${rows ?? "auto"}x${cols ?? "auto"}, Fuel: ${fuel}, Seed: ${baseSeed}`);
console.log(`Output: ${outputDir}\n`);

let generated = 0;
for (let i = 0; i < count; i++) {
  const seed = baseSeed + i * 7919; // Use prime offset for variety
  const level = generateLevel({
    difficulty,
    seed,
    rows,
    cols,
    fuel,
    maxAttempts,
  });

  if (!level) {
    console.log(`  [${i + 1}/${count}] FAILED — no valid level found after ${maxAttempts} attempts`);
    continue;
  }

  // Assign a sequential ID
  level.id = `gen-${generated + 1}`;
  const filename = `level-gen-${String(generated + 1).padStart(2, "0")}.json`;
  const filepath = join(outputDir, filename);
  writeFileSync(filepath, JSON.stringify(level, null, 2) + "\n");

  console.log(
    `  [${i + 1}/${count}] ${level.rows}x${level.cols} | ` +
    `score: ${level.metadata.difficultyScore} | ` +
    `solutions: ${level.metadata.solutionCount} | ` +
    `path: ${level.metadata.pathLength} | ` +
    `turns: ${level.metadata.turnCount} | ` +
    `pieces: ${level.metadata.optimalPieceCount} → ${filepath}`
  );
  generated++;
}

console.log(`\nDone! Generated ${generated}/${count} levels.`);
```

**Step 2: Test the CLI**

```bash
bun run scripts/generate.ts --difficulty easy --count 3 --output levels/test-output/
```

Expected: 3 JSON files created in `levels/test-output/` with console output showing stats.

**Step 3: Clean up test output**

```bash
rm -rf levels/test-output/
```

**Step 4: Commit**

```bash
git add scripts/generate.ts
git commit -m "feat: add generate.ts CLI for batch level generation"
```

---

### Task 9: Adapt game.js for dynamic grid sizes up to 16x16

**Files:**
- Modify: `src/game.js`

The game currently works with dynamic grid sizes (rows/cols per level), but `cellSize` is capped by `maxW / cols` with `maxW` capped at 500px. For 16x16, cells would be ~31px which is small. The track rendering and train sprite need to scale correctly.

**Step 1: Update onResize to handle large grids**

In `src/game.js`, find the `onResize` function (around line 114) and update it:

```javascript
function onResize() {
  const wrap = document.getElementById('canvasWrap');
  const maxW = Math.min(wrap.clientWidth - 16, 600);
  const maxH = window.innerHeight * 0.55; // Don't exceed 55% of viewport height
  const fuelBarH = maxFuel > 0 ? 30 : 0;
  cellSize = Math.floor(Math.min(maxW / cols, (maxH - fuelBarH) / rows));
  cellSize = Math.max(cellSize, 24); // Minimum 24px per cell for legibility
  canvas.width = cellSize * cols;
  canvas.height = cellSize * rows + fuelBarH;
  canvas.style.width = canvas.width + 'px';
  canvas.style.height = canvas.height + 'px';
}
```

**Step 2: Update updateTopBar to handle dynamic chapter indexing**

The current code assumes `Math.floor(currentLevel / 5)` for chapter index. This needs to work with `CHAPTERS` that may have variable-length level lists.

In `src/game.js`, replace the `updateTopBar` function:

```javascript
function updateTopBar() {
  let chIdx = 0, lvIdx = currentLevel + 1;
  let count = 0;
  for (let i = 0; i < CHAPTERS.length; i++) {
    if (currentLevel < count + CHAPTERS[i].levels.length) {
      chIdx = i;
      lvIdx = currentLevel - count + 1;
      break;
    }
    count += CHAPTERS[i].levels.length;
  }
  const ch = CHAPTERS[chIdx];
  document.getElementById('levelLabel').textContent = ch.name.split(' ')[0] + ' ' + (chIdx + 1) + '-' + lvIdx;
  document.getElementById('starsDisplay').textContent = '☆☆☆';
}
```

**Step 3: Update openLevelSelect similarly**

In the `openLevelSelect` function (around line 1254), update the chapter/level iteration to use `CHAPTERS[ci].levels.length` instead of assuming 5 per chapter.

Replace the level button loop to use `CHAPTERS[ci].levels` array for indexing:

```javascript
function openLevelSelect() {
  const list = document.getElementById('levelList');
  list.innerHTML = '';
  let globalIdx = 0;
  CHAPTERS.forEach((ch, ci) => {
    const title = document.createElement('div');
    title.className = 'chapter-title';
    title.textContent = ch.name;
    list.appendChild(title);
    const grid = document.createElement('div');
    grid.className = 'level-grid';
    for (let li = 0; li < ch.levels.length; li++) {
      const btn = document.createElement('button');
      btn.className = 'level-btn';
      btn.textContent = (ci + 1) + '-' + (li + 1);
      const idx = globalIdx;
      btn.addEventListener('click', () => { closeLevelSelect(); loadLevel(idx); });
      grid.appendChild(btn);
      globalIdx++;
    }
    list.appendChild(grid);
  });
  document.getElementById('levelSelectOverlay').classList.remove('hidden');
}
```

**Step 4: Verify the game works with existing 20 levels**

```bash
bun run build
```

Open `dist/index.html` and test level select, play a few levels.

**Step 5: Commit**

```bash
git add src/game.js
git commit -m "feat: adapt game.js for dynamic grid sizes up to 16x16"
```

---

### Task 10: Generate new chapters and build final game

**Step 1: Generate Chapter 5 (medium difficulty)**

```bash
bun run scripts/generate.ts --difficulty medium --count 5 --output levels/chapter5/
```

**Step 2: Generate Chapter 6 (hard difficulty)**

```bash
bun run scripts/generate.ts --difficulty hard --count 5 --output levels/chapter6/
```

**Step 3: Update chapters.json**

Add chapter 5 and 6 entries to `levels/chapters.json`, pointing to the generated JSON files.

**Step 4: Build and test**

```bash
bun run build
```

Open `dist/index.html`, verify all chapters show up in level select. Play at least one level from each new chapter to verify they're solvable and appropriately challenging.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add generated chapter 5 (medium) and chapter 6 (hard)"
```

---

### Task 11: Run all tests, final verification

**Step 1: Run full test suite**

```bash
bun test
```

Expected: All tests pass (solver, difficulty, generator).

**Step 2: Build and verify**

```bash
bun run build
ls -la dist/
```

Verify `dist/` contains: `index.html`, `game.js`, `levels.js`, `styles.css`, `sound.js`.

**Step 3: Manual verification**

Open `dist/index.html`:
- Verify all original 20 levels still work
- Verify new generated levels are playable
- Verify level select shows all chapters
- Verify 16x16 grid renders correctly (if extreme levels generated)

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "chore: final verification pass"
```
