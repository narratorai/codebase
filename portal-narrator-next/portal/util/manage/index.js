import _ from 'lodash'

export {
  ACTIVITY_STATUSES,
  EDITABLE_STATUSES,
  ACTIVITY_STATUS_NEW,
  ACTIVITY_STATUS_LIVE,
  ACTIVITY_STATUS_IGNORED,
  ACTIVITY_SCRIPT_LIFECYCLE_RETIRED,
  ACTIVITY_SCRIPT_LIFECYCLE_LIVE,
  ACTIVITY_SCRIPT_LIFECYCLE_PENDING,
  getActivityStatusOptions,
  COLUMN_KIND_STRING,
  COLUMN_KIND_TIMESTAMP,
  COLUMN_KIND_NUMBER,
  COLUMN_KIND_REVENUE,
  COLUMN_KIND_BOOLEAN,
  CONFIGURABLE_COLUMNS,
  SCRIPT_TYPE_STREAM,
  SCRIPT_TYPE_ENRICHMENT,
  SCRIPT_TYPE_CUSTOMER_ATTRIBUTE,
  VALID_SCRIPT_TYPES,
  SCRIPT_TYPE_STREAM_TABLES,
  PROCESSING_METHODS,
} from './constants'

export {
  createInitialScriptsFormValue,
  getActivitiesGenerated,
  mergeQueryColumnLabelsIntoColumnOverrides,
} from './helpers'

/*
 * Traverse ElasicSearch query to find schemas and tables that should be open
 * in the MiniMap based on the highlight responses.
 * @param schemas - response from ElasticSearch search query
 */
export const makeMiniMapOpenOverrides = (schemas) => {
  let openTablesOverride = {}

  const openSchemasOverride = _.reduce(
    schemas,
    (result, searchObj) => {
      const selectedTables = _.get(searchObj, 'highlight["tables.table"]')
      const selectedColumns = _.get(searchObj, 'highlight["tables.columns.column"]')
      const parentSchema = _.get(searchObj, '_source.schema')

      if (selectedTables || selectedColumns) {
        result[parentSchema] = true
      }

      if (selectedColumns) {
        const tables = _.get(searchObj, '_source.tables')
        const openTables = _.filter(tables, (table) => {
          const tableColumns = _.map(table.columns, 'column')
          const truthies = _.map(selectedColumns, (column) => _.includes(tableColumns, column))
          return _.includes(truthies, true)
        })

        _.forEach(openTables, (tableObj) => {
          openTablesOverride[`${parentSchema}.${tableObj.table}`] = true
        })
      }
      return result
    },
    {}
  )

  return {
    openSchemasOverride,
    openTablesOverride,
  }
}
