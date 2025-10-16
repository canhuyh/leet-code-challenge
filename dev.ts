import { watch } from "fs";
import { readFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const mainFile = resolve(__dirname, "src/main.ts");
const challengesFolder = resolve(__dirname, "src/challenges");

let childProcess: ReturnType<typeof spawn> | null = null;
let reloadTimeout: NodeJS.Timeout | null = null;

// Get list of imported files from main.ts
async function getImportedFiles(): Promise<Set<string>> {
  const imports = new Set<string>();

  try {
    const content = await readFile(mainFile, "utf-8");
    // Match imports from ./challenges/ or @challenges/
    const importRegex = /import\s+(?:.*?\s+from\s+)?['"](?:\.\/challenges\/|@challenges\/)([^'"]+)['"]/g;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      // Remove .js extension if present and add .ts
      const fileName = importPath.replace(/\.js$/, "") + ".ts";

      // Determine which folder based on the import statement
      const fullMatch = match[0];
      let fullPath: string;

      if (fullMatch.includes("./challenges/") || fullMatch.includes("@challenges/")) {
        fullPath = resolve(challengesFolder, fileName);
      } else {
        continue;
      }

      imports.add(fullPath);
    }
  } catch (error) {
    console.error("Error reading main.ts:", error);
  }

  return imports;
}

function runMain() {
  // Clear any pending reload
  if (reloadTimeout) {
    clearTimeout(reloadTimeout);
    reloadTimeout = null;
  }

  if (childProcess) {
    childProcess.kill();
  }

  console.clear();
  console.log("\x1b[36m%s\x1b[0m", "🔄 Running main.ts...\n");

  childProcess = spawn("tsx", [mainFile], {
    stdio: "inherit",
    shell: true,
  });

  childProcess.on("exit", (code) => {
    if (code !== null && code !== 0) {
      console.log("\x1b[31m%s\x1b[0m", `\n❌ Process exited with code ${code}`);
    }
  });
}

function scheduleReload(message: string) {
  // Clear any pending reload
  if (reloadTimeout) {
    clearTimeout(reloadTimeout);
  }

  // Debounce: wait 100ms before reloading
  reloadTimeout = setTimeout(() => {
    console.log("\x1b[33m%s\x1b[0m", message);
    runMain();
    reloadTimeout = null;
  }, 100);
}

// Watch main.ts
watch(mainFile, async (eventType) => {
  if (eventType === "change") {
    scheduleReload("📝 main.ts changed, reloading...");
  }
});

// Watch challenges folder
watch(challengesFolder, { recursive: true }, async (eventType, filename) => {
  if (eventType === "change" && filename?.endsWith(".ts")) {
    const changedFile = resolve(challengesFolder, filename);
    const importedFiles = await getImportedFiles();

    // Only reload if the changed file is imported in main.ts
    if (importedFiles.has(changedFile)) {
      scheduleReload(`📝 challenges/${filename} changed (imported in main.ts), reloading...`);
    } else {
      console.log("\x1b[90m%s\x1b[0m", `📝 challenges/${filename} changed (not imported, skipping reload)`);
    }
  }
});

// Initial load
(async () => {
  const importedFiles = await getImportedFiles();
  console.log("\x1b[32m%s\x1b[0m", "👀 Watching for file changes...");
  console.log("\x1b[90m%s\x1b[0m", `   - ${mainFile}`);

  if (importedFiles.size > 0) {
    console.log("\x1b[90m%s\x1b[0m", "   - Imported files:");
    importedFiles.forEach((file) => {
      console.log("\x1b[90m%s\x1b[0m", `     • ${file.replace(__dirname + "/", "")}`);
    });
  } else {
    console.log("\x1b[33m%s\x1b[0m", "   ⚠️  No imports found in main.ts");
  }
  console.log();

  runMain();
})();
