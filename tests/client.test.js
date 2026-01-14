import { jest } from '@jest/globals';
// Mock axios
jest.unstable_mockModule('axios', () => ({
    default: {
        create: jest.fn()
    }
}));

const { ApiClient } = await import('../src/api/client.js');
const axios = (await import('axios')).default;

describe('ApiClient', () => {
    let apiClient;
    let mockAxiosInstance;

    beforeEach(() => {
        mockAxiosInstance = {
            post: jest.fn(),
            interceptors: {
                response: {
                    use: jest.fn()
                }
            }
        };
        axios.create.mockReturnValue(mockAxiosInstance);

        apiClient = new ApiClient({ apiKey: 'test-key' });
    });

    test('should initialize with correct config', () => {
        expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({
            baseURL: 'https://open-api.biji.com/getnote/openapi',
            headers: expect.objectContaining({
                'Authorization': 'Bearer test-key'
            })
        }));
    });

    test('should throw if apiKey is missing', () => {
        expect(() => new ApiClient({})).toThrow('API Key is required');
    });

    test('searchKnowledge should call correct endpoint', async () => {
        mockAxiosInstance.post.mockResolvedValue({ data: { result: 'ok' } });

        const params = { question: 'test', topic_ids: ['1'] };
        await apiClient.searchKnowledge(params);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
            '/knowledge/search',
            params,
            expect.objectContaining({ responseType: 'json' })
        );
    });

    test('recallKnowledge should call correct endpoint', async () => {
        mockAxiosInstance.post.mockResolvedValue({ data: { result: 'ok' } });

        const params = { question: 'test', topic_id: '1' };
        await apiClient.recallKnowledge(params);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
            '/knowledge/search/recall',
            params
        );
    });

    test('should retry on 5xx errors', async () => {
        const error500 = { response: { status: 500 } };
        const success = { data: 'success' };

        mockAxiosInstance.post
            .mockRejectedValueOnce(error500)
            .mockRejectedValueOnce(error500)
            .mockResolvedValue(success);

        const result = await apiClient.executeRequest(() => mockAxiosInstance.post());
        expect(result).toBe(success);
        expect(mockAxiosInstance.post).toHaveBeenCalledTimes(3);
    }, 10000); // Increase timeout for retries

    test('should not retry on 4xx errors', async () => {
        const error400 = { response: { status: 400 } };

        mockAxiosInstance.post.mockRejectedValue(error400);

        await expect(apiClient.executeRequest(() => mockAxiosInstance.post()))
            .rejects.toEqual(error400);

        expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
    });
});
