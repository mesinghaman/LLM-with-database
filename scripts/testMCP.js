import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { loadMcpTools } from "@langchain/mcp-adapters";
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import dotenv from "dotenv";
 
dotenv.config();
 
const POSTGRESQL_ADDON_URI = process.env.POSTGRESQL_ADDON_URI;
const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_MODEL = process.env.LLM_API_MODEL || "gpt-4o-mini";
const LLM_API_URL = process.env.LLM_API_URL || "https://api.openai.com/v1";
 
if (!POSTGRESQL_ADDON_URI) {
  console.error("Error: POSTGRESQL_ADDON_URI environment variable is not set");
  process.exit(1);
}

if (!LLM_API_KEY) {
  console.error("Error: LLM_API_KEY environment variable is not set");
  process.exit(1);
}

console.log(`Using PostgreSQL connection: ${POSTGRESQL_ADDON_URI.split('@')[1]}`);
console.log(`Using LLM model: ${LLM_MODEL}`);
console.log(`Using LLM API URL: ${LLM_API_URL}`);
 
const model = new ChatOpenAI({ 
  modelName: LLM_MODEL,
  openAIApiKey: LLM_API_KEY,
  temperature: 0.2,
  configuration: {
    baseURL: LLM_API_URL,
  }
});
 
const transport = new StdioClientTransport({
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-postgres", POSTGRESQL_ADDON_URI],
});

const mcpClient = new Client({ name: "postgres-client", version: "1.0.0" });
await mcpClient.connect(transport);
 
const tools = await loadMcpTools("query", mcpClient);
console.log("Available MCP tools:", tools.map(tool => tool.name));
 
const agent = createReactAgent({ llm: model, tools });

 
const userQuery = "List the tables in the database.";
 
const messages = [
  {
    role: "system",
    content: `You are a helpful assistant that can explore PostgreSQL databases using SQL queries.

IMPORTANT: Use PostgreSQL syntax, NOT MySQL syntax. For example:
- To list all tables: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
- To describe a table: SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'table_name';
- To show database size: SELECT pg_size_pretty(pg_database_size(current_database()));

Avoid using MySQL commands like SHOW TABLES, DESCRIBE table_name, etc. as they won't work in PostgreSQL.

When using the query tool, always provide the full SQL query in the 'sql' parameter.`
  },
  {
    role: "user",
    content: userQuery
  }
];
 
console.log("Sending request to model with explicit system message...");
const response = await agent.invoke({
    messages: messages,
  });
 
const lastMessage = response?.messages?.[response.messages.length - 1]?.content ?? "No answer";
console.log(lastMessage);
 
await mcpClient.close();