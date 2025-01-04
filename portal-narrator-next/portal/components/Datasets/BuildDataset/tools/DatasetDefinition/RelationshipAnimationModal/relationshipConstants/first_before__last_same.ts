import { IRelationshipConstants } from '../interfaces'

export const PRIMARY_CUSTOMER = 'Harry'

export const CUSTOMER_JOURNEY_COHORT_LABELS = {
  [PRIMARY_CUSTOMER]: ['2018-06-01', '2018-12-11', '2019-01-21'],
}

export const RELATIONSHIP_CONTEXT = {
  description:
    "This temporal join finds the FIRST time the join activity (<%= appendActivityName %>) happened BEFORE the customer' last primary activity (<%= cohortActivityName %>).",
  link: 'https://docs.narrator.ai/docs/relationships#first-before',
  common_uses: [
    {
      key: 1,
      text: 'First Touch Attribution: Enrich your dataset with the ad source from the first session, but only if that session happened before the last sign up.',
    },
    {
      key: 2,
      text: "Length of Membership: Give me the time between a customer's first started subcription for their last invoice.",
    },
  ],
}

export const RELATIONSHIP_TABLE_ROWS = [
  {
    key: '1',
    timestamp: '2019-01-21',
    customer: PRIMARY_CUSTOMER,
  },
  {
    key: '4',
    timestamp: '2018-06-04',
    customer: 'Sara',
  },
  {
    key: '6',
    timestamp: '2018-06-07',
    customer: 'Sam',
  },
  {
    key: '7',
    timestamp: '2018-06-08',
    customer: 'Greg',
  },
  {
    key: '8',
    timestamp: '2018-06-08',
    customer: 'TJ',
  },
  {
    key: '9',
    timestamp: '2018-06-09',
    customer: 'Brenda',
  },
]

