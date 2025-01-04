export const parseQueryValue = (query?: string | string[]) => (Array.isArray(query) ? query[0] : query)
