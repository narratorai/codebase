export interface IIntegrationsConfig {
  [key: string]: {
    displayName: string
    description?: string
    disableParentGroup?: boolean
  }
}

export type BiToolType = 'looker' | 'tableau' | 'metabase' | 'powerbi' | 'datastudio' | 'domo' | 'otherbi'
