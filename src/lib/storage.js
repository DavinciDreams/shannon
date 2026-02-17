/**
 * Chrome Storage Wrapper
 * Provides convenient methods for storing and retrieving extension data
 */

// Storage keys
export const STORAGE_KEYS = {
  DRAFTS: 'drafts',
  HISTORY: 'history',
  SETTINGS: 'settings',
  CURRENT_RECORDING: 'current_recording',
  LAST_DESTINATION: 'last_destination',
  // Front-End Testing Agent Keys
  TEST_RESULTS: 'test_results',
  CONSOLE_LOGS: 'console_logs',
  ELEMENT_DATA: 'element_data',
  SCREENSHOTS: 'screenshots',
  AI_ANALYSIS: 'ai_analysis',
  VISION_SETTINGS: 'vision_settings',
};

/**
 * Get data from chrome.storage.local
 * @param {string} key - Storage key
 * @returns {Promise<any>} Stored value or null
 */
export async function getLocal(key) {
  try {
    const result = await chrome.storage.local.get(key);
    return result[key] ?? null;
  } catch (error) {
    console.error(`[Storage] Error getting ${key}:`, error);
    return null;
  }
}

/**
 * Set data in chrome.storage.local
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @returns {Promise<boolean>} Success status
 */
export async function setLocal(key, value) {
  try {
    await chrome.storage.local.set({ [key]: value });
    return true;
  } catch (error) {
    console.error(`[Storage] Error setting ${key}:`, error);
    return false;
  }
}

/**
 * Remove data from chrome.storage.local
 * @param {string} key - Storage key
 * @returns {Promise<boolean>} Success status
 */
export async function removeLocal(key) {
  try {
    await chrome.storage.local.remove(key);
    return true;
  } catch (error) {
    console.error(`[Storage] Error removing ${key}:`, error);
    return false;
  }
}

/**
 * Get data from chrome.storage.session (cleared when browser closes)
 * @param {string} key - Storage key
 * @returns {Promise<any>} Stored value or null
 */
export async function getSession(key) {
  try {
    const result = await chrome.storage.session.get(key);
    return result[key] ?? null;
  } catch (error) {
    console.error(`[Storage] Error getting session ${key}:`, error);
    return null;
  }
}

/**
 * Set data in chrome.storage.session
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @returns {Promise<boolean>} Success status
 */
export async function setSession(key, value) {
  try {
    await chrome.storage.session.set({ [key]: value });
    return true;
  } catch (error) {
    console.error(`[Storage] Error setting session ${key}:`, error);
    return false;
  }
}

/**
 * Clear all session data
 * @returns {Promise<boolean>} Success status
 */
export async function clearSession() {
  try {
    await chrome.storage.session.clear();
    return true;
  } catch (error) {
    console.error('[Storage] Error clearing session:', error);
    return false;
  }
}

// ============================================================================
// Drafts Management
// ============================================================================

/**
 * Get all drafts
 * @returns {Promise<Array>} Array of draft objects
 */
export async function getDrafts() {
  const drafts = await getLocal(STORAGE_KEYS.DRAFTS);
  return drafts || [];
}

/**
 * Save a new draft
 * @param {Object} draft - Draft object
 * @param {string} draft.id - UUID
 * @param {number} draft.timestamp - Unix timestamp
 * @param {string} draft.transcription - Transcribed text
 * @param {string} [draft.refinedText] - LLM-refined text
 * @returns {Promise<boolean>} Success status
 */
export async function saveDraft(draft) {
  const drafts = await getDrafts();
  drafts.unshift(draft); // Add to beginning (most recent first)
  return await setLocal(STORAGE_KEYS.DRAFTS, drafts);
}

/**
 * Update an existing draft
 * @param {string} draftId - Draft ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<boolean>} Success status
 */
export async function updateDraft(draftId, updates) {
  const drafts = await getDrafts();
  const index = drafts.findIndex(d => d.id === draftId);

  if (index === -1) {
    console.error(`[Storage] Draft ${draftId} not found`);
    return false;
  }

  drafts[index] = { ...drafts[index], ...updates };
  return await setLocal(STORAGE_KEYS.DRAFTS, drafts);
}

