/**
 * Shannon Service Worker
 * Handles background tasks, offscreen document management, and message relaying
 */

import { ConsoleMonitor } from '../lib/console-monitor.js';
import { ScreenshotCapture } from '../lib/screenshot-capture.js';
import { visionService } from '../lib/vision-service.js';
import { IssueBuilder } from '../lib/issue-builder.js';
import { GitHubService } from '../lib/github-service.js';

console.log('[Service Worker] Shannon loaded');

// ============================================================================
// Console Monitor Service
// ============================================================================

const consoleMonitor = new ConsoleMonitor();

// ============================================================================
// Screenshot Capture Service
// ============================================================================

const screenshotCapture = new ScreenshotCapture();
screenshotCapture.init().catch(error => {
  console.error('[Service Worker] Error initializing screenshot capture:', error);
});

// ============================================================================
// Extension Lifecycle
// ============================================================================

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Service Worker] Extension installed:', details.reason);

  if (details.reason === 'install') {
    console.log('[Service Worker] First install - welcome!');
  } else if (details.reason === 'update') {
    console.log('[Service Worker] Updated from version:', details.previousVersion);
  }

  // Set default side panel behavior
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch(err => console.error('[Service Worker] Error setting panel behavior:', err));
});

chrome.runtime.onStartup.addListener(() => {
  console.log('[Service Worker] Browser started');
  
  // Set default side panel behavior on startup
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .then(() => console.log('[Service Worker] Panel behavior set on startup'))
    .catch(err => console.error('[Service Worker] Error setting panel behavior on startup:', err));
});

// ============================================================================
// Action Click Handler - Opens side panel when extension icon is clicked
// ============================================================================

chrome.action.onClicked.addListener(async (tab) => {
  console.log('[Service Worker] Extension icon clicked, opening side panel for tab:', tab.id);
  
  try {
    // Open the side panel for the current tab
    await chrome.sidePanel.open({ windowId: tab.windowId });
    console.log('[Service Worker] Side panel opened successfully');
  } catch (error) {
    console.error('[Service Worker] Error opening side panel:', error);
  }
});

// ============================================================================
// Offscreen Document Management
// ============================================================================

let offscreenCreated = false;

async function ensureOffscreenDocument() {
  if (offscreenCreated) {
    return true;
  }

  // Check if offscreen document already exists
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL('src/offscreen/offscreen.html')]
  });

  if (existingContexts.length > 0) {
    console.log('[Service Worker] Offscreen document already exists');
    offscreenCreated = true;
    return true;
  }

  // Create offscreen document
  try {
    await chrome.offscreen.createDocument({
      url: 'src/offscreen/offscreen.html',
      reasons: ['USER_MEDIA'],
      justification: 'Recording audio and using Web Speech API for transcription'
    });

    offscreenCreated = true;
    console.log('[Service Worker] Offscreen document created');
    return true;
  } catch (error) {
    console.error('[Service Worker] Error creating offscreen document:', error);
    return false;
  }
}

