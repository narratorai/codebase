import _ from 'lodash'

import {
  TIME_SEGMENT_METRIC_KEY_OVERALL,
  TIME_SEGMENT_METRIC_KEY_LAST_MONTH,
  TIME_SEGMENT_METRIC_KEY_MONTH,
} from 'util/metrics/constants'

import {
  COLUMN_KIND_STRING,
  COLUMN_KIND_TIMESTAMP,
  COLUMN_KIND_NUMBER,
  COLUMN_KIND_REVENUE,
  COLUMN_KIND_BOOLEAN,
} from 'util/manage'

export const mockCustomerTable = {
  name: 'people',
  label: 'People',
  identifier: 'Email',
  stream_table: 'people_stream',
}

export const mockCompany = {
  id: 'testId',
  slug: 'test-co',
  s3_bucket: 'test-bucket',
  default_customer_table: mockCustomerTable,
  customer_tables: [mockCustomerTable],
}

export const mockActivity = {
  id: '0e69637d-794e-4670-947d-2b68fe1f86f6',
  slug: 'test-slug',
  name: 'Test Activity Name',
  kind: 'funnel',
  level: 10,
  is_key: false,
  description: 'A test was created in the google sheet ',
  scripts: [{ slug: 'test-script-slug' }],
  metrics: {
    all: {
      total_events: {
        data: {
          [TIME_SEGMENT_METRIC_KEY_OVERALL]: 627521,
          [TIME_SEGMENT_METRIC_KEY_MONTH]: 2345,
          [TIME_SEGMENT_METRIC_KEY_LAST_MONTH]: 13004,
        },
      },
    },
  },
}

export const mockScriptWithColumns = {
  id: 'xyz098',
  file: {
    slug: 'test-script-slug',
    kind: null,
    source: 'Google Sheet',
    source_notes: null,
    directory_type: 'stream_tables',
    sql:
      "SELECT\n\t s._row AS  activity_id\n\t , s.activity_at::timestamp AS  ts\n\t , NULL ::VARCHAR(255) source\n\t , NULL ::VARCHAR(255) source_id\n\t , s.customer AS  customer\n\t , s.activity AS  activity\n\t , s.value AS  feature_1\n\t , s.detail::varchar ( 255 ) AS  feature_2\n\t , s.sales_person AS  feature_3\n\t , NULL ::FLOAT revenue_impact\n\t , 'https://docs.google.com/spreadsheets/d/1-xvvf0vb-qwgj_bo_xp8fdabhvsb5tp4ub4lw5uecv0/edit#gid=1143345181' AS  link\nFROM gsheets.activity AS s",
    tables: [
      {
        table: 'activity',
        schema: 'gsheets',
        alias: 's',
        join_condition: null,
        joined_alias: [],
        kind: 'from',
        nested_object: null,
      },
    ],
    enrichment: {},
    column_overrides: [
      {
        kind: 'string',
        name: 'activity_id',
        label: 'Row',
      },
      {
        kind: 'timestamp',
        name: 'ts',
        label: 'Activity At',
      },
      {
        kind: 'string',
        name: 'source',
      },
      {
        kind: 'string',
        name: 'source_id',
      },
      {
        kind: 'string',
        name: 'customer',
      },
      {
        kind: 'string',
        name: 'activity',
      },
      {
        kind: 'string',
        name: 'feature_1',
        label: 'Value',
      },
      {
        kind: 'string',
        name: 'feature_2',
        label: 'Detail',
      },
      {
        kind: 'string',
        name: 'feature_3',
        label: 'Sales Person',
      },
      {
        kind: 'number',
        name: 'revenue_impact',
      },
      {
        kind: 'string',
        name: 'link',
      },
    ],
    columns: [
      {
        name: 'activity_id',
        definition: 's._row',
        label: ' Row',
        kind: 'string',
      },
      {
        name: 'ts',
        definition: 's.activity_at::timestamp',
        label: 'Activity At',
        kind: 'timestamp',
      },
      {
        name: 'source',
        definition: null,
        label: 'Source',
        kind: 'string',
      },
      {
        name: 'source_id',
        definition: null,
        label: 'Source Id',
        kind: 'string',
      },
      {
        name: 'customer',
        definition: 's.customer',
        label: 'Customer',
        kind: 'string',
      },
      {
        name: 'activity',
        definition: 's.activity',
        label: 'Activity',
        kind: 'string',
      },
      {
        name: 'feature_1',
        definition: 's.value',
        label: 'Value',
        kind: 'string',
      },
      {
        name: 'feature_2',
        definition: 's.detail::varchar ( 255 )',
        label: 'Detail',
        kind: 'string',
      },
      {
        name: 'feature_3',
        definition: 's.sales_person',
        label: 'Sales Person',
        kind: 'string',
      },
      {
        name: 'revenue_impact',
        definition: null,
        label: 'Revenue Impact',
        kind: 'revenue',
      },
      {
        name: 'link',
        definition:
          "'https://docs.google.com/spreadsheets/d/1-xvvf0vb-qwgj_bo_xp8fdabhvsb5tp4ub4lw5uecv0/edit#gid=1143345181'",
        label: 'Google',
        kind: 'string',
      },
    ],
    stream_table: 'mv_activity_stream',
    run_after_scripts: [],
    single_activity: false,
    created_by: 'ahmed@narrator.ai',
    notes: '',
  },
  activities: [
    {
      slug: 'closed_lost',
      first_seen: '2018-07-10 11:21:24-04:00',
    },
    {
      slug: 'phone_call',
      first_seen: '2018-07-04 17:06:23-04:00',
    },
    {
      slug: 'demo_started',
      first_seen: '2018-07-23 16:30:02-04:00',
    },
    {
      slug: 'transformations_completed',
      first_seen: '2018-08-12 20:30:48-04:00',
    },
    {
      slug: 'lead_created',
      first_seen: '2018-07-04 17:06:19-04:00',
    },
    {
      slug: 'held_meeting',
      first_seen: '2018-07-10 15:04:00-04:00',
    },
    {
      slug: 'test-slug',
      first_seen: '2018-07-05 17:07:03-04:00',
    },
  ],
}

