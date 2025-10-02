const axios = require('axios');

/**
 * Local LLM Service for StarCoder 3B
 * Provides a unified interface to interact with local LLM
 */
class LocalLLMService {
  constructor(baseURL = 'http://localhost:8080') {
    this.baseURL = process.env.LOCAL_LLM_URL || baseURL;
    this.model = 'starcoder-3b';
  }

  /**
   * Generate content using local LLM
   * @param {string} prompt - The prompt to send to the model
   * @param {object} options - Additional options (temperature, max_tokens, etc.)
   * @returns {Promise<string>} - The generated text response
   */
  async generateContent(prompt, options = {}) {
    try {
      const payload = {
        model: this.model,
        prompt: prompt,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2048,
        top_p: options.top_p || 0.95,
        stop: options.stop || null,
        stream: false
      };

      // Try different local LLM server endpoints
      const endpoints = [
        '/v1/completions',        // OpenAI-compatible
        '/api/generate',          // Ollama-style
        '/completion',            // Generic
      ];

      let response;
      let lastError;

      for (const endpoint of endpoints) {
        try {
          response = await axios.post(`${this.baseURL}${endpoint}`, payload, {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 120000, // 2 minutes timeout
          });

          if (response.data) {
            break;
          }
        } catch (err) {
          lastError = err;
          continue;
        }
      }

      if (!response || !response.data) {
        throw lastError || new Error('No response from local LLM');
      }

      // Parse response based on format
      let text = '';

      if (response.data.choices && response.data.choices[0]) {
        // OpenAI format
        text = response.data.choices[0].text || response.data.choices[0].message?.content || '';
      } else if (response.data.response) {
        // Ollama format
        text = response.data.response;
      } else if (response.data.text) {
        // Generic format
        text = response.data.text;
      } else if (typeof response.data === 'string') {
        text = response.data;
      }

      return text.trim();
    } catch (error) {
      console.error('Local LLM Error:', error.message);
      throw new Error(`Local LLM generation failed: ${error.message}`);
    }
  }

  /**
   * Generate JSON content with validation
   * Ensures the response is valid JSON
   */
  async generateJSON(prompt, options = {}) {
    const enhancedPrompt = `${prompt}

CRITICAL: Return ONLY valid JSON. No markdown, no code blocks, no additional text.
Start your response with { and end with }`;

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const response = await this.generateContent(enhancedPrompt, {
          ...options,
          temperature: 0.3, // Lower temperature for more consistent JSON
        });

        // Extract JSON from response
        let jsonStr = response.trim();

        // Remove markdown code blocks if present
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.slice(7);
        }
        if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.slice(3);
        }
        if (jsonStr.endsWith('```')) {
          jsonStr = jsonStr.slice(0, -3);
        }

        // Find first { and last }
        const firstBrace = jsonStr.indexOf('{');
        const firstBracket = jsonStr.indexOf('[');
        const lastBrace = jsonStr.lastIndexOf('}');
        const lastBracket = jsonStr.lastIndexOf(']');

        let startIdx = -1;
        let endIdx = -1;

        // Determine if array or object comes first
        if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
          startIdx = firstBrace;
          endIdx = lastBrace + 1;
        } else if (firstBracket !== -1) {
          startIdx = firstBracket;
          endIdx = lastBracket + 1;
        }

        if (startIdx !== -1 && endIdx > startIdx) {
          jsonStr = jsonStr.substring(startIdx, endIdx);
        }

        // Parse and validate JSON
        const parsed = JSON.parse(jsonStr);
        return parsed;
      } catch (error) {
        attempts++;
        console.error(`JSON parsing attempt ${attempts} failed:`, error.message);

        if (attempts >= maxAttempts) {
          throw new Error(`Failed to generate valid JSON after ${maxAttempts} attempts`);
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Check if local LLM server is available
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      console.error('Local LLM health check failed:', error.message);
      return false;
    }
  }
}

// Singleton instance
let instance = null;

function getLocalLLM() {
  if (!instance) {
    instance = new LocalLLMService();
  }
  return instance;
}

module.exports = {
  LocalLLMService,
  getLocalLLM,
};
