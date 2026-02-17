/**
 * Vision Model Configuration
 * Configuration for AI vision model providers: Zai (Zhipu), OpenRouter, Claude Code
 */

// ============================================================================
// Vision Provider Configurations
// ============================================================================

/**
 * Zai (Zhipu AI) Vision Configuration
 * API Documentation: https://api.z.ai/
 */
export const ZAI_CONFIG = {
  name: 'Zai',
  provider: 'zhipu',
  baseUrl: 'https://api.z.ai/api/paas/v4',
  models: {
    'glm-4.7': {
      name: 'GLM-4.7 (MCP/Vision/WebFetch)',
      maxImageSize: 20 * 1024 * 1024, // 20MB
      supportedFormats: ['png', 'jpeg', 'jpg', 'webp', 'gif'],
      maxTokens: 8192,
    },
    'glm-4.6v': {
      name: 'GLM-4.6V (Vision)',
      maxImageSize: 20 * 1024 * 1024,
      supportedFormats: ['png', 'jpeg', 'jpg', 'webp', 'gif'],
      maxTokens: 8192,
    },
    'glm-4.6v-flash': {
      name: 'GLM-4.6V Flash (Fast)',
      maxImageSize: 20 * 1024 * 1024,
      supportedFormats: ['png', 'jpeg', 'jpg', 'webp', 'gif'],
      maxTokens: 8192,
    },
    'glm-4.5v': {
      name: 'GLM-4.5V',
      maxImageSize: 20 * 1024 * 1024,
      supportedFormats: ['png', 'jpeg', 'jpg', 'webp', 'gif'],
      maxTokens: 8192,
    },
  },
  defaultModel: 'glm-4.7',
  apiKeyEnv: 'ZAI_API_KEY',
};

/**
 * OpenRouter Vision Configuration
 * API Documentation: https://openrouter.ai/
 */
export const OPENROUTER_CONFIG = {
  name: 'OpenRouter',
  provider: 'openrouter',
  baseUrl: 'https://openrouter.ai/api/v1',
  models: {
    'openrouter/free': {
      name: 'Free Auto-Router (Free)',
      maxImageSize: 20 * 1024 * 1024, // 20MB
      supportedFormats: ['png', 'jpeg', 'jpg', 'webp', 'gif'],
      maxTokens: 8192,
    },
    'arcee-ai/trinity-large-preview:free': {
      name: 'Arcee Trinity Large (Free)',
      maxImageSize: 20 * 1024 * 1024,
      supportedFormats: ['png', 'jpeg', 'jpg', 'webp', 'gif'],
      maxTokens: 8192,
    },
    'anthropic/claude-opus-4.6': {
      name: 'Claude Opus 4.6',
      maxImageSize: 20 * 1024 * 1024,
      supportedFormats: ['png', 'jpeg', 'jpg', 'webp', 'gif'],
      maxTokens: 8192,
    },
    'openai/gpt-5.1': {
      name: 'GPT-5.1',
      maxImageSize: 20 * 1024 * 1024,
      supportedFormats: ['png', 'jpeg', 'jpg', 'webp', 'gif'],
      maxTokens: 8192,
    },
    'google/gemini-3-flash-preview': {
      name: 'Gemini 3 Flash',
      maxImageSize: 20 * 1024 * 1024,
      supportedFormats: ['png', 'jpeg', 'jpg', 'webp'],
      maxTokens: 8192,
    },
    'google/gemini-3-pro-preview': {
      name: 'Gemini 3 Pro',
      maxImageSize: 20 * 1024 * 1024,
      supportedFormats: ['png', 'jpeg', 'jpg', 'webp'],
      maxTokens: 8192,
    },
    'qwen/qwen3.5-plus-02-15': {
      name: 'Qwen 3.5 Plus',
      maxImageSize: 20 * 1024 * 1024,
      supportedFormats: ['png', 'jpeg', 'jpg', 'webp'],
      maxTokens: 8192,
    },
    'mistralai/mistral-large-2512': {
      name: 'Mistral Large',
      maxImageSize: 20 * 1024 * 1024,
      supportedFormats: ['png', 'jpeg', 'jpg', 'webp'],
      maxTokens: 8192,
    },
  },
  defaultModel: 'openrouter/free',
  apiKeyEnv: 'OPENROUTER_API_KEY',
};

