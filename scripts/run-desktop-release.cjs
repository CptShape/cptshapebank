const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const rootDir = path.join(__dirname, "..");
loadEnvFile(path.join(rootDir, ".env"));

if (!process.env.GH_TOKEN) {
  console.error('GH_TOKEN was not found. Add it to .env or set it in the terminal first.');
  process.exit(1);
}

const electronBuilderCli = path.join(rootDir, "node_modules", "electron-builder", "cli.js");
const child = spawn(process.execPath, [electronBuilderCli, "--win", "nsis", "--publish", "always"], {
  cwd: rootDir,
  env: process.env,
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});

