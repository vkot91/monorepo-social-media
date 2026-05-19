/* global Buffer, process */

import { createServer, IncomingMessage, ServerResponse } from "node:http";

import { authErrors, authResponse, authTokens, authUser } from "./fixtures/auth.js";
import { getPostScenario } from "./fixtures/posts.js";

const port = Number(process.env.PLAYWRIGHT_API_PORT ?? 3210);

const json = (response: ServerResponse, status: number, body: unknown) => {
  response.writeHead(status, {
    "content-type": "application/json",
  });
  response.end(JSON.stringify(body));
};

const readJson = async (request: IncomingMessage) => {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
};

const base64UrlDecode = (input: string) => {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  return Buffer.from(padded, "base64").toString("utf8");
};

const getScenario = (request: IncomingMessage) => {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const [, payload] = authorization.slice("Bearer ".length).split(".");

  if (!payload) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(payload));

    return typeof parsed.scenario === "string" ? parsed.scenario : null;
  } catch {
    return null;
  }
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);

  if (request.method === "GET" && url.pathname === "/health") {
    json(response, 200, { ok: true });
    return;
  }

  if (request.method === "POST" && url.pathname === "/auth/login") {
    const body = await readJson(request);

    if (body.email === "error@example.com") {
      json(response, 401, authErrors.invalidCredentials);
      return;
    }

    json(response, 200, authResponse);
    return;
  }

  if (request.method === "POST" && url.pathname === "/auth/register") {
    const body = await readJson(request);

    if (body.email === "taken@example.com") {
      json(response, 409, authErrors.emailAlreadyExists);
      return;
    }

    json(response, 200, authResponse);
    return;
  }

  if (request.method === "POST" && url.pathname === "/auth/refresh") {
    json(response, 200, authTokens);
    return;
  }

  if (request.method === "POST" && url.pathname === "/auth/logout") {
    json(response, 204, null);
    return;
  }

  if (request.method === "GET" && url.pathname === "/auth/me") {
    if (!getScenario(request)) {
      json(response, 401, { message: "Authentication required" });
      return;
    }

    json(response, 200, authUser);
    return;
  }

  if (request.method === "GET" && url.pathname === "/posts") {
    const { body, status } = getPostScenario(getScenario(request));

    json(response, status, body);
    return;
  }

  json(response, 404, { message: "Not found" });
});

server.listen(port, "127.0.0.1");

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});
