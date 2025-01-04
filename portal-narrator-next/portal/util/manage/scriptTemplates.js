import { SCRIPT_TYPE_STREAM, SCRIPT_TYPE_ENRICHMENT, SCRIPT_TYPE_CUSTOMER_ATTRIBUTE } from './constants'

const STREAM_TEMPLATE = `SELECT
     unique_identifier AS "activity_id"
     , immutable_time  AS "ts"
     , NULL AS "source"
     , NULL AS "source_id"
     , global_identifier AS "customer"
     , 'activity_name'  AS "activity"
     , NULL AS "feature_1"
     , NULL AS "feature_2"
     , NULL AS "feature_3"
     , NULL AS "revenue_impact"
     , NULL AS "link"
FROM `

const ENRICHMENT_TEMPLATE = `SELECT
     unique_identifier AS "enriched_activity_id"
     , immutable_time  AS "enriched_ts"
     , feature_n AS feature_name


FROM `

const CUSTOMER_TEMPLATE = `SELECT
     global_customer_identifier AS "customer"
     , customer_attribute_n AS attribute_name
     
     
FROM `

export const getScriptTemplateForType = (type) => {
  if (type === SCRIPT_TYPE_STREAM) {
    return STREAM_TEMPLATE
  }
  if (type === SCRIPT_TYPE_ENRICHMENT) {
    return ENRICHMENT_TEMPLATE
  }
  if (type === SCRIPT_TYPE_CUSTOMER_ATTRIBUTE) {
    return CUSTOMER_TEMPLATE
  }
}
