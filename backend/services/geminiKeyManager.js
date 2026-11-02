// AQUANET X — Gemini API Key Manager with Multi-Key Failover & Quota Optimization
// Features:
// 1. In-memory response cache (TTL) to avoid wasting quota on repeated questions
// 2. Multi-key round-robin with automatic failover (429/503/RESOURCE_EXHAUSTED)
// 3. Fallback model hierarchy (gemini-3.5-flash-lite -> gemini-3.5-flash -> gemini-3-flash-preview)
// 4. Token-conserving history window

const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiKeyManager {
  constructor() {
    this.keys = this._loadKeys();
    this.currentIndex = 0;
    this.keyStats = this.keys.map((key, i) => ({
      index: i + 1,
      id: `key_${i + 1}`,
      configured: Boolean(key && !key.includes('your_') && !key.includes('PASTE')),
      successCount: 0,
      failCount: 0,
      lastUsed: null,
      cooldownUntil: null,
      lastError: null,
    }));

    this.defaultModel = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
    this.fallbackModels = ['gemini-3-flash-preview', 'gemini-3.5-flash', 'gemini-3.5-flash-lite'];

    // In-memory cache to prevent wasting API quota on identical queries (TTL: 10 minutes)
    this.cache = new Map();
    this.CACHE_TTL_MS = 10 * 60 * 1000;
  }

  _loadKeys() {
    const keys = [
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
      process.env.GEMINI_API_KEY_4,
    ];

    if (!keys[0] && process.env.GEMINI_API_KEY) {
      keys[0] = process.env.GEMINI_API_KEY;
    }

    return keys.map((k) => (k ? k.trim() : null));
  }

  getStatus() {
    return {
      totalKeysConfigured: this.keys.filter((k) => k && !k.includes('PASTE')).length,
      currentActiveIndex: this.currentIndex + 1,
      model: this.defaultModel,
      cachedQueriesCount: this.cache.size,
      keys: this.keyStats.map((s) => ({
        index: s.index,
        id: s.id,
        configured: s.configured,
        successCount: s.successCount,
        failCount: s.failCount,
        isInCooldown: Boolean(s.cooldownUntil && s.cooldownUntil > Date.now()),
        cooldownRemainingSeconds: s.cooldownUntil && s.cooldownUntil > Date.now()
          ? Math.round((s.cooldownUntil - Date.now()) / 1000)
          : 0,
        lastError: s.lastError,
      })),
    };
  }

  _getNextAvailableIndex(startIndex) {
    const total = this.keys.length;
    const now = Date.now();

    for (let offset = 0; offset < total; offset++) {
      const idx = (startIndex + offset) % total;
      const key = this.keys[idx];
      const stats = this.keyStats[idx];

      if (key && stats.configured) {
        if (!stats.cooldownUntil || stats.cooldownUntil <= now) {
          return idx;
        }
      }
    }
    return -1;
  }

  _getCacheKey(prompt) {
    return (prompt || '').trim().toLowerCase();
  }

  // Execute request with cache lookup & automatic bounded key rotation
  async generateResponse({ prompt, systemInstruction, history = [] }) {
    const configuredKeys = this.keys.filter((k) => k && !k.includes('PASTE'));
    if (configuredKeys.length === 0) {
      throw new Error('CONFIG_ERROR: No valid Gemini API keys configured. Set GEMINI_API_KEY_1..3 in backend/.env.');
    }

    const cacheKey = this._getCacheKey(prompt);

    // 1. All conversational queries are answered dynamically by Gemini without stale cached responses
    // 2. Token Management: Keep the last 6 messages in history to provide deep conversational context
    const truncatedHistory = (history || []).slice(-6);

    let attempts = 0;
    const maxAttempts = Math.min(configuredKeys.length * 2, 6);
    let lastError = null;

    while (attempts < maxAttempts) {
      const activeIdx = this._getNextAvailableIndex(this.currentIndex);
      if (activeIdx === -1) {
        throw new Error('QUOTA_EXHAUSTED: All Gemini API keys have exceeded rate/quota limits. Please wait 60 seconds.');
      }

      this.currentIndex = activeIdx;
      const apiKey = this.keys[activeIdx];
      const stats = this.keyStats[activeIdx];
      stats.lastUsed = new Date();

      // Try current model, then fallback models if 404/503
      for (const candidateModel of this.fallbackModels) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({
            model: candidateModel,
            systemInstruction: systemInstruction || undefined,
            generationConfig: {
              temperature: 0.5, // Natural, articulate conversational intelligence
              maxOutputTokens: 2048, // Provide comprehensive, detailed answers
            },
          });

          // Wrap Gemini API call with a 70-second timeout to prevent hanging
          const withTimeout = (promise, ms) =>
            Promise.race([
              promise,
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Gemini API call timed out after ${ms / 1000}s`)), ms)
              ),
            ]);

          let result;
          if (truncatedHistory.length > 0) {
            let formattedHistory = truncatedHistory.map((m) => ({
              role: m.role === 'user' ? 'user' : 'model',
              parts: [{ text: m.text || m.content || '' }],
            }));

            // Google Gemini SDK strictly requires history to start with role 'user'
            while (formattedHistory.length > 0 && formattedHistory[0].role !== 'user') {
              formattedHistory.shift();
            }

            if (formattedHistory.length > 0) {
              const chat = model.startChat({ history: formattedHistory });
              result = await withTimeout(chat.sendMessage(prompt), 70000);
            } else {
              result = await withTimeout(model.generateContent(prompt), 70000);
            }
          } else {
            result = await withTimeout(model.generateContent(prompt), 70000);
          }

          const responseText = result.response.text();
          stats.successCount++;
          stats.lastError = null;

          // Save to cache to save quota on future identical questions
          if (!history || history.length === 0) {
            this.cache.set(cacheKey, {
              text: responseText,
              model: candidateModel,
              timestamp: Date.now(),
            });
            // Keep cache bounded
            if (this.cache.size > 200) {
              const oldestKey = this.cache.keys().next().value;
              this.cache.delete(oldestKey);
            }
          }

          // Advance index round-robin for balanced load across all 3 keys
          this.currentIndex = (this.currentIndex + 1) % this.keys.length;

          return {
            text: responseText,
            keyUsed: stats.id,
            model: candidateModel,
            cached: false,
          };
        } catch (err) {
          const errMsg = err.message || '';
          // If model not found or temporary 503 spike, try next candidate model
          if (errMsg.includes('not found') || errMsg.includes('503') || errMsg.includes('high demand')) {
            console.warn(`[GeminiKeyManager] ${candidateModel} unavailable (${errMsg.substring(0, 60)}). Trying fallback...`);
            continue;
          }
          throw err;
        }
      }

      // If loop exited without returning, handle quota / auth error
      attempts++;
      stats.failCount++;
      stats.cooldownUntil = Date.now() + 60 * 1000;
      console.warn(`[GeminiKeyManager] Key #${stats.index} put in cooldown. Rotating to next key...`);
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
      await new Promise((r) => setTimeout(r, 500));
    }

    throw new Error(`AI_SERVICE_UNAVAILABLE: ${lastError?.message || 'Rate limit reached on all configured keys.'}`);
  }
}

module.exports = new GeminiKeyManager();
