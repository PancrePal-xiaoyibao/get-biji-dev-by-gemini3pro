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
import { loadKnowledgeBases, getKnowledgeBases, getKnowledgeBaseById } from './src/config/knowledgeBases.js';

dotenv.config();

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
const LIST_KNOWLEDGE_BASES_TOOL = {
    name: 'list_knowledge_bases',
    description: 'List available knowledge bases with their IDs and descriptions. You MUST use this tool first to find the correct kb_id for search_knowledge or recall_knowledge.',
    inputSchema: {
        type: 'object',
        properties: {},
    }
};

const SEARCH_KNOWLEDGE_TOOL = {
    name: 'search_knowledge',
    description: 'Search knowledge base with AI processing. Returns synthesized answers and references.',
    inputSchema: {
        type: 'object',
        properties: {
            kb_id: {
                type: 'string',
                description: 'The ID of the knowledge base to search. Optional if only one KB is configured or to use the default.'
            },
            question: {
                type: 'string',
                description: 'The question to ask'
            },
            deep_seek: {
                type: 'boolean',
                description: 'Enable deep thinking mode',
                default: false
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
            kb_id: {
                type: 'string',
                description: 'The ID of the knowledge base to search. Optional if only one KB is configured or to use the default.'
            },
            question: {
                type: 'string',
                description: 'The question or query'
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
        tools: [LIST_KNOWLEDGE_BASES_TOOL, SEARCH_KNOWLEDGE_TOOL, RECALL_KNOWLEDGE_TOOL],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;

        switch (name) {
            case 'list_knowledge_bases': {
                const kbs = getKnowledgeBases();
                // Return simplified list (hide sensitive config)
                const publicKbs = kbs.map(kb => ({
                    id: kb.id,
                    name: kb.name,
                    description: kb.description
                }));

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(publicKbs, null, 2),
                        },
                    ],
                };
            }

            case 'search_knowledge': {
                const { kb_id, ...params } = args;
                let kb;

                if (kb_id) {
                    kb = getKnowledgeBaseById(kb_id);
                    if (!kb) {
                        throw new Error(`Knowledge base not found: ${kb_id}`);
                    }
                } else {
                    // Default to the first one
                    const kbs = getKnowledgeBases();
                    if (kbs.length === 0) {
                        throw new Error('No knowledge bases configured');
                    }
                    kb = kbs[0];
                }

                // Initialize client for this specific KB
                const client = new ApiClient({
                    apiKey: kb.config.api_key,
                    baseUrl: kb.config.api_endpoint
                });

                // Inject topic_id from config (API requires array format but only supports 1)
                if (kb.config.topic_id) {
                    params.topic_ids = [kb.config.topic_id];
                }

                // Set default value for deep_seek if not provided
                if (params.deep_seek === undefined) {
                    params.deep_seek = false;
                }

                const response = await client.searchKnowledge(params);

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
                const { kb_id, ...params } = args;
                let kb;

                if (kb_id) {
                    kb = getKnowledgeBaseById(kb_id);
                    if (!kb) {
                        throw new Error(`Knowledge base not found: ${kb_id}`);
                    }
                } else {
                    // Default to the first one
                    const kbs = getKnowledgeBases();
                    if (kbs.length === 0) {
                        throw new Error('No knowledge bases configured');
                    }
                    kb = kbs[0];
                }

                const client = new ApiClient({
                    apiKey: kb.config.api_key,
                    baseUrl: kb.config.api_endpoint
                });

                // Inject topic_id from config
                if (kb.config.topic_id) {
                    params.topic_id = kb.config.topic_id;
                }

                const response = await client.recallKnowledge(params);
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
    await loadKnowledgeBases();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info('Get Notes MCP Server running on stdio');
}

runServer().catch((error) => {
    logger.error('Fatal error running server', { error });
    process.exit(1);
});
