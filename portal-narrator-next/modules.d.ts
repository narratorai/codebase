// Modules without types
declare module 'append-query'
declare module '@narratorai/theme'
declare module '@analytics/segment'

// SVG via @svgr/webpack
declare module '*.svg' {
  import { FC, SVGProps } from 'react'
  const _: FC<SVGProps<HTMLOrSVGElement> & { title?: string }>
  export = _
}
