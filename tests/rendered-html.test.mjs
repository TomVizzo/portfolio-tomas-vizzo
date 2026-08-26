import assert from "node:assert/strict";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders development preview metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();

  assert.match(html, developmentPreviewMeta);
  assert.match(html, /data-final-value=["']35["'][^>]*>35<\/span>/i);
  assert.match(html, /data-final-value=["']200["'][^>]*>200<\/span>/i);
  assert.match(html, /aria-label=["']Empresas con las que Tomás Vizzo construyó vínculos comerciales["']/i);
  assert.match(html, /\/clients\/scr\.png/i);
  assert.match(html, /class=["'][^"']*page-loader[^"']*["']/i);
  assert.match(html, /aria-label=["']Progreso de carga["']/i);
});
