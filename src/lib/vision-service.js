/**
 * Vision Model Service
 * Unified interface for AI vision model providers (Zai, OpenRouter, Claude Code)
 */

import { ZaiProvider } from './providers/zai-provider.js';
import { OpenRouterProvider } from './providers/openrouter-provider.js';
import { ClaudeProvider } from './providers/claude-provider.js';
import { VISION_PROVIDERS } from '../config/vision-config.js';
import { runtimeConfig } from '../config/runtime-config.js';

/**
 * Vision Service Class
 * Provides a unified interface for interacting with multiple AI vision model providers
 */
export class VisionService {
  constructor() {
    this.providers = new Map();
    this.defaultProvider = null;
    this.initializeProviders();
  }

  /**
   * Initialize all available providers
   */
  initializeProviders() {
    console.log('[VisionService] Initializing providers...');
    console.log('[VisionService] Runtime config loaded:', !!runtimeConfig);
    console.log('[VisionService] Zai API key:', runtimeConfig.zai?.apiKey ? 'SET' : 'NOT SET');
    console.log('[VisionService] OpenRouter API key:', runtimeConfig.openrouter?.apiKey ? 'SET' : 'NOT SET');
    console.log('[VisionService] Claude API key:', runtimeConfig.claude?.apiKey ? 'SET' : 'NOT SET');

    // Initialize Zai provider
    const zaiConfig = VISION_PROVIDERS.zai;
    const zaiProvider = new ZaiProvider(zaiConfig);
    console.log('[VisionService] Zai provider apiKey:', zaiProvider.apiKey ? 'SET' : 'NOT SET');
    console.log('[VisionService] Zai provider isConfigured:', zaiProvider.isConfigured());
    if (zaiProvider.isConfigured()) {
      this.providers.set('zai', zaiProvider);
      console.log('[VisionService] Zai provider initialized');
    } else {
      console.warn('[VisionService] Zai provider not configured');
    }

    // Initialize OpenRouter provider
    const openrouterConfig = VISION_PROVIDERS.openrouter;
    const openrouterProvider = new OpenRouterProvider(openrouterConfig);
    console.log('[VisionService] OpenRouter provider apiKey:', openrouterProvider.apiKey ? 'SET' : 'NOT SET');
    console.log('[VisionService] OpenRouter provider isConfigured:', openrouterProvider.isConfigured());
    if (openrouterProvider.isConfigured()) {
      this.providers.set('openrouter', openrouterProvider);
      console.log('[VisionService] OpenRouter provider initialized');
    } else {
      console.warn('[VisionService] OpenRouter provider not configured');
    }

    // Initialize Claude provider
    const claudeConfig = VISION_PROVIDERS.claude;
    const claudeProvider = new ClaudeProvider(claudeConfig);
    console.log('[VisionService] Claude provider apiKey:', claudeProvider.apiKey ? 'SET' : 'NOT SET');
    console.log('[VisionService] Claude provider isConfigured:', claudeProvider.isConfigured());
    if (claudeProvider.isConfigured()) {
      this.providers.set('claude', claudeProvider);
      console.log('[VisionService] Claude provider initialized');
    } else {
      console.warn('[VisionService] Claude provider not configured');
    }

    // Set default provider to first available
    const availableProviders = this.getAvailableProviders();
    if (availableProviders.length > 0) {
      this.defaultProvider = availableProviders[0];
      console.log('[VisionService] Default provider set to:', this.defaultProvider);
    } else {
      console.error('[VisionService] No vision providers configured!');
      console.error('[VisionService] To enable vision analysis, please configure at least one provider:');
      console.error('[VisionService]   1. Copy .env.example to .env');
      console.error('[VisionService]   2. Add at least one of these API keys:');
      console.error('[VisionService]      - ZAI_API_KEY (get from https://open.bigmodel.cn/)');
      console.error('[VisionService]      - OPENROUTER_API_KEY (get from https://openrouter.ai/keys)');
      console.error('[VisionService]      - ANTHROPIC_API_KEY (get from https://console.anthropic.com/)');
      console.error('[VisionService]   3. Run: node scripts/build-config.js');
      console.error('[VisionService]   4. Reload the extension');
    }
  }

  /**
   * Get provider instance
   * @param {string} providerName - Provider name (zai, openrouter, claude)
   * @returns {Object} Provider instance
   */
  getProvider(providerName = null) {
    const name = providerName || this.defaultProvider;
    const provider = this.providers.get(name);

    if (!provider) {
      throw new Error(`Provider ${name} not available. Available providers: ${this.getAvailableProviders().join(', ')}`);
    }

    return provider;
  }

