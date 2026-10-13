
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";
import pg from "pg";

console.error(
  "MCP server password status:",
  typeof process.env.PGPASSWORD,
  process.env.PGPASSWORD ? "SET" : "MISSING"
);

const db = new pg.Pool();

const server = new McpServer({
  name: "sugarcane-farmer-server",
  version: "1.0.0",
});

server.registerTool(
  "get_farmer_data",
  {
    description:
      "Retrieve all farmers, their villages, sugarcane supplied in tons, amount paid, and pending payments.",
    inputSchema: z.object({}),
  },
  async () => {
    try {
      const result = await db.query(`
        SELECT farmer_id, name, village,
               sugarcane_supplied_tons,
               amount_paid, payment_pending
        FROM farmers
        ORDER BY farmer_id
      `);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result.rows),
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text:
              error instanceof Error
                ? error.message
                : "Unknown database error",
          },
        ],
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
