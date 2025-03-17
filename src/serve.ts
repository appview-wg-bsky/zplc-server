import { db } from "./db.ts";

export default {
  fetch(req, _info) {
    const pathname = new URL(req.url).pathname;

    if (pathname.startsWith("/did:")) {
      // resolve did:plc to zplc number
      const id = db.didToZplc(pathname.substring(1));
      return id
        ? new Response(String(id), { headers: { "content-type": "text/plain" } })
        : new Response("zplc not found", { status: 404, headers: { "content-type": "text/plain" } });
    } else if (pathname.match(/^\/\d+$/)) {
      // resolve zplc number to did:plc
      const did = db.zplcToDid(Number(pathname.substring(1)));
      return did
        ? new Response(did, { headers: { "content-type": "text/plain" } })
        : new Response("did not found", { status: 404, headers: { "content-type": "text/plain" } });
    } else if (pathname === "/latest") {
      const latest = db.latestOp();
      return new Response(latest ?? "", { headers: { "content-type": "text/plain" } });
    } else if (pathname === "/") {
      return new Response(
        [
          "github.com/char/zplc-server",
          "GET /<zplc> - resolve a zplc id to a did:plc: identifier",
          "GET /did:plc:<id> - resolve a did:plc: identifier to a zplc id",
        ].join("\n"),
      );
    }

    return new Response("Not Found", {
      headers: { "content-type": "text/plain" },
      status: 404,
    });
  },
} satisfies Deno.ServeDefaultExport;
