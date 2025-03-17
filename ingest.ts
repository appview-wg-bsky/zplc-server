import { db } from "./db.ts";
import { IterLines } from "./iter-lines.ts";

export interface ExportEntry {
  did: string;
  operation: unknown;
  cid: string;
  nullified: boolean;
  createdAt: string; // iso timestamp
}

// ok TODO: this but its just reading from the big exports.jsonl i have on the other machine

export async function ingest() {
  const url = new URL("https://plc.directory/export");
  url.searchParams.set("count", "1000");

  const latestOp = db
    .prepare(`SELECT created_at FROM plc_entries ORDER BY id DESC LIMIT 1`)
    .value<[created_at: string]>();

  if (latestOp) url.searchParams.set("after", latestOp[0]);

  const response = await fetch(url, {
    headers: { "user-agent": "char-zplc/0.1 (cerulea.blue)" },
  });
  if (response.status !== 200) {
    console.warn(response);
    return;
  }

  const insertEntry = db.prepare(`INSERT INTO plc_entries (cid, created_at, entry) VALUES (?, ?, ?)`);
  const insertDid = db.prepare(`INSERT INTO plc_idents (did) VALUES (?)`);

  const text = await response.text();
  for (const line of new IterLines(text)) {
    const entry = JSON.parse(line) as unknown as ExportEntry;
    insertEntry.run(entry.cid, entry.createdAt, line);
    insertDid.run(entry.did);
    console.log(Deno.inspect({ c: entry.createdAt, d: entry.did }, { colors: true, breakLength: Infinity }));
  }
}

if (import.meta.main) {
  await ingest();
}