/**
 * Delete a draft
 * @param {string} draftId - Draft ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteDraft(draftId) {
  const drafts = await getDrafts();
  const filtered = drafts.filter(d => d.id !== draftId);
  return await setLocal(STORAGE_KEYS.DRAFTS, filtered);
}

// ============================================================================
// History Management
// ============================================================================

/**
 * Get all history items (sent notes)
 * @returns {Promise<Array>} Array of history items
 */
export async function getHistory() {
  const history = await getLocal(STORAGE_KEYS.HISTORY);
  return history || [];
}

/**
 * Add item to history
 * @param {Object} item - History item
 * @param {string} item.id - UUID
 * @param {number} item.timestamp - Unix timestamp
 * @param {string} item.transcription - Transcribed text
 * @param {string} item.destination - Destination type
 * @param {string} item.status - 'sent' or 'draft'
 * @param {string} [item.artifactUrl] - Link to created artifact
 * @param {Object} [item.metadata] - Destination-specific metadata
 * @returns {Promise<boolean>} Success status
 */
export async function addToHistory(item) {
  const history = await getHistory();
  history.unshift(item); // Add to beginning (most recent first)

  // Keep only last 1000 items to prevent storage bloat
  const trimmed = history.slice(0, 1000);

  return await setLocal(STORAGE_KEYS.HISTORY, trimmed);
}

/**
 * Delete history item
 * @param {string} itemId - History item ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteHistoryItem(itemId) {
  const history = await getHistory();
  const filtered = history.filter(h => h.id !== itemId);
  return await setLocal(STORAGE_KEYS.HISTORY, filtered);
}

/**
 * Clear all history
 * @returns {Promise<boolean>} Success status
 */
export async function clearHistory() {
  return await setLocal(STORAGE_KEYS.HISTORY, []);
}

// ============================================================================
// Settings Management
// ============================================================================

/**
 * Default settings
 */
const DEFAULT_SETTINGS = {
  // GitHub
  githubToken: null,
  githubDefaultRepo: null,
  githubDefaultLabels: ['voice-note'],

  // OneNote
  onenoteToken: null,
  onenoteDefaultNotebook: null,
  onenoteDefaultSection: null,

  // LLM
  llmProvider: 'openrouter', // 'openrouter' | 'zai' | 'claude-code'
  llmApiKey: null,
  llmModel: 'anthropic/claude-3.5-sonnet',

  // Transcription
  transcriptionLanguage: 'en',
  maxRecordingDuration: 300, // 5 minutes in seconds

  // UI
  lastDestination: null, // Remember last used destination
  theme: 'auto', // 'light' | 'dark' | 'auto'
};

/**
 * Get all settings
 * @returns {Promise<Object>} Settings object
 */
export async function getSettings() {
  const settings = await getLocal(STORAGE_KEYS.SETTINGS);
  return { ...DEFAULT_SETTINGS, ...settings };
}

/**
 * Update settings
 * @param {Object} updates - Settings to update
 * @returns {Promise<boolean>} Success status
 */
export async function updateSettings(updates) {
  const current = await getSettings();
  const updated = { ...current, ...updates };
  return await setLocal(STORAGE_KEYS.SETTINGS, updated);
}

/**
 * Reset settings to defaults
 * @returns {Promise<boolean>} Success status
 */
