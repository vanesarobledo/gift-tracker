/**
 * Only allow http(s) links as hrefs. Vue doesn't sanitize URLs, so a
 * `javascript:` link in an imported file would otherwise run when clicked.
 * See https://vuejs.org/guide/best-practices/security#potential-dangers
 */
export function safeHref(link: string | undefined): string | undefined {
  if (!link) return undefined
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(link) ? link : `https://${link}`
  try {
    const url = new URL(withScheme)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined
  } catch {
    return undefined
  }
}

/** Short label for a link, e.g. "amazon.ca". */
export function linkLabel(link: string): string {
  const href = safeHref(link)
  if (!href) return link
  return new URL(href).hostname.replace(/^www\./, '')
}
