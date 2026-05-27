const path = require("node:path");
const { spawn } = require("node:child_process");

const projectRoot = path.join(__dirname, "..");
const sdkRoot = path.join(projectRoot, ".android-sdk");
const cmdlineToolsBin = path.join(sdkRoot, "cmdline-tools", "latest", "bin");
const platformTools = path.join(sdkRoot, "platform-tools");

const env = {
  ...process.env,
  ANDROID_HOME: sdkRoot,
  ANDROID_SDK_ROOT: sdkRoot,
  JAVA_HOME: process.env.JAVA_HOME || "C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.8.9-hotspot",
  PATH: [platformTools, cmdlineToolsBin, process.env.PATH].filter(Boolean).join(path.delimiter),
};

const expoCli = path.join(projectRoot, "node_modules", "expo", "bin", "cli");
const child = spawn(process.execPath, [expoCli, "run:android"], {
  cwd: projectRoot,
  env,
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
