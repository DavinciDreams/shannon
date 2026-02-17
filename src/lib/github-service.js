/**
 * GitHub API Service
 * Provides wrappers for GitHub REST and GraphQL APIs
 */

import { GitHubOAuth } from './github-oauth.js';
import { GitHubCache } from './github-cache.js';

const GITHUB_API_URL = 'https://api.github.com';

export class GitHubService {
  /**
   * Make an authenticated API request to GitHub
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} API response
   */
  static async apiRequest(endpoint, options = {}) {
    const token = await GitHubOAuth.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated with GitHub');
    }

    const url = endpoint.startsWith('http') ? endpoint : `${GITHUB_API_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `GitHub API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Make a GraphQL query to GitHub
   * @param {string} query - GraphQL query
   * @param {Object} variables - Query variables
   * @returns {Promise<Object>} Query result
   */
  static async graphqlRequest(query, variables = {}) {
    const token = await GitHubOAuth.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated with GitHub');
    }

    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    return result.data;
  }

  /**
   * Get authenticated user information
   * @returns {Promise<Object>} User data
   */
  static async getUser() {
    return this.apiRequest('/user');
  }

  /**
   * Fetch all repositories for the authenticated user
   * Uses cache if available and not expired
   * @param {boolean} forceRefresh - Force refresh from API
   * @returns {Promise<Array>} List of repositories
   */
  static async fetchRepositories(forceRefresh = false) {
    // Check cache first
    if (!forceRefresh) {
      const cached = await GitHubCache.getRepositories();
      if (cached) {
        console.log('[GitHubService] Using cached repositories');
        return cached;
      }
    }

    console.log('[GitHubService] Fetching repositories from API');
    const repos = await this.apiRequest('/user/repos?per_page=100&sort=updated');

    // Cache the results
    await GitHubCache.cacheRepositories(repos);

    return repos;
  }

  /**
   * Fetch all projects for the authenticated user (using GraphQL)
   * @param {boolean} forceRefresh - Force refresh from API
   * @returns {Promise<Array>} List of projects
   */
  static async fetchProjects(forceRefresh = false) {
    // Check cache first
    if (!forceRefresh) {
      const cached = await GitHubCache.getProjects();
      if (cached) {
        console.log('[GitHubService] Using cached projects');
        return cached;
      }
    }

    console.log('[GitHubService] Fetching projects from API');

    const query = `
      query {
        viewer {
          projectsV2(first: 100, orderBy: {field: UPDATED_AT, direction: DESC}) {
            nodes {
              id
              title
              url
              shortDescription
              public
            }
          }
        }
      }
    `;

    const data = await this.graphqlRequest(query);
    const projects = data.viewer.projectsV2.nodes.map(project => ({
      id: project.id,
      title: project.title,
      url: project.url,
      description: project.shortDescription,
      public: project.public,
      owner: 'user' // Personal projects
    }));

    // Cache the results
    await GitHubCache.cacheProjects(projects);

    return projects;
  }

  /**
   * Get labels for a specific repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Array>} List of labels
   */
  static async getRepoLabels(owner, repo) {
    return this.apiRequest(`/repos/${owner}/${repo}/labels`);
  }

  /**
   * Get milestones for a specific repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Array>} List of milestones
   */
  static async getRepoMilestones(owner, repo) {
    return this.apiRequest(`/repos/${owner}/${repo}/milestones`);
  }

  /**
   * Get assignable users (collaborators) for a repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Array>} List of assignable users
   */
  static async getRepoAssignees(owner, repo) {
    return this.apiRequest(`/repos/${owner}/${repo}/assignees`);
  }

  /**
   * Create a new issue in a repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {Object} issueData - Issue data
   * @param {string} issueData.title - Issue title
   * @param {string} issueData.body - Issue body (markdown)
   * @param {string[]} issueData.labels - Label names
   * @param {string[]} issueData.assignees - Assignee usernames
   * @param {number} issueData.milestone - Milestone number
   * @returns {Promise<Object>} Created issue
   */
  static async createIssue(owner, repo, issueData) {
    console.log(`[GitHubService] Creating issue in ${owner}/${repo}`);

    const issue = await this.apiRequest(`/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      body: JSON.stringify(issueData)
    });

    // Add repository to recently used
    await GitHubCache.addRecentlyUsedRepo(`${owner}/${repo}`);

    return issue;
  }

  /**
   * Create a draft issue in a GitHub Project v2
   * @param {string} projectId - Project ID
   * @param {Object} itemData - Draft issue data
   * @param {string} itemData.title - Issue title
   * @param {string} itemData.body - Issue body (markdown)
   * @returns {Promise<Object>} Created draft issue
   */
  static async createProjectDraftIssue(projectId, itemData) {
    console.log(`[GitHubService] Creating draft issue in project ${projectId}`);

    const mutation = `
      mutation($projectId: ID!, $title: String!, $body: String) {
        addProjectV2DraftIssue(input: {
          projectId: $projectId,
          title: $title,
          body: $body
        }) {
          projectItem {
            id
            content {
              ... on DraftIssue {
                title
                body
              }
            }
          }
        }
      }
    `;

    const data = await this.graphqlRequest(mutation, {
      projectId,
      title: itemData.title,
      body: itemData.body
    });

    // Add project to recently used
    await GitHubCache.addRecentlyUsedProject(projectId);

    return data.addProjectV2DraftIssue.projectItem;
  }

  /**
   * Search repositories by name
   * @param {string} query - Search query
   * @param {Array} repositories - Repository list to search within
   * @returns {Array} Filtered repositories
   */
  static searchRepositories(query, repositories) {
    if (!query) return repositories;

    const lowerQuery = query.toLowerCase();
    return repositories.filter(repo =>
      repo.full_name.toLowerCase().includes(lowerQuery) ||
      repo.name.toLowerCase().includes(lowerQuery) ||
      (repo.description && repo.description.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Search projects by name
   * @param {string} query - Search query
   * @param {Array} projects - Project list to search within
   * @returns {Array} Filtered projects
   */
  static searchProjects(query, projects) {
    if (!query) return projects;

    const lowerQuery = query.toLowerCase();
    return projects.filter(project =>
      project.title.toLowerCase().includes(lowerQuery) ||
      (project.description && project.description.toLowerCase().includes(lowerQuery))
    );
  }

  // ============================================================================
  // Screenshot Support Methods
  // ============================================================================

  /**
   * Convert a data URL to base64 string (without the data:image/...;base64, prefix)
   * @param {string} dataUrl - Data URL string
   * @returns {string} Base64 string
   */
  static dataUrlToBase64(dataUrl) {
    const matches = dataUrl.match(/^data:(.+?);base64,(.+)$/);
    if (matches && matches.length === 3) {
      return matches[2];
    }
    return dataUrl;
  }

  /**
   * Convert a base64 string to data URL
   * @param {string} base64 - Base64 string
   * @param {string} mimeType - MIME type (e.g., 'image/png')
   * @returns {string} Data URL
   */
  static base64ToDataUrl(base64, mimeType = 'image/png') {
    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * Get the MIME type from a data URL
   * @param {string} dataUrl - Data URL string
   * @returns {string|null} MIME type or null
   */
  static getMimeTypeFromDataUrl(dataUrl) {
    const matches = dataUrl.match(/^data:(.+?);base64,/);
    return matches ? matches[1] : null;
  }

  /**
   * Format a screenshot for inclusion in a GitHub issue body
   * @param {Object} screenshot - Screenshot object with dataUrl and metadata
   * @param {number} index - Screenshot index for numbering
   * @returns {string} Markdown formatted screenshot
   */
  static formatScreenshotForIssue(screenshot, index = 1) {
    const timestamp = new Date(screenshot.timestamp).toLocaleString();
    
    let markdown = `### Screenshot ${index}\n\n`;
    
    // Embed image as markdown
    markdown += `![Screenshot ${index}](${screenshot.dataUrl})\n\n`;
    
    // Add metadata
    markdown += `**Type:** ${screenshot.type === 'element' ? 'Element' : 'Full Page'}  \n`;
    markdown += `**Captured:** ${timestamp}  \n`;
    
    if (screenshot.type === 'element' && screenshot.element) {
      markdown += `**Element:** \`${screenshot.element.tagName}\`  \n`;
      if (screenshot.element.className) {
        markdown += `**Class:** \`${screenshot.element.className}\`  \n`;
      }
      if (screenshot.element.idAttribute) {
        markdown += `**ID:** \`${screenshot.element.idAttribute}\`  \n`;
      }
    }
    
    return markdown;
  }

  /**
   * Create a GitHub gist with screenshots (alternative hosting method)
   * Note: This is an advanced feature for when data URIs are too large for issue bodies
   * @param {Array} screenshots - Array of screenshot objects
   * @param {Object} options - Gist options
   * @param {string} options.description - Gist description
   * @param {boolean} options.public - Whether gist is public (default: false)
   * @returns {Promise<Object>} Created gist data
   */
  static async createScreenshotGist(screenshots, options = {}) {
    const { description = 'Screenshots for issue', public: isPublic = false } = options;
    
    const files = {};
    
    screenshots.forEach((screenshot, index) => {
      const base64 = this.dataUrlToBase64(screenshot.dataUrl);
      const extension = this.getExtensionFromMimeType(this.getMimeTypeFromDataUrl(screenshot.dataUrl));
      const filename = `screenshot-${index + 1}.${extension}`;
      
      files[filename] = {
        content: base64
      };
    });

    const gist = await this.apiRequest('/gists', {
      method: 'POST',
      body: JSON.stringify({
        description,
        public: isPublic,
        files
      })
    });

    return gist;
  }

  /**
   * Get file extension from MIME type
   * @param {string} mimeType - MIME type
   * @returns {string} File extension
   */
  static getExtensionFromMimeType(mimeType) {
    const extensions = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg'
    };
    return extensions[mimeType] || 'png';
  }

  /**
   * Check if an issue body with screenshots is too large for GitHub
   * GitHub has a limit of ~65535 characters for issue bodies
   * @param {string} body - Issue body content
   * @returns {Object} Size information with isTooLarge flag
   */
  static checkIssueBodySize(body) {
    const size = body.length;
    const maxSize = 65535; // GitHub's approximate limit
    const sizeKB = (size / 1024).toFixed(2);
    
    return {
      size,
      sizeKB,
      maxSize,
      isTooLarge: size > maxSize,
      remainingChars: maxSize - size,
      percentageUsed: ((size / maxSize) * 100).toFixed(2)
    };
  }

  /**
   * Optimize screenshots for GitHub issues by resizing or compressing
   * @param {string} dataUrl - Original screenshot data URL
   * @param {Object} options - Optimization options
   * @param {number} options.maxWidth - Maximum width in pixels (default: 1920)
   * @param {number} options.quality - JPEG quality 0-100 (default: 85)
   * @param {string} options.format - Output format 'png' or 'jpeg' (default: 'jpeg')
   * @returns {Promise<string>} Optimized data URL
   */
  static async optimizeScreenshot(dataUrl, options = {}) {
    const { maxWidth = 1920, quality = 85, format = 'jpeg' } = options;
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Scale down if too wide
        if (width > maxWidth) {
          const scale = maxWidth / width;
          width = maxWidth;
          height = height * scale;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to optimized format
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const optimizedDataUrl = canvas.toDataURL(mimeType, quality / 100);
        
        resolve(optimizedDataUrl);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
    });
  }

  /**
   * Upload screenshots to a CDN or image hosting service
   * This is a placeholder for implementing custom image hosting
   * @param {Array} screenshots - Array of screenshot objects
   * @returns {Promise<Array>} Array of uploaded image URLs
   */
  static async uploadScreenshotsToCDN(screenshots) {
    // This is a placeholder implementation
    // In production, you would integrate with a service like:
    // - Imgur API
    // - Cloudinary
    // - AWS S3
    // - GitHub Pages
    // - Or your own image hosting service
    
    console.log('[GitHubService] Screenshot CDN upload not implemented');
    
    // For now, return the original data URLs
    return screenshots.map(s => s.dataUrl);
  }
}
