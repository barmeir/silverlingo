import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const apiDir = path.join(rootDir, "src", "app", "api");
const backupDir = path.join(rootDir, ".api_build_backup");

const hasApiDir = fs.existsSync(apiDir);

try {
  if (hasApiDir) {
    if (fs.existsSync(backupDir)) {
      fs.rmSync(backupDir, { recursive: true, force: true });
    }
    fs.renameSync(apiDir, backupDir);
  }

  execSync("npx next build", {
    stdio: "inherit",
    env: {
      ...process.env,
      STATIC_EXPORT: "true",
    },
  });
} finally {
  if (fs.existsSync(backupDir)) {
    if (fs.existsSync(apiDir)) {
      fs.rmSync(apiDir, { recursive: true, force: true });
    }
    fs.renameSync(backupDir, apiDir);
  }
}
