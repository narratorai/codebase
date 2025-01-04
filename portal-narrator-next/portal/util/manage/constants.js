import _ from 'lodash'

export const ACTIVITY_STATUS_LIVE = 'live'
export const ACTIVITY_STATUS_IGNORED = 'ignored'
export const ACTIVITY_STATUSES = [ACTIVITY_STATUS_LIVE, ACTIVITY_STATUS_IGNORED]

////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////// FIXME - EVERYTHING BELOW IS DEPRECATED ////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////

////////// Activity Editor Constants //////////

export const ACTIVITY_STATUS_NEW = 'new'
export const ACTIVITY_SCRIPT_LIFECYCLE_PENDING = 'pending'
export const ACTIVITY_SCRIPT_LIFECYCLE_LIVE = 'live'
export const ACTIVITY_SCRIPT_LIFECYCLE_RETIRED = 'retired'
export const EDITABLE_STATUSES = [ACTIVITY_STATUS_LIVE, ACTIVITY_STATUS_IGNORED]

export const getActivityStatusOptions = () => {
  return _.map(EDITABLE_STATUSES, (status) => ({
    value: status,
    label: _.startCase(status),
  }))
}

////////// Script Editor Constants //////////

// Customer facing script types
export const SCRIPT_TYPE_STREAM = 'stream'
export const SCRIPT_TYPE_ENRICHMENT = 'enrichment'
export const SCRIPT_TYPE_CUSTOMER_ATTRIBUTE = 'customer_attribute'

// Customer facing script titles
export const VALID_SCRIPT_TYPES = {
  [SCRIPT_TYPE_STREAM]: {
    title: 'Activity Stream',
    description: 'These are scripts that generate activities to appear in your stream.',
  },
  [SCRIPT_TYPE_ENRICHMENT]: {
    title: 'Enrichment',
    description: '',
  },
  [SCRIPT_TYPE_CUSTOMER_ATTRIBUTE]: {
    title: 'Customer Attribute',
    description: '',
  },
}

// TODO Stop using these script types
// Raw scipt types
export const SCRIPT_TYPE_STREAM_TABLES = 'stream_tables'

export const CONFIGURABLE_COLUMNS = ['activity_id', 'ts', 'feature_1', 'feature_2', 'feature_3']

export const PROCESSING_METHODS = [
  {
    label: 'Regular',
    value: 'regular',
    description: 'Incremental updates and full reconciliation nightly',
    scriptTypes: [SCRIPT_TYPE_STREAM, SCRIPT_TYPE_ENRICHMENT],
  },
  {
    label: 'Critical',
    value: 'mutable',
    description:
      'Full reconciliation every 30 min used for data that is mission-critical or data that is updated non-chronologically',
    scriptTypes: [SCRIPT_TYPE_STREAM, SCRIPT_TYPE_ENRICHMENT],
  },
  {
    label: 'Immutable',
    value: 'computed',
    description: 'Preserves historical activity definitions on script updates',
    scriptTypes: [SCRIPT_TYPE_STREAM],
  },
  {
    label: 'One-time',
    value: 'manual',
    description: 'For one time updates that should not be run periodically',
    scriptTypes: [SCRIPT_TYPE_STREAM],
  },
]

// Processed Table Scripts
// CAN BE NULL, materialized_view, or mutable
export const SCRIPT_KIND_MATERIALIZED_VIEW = 'materialized_view'

// Note MAVIS's/manage column.kind === dataset's column.type
export const COLUMN_KIND_STRING = 'string'
export const COLUMN_KIND_TIMESTAMP = 'timestamp'
export const COLUMN_KIND_NUMBER = 'number'
export const COLUMN_KIND_REVENUE = 'revenue'
export const COLUMN_KIND_BOOLEAN = 'boolean'

export const STREAM_COLUMNS = [
  {
    name: 'activity_id',
    kind: 'string',
  },
  {
    name: 'ts',
    kind: 'timestamp',
  },
  {
    name: 'source',
    kind: 'string',
  },
  {
    name: 'source_id',
    kind: 'string',
  },
  {
    name: 'customer',
    kind: 'string',
  },
  {
    name: 'activity',
    kind: 'string',
  },
  {
    name: 'feature_1',
    kind: 'string',
  },
  {
    name: 'feature_2',
    kind: 'string',
  },
  {
    name: 'feature_3',
    kind: 'string',
  },
  {
    name: 'revenue_impact',
    kind: 'number',
  },
  {
    name: 'link',
    kind: 'string',
  },
]
