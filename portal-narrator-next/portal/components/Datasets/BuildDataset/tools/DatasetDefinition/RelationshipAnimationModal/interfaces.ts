export type ActivityPuzzlePieceType = 'cohort' | 'append' | 'null' | 'unknown' | 'value'

export interface IBaseActivityConfig {
  type: ActivityPuzzlePieceType
  ignored?: boolean
  highlighted?: boolean
  bottomMargin?: boolean
  leftMargin?: boolean
  crossedOut?: boolean
  value?: string | number
  aggFunction?: true
}

export interface IRelationshipContext {
  description: string
  link: string
  common_uses: { key: number | string; text: string }[]
}

export interface IRelationshipTitle {
  title: string
  start: number
  end: number | null
  showNull?: boolean
  aggFunction?: boolean
}

export interface IRelationshipTableRow {
  key: string
  customer: string
  timestamp: string
}

export interface IRelationshipTableConfig {
  show: boolean
  cohort: IBaseActivityConfig[]
  append: IBaseActivityConfig[]
  focusCustomer?: boolean
}

export interface IRelationshipCustomerJourneyConfig {
  show: boolean
  customer: IBaseActivityConfig[]
  relationshipTitles: IRelationshipTitle[]
}

export interface IRelationshipStepConfig {
  title: string
  customerName?: string
  table: IRelationshipTableConfig
  customerJourney: IRelationshipCustomerJourneyConfig
}

export interface IRelationshipTableRow {
  key: string
  customer: string
  timestamp: string
}

export interface IRelationshipCustomerJourneyLabelConfig {
  [key: string]: (string | null)[]
}

export interface IRelationshipConstants {
  PRIMARY_CUSTOMER: string
  RELATIONSHIP_CONTEXT: IRelationshipContext
  RELATIONSHIP_TABLE_ROWS: IRelationshipTableRow[]
  RELATIONSHIP_ANIMATION_STEPS: IRelationshipStepConfig[]
  CUSTOMER_JOURNEY_COHORT_LABELS: IRelationshipCustomerJourneyLabelConfig
}
