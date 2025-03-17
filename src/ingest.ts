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

const insertEntry = db.prepare(`INSERT INTO plc_entries (cid, created_at, entry) VALUES (?, ?, ?)`);
const insertDid = db.prepare(`INSERT INTO plc_idents (did) VALUES (?)`);

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

  const text = await response.text();
  for (const line of new IterLines(text)) {
    const entry = JSON.parse(line) as unknown as ExportEntry;
    insertEntry.run(entry.cid, entry.createdAt, line);
    insertDid.run(entry.did);
    console.log(Deno.inspect({ c: entry.createdAt, d: entry.did }, { colors: true, breakLength: Infinity }));
  }
}

if (import.meta.main) {
  /*
  using exports = await Deno.open("./data/exports.jsonl", { read: true });
  const lineStream = exports.readable.pipeThrough(new TextDecoderStream()).pipeThrough(new TextLineStream());

  for await (const line of lineStream.values()) {
    const entry = JSON.parse(line) as unknown as ExportEntry;
    insertEntry.run(entry.cid, entry.createdAt, line);
    insertDid.run(entry.did);
    console.log(Deno.inspect({ c: entry.createdAt, d: entry.did }, { colors: true, breakLength: Infinity }));
  }
  */

  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(() => r(), ms));

  while (true) {
    const now = Date.now();
    await ingest();
    const elapsed = Date.now() - now;

    // rate limit is 500 requests per 5 minutes (300 seconds), so let's do half that
    const TARGET_SLEEP_TIME = (300 / 250) * 1000;
    await sleep(Math.max(0, TARGET_SLEEP_TIME - elapsed));
  }
}
