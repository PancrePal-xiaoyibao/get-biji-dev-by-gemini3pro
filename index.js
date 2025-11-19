#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import dotenv from 'dotenv';
import { ApiClient } from './src/api/client.js';
import logger from './src/logger.js';

dotenv.config();

const API_KEY = process.env.GET_API_KEY;
const DEFAULT_TOPIC_ID = process.env.GET_NOTE_TOPIC_ID;

if (!API_KEY) {
    logger.error('GET_API_KEY environment variable is required');
    process.exit(1);
}

const apiClient = new ApiClient({ apiKey: API_KEY });

const server = new Server(
    {
        name: 'get-notes-mcp',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

/**
 * Tool Definitions
 */
const SEARCH_KNOWLEDGE_TOOL = {
    name: 'search_knowledge',
    description: 'Search knowledge base with AI processing. Returns synthesized answers and references.',
    inputSchema: {
        type: 'object',
        properties: {
            question: {
                type: 'string',
                description: 'The question to ask'
            },
            topic_ids: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of knowledge base IDs. If not provided, uses the default configured topic ID.'
            },
            deep_seek: {
                type: 'boolean',
                description: 'Enable deep thinking mode',
                default: true
            },
            history: {
                type: 'array',
                description: 'Chat history for context',
                items: {
                    type: 'object',
                    properties: {
                        content: { type: 'string' },
                        role: { type: 'string', enum: ['user', 'assistant'] }
                    }
                }
            }
        },
        required: ['question']
    }
};

const RECALL_KNOWLEDGE_TOOL = {
    name: 'recall_knowledge',
    description: 'Raw recall from knowledge base without AI synthesis. Returns list of relevant notes/files.',
    inputSchema: {
        type: 'object',
        properties: {
            question: {
                type: 'string',
                description: 'The question or query'
            },
            topic_id: {
                type: 'string',
                description: 'Knowledge base ID. If not provided, uses the default configured topic ID.'
            },
            top_k: {
                type: 'number',
                description: 'Number of results to return',
                default: 10
            },
            intent_rewrite: {
                type: 'boolean',
                description: 'Enable intent rewrite',
                default: false
            }
        },
        required: ['question']
    }
};

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [SEARCH_KNOWLEDGE_TOOL, RECALL_KNOWLEDGE_TOOL],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;

        switch (name) {
            case 'search_knowledge': {
                const params = { ...args };

                // Handle default topic_ids
                if (!params.topic_ids || params.topic_ids.length === 0) {
                    if (DEFAULT_TOPIC_ID) {
                        params.topic_ids = [DEFAULT_TOPIC_ID];
                    } else {
                        throw new Error('topic_ids is required (no default configured)');
                    }
                }

                // Ensure topic_ids is array
                if (!Array.isArray(params.topic_ids)) {
                    throw new Error('topic_ids must be an array');
                }

                const response = await apiClient.searchKnowledge(params);

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(response.data, null, 2),
                        },
                    ],
                };
            }

            case 'recall_knowledge': {
                const params = { ...args };

                // Handle default topic_id
                if (!params.topic_id) {
                    if (DEFAULT_TOPIC_ID) {
                        params.topic_id = DEFAULT_TOPIC_ID;
                    } else {
                        throw new Error('topic_id is required (no default configured)');
                    }
                }

                const response = await apiClient.recallKnowledge(params);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(response.data, null, 2),
                        },
                    ],
                };
            }

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        logger.error('Tool execution error', { error: error.message });
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
});

async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info('Get Notes MCP Server running on stdio');
}

runServer().catch((error) => {
    logger.error('Fatal error running server', { error });
    process.exit(1);
});
