export const TOPBAR_HEIGHT = 116
export const PROFILE_SIDEBAR_WIDTH = 344
export const CUSTOMER_JOURNEY_AS_SIDEBAR_WIDTH = 473

export const TOPBAR_Z_INDEX = 3
export const SIDEBAR_Z_INDEX = 2

export const GET_CUSTOMER_JOURNEY_LIMIT = 200

export const CUSTOMER_KIND_ANONYMOUS_ID = 'anonymous_customer_id'
export const CUSTOMER_KIND_CUSTOMER = 'customer'
export const CUSTOMER_KIND_JOIN_CUSTOMER = 'join_customer'

export const CUSTOMER_KIND_OPTIONS = [
  { key: CUSTOMER_KIND_CUSTOMER, label: 'Customer', value: CUSTOMER_KIND_CUSTOMER },
  { key: CUSTOMER_KIND_ANONYMOUS_ID, label: 'Anonymous Customer Id', value: CUSTOMER_KIND_ANONYMOUS_ID },
  {
    key: CUSTOMER_KIND_JOIN_CUSTOMER,
    label: 'COALESCE(Customer, Anonymous_customer_id)',
    value: CUSTOMER_KIND_JOIN_CUSTOMER,
  },
]
