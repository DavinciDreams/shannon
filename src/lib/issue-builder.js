/**
 * Issue Builder Service
 * Builds GitHub issue bodies with screenshots, console logs, element info, and AI analysis
 */

import { getLocal } from './storage.js';
import { STORAGE_KEYS } from './storage.js';

export class IssueBuilder {
  /**
   * Build a complete GitHub issue body
   * @param {Object} issueData - Issue data
   * @param {Array<string>} issueData.screenshotIds - Screenshot IDs to include
   * @param {string} issueData.consoleLogId - Console log ID to include
   * @param {Object} issueData.elementData - Element data to include
   * @param {Object} issueData.aiAnalysis - AI analysis result
   * @param {string} issueData.issueType - Type of issue (bug, enhancement, question, etc.)
   * @param {string} issueData.description - User description of the issue
   * @param {string} issueData.tabUrl - URL of the tab where issue was found
   * @param {string} issueData.tabTitle - Title of the tab
   * @returns {Promise<Object>} Issue with title and body
   */
  static async buildIssue(issueData) {
    const {
      screenshotIds = [],
      consoleLogId = null,
      elementData = null,
      aiAnalysis = null,
      issueType = 'bug',
      description = '',
      tabUrl = '',
      tabTitle = ''
    } = issueData;

    // Build issue title
    const title = this.generateTitle(issueType, description, tabTitle);

    // Build issue body sections
    const sections = [];

    // Add description
    if (description) {
      sections.push(this.buildDescriptionSection(description));
    }

    // Add environment info
    sections.push(this.buildEnvironmentSection(tabUrl, tabTitle));

    // Add screenshots
    if (screenshotIds.length > 0) {
      const screenshotsSection = await this.buildScreenshotsSection(screenshotIds);
      if (screenshotsSection) {
        sections.push(screenshotsSection);
      }
    }

    // Add console logs
    if (consoleLogId) {
      const consoleSection = await this.buildConsoleLogsSection(consoleLogId);
      if (consoleSection) {
        sections.push(consoleSection);
      }
    }

    // Add element information
    if (elementData) {
      sections.push(this.buildElementSection(elementData));
    }

    // Add AI analysis
    if (aiAnalysis) {
      sections.push(this.buildAIAnalysisSection(aiAnalysis));
    }

    // Combine all sections
    const body = sections.join('\n\n---\n\n');

    // Generate labels based on issue type
    const labels = this.generateLabels(issueType, aiAnalysis);

    return {
      title,
      body,
      labels
    };
  }

  /**
   * Generate an appropriate issue title
   * @param {string} issueType - Type of issue
   * @param {string} description - User description
   * @param {string} tabTitle - Tab title
   * @returns {string} Issue title
   */
  static generateTitle(issueType, description, tabTitle) {
    const typePrefix = {
      'bug': '🐛 Bug',
      'enhancement': '✨ Enhancement',
      'question': '❓ Question',
      'documentation': '📚 Documentation',
      'feature': '🚀 Feature Request',
      'performance': '⚡ Performance',
      'accessibility': '♿ Accessibility',
      'ui': '🎨 UI Issue',
      'testing': '🧪 Testing'
    };

    const prefix = typePrefix[issueType] || '🐛 Bug';

    if (description) {
      // Use first 60 chars of description
      const shortDesc = description.substring(0, 60).trim();
      return `${prefix}: ${shortDesc}${description.length > 60 ? '...' : ''}`;
    }

    if (tabTitle) {
      return `${prefix}: Issue on ${tabTitle}`;
    }

    return `${prefix}: Front-end issue detected`;
  }

  /**
   * Generate labels based on issue type and AI analysis
   * @param {string} issueType - Type of issue
   * @param {Object} aiAnalysis - AI analysis result
   * @returns {Array<string>} Label names
   */
  static generateLabels(issueType, aiAnalysis) {
    const labels = [issueType];

    // Add labels from AI analysis
    if (aiAnalysis && aiAnalysis.labels) {
      labels.push(...aiAnalysis.labels);
    }

    // Add priority label if available
    if (aiAnalysis && aiAnalysis.priority) {
      labels.push(aiAnalysis.priority);
    }

    // Add component label if available
    if (aiAnalysis && aiAnalysis.component) {
      labels.push(`component: ${aiAnalysis.component}`);
    }

    return labels;
  }

  /**
   * Build description section
   * @param {string} description - User description
   * @returns {string} Markdown section
   */
  static buildDescriptionSection(description) {
    return `## Description

${description}`;
  }

  /**
   * Build environment information section
   * @param {string} tabUrl - Tab URL
   * @param {string} tabTitle - Tab title
   * @returns {string} Markdown section
   */
  static buildEnvironmentSection(tabUrl, tabTitle) {
    const timestamp = new Date().toISOString();
    const userAgent = navigator.userAgent;

    return `## Environment

| Property | Value |
|----------|-------|
| **URL** | ${tabUrl || 'N/A'} |
| **Page Title** | ${tabTitle || 'N/A'} |
| **Detected At** | ${timestamp} |
| **User Agent** | ${userAgent} |
| **Extension Version** | ${chrome.runtime.getManifest().version} |`;
  }

