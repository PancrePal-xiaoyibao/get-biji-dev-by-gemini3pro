import { jest } from '@jest/globals';
import { ApiClient } from '../src/api/client.js';

// Use unstable_mockModule for ESM
jest.unstable_mockModule('../src/api/client.js', () => ({
    ApiClient: jest.fn()
}));

jest.unstable_mockModule('../src/logger.js', () => ({
    default: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    }
}));

// Dynamic import after mocking
const { loadKnowledgeBases, getKnowledgeBases, getKnowledgeBaseById } = await import('../src/config/knowledgeBases.js');

describe('Multi-Knowledge Base Configuration', () => {
    beforeAll(async () => {
        // Load the config
        await loadKnowledgeBases();
    });

    test('should load and expand grouped knowledge bases from config file', () => {
        const kbs = getKnowledgeBases();
        expect(kbs).toBeDefined();
        expect(Array.isArray(kbs)).toBe(true);

        // The grouped config should be expanded into 2 separate KBs
        const kb1 = kbs.find(kb => kb.id === 'kb_pancreatic_trials');
        const kb2 = kbs.find(kb => kb.id === 'kb_patient_experience');

        expect(kb1).toBeDefined();
        expect(kb1.config).toHaveProperty('api_endpoint');
        expect(kb1.config).toHaveProperty('api_key');
        expect(kb1.config).toHaveProperty('topic_id');

        expect(kb2).toBeDefined();
        expect(kb2.config).toHaveProperty('api_endpoint');
        expect(kb2.config).toHaveProperty('api_key');
        expect(kb2.config).toHaveProperty('topic_id');
    });

    test('should retrieve expanded KB by ID', () => {
        const kb = getKnowledgeBaseById('kb_pancreatic_trials');
        expect(kb).toBeDefined();
        expect(kb.id).toBe('kb_pancreatic_trials');
        expect(kb.name).toBe('肿瘤临床试验知识库');
    });

    test('should support dynamic ApiClient instantiation for expanded KBs', () => {
        const kb = getKnowledgeBaseById('kb_pancreatic_trials');
        // We just check if we can access the mock, actual instantiation logic is in index.js
        // But we can verify the config is correct for instantiation
        expect(kb.config.api_key).toBeDefined();
        expect(kb.config.api_endpoint).toBeDefined();
        expect(kb.config.topic_id).toBeDefined();
    });

    test('should support GET_KNOWLEDGE_BASES env var with default endpoint', async () => {
        // Mock process.env
        process.env.GET_KNOWLEDGE_BASES = JSON.stringify([
            {
                id: 'env_kb_test',
                name: 'Env Var KB',
                description: 'From Env Var',
                config: {
                    // No api_endpoint provided
                    api_key: 'env_key',
                    topic_id: 'env_topic'
                }
            }
        ]);

        // Reload config
        await loadKnowledgeBases();
        const kbs = getKnowledgeBases();
        const envKb = kbs.find(kb => kb.id === 'env_kb_test');
        expect(envKb).toBeDefined();
        expect(envKb.name).toBe('Env Var KB');
        // Check default endpoint
        expect(envKb.config.api_endpoint).toBe('https://open-api.biji.com/getnote/openapi');
    });

    test('should support legacy GET_API_KEY env var', async () => {
        // Clear other env vars
        delete process.env.GET_KNOWLEDGE_BASES;
        process.env.GET_API_KEY = 'legacy_key';
        process.env.GET_NOTE_TOPIC_ID = 'legacy_topic';

        // Reload config
        await loadKnowledgeBases();
        const kbs = getKnowledgeBases();

        // Should find the default env kb
        const defaultKb = kbs.find(kb => kb.id === 'default_env_kb');
        expect(defaultKb).toBeDefined();
        expect(defaultKb.config.api_key).toBe('legacy_key');
        expect(defaultKb.config.topic_id).toBe('legacy_topic');
    });

    test('should expand grouped configuration from env var', async () => {
        // Mock process.env with grouped config
        process.env.GET_KNOWLEDGE_BASES = JSON.stringify([
            {
                id: 'test_group',
                name: 'Test Group',
                config: {
                    api_key: 'test_key',
                    topics: [
                        { id: 'kb_test_1', name: 'Test KB 1', topic_id: 'topic1' },
                        { id: 'kb_test_2', name: 'Test KB 2', topic_id: 'topic2' }
                    ]
                }
            }
        ]);

        // Reload config
        await loadKnowledgeBases();
        const kbs = getKnowledgeBases();

        // Should be expanded into 2 separate KBs
        const kb1 = kbs.find(kb => kb.id === 'kb_test_1');
        const kb2 = kbs.find(kb => kb.id === 'kb_test_2');

        expect(kb1).toBeDefined();
        expect(kb1.config.api_key).toBe('test_key');
        expect(kb1.config.topic_id).toBe('topic1');
        expect(kb1.name).toBe('Test KB 1');

        expect(kb2).toBeDefined();
        expect(kb2.config.api_key).toBe('test_key');
        expect(kb2.config.topic_id).toBe('topic2');
        expect(kb2.name).toBe('Test KB 2');
    });
});