/**
 * Claude Code Vision Configuration
 * API Documentation: https://docs.anthropic.com/
 */
export const CLAUDE_CONFIG = {
  name: 'Claude (Anthropic)',
  provider: 'anthropic',
  baseUrl: 'https://api.anthropic.com/v1',
  models: {
    'claude-sonnet-4-5-20250929': {
      name: 'Claude Sonnet 4.5 (Latest)',
      maxImageSize: 20 * 1024 * 1024, // 20MB
      supportedFormats: ['png', 'jpeg', 'jpg', 'webp', 'gif'],
      maxTokens: 8192,
    },
    'claude-haiku-4-5-20251001': {
      name: 'Claude Haiku 4.5 (Fast)',
      maxImageSize: 20 * 1024 * 1024,
      supportedFormats: ['png', 'jpeg', 'jpg', 'webp', 'gif'],
      maxTokens: 8192,
    },
    'claude-3-5-sonnet-20241022': {
      name: 'Claude 3.5 Sonnet',
      maxImageSize: 20 * 1024 * 1024,
      supportedFormats: ['png', 'jpeg', 'jpg', 'webp', 'gif'],
      maxTokens: 8192,
    },
  },
  defaultModel: 'claude-sonnet-4-5-20250929',
  apiKeyEnv: 'ANTHROPIC_API_KEY',
};

// ============================================================================
// Provider Registry
// ============================================================================

/**
 * All available vision providers
 */
export const VISION_PROVIDERS = {
  zai: ZAI_CONFIG,
  openrouter: OPENROUTER_CONFIG,
  claude: CLAUDE_CONFIG,
};

/**
 * Default vision provider
 */
export const DEFAULT_PROVIDER = 'openrouter';

// ============================================================================
// Provider Selection Logic
// ============================================================================

/**
 * Get vision provider configuration
 * @param {string} providerKey - Provider key ('zai', 'openrouter', 'claude')
 * @returns {Object|null} Provider configuration or null if not found
 */
export function getProviderConfig(providerKey) {
  return VISION_PROVIDERS[providerKey] || null;
}

/**
 * Get model configuration for a specific provider and model
 * @param {string} providerKey - Provider key
 * @param {string} modelKey - Model key
 * @returns {Object|null} Model configuration or null if not found
 */
export function getModelConfig(providerKey, modelKey) {
  const provider = getProviderConfig(providerKey);
  if (!provider) return null;
  return provider.models[modelKey] || null;
}

/**
 * Get all available models for a provider
 * @param {string} providerKey - Provider key
 * @returns {Array<Object>} Array of model configurations
 */
export function getProviderModels(providerKey) {
  const provider = getProviderConfig(providerKey);
  if (!provider) return [];
  
  return Object.entries(provider.models).map(([key, model]) => ({
    key,
    ...model,
  }));
}

/**
 * Get all available providers with their models
 * @returns {Array<Object>} Array of provider configurations with models
 */
export function getAllProviders() {
  return Object.entries(VISION_PROVIDERS).map(([key, provider]) => ({
    key,
    name: provider.name,
    provider: provider.provider,
    models: getProviderModels(key),
    defaultModel: provider.defaultModel,
  }));
}

// ============================================================================
// API Key Validation
// ============================================================================

/**
 * Validate API key format for a provider
 * @param {string} providerKey - Provider key
 * @param {string} apiKey - API key to validate
 * @returns {Object} Validation result with isValid and message
 */
