//////// PORTAL SPECIFIC PLUGIN TYPES: ////////
// - Override default ({ payload }) types in custom plugin definitions

export interface IdentifyPluginPayload {
  userId: string
  meta: any
  type: string
  traits: any
  // Portal specific options type:
  options: {
    user: any
    ldFlags: {
      [key: string]: boolean | string | number
    }
    companySlug?: string
  }
}

export interface TrackPluginPayload {
  anonymousId: string
  meta: any
  options: any
  event: string
  properties: any
}
