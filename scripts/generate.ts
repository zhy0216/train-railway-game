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
