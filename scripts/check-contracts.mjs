#!/usr/bin/env node
// Lightweight presence/structure check for the canonical contracts directory
// configured in `contracts.config.json`. Reads pointer, verifies the directory
// exists and contains the required subdirectories, then prints a short summary
// of openapi services, event domains and proto services.
//
// Exit codes:
//   0 — canonical contracts present and structurally valid;
//   1 — config or contracts path missing/invalid.
//
// This script is intentionally minimal. It does not validate schema contents
// and does not generate any client code.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const configPath = path.join(repoRoot, "contracts.config.json");

function fail(message) {
  console.error(`[contracts] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(configPath)) {
  fail(`config not found: ${configPath}`);
}

let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, "utf8"));
} catch (error) {
  fail(`failed to parse ${configPath}: ${error.message}`);
}

if (typeof config.path !== "string" || config.path.length === 0) {
  fail(`contracts.config.json must define a non-empty "path"`);
}

if (!Array.isArray(config.requiredSubdirectories)) {
  fail(`contracts.config.json must define "requiredSubdirectories" as an array`);
}

const contractsPath = path.resolve(repoRoot, config.path);

if (!fs.existsSync(contractsPath)) {
  console.error(
    `[contracts] canonical contracts path not found: ${contractsPath}`,
  );
  console.error(
    `[contracts] expected source of truth at backend monorepo's contracts/`,
  );
  console.error(
    `[contracts] checkout https://… or align repo layout to contracts.config.json`,
  );
  process.exit(1);
}

const stat = fs.statSync(contractsPath);
if (!stat.isDirectory()) {
  fail(`canonical contracts path is not a directory: ${contractsPath}`);
}

const missing = [];
for (const subdir of config.requiredSubdirectories) {
  const full = path.join(contractsPath, subdir);
  if (!fs.existsSync(full) || !fs.statSync(full).isDirectory()) {
    missing.push(subdir);
  }
}

if (missing.length > 0) {
  fail(
    `missing required subdirectories under ${contractsPath}: ${missing.join(", ")}`,
  );
}

function countDirectories(target) {
  return fs
    .readdirSync(target, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .length;
}

const summary = {
  openapiServices: countDirectories(path.join(contractsPath, "openapi")),
  eventDomains: countDirectories(path.join(contractsPath, "events")),
  protoServices: countDirectories(path.join(contractsPath, "proto")),
};

console.log("[contracts] canonical source of truth OK");
console.log(`[contracts] path             = ${contractsPath}`);
console.log(`[contracts] openapi services = ${summary.openapiServices}`);
console.log(`[contracts] event domains    = ${summary.eventDomains}`);
console.log(`[contracts] proto services   = ${summary.protoServices}`);