export async function resetSettings() {
  return await setLocal(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
}

/**
 * Check if a specific integration is configured
 * @param {string} integration - 'github' | 'onenote' | 'notion' | 'llm'
 * @returns {Promise<boolean>} Configuration status
 */
export async function isIntegrationConfigured(integration) {
  const settings = await getSettings();

  switch (integration) {
    case 'github':
      return !!settings.githubToken;
    case 'onenote':
      return !!settings.onenoteToken;
    case 'llm':
      return !!settings.llmApiKey;
    default:
      return false;
  }
}

// ============================================================================
// Storage Quota Management
// ============================================================================

/**
 * Get storage quota information
 * @returns {Promise<Object>} Storage quota info
 */
export async function getStorageQuota() {
  try {
    const bytesInUse = await chrome.storage.local.getBytesInUse();
    const quota = chrome.storage.local.QUOTA_BYTES || 5242880; // 5MB default
    const percentUsed = (bytesInUse / quota) * 100;

    return {
      bytesInUse,
      quota,
      percentUsed: percentUsed.toFixed(2),
      available: quota - bytesInUse,
    };
  } catch (error) {
    console.error('[Storage] Error getting quota:', error);
    return {
      bytesInUse: 0,
      quota: 5242880,
      percentUsed: 0,
      available: 5242880,
    };
  }
}

/**
 * Check if storage is nearly full (>80%)
 * @returns {Promise<boolean>} True if storage is nearly full
 */
export async function isStorageNearlyFull() {
  const quota = await getStorageQuota();
  return quota.percentUsed > 80;
}

// ============================================================================
// Front-End Testing Agent Storage
// ============================================================================

/**
 * Get all test results
 * @returns {Promise<Array>} Array of test result objects
 */
export async function getTestResults() {
  const results = await getLocal(STORAGE_KEYS.TEST_RESULTS);
  return results || [];
}

/**
 * Save a test result
 * @param {Object} testResult - Test result object
 * @param {string} testResult.id - UUID
 * @param {number} testResult.timestamp - Unix timestamp
 * @param {string} testResult.url - Page URL
 * @param {string} testResult.status - 'passed' | 'failed' | 'skipped'
 * @param {Object} [testResult.elementData] - Element information
 * @param {Array} [testResult.consoleLogs] - Console logs
 * @param {string} [testResult.screenshot] - Screenshot data URL
 * @param {Object} [testResult.aiAnalysis] - AI analysis results
 * @returns {Promise<boolean>} Success status
 */
export async function saveTestResult(testResult) {
  const results = await getTestResults();
  results.unshift(testResult); // Add to beginning (most recent first)
  
  // Keep only last 1000 test results to prevent storage bloat
  const trimmed = results.slice(0, 1000);
  
  return await setLocal(STORAGE_KEYS.TEST_RESULTS, trimmed);
}

/**
 * Update a test result
 * @param {string} testId - Test result ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<boolean>} Success status
 */
export async function updateTestResult(testId, updates) {
  const results = await getTestResults();
  const index = results.findIndex(r => r.id === testId);

  if (index === -1) {
    console.error(`[Storage] Test result ${testId} not found`);
    return false;
  }

  results[index] = { ...results[index], ...updates };
  return await setLocal(STORAGE_KEYS.TEST_RESULTS, results);
}

/**
 * Delete a test result
 * @param {string} testId - Test result ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteTestResult(testId) {
  const results = await getTestResults();
  const filtered = results.filter(r => r.id !== testId);
  return await setLocal(STORAGE_KEYS.TEST_RESULTS, filtered);
}

/**
 * Clear all test results
 * @returns {Promise<boolean>} Success status
 */
export async function clearTestResults() {
  return await setLocal(STORAGE_KEYS.TEST_RESULTS, []);
}

// ============================================================================
// Console Logs Storage
// ============================================================================

/**
 * Get console logs for a specific test or page
 * @param {string} testId - Optional test ID to filter by
 * @returns {Promise<Array>} Array of console log objects
 */
export async function getConsoleLogs(testId = null) {
  const logs = await getLocal(STORAGE_KEYS.CONSOLE_LOGS);
  if (!logs) return [];
  
  if (testId) {
    return logs.filter(log => log.testId === testId);
  }
  return logs;
}

/**
 * Save console logs
 * @param {Array} logs - Array of console log objects
 * @returns {Promise<boolean>} Success status
 */
export async function saveConsoleLogs(logs) {
  const existingLogs = await getLocal(STORAGE_KEYS.CONSOLE_LOGS) || [];
  const allLogs = [...existingLogs, ...logs];
  
  // Keep only last 5000 console logs to prevent storage bloat
  const trimmed = allLogs.slice(-5000);
  
  return await setLocal(STORAGE_KEYS.CONSOLE_LOGS, trimmed);
}

/**
 * Clear console logs for a specific test or all logs
 * @param {string} testId - Optional test ID to clear logs for
 * @returns {Promise<boolean>} Success status
 */
export async function clearConsoleLogs(testId = null) {
  if (testId) {
    const logs = await getConsoleLogs();
    const filtered = logs.filter(log => log.testId !== testId);
    return await setLocal(STORAGE_KEYS.CONSOLE_LOGS, filtered);
  }
  return await setLocal(STORAGE_KEYS.CONSOLE_LOGS, []);
}

// ============================================================================
// Element Data Storage
// ============================================================================

/**
 * Get element data for a specific test
 * @param {string} testId - Test result ID
 * @returns {Promise<Object|null>} Element data object or null
 */
export async function getElementData(testId) {
  const allElementData = await getLocal(STORAGE_KEYS.ELEMENT_DATA);
  if (!allElementData) return null;
  
  return allElementData[testId] || null;
}

/**
 * Save element data for a test
 * @param {string} testId - Test result ID
 * @param {Object} elementData - Element data object
 * @returns {Promise<boolean>} Success status
 */
export async function saveElementData(testId, elementData) {
  const allElementData = await getLocal(STORAGE_KEYS.ELEMENT_DATA) || {};
  allElementData[testId] = elementData;
  return await setLocal(STORAGE_KEYS.ELEMENT_DATA, allElementData);
}

/**
 * Delete element data for a test
 * @param {string} testId - Test result ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteElementData(testId) {
  const allElementData = await getLocal(STORAGE_KEYS.ELEMENT_DATA) || {};
  delete allElementData[testId];
  return await setLocal(STORAGE_KEYS.ELEMENT_DATA, allElementData);
}

// ============================================================================
// Screenshots Storage
// ============================================================================

/**
 * Get screenshot for a specific test
 * @param {string} testId - Test result ID
 * @returns {Promise<string|null>} Screenshot data URL or null
 */
export async function getScreenshot(testId) {
  const allScreenshots = await getLocal(STORAGE_KEYS.SCREENSHOTS);
  if (!allScreenshots) return null;
  
  return allScreenshots[testId] || null;
}

/**
 * Save screenshot for a test
 * @param {string} testId - Test result ID
 * @param {string} dataUrl - Screenshot data URL
 * @returns {Promise<boolean>} Success status
 */
export async function saveScreenshot(testId, dataUrl) {
  const allScreenshots = await getLocal(STORAGE_KEYS.SCREENSHOTS) || {};
  allScreenshots[testId] = dataUrl;
  return await setLocal(STORAGE_KEYS.SCREENSHOTS, allScreenshots);
}

/**
 * Delete screenshot for a test
 * @param {string} testId - Test result ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteScreenshot(testId) {
  const allScreenshots = await getLocal(STORAGE_KEYS.SCREENSHOTS) || {};
  delete allScreenshots[testId];
  return await setLocal(STORAGE_KEYS.SCREENSHOTS, allScreenshots);
}

/**
 * Clear all screenshots
 * @returns {Promise<boolean>} Success status
 */
export async function clearAllScreenshots() {
  return await setLocal(STORAGE_KEYS.SCREENSHOTS, {});
}

// ============================================================================
// AI Analysis Storage
// ============================================================================

/**
 * Get AI analysis for a specific test
 * @param {string} testId - Test result ID
 * @returns {Promise<Object|null>} AI analysis object or null
 */
export async function getAIAnalysis(testId) {
  const allAnalysis = await getLocal(STORAGE_KEYS.AI_ANALYSIS);
  if (!allAnalysis) return null;
  
  return allAnalysis[testId] || null;
}

/**
 * Save AI analysis for a test
 * @param {string} testId - Test result ID
 * @param {Object} analysis - AI analysis object
 * @returns {Promise<boolean>} Success status
 */
export async function saveAIAnalysis(testId, analysis) {
  const allAnalysis = await getLocal(STORAGE_KEYS.AI_ANALYSIS) || {};
  allAnalysis[testId] = analysis;
  return await setLocal(STORAGE_KEYS.AI_ANALYSIS, allAnalysis);
}

/**
 * Update AI analysis for a test
 * @param {string} testId - Test result ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<boolean>} Success status
 */
export async function updateAIAnalysis(testId, updates) {
  const allAnalysis = await getLocal(STORAGE_KEYS.AI_ANALYSIS) || {};
  const existing = allAnalysis[testId] || {};
  allAnalysis[testId] = { ...existing, ...updates };
  return await setLocal(STORAGE_KEYS.AI_ANALYSIS, allAnalysis);
}

/**
 * Delete AI analysis for a test
 * @param {string} testId - Test result ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteAIAnalysis(testId) {
  const allAnalysis = await getLocal(STORAGE_KEYS.AI_ANALYSIS) || {};
  delete allAnalysis[testId];
  return await setLocal(STORAGE_KEYS.AI_ANALYSIS, allAnalysis);
}

// ============================================================================
// Vision Settings Storage
// ============================================================================

/**
 * Get vision settings
 * @returns {Promise<Object>} Vision settings object
 */
export async function getVisionSettings() {
  const settings = await getLocal(STORAGE_KEYS.VISION_SETTINGS);
  return settings || {};
}

/**
 * Update vision settings
 * @param {Object} updates - Settings to update
 * @returns {Promise<boolean>} Success status
 */
export async function updateVisionSettings(updates) {
  const current = await getVisionSettings();
  const updated = { ...current, ...updates };
  return await setLocal(STORAGE_KEYS.VISION_SETTINGS, updated);
}

/**
 * Reset vision settings to defaults
 * @returns {Promise<boolean>} Success status
 */
export async function resetVisionSettings() {
  return await setLocal(STORAGE_KEYS.VISION_SETTINGS, {});
}

/**
 * Get vision provider settings
 * @param {string} provider - Provider key ('zai', 'openrouter', 'claude')
 * @returns {Promise<Object|null>} Provider settings or null
 */
export async function getVisionProviderSettings(provider) {
  const settings = await getVisionSettings();
  return settings[provider] || null;
}

/**
 * Update vision provider settings
 * @param {string} provider - Provider key
 * @param {Object} providerSettings - Provider settings to update
 * @returns {Promise<boolean>} Success status
 */
export async function updateVisionProviderSettings(provider, providerSettings) {
  const settings = await getVisionSettings();
  settings[provider] = { ...settings[provider], ...providerSettings };
  return await setLocal(STORAGE_KEYS.VISION_SETTINGS, settings);
}

// ============================================================================
// Test Result Cleanup
// ============================================================================

/**
 * Delete all data associated with a test result
 * @param {string} testId - Test result ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteTestResultData(testId) {
  try {
    await Promise.all([
      deleteTestResult(testId),
      deleteElementData(testId),
      deleteScreenshot(testId),
      deleteAIAnalysis(testId),
    ]);
    return true;
  } catch (error) {
    console.error(`[Storage] Error deleting test result data for ${testId}:`, error);
    return false;
  }
}

/**
 * Get complete test result with all associated data
 * @param {string} testId - Test result ID
 * @returns {Promise<Object|null>} Complete test result object or null
 */
export async function getCompleteTestResult(testId) {
  try {
    const results = await getTestResults();
    const testResult = results.find(r => r.id === testId);
    
    if (!testResult) {
      return null;
    }

    const [elementData, screenshot, aiAnalysis] = await Promise.all([
      getElementData(testId),
      getScreenshot(testId),
      getAIAnalysis(testId),
    ]);

    return {
      ...testResult,
      elementData,
      screenshot,
      aiAnalysis,
    };
  } catch (error) {
    console.error(`[Storage] Error getting complete test result ${testId}:`, error);
    return null;
  }
}
