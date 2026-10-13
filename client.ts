import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI();

let requestQueue = Promise.resolve();

export function askFarmerQuestion(question: string): Promise<string> {
  const run = () => executeFarmerQuestion(question);
  const result = requestQueue.then(run, run);
  requestQueue = result.then(() => {}, () => {});
  return result;
}

async function executeFarmerQuestion(question: string): Promise<string> {
  const trimmed = question.trim();
  if (!trimmed) {
    throw new Error("Question must not be empty.");
  }

  const transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", "server.ts"],
    cwd: __dirname,
    env: {
      ...process.env,
      PGHOST: process.env.PGHOST ?? "localhost",
      PGPORT: process.env.PGPORT ?? "5432",
      PGDATABASE: process.env.PGDATABASE ?? "sanjivani_sugar_factory",
      PGUSER: process.env.PGUSER ?? "postgres",
      PGPASSWORD: process.env.PGPASSWORD ?? "",
    },
  });

  const mcp = new Client({
    name: "sugarcane-farmer-client",
    version: "1.0.0",
  });

  try {
    await mcp.connect(transport);

    const { tools } = await mcp.listTools();
    const tool = tools.find((t) => t.name === "get_farmer_data");
    if (!tool) {
      throw new Error("Required MCP tool 'get_farmer_data' not found.");
    }

    const availableTools = [
      {
        type: "function" as const,
        name: tool.name,
        description:
          tool.description ??
          "Retrieve all sugarcane farmer records from the factory database.",
        parameters: {
          type: "object",
          properties: {},
          required: [],
          additionalProperties: false,
        },
        strict: true,
      },
    ];

    const instructions =
      "You are the official Sugarcane Farmer AI Assistant for Sanjivani Sugar Factory.\n" +
      "Guidelines:\n" +
      "1. You have access to the 'get_farmer_data' tool which returns farmer records from the PostgreSQL database.\n" +
      "2. When answering any question about farmers, sugarcane supply, villages, or payments, ALWAYS call the tool first to fetch verified data.\n" +
      "3. DATA INTEGRITY & DEDUPLICATION: The database currently stores 40 rows containing 10 distinct farmers repeated 4 times (IDs 1-10 repeat as 11-20, 21-30, 31-40 with identical farmer names, villages, tons supplied, and payment figures). " +
      "When calculating totals, averages, or counts, deduplicate records deterministically by distinct farmer name and village so you never double-count or quadruple-count totals. Note this deduplication transparently in your response.\n" +
      "4. Format monetary amounts in Indian Rupees (₹) (e.g. ₹45,000.00).\n" +
      "5. Format crop quantities in tons.\n" +
      "6. If the question is outside the scope of sugarcane farmers, the factory, or database records, politely state your scope.\n" +
      "7. Never fabricate, assume, or hallucinate records not in the database.";

    const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

    const first = await openai.responses.create({
      model,
      instructions,
      input: trimmed,
      tools: availableTools,
      tool_choice: "auto",
    });

    const call = first.output.find((item) => item.type === "function_call");

    if (!call || call.type !== "function_call") {
      return first.output_text || "No response received.";
    }

    const result = await mcp.callTool({
      name: call.name,
      arguments: JSON.parse(call.arguments || "{}"),
    });

    if (result.isError) {
      const errorDetail =
        result.content?.[0]?.type === "text"
          ? result.content[0].text
          : "Database error occurred";
      throw new Error(`MCP Tool Error: ${errorDetail}`);
    }

    const final = await openai.responses.create({
      model,
      previous_response_id: first.id,
      instructions,
      input: [
        {
          type: "function_call_output",
          call_id: call.call_id,
          output: JSON.stringify(result.content),
        },
      ],
      tools: availableTools,
    });

    return final.output_text || "No response received from AI.";
  } catch (err: any) {
    console.error("[MCP Client Error]:", err.message || err);
    throw err;
  } finally {
    try {
      await mcp.close();
    } catch {}
    try {
      await transport.close();
    } catch {}
  }
}

const isDirectExecution =
  process.argv[1] &&
  (process.argv[1].endsWith("client.ts") || process.argv[1].endsWith("client.js"));

if (isDirectExecution) {
  const cliQuestion =
    process.argv.slice(2).join(" ") ||
    "List farmers with pending payments, show their names, villages and pending amounts, and calculate the total.";

  console.log(`\nQuestion: "${cliQuestion}"\n`);
  askFarmerQuestion(cliQuestion)
    .then((answer) => {
      console.log("\nAI ANSWER:\n");
      console.log(answer);
    })
    .catch((error) => {
      console.error("\nApplication error:", error.message || error);
      process.exitCode = 1;
    });
}
