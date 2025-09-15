#!/usr/bin/env node


import path from "path";
import fs from "fs";
import { pathToFileURL } from "url";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROVIDER_URL = "http://127.0.0.1:8545";


async function loadAndRun(filePath, argsArray) {
  
  try {
    const fileUrl = pathToFileURL(filePath).href;
    const imported = await import(fileUrl);

    const fn = imported.default ?? imported.run ?? imported;
    if (typeof fn !== "function") {
      throw new Error(`Imported value from ${filePath} is not a function`);
    }

    await Promise.resolve(fn(PROVIDER_URL, ...argsArray));
    return;
  } catch (err) {
    console.error("Failed to import and run level script:", err);
    process.exit(1);
  }

}


const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("Usage: solve [LEVEL] <CONTRACT>");
  process.exit(1);
}

const [level, ...rest] = args;
const scriptPath = path.resolve(__dirname, level, "index.js");


if (!fs.existsSync(scriptPath)) {
  console.error(`Level script not found: ${scriptPath}`);
  process.exit(1);
}


await loadAndRun(scriptPath, rest);