// ============================================================================
// Message Handling
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Service Worker] Received message:', message.type);

  switch (message.type) {
    // Voice Starter messages
    case 'START_TRANSCRIPTION':
      handleStartTranscription(message, sendResponse);
      return true; // Async

    case 'STOP_TRANSCRIPTION':
      handleStopTranscription(message, sendResponse);
      return true; // Async

    // Front-End Testing Agent messages
    case 'GET_ACTIVE_TAB':
      handleGetActiveTab(sendResponse);
      return true; // Async

    case 'INJECT_CONTENT_SCRIPT':
      handleInjectContentScript(message, sendResponse);
      return true; // Async

    case 'START_ELEMENT_SELECTION':
      handleStartElementSelection(message, sendResponse);
      return true; // Async

    case 'STOP_ELEMENT_SELECTION':
      handleStopElementSelection(message, sendResponse);
      return true; // Async

    case 'GET_ELEMENT_INFO':
      handleGetElementInfo(message, sendResponse);
      return true; // Async

    case 'HIGHLIGHT_ELEMENT':
      handleHighlightElement(message, sendResponse);
      return true; // Async

    case 'REMOVE_HIGHLIGHT':
      handleRemoveHighlight(message, sendResponse);
      return true; // Async

    case 'START_CONSOLE_MONITORING':
      handleStartConsoleMonitoring(message, sendResponse);
      return true; // Async

    case 'STOP_CONSOLE_MONITORING':
      handleStopConsoleMonitoring(message, sendResponse);
      return true; // Async

    case 'GET_CONSOLE_LOGS':
      handleGetConsoleLogs(message, sendResponse);
      return true; // Async

    case 'CLEAR_CONSOLE_LOGS':
      handleClearConsoleLogs(message, sendResponse);
      return true; // Async

    // Screenshot capture messages
    case 'CAPTURE_SCREENSHOT':
      handleCaptureScreenshot(message, sendResponse);
      return true; // Async

    case 'CAPTURE_ELEMENT_SCREENSHOT':
      handleCaptureElementScreenshot(message, sendResponse);
      return true; // Async

    case 'GET_SCREENSHOT':
      handleGetScreenshot(message, sendResponse);
      return true; // Async

    case 'GET_ALL_SCREENSHOTS':
      handleGetAllScreenshots(message, sendResponse);
      return true; // Async

    case 'DELETE_SCREENSHOT':
      handleDeleteScreenshot(message, sendResponse);
      return true; // Async

    case 'DELETE_ALL_SCREENSHOTS':
      handleDeleteAllScreenshots(message, sendResponse);
      return true; // Async

    // Vision model messages
    case 'ANALYZE_IMAGE':
      handleAnalyzeImage(message, sendResponse);
      return true; // Async

    case 'GENERATE_TEST_CASES':
      handleGenerateTestCases(message, sendResponse);
      return true; // Async

    case 'GENERATE_BUG_REPORT':
      handleGenerateBugReport(message, sendResponse);
      return true; // Async

    case 'GENERATE_SUGGESTIONS':
      handleGenerateSuggestions(message, sendResponse);
      return true; // Async

    case 'GET_VISION_SETTINGS':
      handleGetVisionSettings(sendResponse);
      return true; // Async

    case 'UPDATE_VISION_SETTINGS':
      handleUpdateVisionSettings(message, sendResponse);
      return true; // Async

    // GitHub issue messages
    case 'CREATE_TEST_ISSUE':
      handleCreateTestIssue(message, sendResponse);
      return true; // Async

    case 'BUILD_ISSUE_BODY':
      handleBuildIssueBody(message, sendResponse);
      return true; // Async

    case 'PREVIEW_ISSUE':
      handlePreviewIssue(message, sendResponse);
      return true; // Async

    // Messages from content scripts
    case 'CONTENT_SCRIPT_INITIALIZED':
      handleContentScriptInitialized(message, sender, sendResponse);
      return true; // Async

    case 'ELEMENT_SELECTED':
      handleElementSelected(message, sender, sendResponse);
      return true; // Async

    case 'ELEMENT_SELECTION_CANCELLED':
      handleElementSelectionCancelled(sendResponse);
      return true; // Async

    case 'NEW_CONSOLE_LOG':
      handleNewConsoleLog(message, sender, sendResponse);
      return true; // Async

    // Messages from offscreen to relay to side panel
    case 'TRANSCRIPTION_RESULT':
    case 'TRANSCRIPTION_ERROR':
    case 'TRANSCRIPTION_STARTED':
    case 'TRANSCRIPTION_STOPPED':
      // These are sent by offscreen document and relayed to side panel
      // The side panel will receive them via its own message listener
      break;

    default:
      sendResponse({ success: true });
  }

  return true;
});

