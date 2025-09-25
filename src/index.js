import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initMCPClient, closeMCPClient } from './mcp-client.js';
import { createAgent, processQuery } from './llm.js';

dotenv.config();

// ES module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

let agent = null;

async function ensureAgent() {
    if (agent) return agent;
    try {
        const { tools } = await initMCPClient();
        agent = createAgent(tools);
        return agent;
    } catch (error) {
        console.error('Error initializing agent:', error);
        throw error;
    }
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

app.post('/api/query', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }
        console.log('Received query:', query);
        const agentInstance = await ensureAgent();
        const response = await processQuery(agentInstance, query);
        const lastMessage = response.messages[response.messages.length - 1];
        res.json({
            query,
            response: response.messages,
            answer: lastMessage.content
        });
    } catch (error) {
        console.error('Error processing query:', error);
        res.status(500).json({ error: 'Failed to process query', message: error.message });
    }
});

app.listen(PORT, async () => {
    try {
        await ensureAgent();
        console.log(`Server running on http://localhost:${PORT}`);
        console.log('MCP client and agent initialized successfully');
    } catch (error) {
        console.error('Failed to initialize MCP client and agent:', error);
    }
});

process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await closeMCPClient();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Shutting down...');
    await closeMCPClient();
    process.exit(0);
});