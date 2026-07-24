import { readFileSync } from "node:fs";

const packageVersion = JSON.parse(readFileSync(new URL("../package.json", import.meta.url))).version;
const cargoVersion = readFileSync(new URL("../src-tauri/Cargo.toml", import.meta.url), "utf8").match(/^version\s*=\s*"([^"]+)"/m)?.[1];
const tauriVersion = JSON.parse(readFileSync(new URL("../src-tauri/tauri.conf.json", import.meta.url))).version;
if (!cargoVersion || packageVersion !== cargoVersion || packageVersion !== tauriVersion) throw new Error(`Version mismatch: package=${packageVersion}, cargo=${cargoVersion ?? "missing"}, tauri=${tauriVersion}`);
