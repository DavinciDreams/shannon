/**
 * OpenRouter Vision Provider
 * API Documentation: https://openrouter.ai/
 */

import { runtimeConfig } from '../../config/runtime-config.js';

/**
 * OpenRouter Provider Class
 * Handles image analysis using OpenRouter's vision models
 */
export class OpenRouterProvider {
  constructor(config = {}) {
    this.name = 'OpenRouter';
    this.provider = 'openrouter';
    this.baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1';
    this.model = config.model || 'openrouter/free';
    this.maxTokens = config.maxTokens || 8192;
    this.temperature = config.temperature || 0.7;
  }

  /**
   * Get API key dynamically from runtime config
   * @returns {string} API key
   */
  getApiKey() {
    return runtimeConfig.openrouter?.apiKey || '';
  }

  /**
   * Check if provider is configured
   * @returns {boolean}
   */
  isConfigured() {
    const apiKey = this.getApiKey();
    return apiKey && apiKey !== '' && apiKey !== 'your_openrouter_api_key_here';
  }

  /**
   * Analyze an image with a text prompt
   * @param {string} imageData - Base64 encoded image data
   * @param {string} prompt - Analysis prompt
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeImage(imageData, prompt, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('OpenRouter provider is not configured. Please set OPENROUTER_API_KEY in .env file.');
    }

    try {
      const apiKey = this.getApiKey();
      console.log('[OpenRouterProvider] Using API key:', apiKey ? `${apiKey.substring(0, 12)}...${apiKey.substring(apiKey.length - 4)}` : 'EMPTY');
      console.log('[OpenRouterProvider] Using model:', options.model || this.model);
      console.log('[OpenRouterProvider] Base URL:', this.baseUrl);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/DavinciDreams/shannon',
          'X-Title': 'Shannon - Front-End Testing Agent'
        },
        body: JSON.stringify({
          model: options.model || this.model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: this.formatImageData(imageData)
                  }
                }
              ]
            }
          ],
          max_tokens: options.maxTokens || this.maxTokens,
          temperature: options.temperature || this.temperature
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('[OpenRouterProvider] API error response:', response.status, errorBody);
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.error?.message || response.statusText;
        } catch {
          errorMessage = errorBody || response.statusText;
        }
        throw new Error(`OpenRouter API error: ${errorMessage}`);
      }

      const data = await response.json();
      return this.parseResponse(data);
    } catch (error) {
      console.error('[OpenRouterProvider] Error analyzing image:', error);
      throw error;
    }
  }

  /**
   * Analyze DOM element data
   * @param {Object} elementData - Element inspection data
   * @param {string} prompt - Analysis prompt
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeElement(elementData, prompt, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('OpenRouter provider is not configured. Please set OPENROUTER_API_KEY in .env file.');
    }

    // Create a comprehensive prompt with element data
    const elementPrompt = `
${prompt}

Element Information:
- Tag: ${elementData.tagName}
- ID: ${elementData.idAttribute || 'N/A'}
- Classes: ${elementData.className || 'N/A'}
- Text Content: ${elementData.textContent || 'N/A'}
- HTML: ${elementData.outerHTML?.substring(0, 500)}...
`;

    if (elementData.screenshot) {
      return this.analyzeImage(elementData.screenshot, elementPrompt, options);
    }

    // If no screenshot, analyze just the text data
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getApiKey()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/DavinciDreams/shannon',
          'X-Title': 'Shannon - Front-End Testing Agent'
        },
        body: JSON.stringify({
          model: options.model || this.model,
          messages: [
            {
              role: 'user',
              content: elementPrompt
            }
          ],
          max_tokens: options.maxTokens || this.maxTokens,
          temperature: options.temperature || this.temperature
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenRouter API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return this.parseResponse(data);
    } catch (error) {
      console.error('[OpenRouterProvider] Error analyzing element:', error);
      throw error;
    }
  }

  /**
   * Generate test cases from image
   * @param {string} imageData - Base64 encoded image data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Test cases
   */
  async generateTestCases(imageData, options = {}) {
    const prompt = `Analyze this UI component and generate comprehensive test cases.

For each test case, provide:
1. Test case name
2. Description
3. Test steps (detailed step-by-step instructions)
4. Expected result
5. Priority (high/medium/low)
6. Test type (functional/UI/accessibility)

Format the response as a valid JSON array of test cases. Do not include any markdown formatting or additional text outside the JSON.`;

    const result = await this.analyzeImage(imageData, prompt, options);
    return this.parseTestCases(result.content);
  }

