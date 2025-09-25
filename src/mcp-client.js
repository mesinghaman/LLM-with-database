import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {StdioClientTransport} from "@modelcontextprotocol/sdk/client/stdio.js";
import {loadMcpTools} from "@langchain/mcp-adapters";

import dotenv from "dotenv";

dotenv.config();

const POSTGRESQL_ADDON_URI =process.env.POSTGRESQL_ADDON_URI;

let mcpClient =  null;
let mcpTools = null;

// @returns {Promise<Object>} 

export async function initMCPClient() {
    if(mcpClient && mcpTools){
        return { client: mcpClient, tools: mcpTools };
    }
    if (!POSTGRESQL_ADDON_URI) {
        throw new Error("POSTGRESQL_ADDON_URI environment variable is not set");
    }
    console.log(`Initializing MCP client with PostgreSQL connection: ${POSTGRESQL_ADDON_URI.split('@')[1]}`);
    const transport = new StdioClientTransport({
        command :"npx",
        args:["-y","@modelcontextprotocol/server-postgres", POSTGRESQL_ADDON_URI],
    });
    mcpClient= new Client({name:"postgres-client", version: "1.0.0" });
    await mcpClient.connect(transport);
    mcpTools = await loadMcpTools("query", mcpClient);
    return { client: mcpClient, tools: mcpTools };
}

export async function closeMCPClient() {
  if (mcpClient) {
    console.log("Closing MCP client connection");
    await mcpClient.close();
    mcpClient = null;
    mcpTools = null;
  }
}
 
process.on('SIGINT', async () => {
  await closeMCPClient();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeMCPClient();
  process.exit(0);
});