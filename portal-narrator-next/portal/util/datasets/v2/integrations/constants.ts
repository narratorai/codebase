import { IIntegrationsConfig } from 'util/datasets/v2/integrations/interfaces'
import { IMaterialization_Type_Enum } from 'graph/generated'

export const INTEGRATION_TYPE_MATERIALIZED = IMaterialization_Type_Enum.MaterializedView
export const INTEGRATION_TYPE_VIEW = IMaterialization_Type_Enum.View
export const INTEGRATION_TYPE_SHEETS = IMaterialization_Type_Enum.Gsheets
export const INTEGRATION_TYPE_WEBHOOK = IMaterialization_Type_Enum.Webhook
export const INTEGRATION_TYPE_POSTMARK = IMaterialization_Type_Enum.Postmark
export const INTEGRATION_TYPE_CSV = IMaterialization_Type_Enum.Csv
export const INTEGRATION_TYPE_TEXT = IMaterialization_Type_Enum.Text
export const INTEGRATION_TYPE_KLAVIYO = IMaterialization_Type_Enum.Klaviyo

export const ALL_INTEGRATIONS: string[] = [
  INTEGRATION_TYPE_MATERIALIZED,
  INTEGRATION_TYPE_VIEW,
  INTEGRATION_TYPE_SHEETS,
  INTEGRATION_TYPE_WEBHOOK,
  INTEGRATION_TYPE_POSTMARK,
  INTEGRATION_TYPE_CSV,
  INTEGRATION_TYPE_TEXT,
  INTEGRATION_TYPE_KLAVIYO,
]

export const INTEGRATIONS_CONFIG: IIntegrationsConfig = {
  [INTEGRATION_TYPE_MATERIALIZED]: {
    displayName: 'Materialized View',
    description: 'Creates a table in your warehouse and updates according to your processing settings.',
  },
  [INTEGRATION_TYPE_VIEW]: {
    displayName: 'View',
    description: 'Creates a view in your warehouse.',
  },
  [INTEGRATION_TYPE_SHEETS]: {
    displayName: 'Google Sheet',
    description: 'Saves data to a google sheet of your choosing. Will only sync max 2000 rows per sheet.',
  },
  [INTEGRATION_TYPE_WEBHOOK]: {
    displayName: 'Webhook',
    description: 'Sends your dataset data to a custom URL.',
  },
  [INTEGRATION_TYPE_POSTMARK]: {
    displayName: 'Postmark',
    description: 'Sends your dataset data via Postmark.',
  },
  [INTEGRATION_TYPE_CSV]: {
    displayName: 'Email CSV',
    description: 'Sends CSV to a given email address.',
  },
  [INTEGRATION_TYPE_TEXT]: {
    displayName: 'Text (SMS)',
    description: 'Can only send max 40 rows of data via SMS.',
  },
  [INTEGRATION_TYPE_KLAVIYO]: {
    displayName: 'Klaviyo/Sendgrid',
    description: 'Send data to Klaviyo or Sendgrid.',
    disableParentGroup: true,
  },
}

export const WEBHOOK_BASIC_AUTH = 'basic_auth'
export const WEBHOOK_BEARER_AUTH = 'bearer_token'
export const WEBHOOK_CUSTOM_HEADERS_AUTH = 'custom_headers'
export const WEBHOOK_NO_AUTH = 'none'

export const COMPANY_ADMIN_INTEGRATION_TYPES: string[] = [
  INTEGRATION_TYPE_MATERIALIZED,
  INTEGRATION_TYPE_VIEW,
  INTEGRATION_TYPE_WEBHOOK,
]

// non company admins can only create/see these types of integrations
export const NON_COMPANY_ADMIN_INTEGRATION_TYPES = [INTEGRATION_TYPE_SHEETS, INTEGRATION_TYPE_CSV]

export const BI_LOOKER = 'looker'
export const BI_TABLEAU = 'tableau'
export const BI_METABASE = 'metabase'
export const BI_POWER_BI = 'powerbi'
export const BI_DATA_STUDIO = 'datastudio'
export const BI_DOMO = 'domo'
export const BI_OTHER = 'otherbi'

export const ALL_BI_OPTIONS = [BI_LOOKER, BI_TABLEAU, BI_METABASE, BI_POWER_BI, BI_DATA_STUDIO, BI_DOMO, BI_OTHER]
export const ALL_KNOWN_BI_OPTIONS = [BI_LOOKER, BI_TABLEAU, BI_METABASE, BI_POWER_BI, BI_DATA_STUDIO, BI_DOMO]