  /**
   * Generate bug report from image and console logs
   * @param {string} imageData - Base64 encoded image data
   * @param {Array} consoleLogs - Console logs
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Bug report
   */
  async generateBugReport(imageData, consoleLogs, options = {}) {
    const consoleLogsText = consoleLogs 
      ? consoleLogs.map(log => `[${log.level}] ${log.message}`).join('\n')
      : 'No console logs available';

    const prompt = `Analyze this UI component and the provided console logs. Identify any bugs, issues, or potential problems.

Console logs:
${consoleLogsText}

For each bug found, provide:
1. Bug title
2. Severity (critical/high/medium/low)
3. Description
4. Steps to reproduce
5. Expected behavior
6. Actual behavior
7. Suggested fix
8. Affected components

Format the response as a valid JSON array of bugs. Do not include any markdown formatting or additional text outside the JSON.`;

    const result = await this.analyzeImage(imageData, prompt, options);
    return this.parseBugReport(result.content);
  }

  /**
   * Generate suggestions from image
   * @param {string} imageData - Base64 encoded image data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Suggestions
   */
  async generateSuggestions(imageData, options = {}) {
    const prompt = `Analyze this UI component and provide actionable suggestions for improvement.

For each suggestion, provide:
1. Category (UX/UI/Accessibility/Performance/Code Quality)
2. Title
3. Description
4. Priority (high/medium/low)
5. Implementation effort (easy/medium/hard)
6. Expected impact

Format the response as a valid JSON array of suggestions. Do not include any markdown formatting or additional text outside the JSON.`;

    const result = await this.analyzeImage(imageData, prompt, options);
    return this.parseSuggestions(result.content);
  }

  /**
   * Format image data for API
   * @param {string} imageData - Base64 image data
   * @returns {string} Formatted image data
   */
  formatImageData(imageData) {
    // Remove data URL prefix if present
    if (imageData.startsWith('data:')) {
      return imageData;
    }
    // Add base64 prefix if not present
    return `data:image/jpeg;base64,${imageData}`;
  }

  /**
   * Parse API response
   * @param {Object} data - API response data
   * @returns {Object} Parsed response
   */
  parseResponse(data) {
    const content = data.choices?.[0]?.message?.content || '';
    
    return {
      content,
      raw: data,
      model: data.model,
      usage: data.usage
    };
  }

  /**
   * Parse test cases from response
   * @param {string} content - Response content
   * @returns {Array} Test cases
   */
  parseTestCases(content) {
    try {
      // Try to extract JSON from the content
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      // If no JSON found, return as plain text
      return { text: content };
    } catch (error) {
      console.error('[OpenRouterProvider] Error parsing test cases:', error);
      return { text: content, error: 'Failed to parse JSON response' };
    }
  }

  /**
   * Parse bug report from response
   * @param {string} content - Response content
   * @returns {Array} Bug report
   */
  parseBugReport(content) {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { text: content };
    } catch (error) {
      console.error('[OpenRouterProvider] Error parsing bug report:', error);
      return { text: content, error: 'Failed to parse JSON response' };
    }
  }

  /**
   * Parse suggestions from response
   * @param {string} content - Response content
   * @returns {Array} Suggestions
   */
  parseSuggestions(content) {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { text: content };
    } catch (error) {
      console.error('[OpenRouterProvider] Error parsing suggestions:', error);
      return { text: content, error: 'Failed to parse JSON response' };
    }
  }

  /**
   * Get provider capabilities
   * @returns {Object} Provider capabilities
   */
  getCapabilities() {
    return {
      supportsImages: true,
      supportsElements: true,
      maxImageSize: 20 * 1024 * 1024, // 20MB
      supportedFormats: ['png', 'jpeg', 'jpg', 'webp', 'gif'],
      maxTokens: this.maxTokens,
      model: this.model,
      availableModels: [
        'openrouter/free',
        'arcee-ai/trinity-large-preview:free',
        'anthropic/claude-opus-4.6',
        'openai/gpt-5.1',
        'google/gemini-3-flash-preview',
        'google/gemini-3-pro-preview',
        'qwen/qwen3.5-plus-02-15',
        'mistralai/mistral-large-2512'
      ]
    };
  }
}
