#!/usr/bin/env node

const { execFile } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const siteUrl = process.env.CODEX_POMODORO_ARENA_URL || "https://kappaemme-git.github.io/codex-pomodoro-arena/";
const rootDir = path.resolve(__dirname, "..");
const skillDir = path.join(os.homedir(), ".codex", "skills", "codex-pomodoro-arena");

function copyPath(source, target) {
  fs.cpSync(source, target, { recursive: true, force: true });
}

function installSkill() {
  fs.mkdirSync(skillDir, { recursive: true });
  copyPath(path.join(rootDir, "SKILL.md"), path.join(skillDir, "SKILL.md"));
  copyPath(path.join(rootDir, "agents"), path.join(skillDir, "agents"));
  copyPath(path.join(rootDir, "scripts", "open-pomodoro-arena.sh"), path.join(skillDir, "scripts", "open-pomodoro-arena.sh"));
  fs.chmodSync(path.join(skillDir, "scripts", "open-pomodoro-arena.sh"), 0o755);
  console.log(`Codex Pomodoro Arena skill installed at ${skillDir}`);
  console.log(`It will open ${siteUrl}`);
}

function openUrl(url) {
  const platform = process.platform;
  const attempts =
    platform === "darwin"
      ? [["open", ["-a", "Google Chrome", url]], ["open", [url]]]
      : platform === "win32"
        ? [["cmd", ["/c", "start", "", url]]]
        : [["google-chrome", [url]], ["xdg-open", [url]]];

  const run = (index) => {
    if (!attempts[index]) {
      console.log(url);
      return;
    }

    const [command, args] = attempts[index];
    const child = execFile(command, args, { windowsHide: true }, (error) => {
      if (error) run(index + 1);
    });
    child.unref();
  };

  run(0);
}

if (process.argv.includes("--install-skill")) {
  installSkill();
} else {
  openUrl(siteUrl);
  console.log(`Codex Pomodoro Arena opened at ${siteUrl}`);
}