  /**
   * Build screenshots section
   * @param {Array<string>} screenshotIds - Screenshot IDs
   * @returns {Promise<string|null>} Markdown section or null if no screenshots
   */
  static async buildScreenshotsSection(screenshotIds) {
    const screenshots = await getLocal(STORAGE_KEYS.SCREENSHOTS);
    if (!screenshots || screenshots.length === 0) {
      return null;
    }

    const relevantScreenshots = screenshots.filter(s => screenshotIds.includes(s.id));
    if (relevantScreenshots.length === 0) {
      return null;
    }

    let section = `## Screenshots\n\n`;

    relevantScreenshots.forEach((screenshot, index) => {
      const timestamp = new Date(screenshot.timestamp).toLocaleString();
      
      section += `### Screenshot ${index + 1}\n\n`;
      
      // Embed image as markdown
      section += `![Screenshot ${index + 1}](${screenshot.dataUrl})\n\n`;
      
      // Add metadata
      section += `**Type:** ${screenshot.type === 'element' ? 'Element' : 'Full Page'}  \n`;
      section += `**Captured:** ${timestamp}  \n`;
      
      if (screenshot.type === 'element' && screenshot.element) {
        section += `**Element:** \`${screenshot.element.tagName}\`  \n`;
        if (screenshot.element.className) {
          section += `**Class:** \`${screenshot.element.className}\`  \n`;
        }
        if (screenshot.element.idAttribute) {
          section += `**ID:** \`${screenshot.element.idAttribute}\`  \n`;
        }
      }
      
      section += '\n';
    });

    return section;
  }

  /**
   * Build console logs section
   * @param {string} consoleLogId - Console log ID
   * @returns {Promise<string|null>} Markdown section or null if no logs
   */
  static async buildConsoleLogsSection(consoleLogId) {
    const allLogs = await getLocal(STORAGE_KEYS.CONSOLE_LOGS);
    if (!allLogs || !allLogs[consoleLogId]) {
      return null;
    }

    const logs = allLogs[consoleLogId];
    if (!logs || logs.length === 0) {
      return null;
    }

    // Group logs by level
    const errors = logs.filter(l => l.level === 'error');
    const warnings = logs.filter(l => l.level === 'warn');
    const info = logs.filter(l => l.level === 'info' || l.level === 'log');

    let section = `## Console Logs\n\n`;

    // Add errors first
    if (errors.length > 0) {
      section += `### Errors (${errors.length})\n\n`;
      errors.forEach(log => {
        section += this.formatConsoleLog(log);
      });
      section += '\n';
    }

    // Add warnings
    if (warnings.length > 0) {
      section += `### Warnings (${warnings.length})\n\n`;
      warnings.forEach(log => {
        section += this.formatConsoleLog(log);
      });
      section += '\n';
    }

    // Add info logs
    if (info.length > 0) {
      section += `### Info (${info.length})\n\n`;
      info.forEach(log => {
        section += this.formatConsoleLog(log);
      });
      section += '\n';
    }

    return section;
  }

  /**
   * Format a single console log entry
   * @param {Object} log - Log entry
   * @returns {string} Formatted log
   */
  static formatConsoleLog(log) {
    const timestamp = new Date(log.timestamp).toLocaleTimeString();
    let formatted = `**[${timestamp}]** \`${log.level.toUpperCase()}\`\n\n`;

    if (log.message) {
      formatted += '```\n' + this.truncateString(log.message, 500) + '\n```\n\n';
    }

    if (log.stack && log.level === 'error') {
      formatted += '**Stack Trace:**\n\n```\n' + this.truncateString(log.stack, 1000) + '\n```\n\n';
    }

    if (log.url) {
      formatted += `**Source:** ${log.url}:${log.line}:${log.column}\n\n`;
    }

    return formatted;
  }

