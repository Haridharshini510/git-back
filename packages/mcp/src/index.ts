#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { rememberToolDefinition, handleRemember } from "./tools/remember.js";
import { resumeToolDefinition, handleResume } from "./tools/resume.js";
import { compareToolDefinition, handleCompare } from "./tools/compare.js";
import { z } from "zod";

const server = new McpServer({
  name: "gitback",
  version: "0.1.0",
});

server.tool(
  rememberToolDefinition.name,
  rememberToolDefinition.description,
  {
    note: z.string().describe(
      "Describe what you're working on, what's done, what's not, and what you plan to do next."
    ),
    tags: z.array(z.string()).optional().describe(
      "Optional tags for categorization"
    ),
  },
  async ({ note, tags }) => {
    const result = await handleRemember({ note, tags });
    return { content: [{ type: "text", text: result }] };
  }
);

server.tool(
  resumeToolDefinition.name,
  resumeToolDefinition.description,
  {
    detail: z.enum(["brief", "full"]).optional().describe(
      "Level of detail: 'brief' (default) or 'full'"
    ),
  },
  async ({ detail }) => {
    const result = await handleResume({ detail });
    return { content: [{ type: "text", text: result }] };
  }
);

server.tool(
  compareToolDefinition.name,
  compareToolDefinition.description,
  {},
  async () => {
    const result = await handleCompare();
    return { content: [{ type: "text", text: result }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("GitBack MCP server failed to start:", err);
  process.exit(1);
});
