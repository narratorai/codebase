export const DEFAULT_TITLE = 'Portal'

export function makeTitle(title: string | string[] | undefined) {
  if (Array.isArray(title)) {
    title = title.join(' | ')
  }
  return `${title || DEFAULT_TITLE} | Narrator`
}