export const RELATIONSHIP_ANIMATION_STEPS = [
  {
    title: "Start with your primary activity (<%= cohortActivityName %>), notice how there's only one row per customer",
    table: {
      show: true,
      cohort: [
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: false },
      ],
      append: [
        { type: 'unknown', ignored: false },
        { type: 'unknown', ignored: false },
        { type: 'unknown', ignored: false },
        { type: 'unknown', ignored: false },
        { type: 'unknown', ignored: false },
        { type: 'unknown', ignored: false },
      ],
    },
    customerJourney: {
      show: false,
      customer: [],
    },
  },
  {
    title: 'Focus on a single customer',
    table: {
      show: true,
      focusCustomer: true,
      cohort: [
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: false },
      ],
      append: [
        { type: 'unknown', ignored: false },
        { type: 'unknown', ignored: false },
        { type: 'unknown', ignored: false },
        { type: 'unknown', ignored: false },
        { type: 'unknown', ignored: false },
        { type: 'unknown', ignored: false },
      ],
    },
    customerJourney: {
      show: false,
      relationshipTitles: [],
      customer: [],
    },
  },
  {
    title: 'Look at their customer journey',
    table: {
      show: true,
      cohort: [
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
      ],
      append: [
        { type: 'unknown', ignored: false },
        { type: 'unknown', ignored: true },
        { type: 'unknown', ignored: true },
        { type: 'unknown', ignored: true },
        { type: 'unknown', ignored: true },
        { type: 'unknown', ignored: true },
      ],
    },
    customerJourney: {
      show: true,
      relationshipTitles: [],
      customer: [
        { type: 'cohort', ignored: false, bottomMargin: true },
        { type: 'cohort', ignored: false, bottomMargin: true },
        { type: 'cohort', ignored: false },
      ],
    },
  },
  {
    title: 'For each primary activity (<%= cohortActivityName %>) in your dataset, find it in the Activity Stream',
    table: {
      show: true,
      cohort: [
        { type: 'cohort', ignored: false, highlighted: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
      ],
      append: [
        { type: 'unknown', ignored: false, highlighted: true },
        { type: 'unknown', ignored: true },
        { type: 'unknown', ignored: true },
        { type: 'unknown', ignored: true },
        { type: 'unknown', ignored: true },
        { type: 'unknown', ignored: true },
      ],
    },
    customerJourney: {
      show: true,
      relationshipTitles: [],
      customer: [
        { type: 'cohort', ignored: false, bottomMargin: true },
        { type: 'cohort', ignored: false, bottomMargin: true },
        { type: 'cohort', ignored: false, highlighted: true },
      ],
    },
  },
  {
    title:
      '"Before" - Find all <%= appendActivityName %> activities that happened BEFORE  the <%= cohortActivityName %> ',
    table: {
      show: true,
      cohort: [
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
      ],
      append: [
        { type: 'unknown', ignored: false, highlighted: true },
        { type: 'unknown', ignored: true },
        { type: 'unknown', ignored: true },
        { type: 'unknown', ignored: true },
        { type: 'unknown', ignored: true },
        { type: 'unknown', ignored: true },
      ],
    },
    customerJourney: {
      show: true,
      relationshipTitles: [{ title: 'First **Before**', start: null, end: 2 }],
      customer: [
        { type: 'append', ignored: false, bottomMargin: true, leftMargin: true },
        { type: 'append', ignored: false, bottomMargin: true, leftMargin: true },
        { type: 'cohort', ignored: false, highlighted: true },
      ],
    },
  },
  {
    title: '"First Before" - Choose the FIRST <%= appendActivityName %> from those activities',
    table: {
      show: true,
      cohort: [
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
      ],
      append: [
        { type: 'unknown', ignored: false, highlighted: true },
        { type: 'unknown', ignored: true },
        { type: 'unknown', ignored: true },
        { type: 'unknown', ignored: true },
        { type: 'unknown', ignored: true },
        { type: 'unknown', ignored: true },
      ],
    },
    customerJourney: {
      show: true,
      relationshipTitles: [{ title: '**First** Before', start: null, end: 2, showNull: false }],
      customer: [
        { type: 'append', ignored: false, bottomMargin: true, leftMargin: true, highlighted: true },
        { type: 'append', ignored: false, bottomMargin: true, leftMargin: true },
        { type: 'cohort', ignored: false, highlighted: true },
      ],
    },
  },
  {
    title: 'Add that <%= appendActivityName %> activity to the corresponding <%= cohortActivityName %> in your dataset',
    table: {
      show: true,
      cohort: [
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
      ],
      append: [
        { type: 'append', ignored: false, highlighted: true },
        { type: 'unknown', ignored: true },
        { type: 'unknown', ignored: true },
        { type: 'unknown', ignored: true },
        { type: 'unknown', ignored: true },
        { type: 'unknown', ignored: true },
      ],
    },
    customerJourney: {
      show: true,
      relationshipTitles: [{ title: '**First** Before', start: null, end: 2, showNull: false }],
      customer: [
        { type: 'append', ignored: false, bottomMargin: true, leftMargin: true, highlighted: true },
        { type: 'append', ignored: false, bottomMargin: true, leftMargin: true },
        { type: 'cohort', ignored: false, highlighted: true },
      ],
    },
  },
  {
    title: 'Repeat for all customers',
    table: {
      show: true,
      cohort: [
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: false },
      ],
      append: [
        { type: 'append', ignored: false },
        { type: 'append', ignored: false },
        { type: 'null', ignored: false },
        { type: 'null', ignored: false },
        { type: 'null', ignored: false },
        { type: 'null', ignored: false },
      ],
    },
    customerJourney: {
      show: false,
      relationshipTitles: [],
      customer: [],
    },
  },
]

export default {
  PRIMARY_CUSTOMER,
  RELATIONSHIP_CONTEXT,
  RELATIONSHIP_TABLE_ROWS,
  RELATIONSHIP_ANIMATION_STEPS,
  CUSTOMER_JOURNEY_COHORT_LABELS,
} as IRelationshipConstants
