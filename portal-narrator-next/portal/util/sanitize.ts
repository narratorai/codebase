import _ from 'lodash'
import DOMPurify from 'isomorphic-dompurify'

/**
 * Runs text through DOMPurify for sanitization
 * This is useful anywhere we pass HTML content through dangeouslySetInnerHTML, but is not fool proof!
 *
 * For more details:
 * - https://github.com/cure53/DOMPurify
 * - https://github.com/cure53/DOMPurify/wiki/Security-Goals-&-Threat-Model
 * - https://pragmaticwebsecurity.com/articles/spasecurity/react-xss-part2.html
 */

const sanitize = _.memoize((text: string): string =>
  // nosemgrep: javascript.dompurify.harden-dompurify-usage
  DOMPurify.sanitize(text, {
    USE_PROFILES: { html: true },
    // Extend https://github.com/cure53/DOMPurify/wiki/Default-TAGs-ATTRIBUTEs-allow-list-&-blocklist#html-tags
    FORBID_TAGS: ['html', 'body', 'head', 'style', 'main', 'nav', 'section', 'audio', 'canvas', 'dialog', 'form'],
    RETURN_DOM: false,
  })
)

export default sanitize
