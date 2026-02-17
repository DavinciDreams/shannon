/**
 * Screenshot Capture Service
 * Provides methods for capturing full page and element screenshots
 */

import { getLocal, setLocal, removeLocal } from './storage.js';
import { STORAGE_KEYS } from './storage.js';

export class ScreenshotCapture {
  constructor() {
    this.screenshots = [];
    this.maxScreenshots = 100;
  }

  /**
   * Initialize the screenshot capture service
   */
  async init() {
    const stored = await getLocal(STORAGE_KEYS.SCREENSHOTS);
    this.screenshots = stored || [];
    console.log('[ScreenshotCapture] Initialized with', this.screenshots.length, 'screenshots');
  }

  /**
   * Capture visible tab screenshot
   * @param {number} tabId - Tab ID
   * @param {Object} options - Capture options
   * @param {string} options.format - Image format ('png' or 'jpeg')
   * @param {number} options.quality - Image quality (0-100, for JPEG)
   * @returns {Promise<Object>} Screenshot data with metadata
   */
  async captureVisibleTab(tabId, options = {}) {
    try {
      // Get tab first to ensure we have right context
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        throw new Error('No active tab found');
      }
      
      // Capture with proper tab context
      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
        format: options.format || 'png',
        quality: options.quality || 100
      });
      
      const screenshot = {
        id: this.generateId(),
        type: 'full_page',
        dataUrl: dataUrl,
        format: options.format || 'png',
        timestamp: Date.now(),
        tabId: tabId,
        url: tab?.url || '',
        title: tab?.title || '',
        metadata: {
          viewport: {
            width: tab?.width || 0,
            height: tab?.height || 0
          },
          devicePixelRatio: 1
        }
      };

      await this.saveScreenshot(screenshot);
      console.log('[ScreenshotCapture] Captured visible tab screenshot:', screenshot.id);

      return screenshot;
    } catch (error) {
      console.error('[ScreenshotCapture] Error capturing visible tab:', error);
      throw error;
    }
  }

  /**
   * Capture specific element screenshot (called from content script)
   * @param {string} dataUrl - Base64 image data URL from html2canvas
   * @param {Object} elementData - Element metadata
   * @param {number} tabId - Tab ID
   * @returns {Promise<Object>} Screenshot data with metadata
   */
  async captureElement(dataUrl, elementData, tabId) {
    try {
      const screenshot = {
        id: this.generateId(),
        type: 'element',
        dataUrl: dataUrl,
        format: 'png',
        timestamp: Date.now(),
        tabId: tabId,
        url: elementData.url || '',
        title: elementData.title || '',
        element: {
          id: elementData.id,
          tagName: elementData.tagName,
          className: elementData.className,
          idAttribute: elementData.idAttribute,
          xpath: elementData.xpath,
          cssSelector: elementData.cssSelector,
          position: elementData.position
        },
        metadata: {
          viewport: elementData.position?.viewport || {
            width: 0,
            height: 0
          },
          devicePixelRatio: 1
        }
      };

      await this.saveScreenshot(screenshot);
      console.log('[ScreenshotCapture] Captured element screenshot:', screenshot.id);
      
      return screenshot;
    } catch (error) {
      console.error('[ScreenshotCapture] Error capturing element screenshot:', error);
      throw error;
    }
  }

  /**
   * Convert Data URL to base64 string (without the data:image/...;base64, prefix)
   * @param {string} dataUrl - Data URL
   * @returns {string} Base64 string
   */
  dataUrlToBase64(dataUrl) {
    const matches = dataUrl.match(/^data:(.+?);base64,(.+)$/);
    if (matches && matches.length === 3) {
      return matches[2];
    }
    return dataUrl;
  }

  /**
   * Convert base64 string to Data URL
   * @param {string} base64 - Base64 string
   * @param {string} mimeType - MIME type (e.g., 'image/png')
   * @returns {string} Data URL
   */
  base64ToDataUrl(base64, mimeType = 'image/png') {
    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * Get screenshot by ID
   * @param {string} screenshotId - Screenshot ID
   * @returns {Promise<Object|null>} Screenshot data or null
   */
  async getScreenshot(screenshotId) {
    const screenshot = this.screenshots.find(s => s.id === screenshotId);
    return screenshot || null;
  }

  /**
   * Get all screenshots
   * @param {Object} filter - Optional filter
   * @param {string} filter.type - Filter by type ('full_page' or 'element')
   * @param {number} filter.tabId - Filter by tab ID
   * @returns {Promise<Array>} Array of screenshots
   */
  async getAllScreenshots(filter = {}) {
    let filtered = [...this.screenshots];

    if (filter.type) {
      filtered = filtered.filter(s => s.type === filter.type);
    }

    if (filter.tabId) {
      filtered = filtered.filter(s => s.tabId === filter.tabId);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    return filtered;
  }

  /**
   * Delete screenshot by ID
   * @param {string} screenshotId - Screenshot ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteScreenshot(screenshotId) {
    const index = this.screenshots.findIndex(s => s.id === screenshotId);
    
    if (index === -1) {
      console.error('[ScreenshotCapture] Screenshot not found:', screenshotId);
      return false;
    }

    this.screenshots.splice(index, 1);
    await this.persist();
    
    console.log('[ScreenshotCapture] Deleted screenshot:', screenshotId);
    return true;
  }

  /**
   * Delete all screenshots
   * @returns {Promise<boolean>} Success status
   */
  async deleteAllScreenshots() {
    this.screenshots = [];
    await this.persist();
    
    console.log('[ScreenshotCapture] Deleted all screenshots');
    return true;
  }

  /**
   * Delete screenshots by tab ID
   * @param {number} tabId - Tab ID
   * @returns {Promise<number>} Number of deleted screenshots
   */
  async deleteScreenshotsByTab(tabId) {
    const initialCount = this.screenshots.length;
    this.screenshots = this.screenshots.filter(s => s.tabId !== tabId);
    const deletedCount = initialCount - this.screenshots.length;
    
    await this.persist();
    
    console.log('[ScreenshotCapture] Deleted', deletedCount, 'screenshots for tab:', tabId);
    return deletedCount;
  }

  /**
   * Save screenshot to storage
   * @param {Object} screenshot - Screenshot data
   * @returns {Promise<boolean>} Success status
   */
  async saveScreenshot(screenshot) {
    this.screenshots.unshift(screenshot);
    
    // Limit to maxScreenshots
    if (this.screenshots.length > this.maxScreenshots) {
      this.screenshots = this.screenshots.slice(0, this.maxScreenshots);
    }
    
    await this.persist();
    return true;
  }

  /**
   * Persist screenshots to storage
   * @returns {Promise<boolean>} Success status
   */
  async persist() {
    return await setLocal(STORAGE_KEYS.SCREENSHOTS, this.screenshots);
  }

  /**
   * Generate unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `screenshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get screenshot statistics
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics() {
    const fullPageCount = this.screenshots.filter(s => s.type === 'full_page').length;
    const elementCount = this.screenshots.filter(s => s.type === 'element').length;
    const totalSize = this.screenshots.reduce((sum, s) => {
      const base64 = this.dataUrlToBase64(s.dataUrl);
      return sum + (base64.length * 0.75); // Approximate size in bytes
    }, 0);

    return {
      totalCount: this.screenshots.length,
      fullPageCount,
      elementCount,
      totalSizeBytes: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
    };
  }
}

// ============================================================================
// Helper Functions for Content Scripts
// ============================================================================

/**
 * Capture element using html2canvas (to be used in content script)
 * @param {Element} element - DOM element to capture
 * @param {Object} options - Capture options
 * @returns {Promise<string>} Data URL
 */
export async function captureElementWithHtml2Canvas(element, options = {}) {
  // Import html2canvas dynamically
  const html2canvas = await importHtml2Canvas();
  
  const canvas = await html2canvas(element, {
    useCORS: true,
    allowTaint: true,
    backgroundColor: options.backgroundColor || null,
    scale: options.scale || window.devicePixelRatio,
    logging: false,
    onclone: (clonedDoc) => {
      // Optional: Modify cloned document before capture
      if (options.onClone) {
        options.onClone(clonedDoc);
      }
    }
  });

  return canvas.toDataURL(options.format || 'image/png');
}

/**
 * Import html2canvas dynamically
 * @returns {Promise<Object>} html2canvas module
 */
async function importHtml2Canvas() {
  try {
    // Try to import from node_modules
    const module = await import('html2canvas');
    return module.default || module;
  } catch (error) {
    console.error('[ScreenshotCapture] Error importing html2canvas:', error);
    throw new Error('html2canvas not available. Please ensure it is installed.');
  }
}

/**
 * Crop full page screenshot to element position
 * @param {Object} position - Element position {x, y, width, height}
 * @param {string} dataUrl - Full page screenshot data URL
 * @returns {Promise<string>} Cropped image data URL
 */
export async function cropElementFromScreenshot(position, dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = position.width;
        canvas.height = position.height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(
          img,
          position.x,
          position.y,
          position.width,
          position.height,
          0,
          0,
          position.width,
          position.height
        );

        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const screenshotCapture = new ScreenshotCapture();
