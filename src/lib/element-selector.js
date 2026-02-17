/**
 * Element Selector Service
 * Manages element selection state and coordinates with content scripts.
 */

export class ElementSelectorService {
  constructor() {
    this.selectedElement = null;
    this.selectionMode = false;
    this.elementData = null;
    this.listeners = new Map();
  }

  /**
   * Initialize the element selector service
   */
  init() {
    console.log('[FTA] Element selector service initialized');
  }

  /**
   * Start element selection mode
   * @param {number} tabId - Tab ID
   * @returns {Promise<Object>} Result
   */
  async startSelection(tabId) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'START_ELEMENT_SELECTION'
      });

      if (response && response.success) {
        this.selectionMode = true;
        console.log('[FTA] Element selection started for tab:', tabId);
        return { success: true };
      }

      return { success: false, error: 'Failed to start element selection' };
    } catch (error) {
      console.error('[FTA] Error starting element selection:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop element selection mode
   * @param {number} tabId - Tab ID
   * @returns {Promise<Object>} Result
   */
  async stopSelection(tabId) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'STOP_ELEMENT_SELECTION'
      });

      if (response && response.success) {
        this.selectionMode = false;
        console.log('[FTA] Element selection stopped for tab:', tabId);
        return { success: true };
      }

      return { success: false, error: 'Failed to stop element selection' };
    } catch (error) {
      console.error('[FTA] Error stopping element selection:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get element information by selector
   * @param {string} selector - CSS or XPath selector
   * @returns {Promise<Object>} Element data
   */
  async getElementInfo(selector) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_ELEMENT_INFO',
        selector: selector
      });

      if (response && response.success) {
        return { success: true, data: response.data };
      }

      return { success: false, error: 'Failed to get element info' };
    } catch (error) {
      console.error('[FTA] Error getting element info:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Highlight an element by selector
   * @param {string} selector - CSS or XPath selector
   * @returns {Promise<Object>} Result
   */
  async highlightElement(selector) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'HIGHLIGHT_ELEMENT',
        selector: selector
      });

      if (response && response.success) {
        return { success: true };
      }

      return { success: false, error: 'Failed to highlight element' };
    } catch (error) {
      console.error('[FTA] Error highlighting element:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove highlight from element
   * @returns {Promise<Object>} Result
   */
  async removeHighlight() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'REMOVE_HIGHLIGHT'
      });

      if (response && response.success) {
        return { success: true };
      }

      return { success: false, error: 'Failed to remove highlight' };
    } catch (error) {
      console.error('[FTA] Error removing highlight:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Set selected element data
   * @param {Object} data - Element data
   */
  setSelectedElement(data) {
    this.selectedElement = data;
    this.elementData = data;
    this.notifyListeners('ELEMENT_SELECTED', data);
  }

  /**
   * Get selected element data
   * @returns {Object|null} Element data
   */
  getSelectedElement() {
    return this.elementData;
  }

  /**
   * Clear selected element
   */
  clearSelectedElement() {
    this.selectedElement = null;
    this.elementData = null;
    this.notifyListeners('ELEMENT_CLEARED', null);
  }

  /**
   * Check if selection mode is active
   * @returns {boolean} Selection mode status
   */
  isSelectionModeActive() {
    return this.selectionMode;
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  removeListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Notify all listeners of an event
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Save selected element to storage
   * @param {number} tabId - Tab ID
   * @returns {Promise<boolean>} Success status
   */
  async saveToStorage(tabId) {
    if (!this.elementData) {
      return false;
    }

    try {
      await chrome.storage.local.set({
        [`selected_element_${tabId}`]: this.elementData
      });
      return true;
    } catch (error) {
      console.error('[FTA] Error saving element to storage:', error);
      return false;
    }
  }

  /**
   * Load selected element from storage
   * @param {number} tabId - Tab ID
   * @returns {Promise<Object|null>} Element data
   */
  async loadFromStorage(tabId) {
    try {
      const result = await chrome.storage.local.get([`selected_element_${tabId}`]);
      const data = result[`selected_element_${tabId}`];
      
      if (data) {
        this.elementData = data;
        this.selectedElement = data;
      }

      return data;
    } catch (error) {
      console.error('[FTA] Error loading element from storage:', error);
      return null;
    }
  }

  /**
   * Clear element from storage
   * @param {number} tabId - Tab ID
   * @returns {Promise<boolean>} Success status
   */
  async clearFromStorage(tabId) {
    try {
      await chrome.storage.local.remove([`selected_element_${tabId}`]);
      return true;
    } catch (error) {
      console.error('[FTA] Error clearing element from storage:', error);
      return false;
    }
  }

  /**
   * Get element selector (CSS or XPath)
   * @returns {string|null} Element selector
   */
  getSelector() {
    if (!this.elementData) {
      return null;
    }

    // Prefer CSS selector if available
    return this.elementData.cssSelector || this.elementData.xpath;
  }

  /**
   * Get element XPath
   * @returns {string|null} XPath
   */
  getXPath() {
    if (!this.elementData) {
      return null;
    }

    return this.elementData.xpath;
  }

  /**
   * Get element CSS selector
   * @returns {string|null} CSS selector
   */
  getCssSelector() {
    if (!this.elementData) {
      return null;
    }

    return this.elementData.cssSelector;
  }

  /**
   * Get element position
   * @returns {Object|null} Element position
   */
  getPosition() {
    if (!this.elementData) {
      return null;
    }

    return this.elementData.position;
  }

  /**
   * Get element HTML
   * @returns {string|null} Element HTML
   */
  getHTML() {
    if (!this.elementData) {
      return null;
    }

    return this.elementData.outerHTML;
  }

  /**
   * Get element attributes
   * @returns {Object|null} Element attributes
   */
  getAttributes() {
    if (!this.elementData) {
      return null;
    }

    return this.elementData.attributes;
  }

  /**
   * Get computed styles
   * @returns {Object|null} Computed styles
   */
  getComputedStyles() {
    if (!this.elementData) {
      return null;
    }

    return this.elementData.computedStyles;
  }

  /**
   * Get element tag name
   * @returns {string|null} Tag name
   */
  getTagName() {
    if (!this.elementData) {
      return null;
    }

    return this.elementData.tagName;
  }

  /**
   * Get element ID
   * @returns {string|null} Element ID
   */
  getElementId() {
    if (!this.elementData) {
      return null;
    }

    return this.elementData.idAttribute;
  }

  /**
   * Get element class name
   * @returns {string|null} Class name
   */
  getClassName() {
    if (!this.elementData) {
      return null;
    }

    return this.elementData.className;
  }

  /**
   * Reset service state
   */
  reset() {
    this.selectedElement = null;
    this.selectionMode = false;
    this.elementData = null;
    this.listeners.clear();
    console.log('[FTA] Element selector service reset');
  }
}

// Create singleton instance
const elementSelectorService = new ElementSelectorService();

export default elementSelectorService;
