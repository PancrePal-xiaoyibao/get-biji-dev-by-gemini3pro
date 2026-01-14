import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.resolve(__dirname, '../../knowledge_bases.json');

let knowledgeBases = [];

export async function loadKnowledgeBases() {
    try {
        const data = await fs.readFile(CONFIG_PATH, 'utf-8');
        knowledgeBases = JSON.parse(data);
    } catch (error) {
        console.warn('Warning: Could not load knowledge_bases.json, using empty list or environment variables.', error.message);
        knowledgeBases = [];
    }

    // Backward compatibility: Inject KB from environment variables if they exist
    const envApiKey = process.env.GET_API_KEY;
    const envTopicId = process.env.GET_NOTE_TOPIC_ID;

    if (envApiKey) {
        // Check if already exists to avoid duplicates
        const defaultId = 'default_env_kb';
        const exists = knowledgeBases.find(kb => kb.id === defaultId);

        if (!exists) {
            knowledgeBases.unshift({
                id: defaultId,
                name: "Default Knowledge Base (Env)",
                description: "Configured via environment variables",
                config: {
                    api_endpoint: process.env.GET_API_ENDPOINT || 'https://open-api.biji.com/getnote/openapi',
                    api_key: envApiKey,
                    topic_id: envTopicId || ''
                }
            });
        }
    }

    // Support for multiple KBs via environment variable (JSON string)
    const envKbsJson = process.env.GET_KNOWLEDGE_BASES;
    if (envKbsJson) {
        try {
            const envKbs = JSON.parse(envKbsJson);
            if (Array.isArray(envKbs)) {
                const DEFAULT_ENDPOINT = 'https://open-api.biji.com/getnote/openapi';
                // Merge strategies: Append? Prepend? Overwrite?
                // Let's append, but filter out duplicates by ID
                for (const kb of envKbs) {
                    if (!knowledgeBases.find(existing => existing.id === kb.id)) {
                        // Apply defaults
                        if (kb.config && !kb.config.api_endpoint) {
                            kb.config.api_endpoint = DEFAULT_ENDPOINT;
                        }
                        knowledgeBases.push(kb);
                    }
                }
            }
        } catch (e) {
            console.warn('Failed to parse GET_KNOWLEDGE_BASES environment variable:', e.message);
        }
    }

    // Expand grouped configurations
    knowledgeBases = expandKnowledgeBases(knowledgeBases);

    // Normalize configs: ensure api_endpoint and topic_id are set
    const DEFAULT_ENDPOINT = 'https://open-api.biji.com/getnote/openapi';
    knowledgeBases.forEach(kb => {
        if (kb.config) {
            if (!kb.config.api_endpoint) {
                kb.config.api_endpoint = DEFAULT_ENDPOINT;
            }
            // Ensure topic_id is set (no longer support topic_ids array)
            if (!kb.config.topic_id) {
                kb.config.topic_id = '';
            }
        }
    });

    return knowledgeBases;
}

/**
 * Expand grouped knowledge base configurations into individual entries.
 * A grouped config has a 'topics' array in its config, where each topic
 * becomes an independent knowledge base entry.
 * 
 * @param {Array} rawConfig - Raw configuration array
 * @returns {Array} Expanded configuration array
 */
function expandKnowledgeBases(rawConfig) {
    const expanded = [];

    for (const group of rawConfig) {
        if (group.config && group.config.topics && Array.isArray(group.config.topics)) {
            // Grouped configuration: expand into multiple independent KBs
            for (const topic of group.config.topics) {
                expanded.push({
                    id: topic.id,
                    name: topic.name,
                    description: topic.description || '',
                    config: {
                        api_key: group.config.api_key,
                        api_endpoint: group.config.api_endpoint || 'https://open-api.biji.com/getnote/openapi',
                        topic_id: topic.topic_id
                    }
                });
            }
        } else {
            // Regular configuration: keep as-is
            expanded.push(group);
        }
    }

    return expanded;
}

export function getKnowledgeBases() {
    return knowledgeBases;
}

export function getKnowledgeBaseById(id) {
    return knowledgeBases.find(kb => kb.id === id);
}
