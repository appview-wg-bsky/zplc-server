import "https://char.lt/esm/pipe.ts";

import { Database } from "@db/sqlite";

const ids = new Database("./data/ids.db").tap(db => {
  db.exec(`pragma journal_mode = WAL;`);
  db.exec(`
  CREATE TABLE IF NOT EXISTS plc_idents (
    id INTEGER PRIMARY KEY NOT NULL,
    did TEXT NOT NULL UNIQUE ON CONFLICT IGNORE
  ) STRICT;
  `);
});
const log = !Deno.env.get("ZPLC_NO_RAW_LOG")?.pipe(it => ["true", "1"].includes(it))
  ? new Database("./data/log.db").tap(db => {
      db.exec(`pragma journal_mode = WAL;`);
      db.exec(` 
      CREATE TABLE IF NOT EXISTS plc_entries (
        id INTEGER PRIMARY KEY NOT NULL,
        entry TEXT NOT NULL,
        cid TEXT NOT NULL UNIQUE ON CONFLICT IGNORE,
        created_at TEXT NOT NULL
      ) STRICT;
      `);
    })
  : undefined;

const zplcToDid = ids.prepare("SELECT did FROM plc_idents WHERE id = ?");
const didToZplc = ids.prepare("SELECT id FROM plc_idents WHERE did = ?");

const insertEntry = log?.prepare(`INSERT INTO plc_entries (cid, created_at, entry) VALUES (?, ?, ?)`);
const insertDid = ids.prepare(`INSERT INTO plc_idents (did) VALUES (?)`);

// TODO: we need to figure out an alternative for when we're running logless.
// probably just write latest of batch to a flat file
const latestOp = log?.prepare(`SELECT created_at FROM plc_entries ORDER BY id DESC LIMIT 1`);
let latest: string | undefined;
try {
  latest = Deno.readTextFileSync("./data/latest-date").trim();
} catch {
  // ignore
}

export const db = {
  zplc: ids,
  log,
  zplcToDid: (zplc: number) => zplcToDid.value<[string]>(zplc)?.pipe(it => it[0]),
  didToZplc: (did: string) => didToZplc.value<[number]>(did)?.pipe(it => it[0]),
  ingest: (cid: string, createdAt: string, did: string, raw: string) => {
    latest = createdAt;
    insertEntry?.run(cid, createdAt, raw);
    insertDid.run(did);
  },
  latestOp: latestOp
    ? () => latestOp?.value<[created_at: string]>()?.pipe(it => it[0])
    : () => {
        if (latest) return latest;
        try {
          return Deno.readTextFileSync("./data/latest-date");
        } catch {
          return undefined;
        }
      },
  flush: () => {
    latest?.pipe(c => Deno.writeTextFileSync("./data/latest-date", c));
  },
};