async function handleStartTranscription(message, sendResponse) {
  try {
    // Ensure offscreen document exists
    const created = await ensureOffscreenDocument();
    if (!created) {
      sendResponse({
        success: false,
        error: 'Failed to create offscreen document'
      });
      return;
    }

    // Forward to offscreen document with target property
    chrome.runtime.sendMessage({
      type: 'START_TRANSCRIPTION',
      target: 'offscreen',
      language: message.language || 'en-US'
    });

    sendResponse({ success: true });
  } catch (error) {
    console.error('[Service Worker] Error starting transcription:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

async function handleStopTranscription(message, sendResponse) {
  try {
    chrome.runtime.sendMessage({
      type: 'STOP_TRANSCRIPTION',
      target: 'offscreen'
    });

    sendResponse({ success: true });
  } catch (error) {
    console.error('[Service Worker] Error stopping transcription:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// ============================================================================
// Front-End Testing Agent Handlers
// ============================================================================

async function handleGetActiveTab(sendResponse) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      sendResponse({ success: false, error: 'No active tab found' });
      return;
    }

    sendResponse({
      success: true,
      tabInfo: {
        id: tab.id,
        url: tab.url,
        title: tab.title,
        favicon: tab.favIconUrl
      }
    });
  } catch (error) {
    console.error('[Service Worker] Error getting active tab:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleInjectContentScript(message, sendResponse) {
  try {
    const tabId = message.tabId;

    await chrome.scripting.executeScript({
      target: { tabId },
      files: CONTENT_SCRIPT_FILES
    });

    sendResponse({ success: true });
  } catch (error) {
    console.error('[Service Worker] Error injecting content script:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleStartElementSelection(message, sendResponse) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      sendResponse({ success: false, error: 'No active tab found' });
      return;
    }

    // Ensure content script is injected
    await ensureContentScriptInjected(tab.id);

    // Send message to content script
    await chrome.tabs.sendMessage(tab.id, {
      type: 'START_ELEMENT_SELECTION'
    });

    sendResponse({ success: true });
  } catch (error) {
    console.error('[Service Worker] Error starting element selection:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleStopElementSelection(message, sendResponse) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      sendResponse({ success: false, error: 'No active tab found' });
      return;
    }

    await chrome.tabs.sendMessage(tab.id, {
      type: 'STOP_ELEMENT_SELECTION'
    });

    sendResponse({ success: true });
  } catch (error) {
    console.error('[Service Worker] Error stopping element selection:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetElementInfo(message, sendResponse) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      sendResponse({ success: false, error: 'No active tab found' });
      return;
    }

    // Ensure content script is injected
    await ensureContentScriptInjected(tab.id);

    const result = await chrome.tabs.sendMessage(tab.id, {
      type: 'GET_ELEMENT_INFO',
      selector: message.selector
    });

    sendResponse(result);
  } catch (error) {
    console.error('[Service Worker] Error getting element info:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleHighlightElement(message, sendResponse) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      sendResponse({ success: false, error: 'No active tab found' });
      return;
    }

    // Ensure content script is injected
    await ensureContentScriptInjected(tab.id);

    await chrome.tabs.sendMessage(tab.id, {
      type: 'HIGHLIGHT_ELEMENT',
      selector: message.selector
    });

    sendResponse({ success: true });
  } catch (error) {
    console.error('[Service Worker] Error highlighting element:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleRemoveHighlight(message, sendResponse) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      sendResponse({ success: false, error: 'No active tab found' });
      return;
    }

    await chrome.tabs.sendMessage(tab.id, {
      type: 'REMOVE_HIGHLIGHT'
    });

    sendResponse({ success: true });
  } catch (error) {
    console.error('[Service Worker] Error removing highlight:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleStartConsoleMonitoring(message, sendResponse) {
  try {
    const tabId = message.tabId || (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id;
    if (!tabId) {
      sendResponse({ success: false, error: 'No active tab found' });
      return;
    }

    await consoleMonitor.startMonitoring(tabId);
    sendResponse({ success: true });
  } catch (error) {
    console.error('[Service Worker] Error starting console monitoring:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleStopConsoleMonitoring(message, sendResponse) {
  try {
    const tabId = message.tabId || (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id;
    if (!tabId) {
      sendResponse({ success: false, error: 'No active tab found' });
      return;
    }

    await consoleMonitor.stopMonitoring(tabId);
    sendResponse({ success: true });
  } catch (error) {
    console.error('[Service Worker] Error stopping console monitoring:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetConsoleLogs(message, sendResponse) {
  try {
    const tabId = message.tabId || (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id;
    if (!tabId) {
      sendResponse({ success: false, error: 'No active tab found' });
      return;
    }

    const logs = await consoleMonitor.getLogs(tabId, message.filter);
    sendResponse({ success: true, logs });
  } catch (error) {
    console.error('[Service Worker] Error getting console logs:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleClearConsoleLogs(message, sendResponse) {
  try {
    const tabId = message.tabId || (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id;
    if (!tabId) {
      sendResponse({ success: false, error: 'No active tab found' });
      return;
    }

    await consoleMonitor.clearLogs(tabId);
    sendResponse({ success: true });
  } catch (error) {
    console.error('[Service Worker] Error clearing console logs:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleContentScriptInitialized(message, sender, sendResponse) {
  console.log('[Service Worker] Content script initialized for tab:', sender.tab?.id);
  sendResponse({ success: true });
}

async function handleElementSelected(message, sender, sendResponse) {
  console.log('[Service Worker] Element selected:', message.data.tagName);
  
  // Store selected element data
  const tabId = sender.tab?.id;
  if (tabId) {
    chrome.storage.local.set({
      [`selected_element_${tabId}`]: message.data
    });
  }

  // Notify side panel
  chrome.runtime.sendMessage({
    type: 'ELEMENT_SELECTED',
    data: message.data,
    tabId: tabId
  }).catch(() => {
    // Ignore errors if side panel is not open
  });

  sendResponse({ success: true });
}

async function handleElementSelectionCancelled(sendResponse) {
  console.log('[Service Worker] Element selection cancelled');

  // Notify side panel
  chrome.runtime.sendMessage({
    type: 'ELEMENT_SELECTION_CANCELLED'
  }).catch(() => {
    // Ignore errors if side panel is not open
  });

  sendResponse({ success: true });
}

async function handleNewConsoleLog(message, sender, sendResponse) {
  console.log('[Service Worker] New console log:', message.log.type);

  const tabId = sender.tab?.id;
  if (tabId) {
    // Handle log in console monitor service
    consoleMonitor.handleNewLog(tabId, message.log);

    // Store log in storage for persistence
    chrome.storage.local.get([`console_logs_${tabId}`], (result) => {
      const logs = result[`console_logs_${tabId}`] || [];
      logs.push(message.log);
      
      // Limit to 1000 logs
      if (logs.length > 1000) {
        logs.shift();
      }

      chrome.storage.local.set({
        [`console_logs_${tabId}`]: logs
      });
    });
  }

  // Notify side panel
  chrome.runtime.sendMessage({
    type: 'NEW_CONSOLE_LOG',
    log: message.log,
    tabId: tabId
  }).catch(() => {
    // Ignore errors if side panel is not open
  });

  sendResponse({ success: true });
}

async function handleCaptureScreenshot(message, sendResponse) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      sendResponse({ success: false, error: 'No active tab found' });
      return;
    }

    const screenshot = await screenshotCapture.captureVisibleTab(tab.id, message.options || {});
    
    // Notify side panel
    chrome.runtime.sendMessage({
      type: 'SCREENSHOT_CAPTURED',
      screenshot: screenshot
    }).catch(() => {
      // Ignore errors if side panel is not open
    });

    sendResponse({ success: true, screenshot });
  } catch (error) {
    console.error('[Service Worker] Error capturing screenshot:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleCaptureElementScreenshot(message, sendResponse) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      sendResponse({ success: false, error: 'No active tab found' });
      return;
    }

    // Ensure content script is injected
    await ensureContentScriptInjected(tab.id);

    // Get element position from content script
    const elementInfoResponse = await chrome.tabs.sendMessage(tab.id, {
      type: 'GET_ELEMENT_INFO',
      selector: message.selector || message.xpath || message.cssSelector
    });

    if (!elementInfoResponse || !elementInfoResponse.success) {
      sendResponse({ success: false, error: 'Element not found or not visible' });
      return;
    }

    const elementData = elementInfoResponse.data;

    // Capture full visible tab screenshot
    const fullScreenshotUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png',
      quality: 100
    });

    // Crop to element bounds using OffscreenCanvas
    const croppedDataUrl = await cropImageToElement(fullScreenshotUrl, elementData.position);

    // Save via ScreenshotCapture service
    const screenshot = await screenshotCapture.captureElement(croppedDataUrl, elementData, tab.id);

    // Notify side panel
    chrome.runtime.sendMessage({
      type: 'ELEMENT_SCREENSHOT_CAPTURED',
      screenshot: screenshot
    }).catch(() => {
      // Ignore errors if side panel is not open
    });

    sendResponse({ success: true, screenshot });
  } catch (error) {
    console.error('[Service Worker] Error capturing element screenshot:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Crop a data URL image to element bounds using OffscreenCanvas.
 * Works in service worker context (no DOM required).
 * @param {string} dataUrl - Full page screenshot data URL
 * @param {Object} position - Element position {x, y, width, height}
 * @returns {Promise<string>} Cropped image data URL
 */
async function cropImageToElement(dataUrl, position) {
  if (!position || !position.width || !position.height) {
    return dataUrl; // Return full screenshot if no valid position
  }

  // Convert data URL to blob via fetch
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  // Create ImageBitmap (available in service workers)
  const imageBitmap = await createImageBitmap(blob);

  // Calculate crop bounds (clamp to image dimensions)
  const x = Math.max(0, Math.round(position.x));
  const y = Math.max(0, Math.round(position.y));
  const width = Math.min(Math.round(position.width), imageBitmap.width - x);
  const height = Math.min(Math.round(position.height), imageBitmap.height - y);

  if (width <= 0 || height <= 0) {
    imageBitmap.close();
    return dataUrl;
  }

  // Crop using OffscreenCanvas
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageBitmap, x, y, width, height, 0, 0, width, height);
  imageBitmap.close();

  // Convert to blob then data URL via arrayBuffer (no FileReader in service workers)
  const croppedBlob = await canvas.convertToBlob({ type: 'image/png' });
  const arrayBuffer = await croppedBlob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return 'data:image/png;base64,' + btoa(binary);
}

async function handleGetScreenshot(message, sendResponse) {
  try {
    const screenshot = await screenshotCapture.getScreenshot(message.screenshotId);
    
    if (!screenshot) {
      sendResponse({ success: false, error: 'Screenshot not found' });
      return;
    }

    sendResponse({ success: true, screenshot });
  } catch (error) {
    console.error('[Service Worker] Error getting screenshot:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetAllScreenshots(message, sendResponse) {
  try {
    const screenshots = await screenshotCapture.getAllScreenshots(message.filter || {});
    sendResponse({ success: true, screenshots });
  } catch (error) {
    console.error('[Service Worker] Error getting all screenshots:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleDeleteScreenshot(message, sendResponse) {
  try {
    const success = await screenshotCapture.deleteScreenshot(message.screenshotId);
    
    if (!success) {
      sendResponse({ success: false, error: 'Screenshot not found' });
      return;
    }

    // Notify side panel
    chrome.runtime.sendMessage({
      type: 'SCREENSHOT_DELETED',
      screenshotId: message.screenshotId
    }).catch(() => {
      // Ignore errors if side panel is not open
    });

    sendResponse({ success: true });
  } catch (error) {
    console.error('[Service Worker] Error deleting screenshot:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleDeleteAllScreenshots(message, sendResponse) {
  try {
    await screenshotCapture.deleteAllScreenshots();
    
    // Notify side panel
    chrome.runtime.sendMessage({
      type: 'ALL_SCREENSHOTS_DELETED'
    }).catch(() => {
      // Ignore errors if side panel is not open
    });

    sendResponse({ success: true });
  } catch (error) {
    console.error('[Service Worker] Error deleting all screenshots:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// ============================================================================
// Vision Model Handlers
// ============================================================================

/**
 * Handle analyze image message
 */
async function handleAnalyzeImage(message, sendResponse) {
  try {
    const { imageData, prompt, provider, options } = message;

    if (!imageData) {
      sendResponse({
        success: false,
        error: 'Image data is required'
      });
      return;
    }

    if (!prompt) {
      sendResponse({
        success: false,
        error: 'Prompt is required'
      });
      return;
    }

    const result = await visionService.analyzeImage(imageData, prompt, provider, options);

    sendResponse({
      success: true,
      result
    });
  } catch (error) {
    console.error('[Service Worker] Error analyzing image:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle generate test cases message
 */
async function handleGenerateTestCases(message, sendResponse) {
  try {
    const { imageData, provider, options } = message;

    if (!imageData) {
      sendResponse({
        success: false,
        error: 'Image data is required'
      });
      return;
    }

    const result = await visionService.generateTestCases(imageData, provider, options);

    sendResponse({
      success: true,
      result
    });
  } catch (error) {
    console.error('[Service Worker] Error generating test cases:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle generate bug report message
 */
async function handleGenerateBugReport(message, sendResponse) {
  try {
    const { imageData, consoleLogs, provider, options } = message;

    if (!imageData) {
      sendResponse({
        success: false,
        error: 'Image data is required'
      });
      return;
    }

    const result = await visionService.generateBugReport(imageData, consoleLogs, provider, options);

    sendResponse({
      success: true,
      result
    });
  } catch (error) {
    console.error('[Service Worker] Error generating bug report:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle generate suggestions message
 */
async function handleGenerateSuggestions(message, sendResponse) {
  try {
    const { imageData, provider, options } = message;

    if (!imageData) {
      sendResponse({
        success: false,
        error: 'Image data is required'
      });
      return;
    }

    const result = await visionService.generateSuggestions(imageData, provider, options);

    sendResponse({
      success: true,
      result
    });
  } catch (error) {
    console.error('[Service Worker] Error generating suggestions:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle get vision settings message
 */
async function handleGetVisionSettings(sendResponse) {
  try {
    const settings = {
      availableProviders: visionService.getAvailableProviders(),
      defaultProvider: visionService.getDefaultProvider(),
      capabilities: visionService.getCapabilities(),
      hasConfiguredProviders: visionService.hasConfiguredProviders()
    };

    sendResponse({
      success: true,
      settings
    });
  } catch (error) {
    console.error('[Service Worker] Error getting vision settings:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle update vision settings message
 */
async function handleUpdateVisionSettings(message, sendResponse) {
  try {
    const { defaultProvider } = message;

    if (defaultProvider) {
      visionService.setDefaultProvider(defaultProvider);
    }

    sendResponse({
      success: true
    });
  } catch (error) {
    console.error('[Service Worker] Error updating vision settings:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle create test issue message
 */
async function handleCreateTestIssue(message, sendResponse) {
  try {
    const { issueData, owner, repo } = message;

    if (!owner || !repo) {
      sendResponse({
        success: false,
        error: 'Owner and repository are required'
      });
      return;
    }

    // Validate issue data
    const validation = IssueBuilder.validateIssueData(issueData);
    if (!validation.isValid) {
      sendResponse({
        success: false,
        error: 'Invalid issue data',
        validationErrors: validation.errors
      });
      return;
    }

    // Build the issue
    const issue = await IssueBuilder.buildIssue(issueData);

    // Create the issue on GitHub
    const createdIssue = await GitHubService.createIssue(owner, repo, {
      title: issue.title,
      body: issue.body,
      labels: issue.labels
    });

    // Notify side panel
    chrome.runtime.sendMessage({
      type: 'TEST_ISSUE_CREATED',
      issue: createdIssue
    }).catch(() => {
      // Ignore errors if side panel is not open
    });

    sendResponse({
      success: true,
      issue: createdIssue
    });
  } catch (error) {
    console.error('[Service Worker] Error creating test issue:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle build issue body message
 */
async function handleBuildIssueBody(message, sendResponse) {
  try {
    const { issueData } = message;

    // Validate issue data
    const validation = IssueBuilder.validateIssueData(issueData);
    if (!validation.isValid) {
      sendResponse({
        success: false,
        error: 'Invalid issue data',
        validationErrors: validation.errors
      });
      return;
    }

    // Build the issue
    const issue = await IssueBuilder.buildIssue(issueData);

    sendResponse({
      success: true,
      issue
    });
  } catch (error) {
    console.error('[Service Worker] Error building issue body:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle preview issue message
 */
async function handlePreviewIssue(message, sendResponse) {
  try {
    const { issueData } = message;

    // Validate issue data
    const validation = IssueBuilder.validateIssueData(issueData);
    if (!validation.isValid) {
      sendResponse({
        success: false,
        error: 'Invalid issue data',
        validationErrors: validation.errors
      });
      return;
    }

    // Preview the issue
    const preview = await IssueBuilder.previewIssue(issueData);

    sendResponse({
      success: true,
      preview
    });
  } catch (error) {
    console.error('[Service Worker] Error previewing issue:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Ensure content script is injected in the specified tab
 * @param {number} tabId - Tab ID
 */
const CONTENT_SCRIPT_FILES = [
  'src/content-scripts/namespace.js',
  'src/content-scripts/element-inspector.js',
  'src/content-scripts/element-selector.js',
  'src/content-scripts/console-interceptor.js',
  'src/content-scripts/main.js'
];

async function ensureContentScriptInjected(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'PING' });
  } catch {
    // Content script not injected, inject all files in dependency order
    await chrome.scripting.executeScript({
      target: { tabId },
      files: CONTENT_SCRIPT_FILES
    });
  }
}

// ============================================================================
// Error Handling
// ============================================================================

self.addEventListener('error', (event) => {
  console.error('[Service Worker] Global error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[Service Worker] Unhandled promise rejection:', event.reason);
});

console.log('[Service Worker] Initialization complete');
