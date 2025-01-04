import ErrorStackParser from 'error-stack-parser'
import pino from 'pino'

import { isDev } from './env'

const level = (process.env.LOG_LEVEL as string) || (isDev ? 'debug' : 'info')
const levelToReadable = (label: string, _: number) => ({ level: label })
const transport = isDev
  ? {
      options: {
        colorize: true,
        colorizeObjects: true,
      },
      target: 'pino-pretty',
    }
  : undefined

const logger = pino({
  base: {
    env: process.env.NODE_ENV,
    revision: process.env.GITHUB_SHA || process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_HASH,
  },
  browser: {
    asObject: true,
    formatters: {
      level: levelToReadable,
    },
  },
  formatters: {
    level: levelToReadable,
  },
  level,
  name: 'portal',
  redact: ['req.rawHeaders', 'req.cookies', 'req.query.code', 'req.query.state', 'res.headers'],
  timestamp: pino.stdTimeFunctions.isoTime,
  transport,
})

export const getLogger = (bindings?: pino.Bindings) => {
  const stack = ErrorStackParser.parse(new Error())
  const caller = stack[1] // Reference to the caller of this function
  const src = caller.fileName?.split('./')[1]

  return logger.child({ ...bindings, src })
}

export default logger
