#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const envPath = path.join(cwd, ".env.local");

const requiredClientVars = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

const optionalClientVars = [
  "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
  "NEXT_PUBLIC_INTERNAL_TOOL_ALLOWLIST",
];

const requiredAdminVars = [
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
];

function parseEnvFile(raw) {
  const map = new Map();
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    map.set(key, value);
  }
  return map;
}

if (!existsSync(envPath)) {
  console.error("Missing .env.local");
  console.error("Copy .env.local.example -> .env.local, lalu isi semua variabel Firebase.");
  process.exit(1);
}

const parsed = parseEnvFile(readFileSync(envPath, "utf8"));

const missingClient = requiredClientVars.filter((key) => {
  const value = parsed.get(key);
  return !value || value.length === 0;
});

const missingAdmin = requiredAdminVars.filter((key) => {
  const value = parsed.get(key);
  return !value || value.length === 0;
});

console.log("Admin Local Setup Check");
console.log(`- .env.local: ${envPath}`);
console.log(`- Client vars required: ${requiredClientVars.length}`);
console.log(`- Admin vars required: ${requiredAdminVars.length}`);

if (missingClient.length === 0) {
  console.log("Client Firebase vars: OK");
} else {
  console.log("Client Firebase vars: MISSING");
  for (const key of missingClient) console.log(`  - ${key}`);
}

if (missingAdmin.length === 0) {
  console.log("Admin API vars: OK");
} else {
  console.log("Admin API vars: MISSING");
  for (const key of missingAdmin) console.log(`  - ${key}`);
}

for (const key of optionalClientVars) {
  if (!parsed.get(key)) {
    console.log(`Optional kosong: ${key}`);
  }
}

if (missingClient.length > 0) {
  console.error("\nLogin admin lokal belum siap: isi NEXT_PUBLIC_FIREBASE_* dulu.");
  process.exit(1);
}

if (missingAdmin.length > 0) {
  console.warn("\nCatatan: login admin bisa jalan, tapi endpoint /api/admin/* akan gagal sampai FIREBASE_CLIENT_EMAIL dan FIREBASE_PRIVATE_KEY diisi.");
}

console.log("\nSetup minimum untuk akses admin localhost sudah siap.");
