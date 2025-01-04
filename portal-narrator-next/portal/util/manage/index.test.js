import { makeMiniMapOpenOverrides } from './'
import script from '../../../test/fixtures/script.json'
import searchSchema from '../../../test/fixtures/searchSchema.json'

// Script Form creates an object that looks like this:
const scriptFormObject = {
  _enrichment_table: {
    table: 'mv_enriched_pages',
    column: 'enriched_activity_id',
  },
  kind: null,
  notes: '',
  query: {
    columns: [
      {
        definition: '',
        kind: 'string',
        label: 'Activity Id',
        name: 'activity_id',
      },
      {
        definition: "date_add ( 'minutes', -1, ts )",
        kind: 'timestamp',
        label: 'Ts',
        name: 'ts',
      },
      // Removing extra columns
    ],
    ctes: {},
    filters: "date_diff ( 'minutes', last_ts, s.ts ) >=30 or last_ts is null",
    group_by: null,
    has_source: true,
    having: null,
    is_aliasing: false,
    is_distinct: false,
    limit: null,
    order_by: null,
    override: false,
    raw_query:
      "select activity_id, date_add('minutes', -1, ts) as ts, source, source_id, customer, 'session' as activity, feature_1, feature_2, feature_3, revenue_impact, link\nfrom(\nselect activity_id, ts at time zone 'utc' as ts, source, source_id, customer, feature_1, feature_2, feature_3, revenue_impact, link,\n        lag(s.ts at time zone 'utc') over (partition by nvl(customer, source_id) order by ts) as last_ts\nfrom {schema}.{table} s\nwhere activity in ('page_view') and ts < DATE_ADD('hour', -1, SYSDATE::TIMESTAMP)\n)s\nwhere date_diff('minutes', last_ts, s.ts) >=30 or last_ts is null\n",
    tables: [
      {
        alias: 's',
        join_condition: null,
        joined_alias: [],
        kind: 'from',
        nested_object: {
          columns: [
            {
              definition: '',
              kind: 'string',
              label: 'Activity Id',
              name: 'activity_id',
            },
          ],
          ctes: {},
          filters: "activity in ( 'page_view' ) and ts < DATE_ADD ( 'hour', -1, SYSDATE::TIMESTAMP )",
          group_by: null,
          having: null,
          is_distinct: false,
          limit: null,
          order_by: null,
          tables: [
            {
              alias: 's',
              join_condition: null,
              joined_alias: [],
              kind: 'from',
              nested_object: null,
              schema: '{schema}',
              table: '{table}',
            },
          ],
          union: [],
        },
        schema: null,
        table: null,
      },
    ],
    union: [],
  },
  run_after_scripts: [
    'first_touch_attribution',
    'last_touch_attribution',
    'page_views_survey',
    'page_views_segment',
    'page_views_landing_page',
  ],
  slug: 'sessions',
  source: 'Activity Stream',
  source_notes: null,
  single_activity: true,
  stream_table: 'mv_activity_stream',
  created_by: 'fancy@pants.com',
}

describe('#makeMiniMapOpenOverrides', () => {
  it('creates openSchemasOverride and openTablesOverride', () => {
    expect(makeMiniMapOpenOverrides(searchSchema)).toMatchSnapshot()
  })
})
