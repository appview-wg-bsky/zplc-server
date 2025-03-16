import { db } from "./db.ts";

const plcLookup = db.prepare("SELECT id FROM plc_idents WHERE did = ?");
const zplcLookup = db.prepare("SELECT did FROM plc_idents WHERE id = ?");

export default {
  async fetch(req, _info) {
    const pathname = new URL(req.url).pathname;

    if (pathname.startsWith("/did:")) {
      // resolve did:plc to zplc number
      const maybeId = plcLookup.value<[id: number]>(pathname.substring(1));
      if (maybeId) {
        return new Response(String(maybeId[0]), { headers: { "content-type": "text/plain" } });
      } else {
        return new Response("zplc not found", { status: 404, headers: { "content-type": "text/plain" } });
      }
    } else if (pathname.match(/^\/\d+$/)) {
      // resolve zplc number to did:plc
      const maybeDid = zplcLookup.value<[did: string]>(Number(pathname.substring(1)));
      if (maybeDid) {
        return new Response(maybeDid[0], { headers: { "content-type": "text/plain" } });
      } else {
        return new Response("did not found", { status: 404, headers: { "content-type": "text/plain" } });
      }
    } else if (pathname === "/latest") {
      const latest = db
        .prepare("SELECT created_at FROM plc_entries ORDER BY id DESC LIMIT 1")
        .value<[createdAt: string]>();
      if (latest) {
        return new Response(latest[0], { headers: { "content-type": "text/plain" } });
      } else {
        return new Response("", { headers: { "content-type": "text/plain" } });
      }
    }

    return new Response("Not Found", {
      headers: { "content-type": "text/plain" },
      status: 404,
    });
  },
} satisfies Deno.ServeDefaultExport;
