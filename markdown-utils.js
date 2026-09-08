(function initializeMarkdownUtils(root) {
  /**
   * Normalize pasted or loaded Markdown before rendering it.
   * This function has no browser dependencies, so it can be unit tested in Node.js.
   */
  function cleanMarkdownText(text) {
    if (!text) return '';

    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // These control-code ranges are intentional input-sanitization targets.
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '');
  }

  /** Calculate the values displayed in the document statistics bar. */
  function calculateStats(content) {
    const chars = content.length;

    return {
      chars,
      lines: content ? content.split('\n').length : 0,
      minutes: Math.max(1, Math.ceil(chars / 500)),
    };
  }

  root.MarkdownUtils = Object.freeze({
    calculateStats,
    cleanMarkdownText,
  });
})(globalThis);