  /**
   * Analyze an image with a text prompt
   * @param {string} imageData - Base64 encoded image data
   * @param {string} prompt - Analysis prompt
   * @param {string} providerName - Provider name (optional, uses default if not specified)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeImage(imageData, prompt, providerName = null, options = {}) {
    const provider = this.getProvider(providerName);
    return provider.analyzeImage(imageData, prompt, options);
  }

  /**
   * Analyze DOM element data
   * @param {Object} elementData - Element inspection data
   * @param {string} prompt - Analysis prompt
   * @param {string} providerName - Provider name (optional, uses default if not specified)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeElement(elementData, prompt, providerName = null, options = {}) {
    const provider = this.getProvider(providerName);
    return provider.analyzeElement(elementData, prompt, options);
  }

  /**
   * Generate test cases from image
   * @param {string} imageData - Base64 encoded image data
   * @param {string} providerName - Provider name (optional, uses default if not specified)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Test cases
   */
  async generateTestCases(imageData, providerName = null, options = {}) {
    const provider = this.getProvider(providerName);
    return provider.generateTestCases(imageData, options);
  }

  /**
   * Generate bug report from image and console logs
   * @param {string} imageData - Base64 encoded image data
   * @param {Array} consoleLogs - Console logs
   * @param {string} providerName - Provider name (optional, uses default if not specified)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Bug report
   */
  async generateBugReport(imageData, consoleLogs, providerName = null, options = {}) {
    const provider = this.getProvider(providerName);
    return provider.generateBugReport(imageData, consoleLogs, options);
  }

  /**
   * Generate suggestions from image
   * @param {string} imageData - Base64 encoded image data
   * @param {string} providerName - Provider name (optional, uses default if not specified)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Suggestions
   */
  async generateSuggestions(imageData, providerName = null, options = {}) {
    const provider = this.getProvider(providerName);
    return provider.generateSuggestions(imageData, options);
  }

  /**
   * Get list of available providers
   * @returns {Array} List of provider names
   */
  getAvailableProviders() {
    return Array.from(this.providers.keys());
  }

  /**
   * Get default provider name
   * @returns {string} Default provider name
   */
  getDefaultProvider() {
    return this.defaultProvider;
  }

  /**
   * Set default provider
   * @param {string} providerName - Provider name
   */
  setDefaultProvider(providerName) {
    if (!this.providers.has(providerName)) {
      throw new Error(`Provider ${providerName} not available. Available providers: ${this.getAvailableProviders().join(', ')}`);
    }
    this.defaultProvider = providerName;
    console.log('[VisionService] Default provider changed to:', providerName);
  }

  /**
   * Set provider with API key (for UI configuration)
   * @param {string} providerName - Provider name (zai, openrouter, claude)
   * @param {string} apiKey - API key for the provider
   */
  setProvider(providerName, apiKey) {
    console.log('[VisionService] Setting provider:', providerName);
    
    // Remove existing provider if it exists
    if (this.providers.has(providerName)) {
      this.providers.delete(providerName);
    }

    // Create new provider instance with API key
    let provider;
    const config = VISION_PROVIDERS[providerName];
    
    switch (providerName) {
      case 'zai':
        provider = new ZaiProvider({ ...config, apiKey });
        break;
      case 'openrouter':
        provider = new OpenRouterProvider({ ...config, apiKey });
        break;
      case 'claude':
        provider = new ClaudeProvider({ ...config, apiKey });
        break;
      default:
        throw new Error(`Unknown provider: ${providerName}`);
    }

    // Add provider to map
    this.providers.set(providerName, provider);
    
    // Set as default provider
    this.defaultProvider = providerName;
    
    console.log('[VisionService] Provider set successfully:', providerName);
  }

  /**
   * Get provider capabilities
   * @param {string} providerName - Provider name (optional, returns all if not specified)
   * @returns {Object|Array} Provider capabilities
   */
  getCapabilities(providerName = null) {
    if (providerName) {
      const provider = this.getProvider(providerName);
      return provider.getCapabilities();
    }

    // Return capabilities for all providers
    const capabilities = {};
    for (const [name, provider] of this.providers.entries()) {
      capabilities[name] = provider.getCapabilities();
    }
    return capabilities;
  }

  /**
   * Check if any providers are configured
   * @returns {boolean}
   */
  hasConfiguredProviders() {
    return this.providers.size > 0;
  }

  /**
   * Get user-friendly error message for unconfigured providers
   * @returns {string} Error message with setup instructions
   */
  getConfigurationErrorMessage() {
    return `
No vision providers configured!

To enable AI-powered visual analysis, please configure at least one provider:

1. Open the .env file in the shannon directory
2. Add at least one of these API keys:
   - ZAI_API_KEY (get from https://open.bigmodel.cn/)
   - OPENROUTER_API_KEY (get from https://openrouter.ai/keys)
   - ANTHROPIC_API_KEY (get from https://console.anthropic.com/)

3. Run: node scripts/build-config.js
4. Reload the extension

For more information, see INSTALLATION.md
    `.trim();
  }

  /**
   * Reinitialize providers (useful after updating API keys)
   */
  reinitializeProviders() {
    this.providers.clear();
    this.defaultProvider = null;
    this.initializeProviders();
  }
}

// Export singleton instance
export const visionService = new VisionService();
