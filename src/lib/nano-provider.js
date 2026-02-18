/**
 * NanoProvider — Gemini Nano Prompt API wrapper
 * Primary on-device analysis engine for Shannon.
 *
 * Supports both API shapes:
 * - Shape 1: Origin trial / Chrome 127-137 (self.ai.languageModel)
 * - Shape 2: Finalized API / Chrome 138+ (LanguageModel global)
 *
 * Ported from the working generateAISummary() pattern in Duly Noted.
 */

const SESSION_IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

class NanoProvider {
  constructor() {
    this.session = null;
    this.available = null; // null = unchecked, true/false = checked
    this.apiShape = null; // 'global' | 'self.ai' | null
    this._idleTimer = null;
  }

  /**
   * Check if Gemini Nano is available on this device.
   * Supports both API shapes. Returns availability status string.
   *
   * @returns {Promise<{ available: boolean, status: string }>}
   *   status: 'available' | 'downloading' | 'unavailable'
   */
  async checkAvailability() {
    // Shape 2: Chrome 138+ (LanguageModel global)
    if (typeof LanguageModel !== 'undefined') {
      try {
        const availability = await LanguageModel.availability();
        this.available = (availability === 'available');
        this.apiShape = 'global';
        return { available: this.available, status: availability };
      } catch (e) {
        console.warn('[NanoProvider] LanguageModel.availability() failed:', e);
      }
    }

    // Shape 1: Origin trial (self.ai.languageModel)
    if (self.ai?.languageModel) {
      try {
        const capabilities = await self.ai.languageModel.capabilities();
        const status = capabilities.available === 'readily'
          ? 'available'
          : capabilities.available === 'after-download'
            ? 'downloading'
            : 'unavailable';
        this.available = (capabilities.available !== 'no');
        this.apiShape = 'self.ai';
        return { available: this.available, status };
      } catch (e) {
        console.warn('[NanoProvider] self.ai.languageModel.capabilities() failed:', e);
      }
    }

    this.available = false;
    this.apiShape = null;
    return { available: false, status: 'unavailable' };
  }

  /**
   * Create a session. Reuses existing session if alive.
   * @param {object} options - Session creation options
   */
  async getSession(options = {}) {
    if (this.session) {
      this._resetIdleTimer();
      return this.session;
    }

    if (this.available === null) {
      await this.checkAvailability();
    }

    if (!this.available) {
      throw new Error('Gemini Nano is not available on this device');
    }

    if (this.apiShape === 'global') {
      this.session = await LanguageModel.create({
        expectedInputs: options.expectedInputs || [{ type: 'image' }],
        ...options
      });
    } else if (this.apiShape === 'self.ai') {
      this.session = await self.ai.languageModel.create();
    } else {
      throw new Error('No supported Prompt API shape found');
    }

    this._resetIdleTimer();
    return this.session;
  }

  /**
   * Run a multimodal prompt with text + optional screenshot.
   * Converts base64 dataUrl to ImageBitmap (required by Prompt API).
   *
   * @param {string} textPrompt - The text portion of the prompt
   * @param {string|null} screenshotDataUrl - Base64 screenshot data URL, or null
   * @returns {Promise<string>} Raw response text from Nano
   */
  async prompt(textPrompt, screenshotDataUrl = null) {
    const session = await this.getSession();
    const parts = [];

    parts.push({ type: 'text', value: textPrompt });

    if (screenshotDataUrl) {
      try {
        const response = await fetch(screenshotDataUrl);
        const blob = await response.blob();
        const imageBitmap = await createImageBitmap(blob);
        parts.push({ type: 'image', value: imageBitmap });
      } catch (imgErr) {
        console.warn('[NanoProvider] Could not convert screenshot to ImageBitmap:', imgErr);
        // Continue without image — text-only analysis still useful
      }
    }

    this._resetIdleTimer();
    return await session.prompt(parts);
  }

  /**
   * Run a streaming multimodal prompt. Returns an async iterable.
   *
   * @param {string} textPrompt - The text portion of the prompt
   * @param {string|null} screenshotDataUrl - Base64 screenshot data URL, or null
   * @returns {Promise<AsyncIterable<string>>} Streaming response
   */
  async promptStreaming(textPrompt, screenshotDataUrl = null) {
    const session = await this.getSession();
    const parts = [];

    parts.push({ type: 'text', value: textPrompt });

    if (screenshotDataUrl) {
      try {
        const response = await fetch(screenshotDataUrl);
        const blob = await response.blob();
        const imageBitmap = await createImageBitmap(blob);
        parts.push({ type: 'image', value: imageBitmap });
      } catch (imgErr) {
        console.warn('[NanoProvider] Image conversion failed, text-only:', imgErr);
      }
    }

    this._resetIdleTimer();
    return session.promptStreaming(parts);
  }

  /**
   * Parse a JSON response from Nano, stripping markdown fences if present.
   * @param {string} raw - Raw response text
   * @returns {object|null} Parsed JSON or null on failure
   */
  static parseJSON(raw) {
    try {
      const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      console.warn('[NanoProvider] Failed to parse JSON from response:', raw?.slice(0, 200));
      return null;
    }
  }

  /**
   * Destroy session and free resources.
   */
  destroySession() {
    if (this._idleTimer) {
      clearTimeout(this._idleTimer);
      this._idleTimer = null;
    }
    if (this.session) {
      try {
        this.session.destroy();
      } catch (e) {
        console.warn('[NanoProvider] Error destroying session:', e);
      }
      this.session = null;
    }
  }

  /**
   * Reset the idle timer. Session auto-destroys after SESSION_IDLE_TIMEOUT.
   * @private
   */
  _resetIdleTimer() {
    if (this._idleTimer) clearTimeout(this._idleTimer);
    this._idleTimer = setTimeout(() => {
      console.log('[NanoProvider] Session idle timeout, destroying');
      this.destroySession();
    }, SESSION_IDLE_TIMEOUT);
  }
}

export default NanoProvider;
