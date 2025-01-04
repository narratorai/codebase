import { nanoid } from 'nanoid'

export const makeShortid = () => nanoid().replace(/-/g, '_')