export function validateApiKey(providerKey, apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return {
      isValid: false,
      message: 'API key is required',
    };
  }

  const provider = getProviderConfig(providerKey);
  if (!provider) {
    return {
      isValid: false,
      message: `Unknown provider: ${providerKey}`,
    };
  }

  // Provider-specific validation
  switch (providerKey) {
    case 'zai':
      // Zai API keys typically start with specific prefixes
      if (apiKey.length < 10) {
        return {
          isValid: false,
          message: 'Zai API key appears to be too short',
        };
      }
      break;

    case 'openrouter':
      // OpenRouter API keys are typically long strings
      if (apiKey.length < 20) {
        return {
          isValid: false,
          message: 'OpenRouter API key appears to be too short',
        };
      }
      break;

    case 'claude':
      // Claude API keys start with 'sk-ant-'
      if (!apiKey.startsWith('sk-ant-')) {
        return {
          isValid: false,
          message: 'Claude API key should start with "sk-ant-"',
        };
      }
      if (apiKey.length < 40) {
        return {
          isValid: false,
          message: 'Claude API key appears to be too short',
        };
      }
      break;

    default:
      return {
        isValid: false,
        message: `Unknown provider: ${providerKey}`,
      };
  }

  return {
    isValid: true,
    message: 'API key format is valid',
  };
}

/**
 * Check if a provider has a configured API key
 * @param {string} providerKey - Provider key
 * @param {Object} settings - Extension settings containing API keys
 * @returns {boolean} True if API key is configured
 */
export function isProviderConfigured(providerKey, settings) {
  const provider = getProviderConfig(providerKey);
  if (!provider) return false;

  const apiKey = settings[`${providerKey}ApiKey`] || settings[`${provider.provider}ApiKey`];
  return !!apiKey;
}

/**
 * Get the API key for a provider from settings
 * @param {string} providerKey - Provider key
 * @param {Object} settings - Extension settings
 * @returns {string|null} API key or null
 */
export function getProviderApiKey(providerKey, settings) {
  const provider = getProviderConfig(providerKey);
  if (!provider) return null;

  return settings[`${providerKey}ApiKey`] || settings[`${provider.provider}ApiKey`] || null;
}

// ============================================================================
// Default Vision Settings
// ============================================================================

/**
 * Default vision settings
 */
export const DEFAULT_VISION_SETTINGS = {
  // Provider selection
  visionProvider: DEFAULT_PROVIDER,
  visionModel: null, // null = use provider's default model

  // API keys (stored separately, but tracked here)
  zaiApiKey: null,
  openrouterApiKey: null,
  claudeApiKey: null,

  // Analysis settings
  analysisPrompt: 'Analyze this UI component. Identify any visual issues, accessibility problems, or potential bugs. Provide specific recommendations for improvements.',
  includeConsoleLogs: true,
  includeElementData: true,

  // Screenshot settings
  screenshotFormat: 'png', // 'png' | 'jpeg' | 'webp'
  screenshotQuality: 0.9, // 0.0 - 1.0 (for jpeg/webp)
  captureFullPage: false,
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert image to base64 for API requests
 * @param {string} dataUrl - Data URL of the image
 * @returns {string} Base64 encoded image
 */
export function imageToBase64(dataUrl) {
  // Remove data URL prefix if present
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  return base64Data;
}

/**
 * Get image format from data URL
 * @param {string} dataUrl - Data URL of the image
 * @returns {string} Image format (png, jpeg, webp, etc.)
 */
export function getImageFormat(dataUrl) {
  const match = dataUrl.match(/^data:image\/(\w+);base64,/);
  return match ? match[1] : 'png';
}

/**
 * Check if image format is supported by a model
 * @param {string} format - Image format
 * @param {Object} modelConfig - Model configuration
 * @returns {boolean} True if format is supported
 */
export function isFormatSupported(format, modelConfig) {
  if (!modelConfig || !modelConfig.supportedFormats) {
    return false;
  }
  return modelConfig.supportedFormats.includes(format.toLowerCase());
}

/**
 * Check if image size is within limits for a model
 * @param {number} size - Image size in bytes
 * @param {Object} modelConfig - Model configuration
 * @returns {boolean} True if size is within limits
 */
export function isSizeWithinLimits(size, modelConfig) {
  if (!modelConfig || !modelConfig.maxImageSize) {
    return false;
  }
  return size <= modelConfig.maxImageSize;
}
