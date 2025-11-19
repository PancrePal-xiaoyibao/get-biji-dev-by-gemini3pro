import { RateLimiter } from '../src/utils/rateLimiter.js';

describe('RateLimiter', () => {
    let rateLimiter;

    beforeEach(() => {
        // Create a new limiter for each test to reset state
        // QPS = 10 (100ms interval), Max Total = 5
        rateLimiter = new RateLimiter(10, 5);
    });

    test('should execute function successfully', async () => {
        const result = await rateLimiter.schedule(async () => 'success');
        expect(result).toBe('success');
    });

    test('should respect rate limits (QPS)', async () => {
        const start = Date.now();
        const promises = [];

        // Schedule 3 requests
        for (let i = 0; i < 3; i++) {
            promises.push(rateLimiter.schedule(async () => Date.now()));
        }

        const results = await Promise.all(promises);
        const end = Date.now();

        // With QPS=10 (100ms interval):
        // Req 1: 0ms
        // Req 2: 100ms
        // Req 3: 200ms
        // Total time should be at least 200ms
        expect(end - start).toBeGreaterThanOrEqual(190); // Allow small margin

        // Check intervals between executions
        expect(results[1] - results[0]).toBeGreaterThanOrEqual(90);
        expect(results[2] - results[1]).toBeGreaterThanOrEqual(90);
    });

    test('should respect total request limit', async () => {
        // Schedule 5 requests (max total)
        for (let i = 0; i < 5; i++) {
            await rateLimiter.schedule(async () => { });
        }

        // 6th request should fail
        await expect(rateLimiter.schedule(async () => { }))
            .rejects.toThrow('Total request limit of 5 exceeded');
    });

    test('should handle function errors', async () => {
        await expect(rateLimiter.schedule(async () => {
            throw new Error('Test error');
        })).rejects.toThrow('Test error');
    });
});