  /**
   * Build element information section
   * @param {Object} elementData - Element data
   * @returns {string} Markdown section
   */
  static buildElementSection(elementData) {
    let section = `## Element Information\n\n`;

    section += `| Property | Value |\n`;
    section += `|----------|-------|\n`;
    section += `| **Tag Name** | \`${elementData.tagName || 'N/A'}\` |\n`;
    section += `| **ID** | \`${elementData.idAttribute || 'N/A'}\` |\n`;
    section += `| **Classes** | \`${elementData.className || 'N/A'}\` |\n`;
    section += `| **XPath** | \`${elementData.xpath || 'N/A'}\` |\n`;
    section += `| **CSS Selector** | \`${elementData.cssSelector || 'N/A'}\` |\n`;

    if (elementData.position) {
      section += `| **Position** | x: ${elementData.position.x}, y: ${elementData.position.y} |\n`;
      section += `| **Size** | width: ${elementData.position.width}, height: ${elementData.position.height} |\n`;
    }

    section += '\n';

    // Add attributes
    if (elementData.attributes && Object.keys(elementData.attributes).length > 0) {
      section += `### Attributes\n\n`;
      section += `\`\`\`json\n${JSON.stringify(elementData.attributes, null, 2)}\n\`\`\`\n\n`;
    }

    // Add computed styles (selected properties)
    if (elementData.computedStyles) {
      section += `### Key Styles\n\n`;
      section += `\`\`\`css\n`;
      const importantStyles = [
        'display', 'position', 'width', 'height', 'margin', 'padding',
        'color', 'background-color', 'font-size', 'font-family',
        'visibility', 'opacity', 'z-index'
      ];
      importantStyles.forEach(prop => {
        if (elementData.computedStyles[prop]) {
          section += `${prop}: ${elementData.computedStyles[prop]};\n`;
        }
      });
      section += `\`\`\`\n\n`;
    }

    // Add HTML snippet
    if (elementData.outerHTML) {
      section += `### HTML\n\n`;
      const truncatedHTML = this.truncateString(elementData.outerHTML, 2000);
      section += `\`\`\`html\n${truncatedHTML}\n\`\`\`\n\n`;
    }

    return section;
  }

  /**
   * Build AI analysis section
   * @param {Object} aiAnalysis - AI analysis result
   * @returns {string} Markdown section
   */
  static buildAIAnalysisSection(aiAnalysis) {
    let section = `## AI Analysis\n\n`;

    // Add provider info
    if (aiAnalysis.provider) {
      section += `**Provider:** ${aiAnalysis.provider}\n\n`;
    }

    if (aiAnalysis.model) {
      section += `**Model:** ${aiAnalysis.model}\n\n`;
    }

    // Add analysis result
    if (aiAnalysis.result) {
      section += `### Analysis\n\n`;

      if (typeof aiAnalysis.result === 'string') {
        section += aiAnalysis.result + '\n\n';
      } else if (aiAnalysis.result.summary) {
        section += aiAnalysis.result.summary + '\n\n';
      }

      // Add suggestions if available
      if (aiAnalysis.result.suggestions && aiAnalysis.result.suggestions.length > 0) {
        section += `### Suggestions\n\n`;
        aiAnalysis.result.suggestions.forEach((suggestion, index) => {
          section += `${index + 1}. ${suggestion}\n`;
        });
        section += '\n';
      }

      // Add test cases if available
      if (aiAnalysis.result.testCases && aiAnalysis.result.testCases.length > 0) {
        section += `### Recommended Test Cases\n\n`;
        aiAnalysis.result.testCases.forEach((testCase, index) => {
          section += `${index + 1}. ${testCase}\n`;
        });
        section += '\n';
      }

      // Add severity if available
      if (aiAnalysis.result.severity) {
        section += `**Severity:** ${aiAnalysis.result.severity}\n\n`;
      }

      // Add confidence if available
      if (aiAnalysis.result.confidence) {
        section += `**Confidence:** ${aiAnalysis.result.confidence}\n\n`;
      }
    }

    // Add raw analysis if needed
    if (aiAnalysis.rawAnalysis) {
      section += `### Raw Analysis\n\n`;
      section += `\`\`\`json\n${JSON.stringify(aiAnalysis.rawAnalysis, null, 2)}\n\`\`\`\n\n`;
    }

    return section;
  }

  /**
   * Truncate a string to a maximum length
   * @param {string} str - String to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated string
   */
  static truncateString(str, maxLength) {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '... (truncated)';
  }

  /**
   * Preview an issue without creating it
   * @param {Object} issueData - Issue data
   * @returns {Promise<Object>} Issue preview
   */
  static async previewIssue(issueData) {
    const issue = await this.buildIssue(issueData);
    
    // Calculate approximate body size
    const bodySize = new Blob([issue.body]).size;
    const bodySizeKB = (bodySize / 1024).toFixed(2);

    return {
      ...issue,
      metadata: {
        bodySizeBytes: bodySize,
        bodySizeKB: bodySizeKB,
        screenshotCount: issueData.screenshotIds?.length || 0,
        hasConsoleLogs: !!issueData.consoleLogId,
        hasElementData: !!issueData.elementData,
        hasAIAnalysis: !!issueData.aiAnalysis
      }
    };
  }

  /**
   * Validate issue data before building
   * @param {Object} issueData - Issue data to validate
   * @returns {Object} Validation result with isValid and errors
   */
  static validateIssueData(issueData) {
    const errors = [];

    if (!issueData.issueType) {
      errors.push('Issue type is required');
    }

    if (!issueData.description && !issueData.screenshotIds?.length) {
      errors.push('At least a description or screenshot is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
