import { DatacenterRegion } from '@/util/mavisClient'

export enum Color {
  Transparent = 'transparent',
  White = 'white',
  Slate = 'slate',
  Gray = 'gray',
  Zinc = 'zinc',
  Neutral = 'neutral',
  Stone = 'stone',
  Red = 'red',
  Orange = 'orange',
  Amber = 'amber',
  Yellow = 'yellow',
  Lime = 'lime',
  Green = 'green',
  Emerald = 'emerald',
  Teal = 'teal',
  Cyan = 'cyan',
  Sky = 'sky',
  Blue = 'blue',
  Indigo = 'indigo',
  Violet = 'violet',
  Purple = 'purple',
  Fuchsia = 'fuchsia',
  Pink = 'pink',
  Rose = 'rose',
}

export enum CompanyStatus {
  Active = 'active',
  Archived = 'archived',
  MissingPayment = 'missing_payment',
  New = 'new',
  Onboarding = 'onboarding',
}

export interface IRemoteCompanyTeam {
  color: Color
  id: string
  name: string
}

export interface IRemoteCompanyTag {
  color: Color
  id: string
  tag: string
}

export interface IRemoteCompanyUser {
  avatarUrl: string | null
  email: string
  firstName: string | null
  id: string
  lastName: string | null
  userId: string
}

export interface IRemoteCompany {
  batchHalt: boolean
  createdAt: string
  currency: string
  datacenterRegion: DatacenterRegion
  id: string
  locale: string
  logoUrl: string | null
  name: string
  productionSchema: string
  slug: string
  status: CompanyStatus
  tags: IRemoteCompanyTag[]
  teams: IRemoteCompanyTeam[]
  /**
   * TODO:
   *
   * Our time formatters respect the ES Intl.ResolvedDateTimeFormatOptions
   * interface which assumes property "timeZone".
   *
   * Therefore, the value in the "timezone" ends up being ignored,
   * causing the incorrect formatting.
   *
   * We have several ways to solve this:
   * - update "timezone" to "timeZone" on the BE endpoint,
   * - keep the current transformation in the store that copies value from "timezone" to "timeZone",
   * - adjust formatters to use "timezone" instead of "timeZone".
   */
  timezone: string
  updatedAt: string
  users: IRemoteCompanyUser[]
  warehouseLanguage: string | null
}

export interface IRemoteCreateCompany {
  name: string
  region: DatacenterRegion
}

export interface IRemoteCreateCompanyResponse {
  apiKey: string
  id: string
  slug: string
}

export interface ICompany extends IRemoteCompany {
  /** Get the model from the server */
  get: (id: string) => Promise<IRemoteCompany>

  /** Reset the state */
  reset: () => void

  /** Set attributes on the model */
  set: (attributes: Partial<IRemoteCompany>) => void

  timeZone: string
}
