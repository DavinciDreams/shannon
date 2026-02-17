/**
 * Main Content Script
 * Entry point for all content scripts. Initializes other modules and handles communication with the extension.
 * Note: Loaded after namespace.js, element-inspector.js, element-selector.js, console-interceptor.js
 */

class ContentScriptCoordinator {
  constructor() {
    this.elementInspector = new window.Shannon.ElementInspector();
    this.elementSelector = new window.Shannon.ElementSelector();
    this.consoleInterceptor = new window.Shannon.ConsoleInterceptor();
    this.isInitialized = false;
  }

  /**
   * Initialize all content script modules
   */
  init() {
    if (this.isInitialized) {
      console.log('[FTA] Content script already initialized');
      return;
    }

    console.log('[FTA] Initializing content script...');

    // Initialize modules
    this.elementInspector.init();
    this.elementSelector.init();
    this.consoleInterceptor.init();

    // Setup message listener
    this.setupMessageListener();

    this.isInitialized = true;
    console.log('[FTA] Content script initialized successfully');

    // Send initialization confirmation
    chrome.runtime.sendMessage({
      type: 'CONTENT_SCRIPT_INITIALIZED',
      tabId: this.getTabId()
    }).catch(() => {
      // Ignore errors if extension context is invalid
    });
  }

  /**
   * Setup message listener for communication with service worker and side panel
   */
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('[FTA] Received message:', message.type);

      switch (message.type) {
        case 'PING':
          sendResponse({ success: true, initialized: this.isInitialized });
          return true;

        case 'INSPECT_ELEMENT':
          this.elementInspector.inspect(message.elementId)
            .then(result => sendResponse({ success: true, data: result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
          return true;

        case 'GET_ELEMENT_INFO':
          this.elementInspector.getElementInfo(message.selector)
            .then(result => sendResponse({ success: true, data: result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
          return true;

        case 'START_ELEMENT_SELECTION':
          this.elementSelector.enable();
          sendResponse({ success: true });
          return true;

        case 'STOP_ELEMENT_SELECTION':
          this.elementSelector.disable();
          sendResponse({ success: true });
          return true;

        case 'HIGHLIGHT_ELEMENT':
          this.elementSelector.highlightElement(message.selector);
          sendResponse({ success: true });
          return true;

        case 'REMOVE_HIGHLIGHT':
          this.elementSelector.removeHighlight();
          sendResponse({ success: true });
          return true;

        case 'START_CONSOLE_MONITORING':
          this.consoleInterceptor.startMonitoring();
          sendResponse({ success: true });
          return true;

        case 'STOP_CONSOLE_MONITORING':
          this.consoleInterceptor.stopMonitoring();
          sendResponse({ success: true });
          return true;

        case 'GET_CONSOLE_LOGS':
          const logs = this.consoleInterceptor.getLogs(message.filter);
          sendResponse({ success: true, logs });
          return true;

        case 'CLEAR_CONSOLE_LOGS':
          this.consoleInterceptor.clearLogs();
          sendResponse({ success: true });
          return true;

        default:
          console.log('[FTA] Unknown message type:', message.type);
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    });
  }

  /**
   * Get current tab ID
   */
  getTabId() {
    // Tab ID is not directly available in content script
    // We'll send this to the service worker which can identify the tab
    return null;
  }
}

// Create and initialize the coordinator
const coordinator = new ContentScriptCoordinator();
coordinator.init();

// Store on namespace for external access
window.Shannon.coordinator = coordinator;
