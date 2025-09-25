import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import dotenv from "dotenv";


dotenv.config();

const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_API_MODEL = process.env.LLM_API_MODEL || "gpt-4o-mini";
const LLM_API_URL = process.env.LLM_API_URL || "https://api.openai.com/v1";

function initLLM(){
    if(!LLM_API_KEY){
        throw new Error("LLM_API_KEY environment variable is not set");
    }
    const llm = new ChatOpenAI({
    openAIApiKey: LLM_API_KEY,
    modelName: LLM_API_MODEL,
    temperature: 0.2,
    configuration: {
      baseURL: LLM_API_URL,
    },
  });
  
  return llm;
}


export function createAgent(tools) {
  const llm = initLLM(); 
  const agent = createReactAgent({
    llm,
    tools,
  });
  
  return agent;
}

export async function processQuery(agent, query) { 
  const systemMessage = {
    role: "system",
    content: `You are a helpful assistant that can explore PostgreSQL databases using SQL queries.

IMPORTANT: Use PostgreSQL syntax, NOT MySQL syntax. For example:
- To list all tables: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
- To describe a table: SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'table_name';
- To show database size: SELECT pg_size_pretty(pg_database_size(current_database()));

Avoid using MySQL commands like SHOW TABLES, DESCRIBE table_name, etc. as they won't work in PostgreSQL.

When using the query tool, always provide the full SQL query in the 'sql' parameter.`
  };

  const userMessage = {
    role: "user",
    content: query
  }; 
  const response = await agent.invoke({
    messages: [systemMessage, userMessage],
  });

  return response;
}