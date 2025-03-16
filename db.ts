import { Database } from "@db/sqlite";

export const db = new Database("./data/plc_data.db");
db.exec(`pragma journal_mode = WAL;`);
db.exec(`
CREATE TABLE IF NOT EXISTS plc_entries (
  id INTEGER PRIMARY KEY NOT NULL,
  entry TEXT NOT NULL,
  cid TEXT NOT NULL UNIQUE ON CONFLICT IGNORE,
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS plc_idents (
  id INTEGER PRIMARY KEY NOT NULL,
  did TEXT NOT NULL UNIQUE ON CONFLICT IGNORE
) STRICT;
`);
