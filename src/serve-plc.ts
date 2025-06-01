import "https://char.lt/esm/pipe.ts";
import { CompatibleOpOrTombstone, DidDocument, formatDidDoc, opToData } from "npm:@did-plc/lib@0.0.4";
import { db } from "./db.ts";

const statement = db.log?.prepare("SELECT entry FROM plc_entries WHERE did = ? ORDER BY id DESC LIMIT 1");
if (!statement) throw new Error("can't serve plc when ZPLC_NO_RAW_LOG is set");

export default {
  fetch(req, _info): Response {
    const pathname = decodeURIComponent(new URL(req.url).pathname);

    if (pathname.startsWith("/did:")) {
      const did = pathname.substring(1);
      const entry = statement.value<[entry: string]>(did)?.pipe(it => it[0]);
      const doc: DidDocument | undefined = entry
        ?.pipe(it => JSON.parse(it).operation)
        ?.pipe((op: CompatibleOpOrTombstone) => opToData(did, op))
        ?.pipe(formatDidDoc);

      return doc
        ? new Response(JSON.stringify(doc), { headers: { "content-type": "application/json" } })
        : new Response(JSON.stringify({ message: "DID not registered: " + did }), {
            status: 404,
            headers: { "content-type": "application/json" },
          });
    }

    return new Response("Not Found", {
      headers: { "content-type": "text/plain" },
      status: 404,
    });
  },
} satisfies Deno.ServeDefaultExport;
