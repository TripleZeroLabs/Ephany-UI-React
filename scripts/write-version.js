import fs from "fs";
import path from "path";

const distDir = path.resolve("dist");

if (!fs.existsSync(distDir)) {
  console.error("dist/ does not exist. Run vite build first.");
  process.exit(1);
}

const version =
  process.env.GIT_SHA ||
  process.env.VITE_APP_VERSION ||
  new Date().toISOString();

const payload = {
  version,
  builtAt: new Date().toISOString(),
};

fs.writeFileSync(
  path.join(distDir, "version.json"),
  JSON.stringify(payload, null, 2)
);

console.log("version.json written:", payload);