export const mockScript = {
  id: 'def567',
  file: {
    slug: 'create_activity',
    source: 'Internal DB',
    source_notes: null,
    directory_type: 'stream_tables',
    sql:
      "\n\t\t\t\tSELECT \n\t\t\t\t\ta.id as activity_id,\na.created_at AT TIME ZONE 'UTC'  as ts,\nNULL as source,\nNULL as source_id,\nlower((SELECT u.email FROM api_db_public.users u order by u.created_at limit 1)) as customer,\n'create_activity' as activity,\na.slug as feature_1,\nc.slug as feature_2,\nNULL as feature_3,\nNULL::FLOAT as revenue_impact,\n'https://portal.narrator.ai/activities/s/' ||a.slug as link\n\t\t\t\tFROM api_db_public.activities a\nJOIN api_db_public.companies c \non (c.id = a.company_id)\nwhere a.deleted_at is null\n\t\t\t",
    tables: [
      {
        table: 'api_db_public.activities',
        alias: 'a',
      },
      {
        table: 'api_db_public.companies',
        alias: 'c',
      },
    ],
    enrichment: [],
    stream_table: 'mv_activity_stream',
  },
  activities: [
    {
      slug: 'session',
    },
  ],
}

export const mockDataset = {
  id: 'c022ad83-1580-4684-8bda-8a9085bf867f',
  slug: 'first_touch_by_email_rebuild',
  name: 'First Touch By Email',
  description: '',
  category_name: 'Testing',
  created_at: '2019-01-29T17:03:56.881Z',
  save_to_warehouse: true,
  is_temp: false,
  updated_at: '2019-01-31T18:36:37.975Z',
}

