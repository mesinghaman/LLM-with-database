<img width="1917" height="903" alt="image" src="https://github.com/user-attachments/assets/a3164edf-cd40-486c-ab84-ae6b57c18ce0" />


# PostgreSQL MCP Chat Assistant

An intelligent assistant to explore and query PostgreSQL databases using natural language. This project leverages the Model Context Protocol (MCP) client, LangChain agents, and OpenAI-powered language models to provide an interactive chat interface for PostgreSQL.

---

## Features

- Connect to PostgreSQL database securely using MCP client
- Natural language query interface powered by OpenAI GPT models
- Interactive chat frontend to ask questions about the database schema, data, and more
- Uses PostgreSQL-compatible SQL queries for database exploration
- Easy initialization of database schema and datasets


---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL database access (connection URL)
- OpenAI API key or compatible LLM API key

---

 
### Initialize Database

Run the database initialization script to clone the required schema repository, apply schema, and load initial data:

node scripts/initializeDb.js
---

### Run the Server

Start the Express server which hosts the chat API and frontend:

node index.js

Open [http://localhost:8080](http://localhost:8080) in your browser to access the chat interface.

---

## Usage

Type natural language questions related to your PostgreSQL database schema or data in the chat box. The assistant will generate proper SQL queries, execute them via MCP client, and return formatted results.

Examples:

- "List all tables in the database."
- "Show columns and their data types for the 'users' table."
- "What is the size of the current database?"

---

## Development

- `llm.js` contains the language model and agent creation code.
- `mcp-client.js` manages the MCP PostgreSQL client lifecycle.
- `index.js` is the Express server handling API endpoints and serving the UI.
- `public/index.html` provides the frontend chat interface.
- `scripts/initializeDb.js` automates clone and database setup.

---

## License

This project is licensed under the MIT License.

---

## Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.com/)
- [LangChain](https://langchain.com/)
- [OpenAI GPT](https://openai.com/)
- [PostgreSQL](https://www.postgresql.org/)

---

Feel free to open issues or pull requests for improvements and bug fixes!
 
