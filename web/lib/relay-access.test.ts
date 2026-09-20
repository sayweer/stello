import assert from "node:assert/strict";
import { test } from "node:test";
import { relayAccess } from "./relay-access.ts";

test("a separate app can preflight the relay when its exact origin is allowed", () => {
  const request = new Request("https://stello.example/api/relay", { method: "OPTIONS", headers: { origin: "https://app.example" } });
  const result = relayAccess(request, " https://other.example, https://app.example ");
  assert.equal(result.allowed, true);
  assert.equal(result.headers.get("Access-Control-Allow-Origin"), "https://app.example");
  assert.equal(result.headers.get("Access-Control-Allow-Methods"), "POST, OPTIONS");
});

test("unknown origins cannot invoke the relay through a browser", () => {
  const request = new Request("https://stello.example/api/relay", { headers: { origin: "https://app.example.attacker.test" } });
  const result = relayAccess(request, "https://app.example");
  assert.equal(result.allowed, false);
  assert.equal(result.headers.has("Access-Control-Allow-Origin"), false);
});

test("same-origin and non-browser requests do not need an allow-list entry", () => {
  assert.equal(relayAccess(new Request("https://stello.example/api/relay"), "").allowed, true);
  assert.equal(relayAccess(new Request("https://stello.example/api/relay", { headers: { origin: "https://stello.example" } }), "").allowed, true);
});
