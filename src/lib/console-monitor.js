/**
 * Console Monitor Service
 * Manages console monitoring state, stores console logs, and provides methods to retrieve and filter logs.
 */

export class ConsoleMonitor {
  constructor() {
    this.activeTabId = null;
    this.logs = new Map(); // tabId -> logs[]
    this.listeners = new Map(); // eventType -> Set of listeners
    this.maxLogsPerTab = 1000;
    this.maxTabs = 10;
  }

  /**
   * Start console monitoring for a tab
   * @param {number} tabId - Tab ID to monitor
   * @returns {Promise<void>}
   */
  async startMonitoring(tabId) {
    if (this.activeTabId === tabId) {
      console.log('[ConsoleMonitor] Already monitoring tab:', tabId);
      return;
    }

    // Stop monitoring current tab if any
    if (this.activeTabId) {
      await this.stopMonitoring(this.activeTabId);
    }

    this.activeTabId = tabId;

    // Initialize logs for this tab
    if (!this.logs.has(tabId)) {
      this.logs.set(tabId, []);
    }

    // Inject content script if not already injected
    await this.ensureContentScript(tabId);

    // Start monitoring in content script
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: 'START_CONSOLE_MONITORING'
      });
      console.log('[ConsoleMonitor] Started monitoring tab:', tabId);
      this.emit('monitoringStarted', { tabId });
    } catch (error) {
      console.error('[ConsoleMonitor] Failed to start monitoring:', error);
      this.activeTabId = null;
      throw error;
    }
  }

  /**
   * Stop console monitoring for a tab
   * @param {number} tabId - Tab ID to stop monitoring
   * @returns {Promise<void>}
   */
  async stopMonitoring(tabId) {
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: 'STOP_CONSOLE_MONITORING'
      });
      console.log('[ConsoleMonitor] Stopped monitoring tab:', tabId);
    } catch (error) {
      console.error('[ConsoleMonitor] Failed to stop monitoring:', error);
    }

    if (this.activeTabId === tabId) {
      this.activeTabId = null;
      this.emit('monitoringStopped', { tabId });
    }
  }

  /**
   * Get logs from a tab with optional filtering
   * @param {number} tabId - Tab ID
   * @param {Object} filter - Filter options
   * @returns {Promise<Array>} Filtered logs
   */
  async getLogs(tabId, filter = {}) {
    try {
      const result = await chrome.tabs.sendMessage(tabId, {
        type: 'GET_CONSOLE_LOGS',
        filter: filter
      });

      // Store logs locally
      this.logs.set(tabId, result.logs);

      return result.logs;
    } catch (error) {
      console.error('[ConsoleMonitor] Failed to get logs:', error);
      // Return cached logs if available
      return this.logs.get(tabId) || [];
    }
  }

  /**
   * Clear logs for a tab
   * @param {number} tabId - Tab ID
   * @returns {Promise<void>}
   */
  async clearLogs(tabId) {
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: 'CLEAR_CONSOLE_LOGS'
      });
      console.log('[ConsoleMonitor] Cleared logs for tab:', tabId);

      // Clear local cache
      this.logs.set(tabId, []);
      this.emit('logsCleared', { tabId });
    } catch (error) {
      console.error('[ConsoleMonitor] Failed to clear logs:', error);
    }
  }

  /**
   * Get log statistics for a tab
   * @param {number} tabId - Tab ID
   * @returns {Promise<Object>} Log statistics
   */
  async getStatistics(tabId) {
    const logs = await this.getLogs(tabId);
    return {
      total: logs.length,
      errors: logs.filter(l => l.level === 'error').length,
      warnings: logs.filter(l => l.level === 'warn').length,
      info: logs.filter(l => l.level === 'info').length,
      logs: logs.filter(l => l.level === 'log').length,
      categories: this.getCategoryBreakdown(logs)
    };
  }

  /**
   * Get breakdown of error categories
   * @param {Array} logs - Log entries
   * @returns {Object} Category breakdown
   */
  getCategoryBreakdown(logs) {
    const categories = {};
    logs
      .filter(l => l.level === 'error' && l.category)
      .forEach(log => {
        categories[log.category] = (categories[log.category] || 0) + 1;
      });
    return categories;
  }

  /**
   * Handle new console log from content script
   * @param {number} tabId - Tab ID
   * @param {Object} log - Log entry
   */
  handleNewLog(tabId, log) {
    const tabLogs = this.logs.get(tabId) || [];
    tabLogs.push(log);

    // Limit log count
    if (tabLogs.length > this.maxLogsPerTab) {
      tabLogs.shift();
    }

    this.logs.set(tabId, tabLogs);
    this.emit('newLog', { tabId, log });
  }

  /**
   * Get all logs across all tabs
   * @param {Object} filter - Filter options
   * @returns {Array} All filtered logs
   */
  getAllLogs(filter = {}) {
    let allLogs = [];

    for (const [tabId, logs] of this.logs.entries()) {
      allLogs = allLogs.concat(logs.map(log => ({ ...log, tabId })));
    }

    // Apply filters
    if (filter.level) {
      allLogs = allLogs.filter(log => log.level === filter.level);
    }

    if (filter.category) {
      allLogs = allLogs.filter(log => log.category === filter.category);
    }

    if (filter.tabId) {
      allLogs = allLogs.filter(log => log.tabId === filter.tabId);
    }

    if (filter.since) {
      allLogs = allLogs.filter(log => log.timestamp >= filter.since);
    }

    if (filter.until) {
      allLogs = allLogs.filter(log => log.timestamp <= filter.until);
    }

    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      allLogs = allLogs.filter(log =>
        log.message.toLowerCase().includes(searchTerm)
      );
    }

    // Sort by timestamp (newest first)
    allLogs.sort((a, b) => b.timestamp - a.timestamp);

    return allLogs;
  }

  /**
   * Get the currently monitored tab ID
   * @returns {number|null} Active tab ID
   */
  getActiveTabId() {
    return this.activeTabId;
  }

  /**
   * Check if a tab is being monitored
   * @param {number} tabId - Tab ID
   * @returns {boolean} True if monitoring
   */
  isMonitoring(tabId) {
    return this.activeTabId === tabId;
  }

  /**
   * Ensure content script is injected in a tab
   * @param {number} tabId - Tab ID
   * @returns {Promise<void>}
   */
  async ensureContentScript(tabId) {
    try {
      await chrome.tabs.sendMessage(tabId, { type: 'PING' });
    } catch {
      // Content script not injected, inject it
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: [
            'src/content-scripts/namespace.js',
            'src/content-scripts/element-inspector.js',
            'src/content-scripts/element-selector.js',
            'src/content-scripts/console-interceptor.js',
            'src/content-scripts/main.js'
          ]
        });
        console.log('[ConsoleMonitor] Content script injected into tab:', tabId);
      } catch (error) {
        console.error('[ConsoleMonitor] Failed to inject content script:', error);
        throw error;
      }
    }
  }

  /**
   * Add event listener
   * @param {string} eventType - Event type
   * @param {Function} listener - Event listener function
   */
  addListener(eventType, listener) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(listener);
  }

  /**
   * Remove event listener
   * @param {string} eventType - Event type
   * @param {Function} listener - Event listener function
   */
  removeListener(eventType, listener) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Emit event to all listeners
   * @param {string} eventType - Event type
   * @param {Object} data - Event data
   */
  emit(eventType, data) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('[ConsoleMonitor] Error in event listener:', error);
        }
      });
    }
  }

  /**
   * Clean up logs for tabs that no longer exist
   * @param {Array<number>} activeTabIds - List of active tab IDs
   */
  async cleanupInactiveTabs(activeTabIds) {
    const activeTabSet = new Set(activeTabIds);
    const tabsToRemove = [];

    for (const tabId of this.logs.keys()) {
      if (!activeTabSet.has(tabId)) {
        tabsToRemove.push(tabId);
      }
    }

    // Remove logs for inactive tabs
    for (const tabId of tabsToRemove) {
      this.logs.delete(tabId);
      console.log('[ConsoleMonitor] Cleaned up logs for inactive tab:', tabId);
    }

    // Also stop monitoring if the active tab is no longer active
    if (this.activeTabId && !activeTabSet.has(this.activeTabId)) {
      this.activeTabId = null;
      this.emit('monitoringStopped', { tabId: this.activeTabId });
    }
  }

  /**
   * Export logs to JSON format
   * @param {number} tabId - Tab ID (optional, exports all if not provided)
   * @returns {string} JSON string of logs
   */
  exportLogs(tabId = null) {
    const logs = tabId ? (this.logs.get(tabId) || []) : this.getAllLogs();
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Get recent logs from a tab
   * @param {number} tabId - Tab ID
   * @param {number} count - Number of recent logs to return
   * @returns {Promise<Array>} Recent logs
   */
  async getRecentLogs(tabId, count = 50) {
    const logs = await this.getLogs(tabId);
    return logs.slice(0, count);
  }

  /**
   * Get error logs from a tab
   * @param {number} tabId - Tab ID
   * @returns {Promise<Array>} Error logs
   */
  async getErrorLogs(tabId) {
    return this.getLogs(tabId, { level: 'error' });
  }

  /**
   * Get warning logs from a tab
   * @param {number} tabId - Tab ID
   * @returns {Promise<Array>} Warning logs
   */
  async getWarningLogs(tabId) {
    return this.getLogs(tabId, { level: 'warn' });
  }
}
