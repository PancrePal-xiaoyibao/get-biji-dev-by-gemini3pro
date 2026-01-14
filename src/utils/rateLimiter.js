/**
 * Rate Limiter implementation
 * Limits requests to:
 * - QPS < 2 (Minimum 500ms interval between requests)
 * - Total requests < 5000
 */
export class RateLimiter {
  constructor(maxQps = 2, maxTotal = 5000) {
    this.minInterval = 1000 / maxQps; // Minimum interval in ms
    this.maxTotal = maxTotal;
    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.queue = [];
    this.processing = false;
  }

  /**
   * Execute a function with rate limiting
   * @param {Function} fn - The async function to execute
   * @returns {Promise<any>} - The result of the function
   */
  async schedule(fn) {
    if (this.requestCount >= this.maxTotal) {
      throw new Error(`Total request limit of ${this.maxTotal} exceeded.`);
    }

    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      if (this.requestCount >= this.maxTotal) {
        const { reject } = this.queue.shift();
        reject(new Error(`Total request limit of ${this.maxTotal} exceeded.`));
        continue;
      }

      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.minInterval) {
        const waitTime = this.minInterval - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      const { fn, resolve, reject } = this.queue.shift();
      
      this.lastRequestTime = Date.now();
      this.requestCount++;

      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.processing = false;
  }

  /**
   * Get current stats
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      queueLength: this.queue.length
    };
  }
}

export const globalRateLimiter = new RateLimiter(2, 5000);