export const mockReport = {
  id: '504baeb3-b9d3-47ce-810f-f2dcfc48a8ab',
  slug: 'daily_report',
  name: 'Daily Report',
  crontab: '0 8 * * *',
  category: null,
  owner: {
    id: '5d8fd6f3-b5d9-42fd-a04a-7ecaa8883aa1',
    email: 'ahmed@narrator.ai',
    deleted_at: null,
    created_at: '2017-12-22T18:43:45.466Z',
    updated_at: '2018-06-25T13:40:14.072Z',
    super_admin: true,
    phone: '13478190072',
    first_name: 'Ahmed',
    last_name: 'Elsamadisi',
    title: 'Founder, CEO',
    product_user_type: 'director',
    api_admin: true,
  },
  company: {
    id: 'ee522f92-1ae3-41f4-80f4-c936711f21d8',
    slug: 'narratorai',
    name: 'Narrator AI',
  },
  report_metrics: [
    {
      id: '4f2ba610-1a4e-49a8-a2d2-ad0e7ab93864',
      display_order: 1,
      updated_at: '2018-07-01T22:58:52.659Z',
      reportable_type: 'Dataset',
      time_segmentation: '',
      report_distributions: [],
      metric_names: ['total_activities'],
      metric_labels: ['Total Activities'],
      reportable: {},
    },
  ],
  followers: [
    {
      id: '6dffeb2d-7b2f-4694-90e0-942a2a960b84',
      kind: 'text',
      email: 'george@narrator.ai',
      phone: '18142800007',
      sftp_prefix: '',
      sftp_folder: '',
      google_sheet_key: '',
    },
  ],
}

export const mockMetric = {
  total_customers: {
    time: {
      day: {
        x: ['2018-02-25', '2018-02-26', '2018-02-27'],
        y: [68, 70, 30],
      },
      week: {
        x: ['2017-07-31', '2017-08-07', '2017-08-14'],
        y: [242, 305, 22],
      },
      month: {
        x: ['2017-08-01', '2017-09-01', '2017-10-01'],
        y: [1130, 1056, 17],
      },
    },
  },
}

export const mockPathMetrics = {
  all: {
    ...mockMetric,
    customer_conversion_rate: {
      time: {
        day: {
          x: ['2018-02-25', '2018-02-26', '2018-02-27'],
          y: [0.68, 0.7, 0.3],
        },
        week: {
          x: ['2017-07-31', '2017-08-07', '2017-08-14'],
          y: [0.242, 0.305, 0.22],
        },
        month: {
          x: ['2017-08-01', '2017-09-01', '2017-10-01'],
          y: [0.113, 0.1056, 0.17],
        },
      },
    },
  },
}

//////////////// Dynamic Config EXAMPLES (configuration.tableDefinitions) //////////////////////

export const mockCustomerColumnDefinitions = [
  {
    column_name: 'first_name',
    ordinal_position: 7,
    data_type: COLUMN_KIND_STRING,
    len: 600,
  },
  {
    column_name: 'status',
    ordinal_position: 6,
    data_type: COLUMN_KIND_NUMBER,
    len: 32,
  },
  {
    column_name: 'email',
    ordinal_position: 1,
    data_type: COLUMN_KIND_STRING,
    len: null,
  },
]

export const mockActivityColumnDefinitions = [
  {
    column_name: 'ts',
    ordinal_position: 4,
    data_type: COLUMN_KIND_TIMESTAMP,
    len: null,
  },
  {
    column_name: 'customer',
    ordinal_position: 7,
    data_type: COLUMN_KIND_STRING,
    len: 256,
  },
  {
    column_name: 'activity',
    ordinal_position: 9,
    data_type: COLUMN_KIND_STRING,
    len: 256,
  },
  {
    column_name: 'feature_1',
    ordinal_position: 10,
    data_type: COLUMN_KIND_STRING,
    len: 256,
  },
  {
    column_name: 'feature_2',
    ordinal_position: 11,
    data_type: COLUMN_KIND_STRING,
    len: 256,
  },
  {
    column_name: 'revenue_impact',
    ordinal_position: 14,
    data_type: COLUMN_KIND_NUMBER,
    len: 53,
  },
]

export const mockTable = {
  customer_table: 'people',
  customer_label: 'People',
  identifier: 'Email',
  activity_stream: 'mv_activity_stream',
}

export const defaultStore = {
  user: {
    auth: {
      token: 'test-token',
    },
    info: {
      entities: {
        companies: {
          [mockCompany.id]: _.omit(mockCompany, ['default_customer_table', 'customer_tables']),
        },
      },
      data: {
        email: 'tester@test.com',
      },
    },
    filters: {},
  },
  company: {
    loaded: true,
    data: _.omit(mockCompany, ['default_customer_table', 'customer_tables']),
  },
  router: {
    location: {
      pathname: `/${mockCompany.slug}`,
    },
  },
  configuration: {
    config: {
      tables: [mockTable],
    },
  },
}
