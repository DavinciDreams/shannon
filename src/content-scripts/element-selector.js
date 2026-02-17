/**
 * Element Selector
 * Provides UI for selecting DOM elements on the page with hover highlighting and click selection.
 */

window.Shannon.ElementSelector = class ElementSelector {
  constructor() {
    this.isEnabled = false;
    this.hoveredElement = null;
    this.selectedElement = null;
    this.overlay = null;
    this.selectedBorder = null;
    this.tooltip = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the element selector
   */
  init() {
    if (this.isInitialized) {
      return;
    }

    this.createOverlay();
    this.createSelectedBorder();
    this.createTooltip();
    this.setupEventListeners();

    this.isInitialized = true;
    console.log('[FTA] Element selector initialized');
  }

  /**
   * Create hover overlay element
   */
  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'fta-element-overlay';
    this.overlay.style.cssText = `
      position: absolute;
      pointer-events: none;
      background-color: rgba(66, 135, 245, 0.2);
      border: 2px solid #4287f5;
      z-index: 999999;
      display: none;
      transition: all 0.1s ease;
      box-sizing: border-box;
    `;
    document.body.appendChild(this.overlay);
  }

  /**
   * Create selected element border
   */
  createSelectedBorder() {
    this.selectedBorder = document.createElement('div');
    this.selectedBorder.id = 'fta-selected-border';
    this.selectedBorder.style.cssText = `
      position: absolute;
      pointer-events: none;
      background-color: rgba(255, 193, 7, 0.1);
      border: 3px solid #ffc107;
      z-index: 999999;
      display: none;
      box-shadow: 0 0 10px rgba(255, 193, 7, 0.5);
      box-sizing: border-box;
    `;
    document.body.appendChild(this.selectedBorder);
  }

  /**
   * Create tooltip element
   */
  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.id = 'fta-tooltip';
    this.tooltip.style.cssText = `
      position: absolute;
      background-color: #333;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      z-index: 999999;
      pointer-events: none;
      display: none;
      max-width: 300px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;
    document.body.appendChild(this.tooltip);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  /**
   * Enable element selection mode
   */
  enable() {
    if (this.isEnabled) {
      console.log('[FTA] Element selection already enabled');
      return;
    }

    this.isEnabled = true;
    document.addEventListener('mousemove', this.handleMouseMove, true);
    document.addEventListener('click', this.handleClick, true);
    document.addEventListener('keydown', this.handleKeyDown, true);
    document.body.style.cursor = 'crosshair';

    console.log('[FTA] Element selection enabled');
  }

  /**
   * Disable element selection mode
   */
  disable() {
    if (!this.isEnabled) {
      return;
    }

    this.isEnabled = false;
    document.removeEventListener('mousemove', this.handleMouseMove, true);
    document.removeEventListener('click', this.handleClick, true);
    document.removeEventListener('keydown', this.handleKeyDown, true);
    document.body.style.cursor = '';

    this.hideOverlay();
    this.hideTooltip();

    console.log('[FTA] Element selection disabled');
  }

  /**
   * Handle mouse move event
   * @param {MouseEvent} event - Mouse move event
   */
  handleMouseMove(event) {
    if (!this.isEnabled) return;

    const element = event.target;

    // Skip if hovering over our own elements
    if (element.id === 'fta-element-overlay' ||
        element.id === 'fta-selected-border' ||
        element.id === 'fta-tooltip') {
      return;
    }

    this.hoveredElement = element;
    this.updateOverlay(element);
    this.updateTooltip(element);
  }

  /**
   * Update overlay position and size
   * @param {Element} element - Element to highlight
   */
  updateOverlay(element) {
    const rect = element.getBoundingClientRect();

    this.overlay.style.display = 'block';
    this.overlay.style.left = `${rect.left + window.scrollX}px`;
    this.overlay.style.top = `${rect.top + window.scrollY}px`;
    this.overlay.style.width = `${rect.width}px`;
    this.overlay.style.height = `${rect.height}px`;
  }

  /**
   * Update tooltip content and position
   * @param {Element} element - Element to show tooltip for
   */
  updateTooltip(element) {
    const tagName = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const classes = element.className && typeof element.className === 'string'
      ? `.${element.className.split(' ').filter(Boolean).join('.')}`
      : '';
    const rect = element.getBoundingClientRect();

    // Build tooltip content safely using DOM methods (avoid innerHTML XSS)
    this.tooltip.textContent = '';
    const strong = document.createElement('strong');
    strong.textContent = tagName;
    this.tooltip.appendChild(strong);
    this.tooltip.appendChild(document.createTextNode(`${id}${classes}`));
    this.tooltip.appendChild(document.createElement('br'));
    const sizeSpan = document.createElement('span');
    sizeSpan.style.color = '#aaa';
    sizeSpan.textContent = `${Math.round(rect.width)} \u00d7 ${Math.round(rect.height)}`;
    this.tooltip.appendChild(sizeSpan);

    // Position tooltip above element
    this.tooltip.style.display = 'block';
    this.tooltip.style.left = `${rect.left + window.scrollX}px`;
    this.tooltip.style.top = `${rect.top + window.scrollY - this.tooltip.offsetHeight - 8}px`;
  }

  /**
   * Handle click event
   * @param {MouseEvent} event - Click event
   */
  handleClick(event) {
    if (!this.isEnabled) return;

    event.preventDefault();
    event.stopPropagation();

    const element = event.target;

    // Skip if clicking on our own elements
    if (element.id === 'fta-element-overlay' ||
        element.id === 'fta-selected-border' ||
        element.id === 'fta-tooltip') {
      return;
    }

    this.selectElement(element);
  }

  /**
   * Select an element
   * @param {Element} element - Element to select
   */
  selectElement(element) {
    this.selectedElement = element;
    const rect = element.getBoundingClientRect();

    // Show selected border
    this.selectedBorder.style.display = 'block';
    this.selectedBorder.style.left = `${rect.left + window.scrollX}px`;
    this.selectedBorder.style.top = `${rect.top + window.scrollY}px`;
    this.selectedBorder.style.width = `${rect.width}px`;
    this.selectedBorder.style.height = `${rect.height}px`;

    // Get element data
    const elementData = this.getElementData(element);

    // Send to extension
    chrome.runtime.sendMessage({
      type: 'ELEMENT_SELECTED',
      data: elementData
    }).catch(() => {
      // Ignore errors if extension context is invalid
    });

    console.log('[FTA] Element selected:', elementData.tagName, elementData.idAttribute);

    // Disable selection mode after selection
    this.disable();
  }

  /**
   * Get element data for selection
   * @param {Element} element - DOM element
   * @returns {Object} Element data
   */
  getElementData(element) {
    const rect = element.getBoundingClientRect();
    const computedStyles = window.getComputedStyle(element);

    return {
      id: this.generateElementId(element),
      tagName: element.tagName,
      className: element.className,
      idAttribute: element.id,
      outerHTML: element.outerHTML,
      innerHTML: element.innerHTML,
      innerText: element.innerText,
      textContent: element.textContent,
      attributes: this.getElementAttributes(element),
      computedStyles: {
        display: computedStyles.display,
        position: computedStyles.position,
        visibility: computedStyles.visibility,
        opacity: computedStyles.opacity,
        color: computedStyles.color,
        backgroundColor: computedStyles.backgroundColor,
        fontSize: computedStyles.fontSize,
        fontFamily: computedStyles.fontFamily
      },
      position: {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      },
      scrollPosition: {
        scrollX: window.scrollX,
        scrollY: window.scrollY
      },
      xpath: this.getXPath(element),
      cssSelector: this.getCssSelector(element)
    };
  }

  /**
   * Get all element attributes
   * @param {Element} element - DOM element
   * @returns {Object} Attributes object
   */
  getElementAttributes(element) {
    const attributes = {};
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      attributes[attr.name] = attr.value;
    }
    return attributes;
  }

  /**
   * Generate XPath for an element
   * @param {Element} element - DOM element
   * @returns {string} XPath selector
   */
  getXPath(element) {
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }

    const parts = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let index = 0;
      let sibling = current.previousSibling;

      while (sibling) {
        if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === current.tagName) {
          index++;
        }
        sibling = sibling.previousSibling;
      }

      const tagName = current.tagName.toLowerCase();
      const part = index > 0 ? `${tagName}[${index + 1}]` : tagName;
      parts.unshift(part);

      current = current.parentNode;
    }

    return parts.length ? `/${parts.join('/')}` : '';
  }

  /**
   * Generate CSS selector for an element
   * @param {Element} element - DOM element
   * @returns {string} CSS selector
   */
  getCssSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }

    const path = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        selector = `#${current.id}`;
        path.unshift(selector);
        break;
      }

      if (current.className) {
        const classes = current.className.split(' ').filter(c => c);
        if (classes.length > 0) {
          selector += `.${classes.join('.')}`;
        }
      }

      path.unshift(selector);
      current = current.parentNode;
    }

    return path.join(' > ');
  }

  /**
   * Generate unique element ID
   * @param {Element} element - DOM element
   * @returns {string} Unique ID
   */
  generateElementId(element) {
    if (element.id) {
      return element.id;
    }

    const tagName = element.tagName.toLowerCase();
    const className = element.className || '';
    const index = Array.from(element.parentElement?.children || []).indexOf(element);

    return `${tagName}_${className.replace(/\s+/g, '_')}_${index}`;
  }

  /**
   * Handle key down event
   * @param {KeyboardEvent} event - Key down event
   */
  handleKeyDown(event) {
    if (!this.isEnabled) return;

    if (event.key === 'Escape') {
      this.disable();
      chrome.runtime.sendMessage({
        type: 'ELEMENT_SELECTION_CANCELLED'
      }).catch(() => {
        // Ignore errors if extension context is invalid
      });
    }
  }

  /**
   * Highlight an element by selector
   * @param {string} selector - CSS or XPath selector
   */
  highlightElement(selector) {
    let element = null;

    // Try CSS selector first
    try {
      element = document.querySelector(selector);
    } catch (e) {
      // If CSS selector fails, try XPath
      try {
        element = document.evaluate(
          selector,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
      } catch (e2) {
        console.error('[FTA] Failed to find element:', selector);
        return;
      }
    }

    if (!element) {
      console.error('[FTA] Element not found:', selector);
      return;
    }

    const rect = element.getBoundingClientRect();

    this.selectedBorder.style.display = 'block';
    this.selectedBorder.style.left = `${rect.left + window.scrollX}px`;
    this.selectedBorder.style.top = `${rect.top + window.scrollY}px`;
    this.selectedBorder.style.width = `${rect.width}px`;
    this.selectedBorder.style.height = `${rect.height}px`;

    this.selectedElement = element;
  }

  /**
   * Remove highlight from selected element
   */
  removeHighlight() {
    this.selectedBorder.style.display = 'none';
    this.selectedElement = null;
  }

  /**
   * Hide overlay
   */
  hideOverlay() {
    this.overlay.style.display = 'none';
    this.hoveredElement = null;
  }

  /**
   * Hide tooltip
   */
  hideTooltip() {
    this.tooltip.style.display = 'none';
  }

  /**
   * Cleanup and remove all UI elements
   */
  destroy() {
    this.disable();

    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }

    if (this.selectedBorder && this.selectedBorder.parentNode) {
      this.selectedBorder.parentNode.removeChild(this.selectedBorder);
    }

    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.parentNode.removeChild(this.tooltip);
    }

    this.overlay = null;
    this.selectedBorder = null;
    this.tooltip = null;
    this.isInitialized = false;
  }
};
