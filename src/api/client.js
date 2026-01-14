import axios from 'axios';
import { globalRateLimiter } from '../utils/rateLimiter.js';
import logger from '../logger.js';

export class ApiClient {
    constructor(config) {
        this.baseUrl = config.baseUrl || 'https://open-api.biji.com/getnote/openapi';
        this.apiKey = config.apiKey;

        if (!this.apiKey) {
            throw new Error('API Key is required');
        }

        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/json',
                'Connection': 'keep-alive',
                'Authorization': `Bearer ${this.apiKey}`,
                'X-OAuth-Version': '1'
            }
        });

        // Add response interceptor for error logging
        this.client.interceptors.response.use(
            response => response,
            error => {
                logger.error('API Request Failed:', {
                    url: error.config?.url,
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message
                });
                return Promise.reject(error);
            }
        );
    }

    /**
     * Execute a request with rate limiting and retries
     * @param {Function} requestFn 
     * @param {number} retries 
     */
    async executeRequest(requestFn, retries = 3) {
        return globalRateLimiter.schedule(async () => {
            let lastError;
            for (let i = 0; i < retries; i++) {
                try {
                    return await requestFn();
                } catch (error) {
                    lastError = error;
                    const isRetryable = !error.response || (error.response.status >= 500 && error.response.status < 600) || error.code === 'ECONNABORTED';

                    if (!isRetryable || i === retries - 1) {
                        throw error;
                    }

                    // Exponential backoff: 1000ms, 2000ms, 4000ms
                    const delay = 1000 * Math.pow(2, i);
                    logger.warn(`Request failed, retrying in ${delay}ms... (${i + 1}/${retries})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            throw lastError;
        });
    }

    /**
     * Knowledge Search (AI Processed)
     * @param {Object} params 
     * @returns {Promise<any>}
     */
    async searchKnowledge(params) {
        return this.executeRequest(() =>
            this.client.post('/knowledge/search', params, {
                responseType: params.stream ? 'stream' : 'json'
            })
        );
    }

    /**
     * Knowledge Recall (Raw)
     * @param {Object} params 
     * @returns {Promise<any>}
     */
    async recallKnowledge(params) {
        return this.executeRequest(() =>
            this.client.post('/knowledge/search/recall', params)
        );
    }
}
