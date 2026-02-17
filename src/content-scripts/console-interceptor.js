/**
 * Console Interceptor
 * Intercepts and captures console logs, errors, and warnings.
 */

window.Shannon.ConsoleInterceptor = class ConsoleInterceptor {
  constructor() {
    this.logs = [];
    this.isMonitoring = false;
    this.maxLogs = 1000;
    this.originalConsole = {};
    this.isInitialized = false;
    this.errorEventListeners = [];
    this.rejectionEventListeners = [];
  }

  /**
   * Initialize the console interceptor
   */
  init() {
    if (this.isInitialized) {
      return;
    }

    // Message handling is done by ContentScriptCoordinator in main.js
    // to avoid duplicate onMessage listeners
    this.isInitialized = true;
    console.log('[FTA] Console interceptor initialized');
  }

  /**
   * Start console monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) {
      console.log('[FTA] Console monitoring already active');
      return;
    }

    // Store original console methods
    this.originalConsole = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      info: console.info.bind(console)
    };

    // Override console methods
    this.overrideConsole();

    this.isMonitoring = true;
    console.log('[FTA] Console monitoring started');
  }

  /**
   * Override console methods to capture logs
   */
  overrideConsole() {
    const self = this;

    // Override console.log
    console.log = function(...args) {
      self.captureLog('log', args);
      self.originalConsole.log.apply(console, args);
    };

    // Override console.warn
    console.warn = function(...args) {
      self.captureLog('warn', args);
      self.originalConsole.warn.apply(console, args);
    };

    // Override console.error
    console.error = function(...args) {
      self.captureLog('error', args);
      self.originalConsole.error.apply(console, args);
    };

    // Override console.info
    console.info = function(...args) {
      self.captureLog('info', args);
      self.originalConsole.info.apply(console, args);
    };

    // Capture unhandled errors
    const errorHandler = (event) => {
      self.captureLog('error', [event.message], {
        source: {
          file: event.filename,
          line: event.lineno,
          column: event.colno
        },
        stackTrace: event.error?.stack,
        type: 'unhandled'
      });
    };
    window.addEventListener('error', errorHandler);
    this.errorEventListeners.push({ target: window, handler: errorHandler });

    // Capture unhandled promise rejections
    const rejectionHandler = (event) => {
      self.captureLog('error', [event.reason], {
        stackTrace: event.reason?.stack,
        type: 'unhandledRejection'
      });
    };
    window.addEventListener('unhandledrejection', rejectionHandler);
    this.rejectionEventListeners.push({ target: window, handler: rejectionHandler });
  }

  /**
   * Stop console monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    // Restore original console methods
    if (this.originalConsole.log) {
      console.log = this.originalConsole.log;
    }
    if (this.originalConsole.warn) {
      console.warn = this.originalConsole.warn;
    }
    if (this.originalConsole.error) {
      console.error = this.originalConsole.error;
    }
    if (this.originalConsole.info) {
      console.info = this.originalConsole.info;
    }

    // Remove event listeners
    this.errorEventListeners.forEach(({ target, handler }) => {
      target.removeEventListener('error', handler);
    });
    this.errorEventListeners = [];

    this.rejectionEventListeners.forEach(({ target, handler }) => {
      target.removeEventListener('unhandledrejection', handler);
    });
    this.rejectionEventListeners = [];

    this.isMonitoring = false;
    console.log('[FTA] Console monitoring stopped');
  }

  /**
   * Capture a log entry
   * @param {string} level - Log level (log, warn, error, info)
   * @param {Array} args - Log arguments
   * @param {Object} metadata - Additional metadata
   */
  captureLog(level, args, metadata = {}) {
    const logEntry = {
      id: this.generateId(),
      type: level,
      level: level,
      message: this.formatMessage(args),
      timestamp: Date.now(),
      url: window.location.href,
      args: this.serializeArgs(args),
      ...metadata
    };

    // Add source info if not provided
    if (!metadata.source) {
      const stack = new Error().stack;
      logEntry.source = this.parseStackTrace(stack);
    }

    // Categorize error
    if (level === 'error') {
      logEntry.category = this.categorizeError(logEntry);
    }

    this.logs.push(logEntry);

    // Limit log count
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Notify extension
    chrome.runtime.sendMessage({
      type: 'NEW_CONSOLE_LOG',
      log: logEntry
    }).catch(() => {
      // Ignore errors if extension context is invalid
    });
  }

  /**
   * Format log message from arguments
   * @param {Array} args - Log arguments
   * @returns {string} Formatted message
   */
  formatMessage(args) {
    return args.map(arg => {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return arg.message;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    }).join(' ');
  }

  /**
   * Serialize log arguments
   * @param {Array} args - Log arguments
   * @returns {Array} Serialized arguments
   */
  serializeArgs(args) {
    return args.map(arg => {
      if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
        return arg;
      }
      if (arg instanceof Error) {
        return { message: arg.message, stack: arg.stack };
      }
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.parse(JSON.stringify(arg));
        } catch {
          return { '[unserializable]': typeof arg };
        }
      }
      return String(arg);
    });
  }

  /**
   * Parse stack trace to extract source information
   * @param {string} stack - Stack trace string
   * @returns {Object|null} Source information
   */
  parseStackTrace(stack) {
    if (!stack) return null;

    const lines = stack.split('\n');
    for (const line of lines) {
      const match = line.match(/at\s+.*?\((.*?):(\d+):(\d+)\)/) ||
                    line.match(/at\s+(.*?):(\d+):(\d+)/);

      if (match) {
        return {
          file: match[1],
          line: parseInt(match[2]),
          column: parseInt(match[3])
        };
      }
    }

    return null;
  }

  /**
   * Categorize errors based on message and stack
   * @param {Object} logEntry - Log entry object
   * @returns {string} Error category
   */
  categorizeError(logEntry) {
    const message = logEntry.message.toLowerCase();
    const stack = logEntry.stackTrace?.toLowerCase() || '';

    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('xhr')) {
      return 'network';
    }

    // JavaScript errors
    if (message.includes('undefined') || message.includes('null')) {
      return 'reference';
    }

    if (message.includes('syntax')) {
      return 'syntax';
    }

    if (message.includes('type error') || message.includes('is not a')) {
      return 'type';
    }

    // Promise errors
    if (logEntry.type === 'unhandledRejection') {
      return 'promise';
    }

    // API errors
    if (stack.includes('api') || message.includes('api')) {
      return 'api';
    }

    // Resource errors
    if (message.includes('404') || message.includes('not found')) {
      return 'resource';
    }

    return 'unknown';
  }

  /**
   * Get logs with optional filtering
   * @param {Object} filter - Filter options
   * @returns {Array} Filtered logs
   */
  getLogs(filter = {}) {
    let filteredLogs = this.logs;

    if (filter.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filter.level);
    }

    if (filter.category) {
      filteredLogs = filteredLogs.filter(log => log.category === filter.category);
    }

    if (filter.since) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.since);
    }

    if (filter.until) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filter.until);
    }

    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log =>
        log.message.toLowerCase().includes(searchTerm)
      );
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp - a.timestamp);

    return filteredLogs;
  }

  /**
   * Clear all captured logs
   */
  clearLogs() {
    this.logs = [];
    console.log('[FTA] Console logs cleared');
  }

  /**
   * Generate unique ID for log entry
   * @returns {string} Unique ID
   */
  generateId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get log statistics
   * @returns {Object} Log statistics
   */
  getStatistics() {
    return {
      total: this.logs.length,
      errors: this.logs.filter(l => l.level === 'error').length,
      warnings: this.logs.filter(l => l.level === 'warn').length,
      info: this.logs.filter(l => l.level === 'info').length,
      logs: this.logs.filter(l => l.level === 'log').length,
      categories: this.getCategoryBreakdown()
    };
  }

  /**
   * Get breakdown of error categories
   * @returns {Object} Category breakdown
   */
  getCategoryBreakdown() {
    const categories = {};
    this.logs
      .filter(l => l.level === 'error' && l.category)
      .forEach(log => {
        categories[log.category] = (categories[log.category] || 0) + 1;
      });
    return categories;
  }
};
