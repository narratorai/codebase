import { IRelationshipConstants } from '../interfaces'

export const PRIMARY_CUSTOMER = 'Harry'

export const CUSTOMER_JOURNEY_COHORT_LABELS = {
  [PRIMARY_CUSTOMER]: ['2018-06-01', '2018-12-11', '2019-01-21'],
}

export const RELATIONSHIP_CONTEXT = {
  description:
    'This temporal join aggregates all the join activities (<%= appendActivityName %> activities) that happened BEFORE the first primary activity (<%= cohortActivityName %>). Then the aggregate value (SUM, COUNT, MAX, etc) is appended to the dataset.',
  link: 'https://docs.narrator.ai/docs/relationships#agg-before',
  common_uses: [
    {
      key: 1,
      text: 'Page views before first lead: Add the count of unique pages that a customer viewed before their first lead submission.',
    },

    {
      key: 2,
      text: 'Chats before first subscription: Add the count of chats a customer submits before their first subscription.',
    },
  ],
}

export const RELATIONSHIP_TABLE_ROWS = [
  {
    key: '1',
    timestamp: '2018-06-01',
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
        { type: 'cohort', ignored: false, bottomMargin: true, highlighted: true },
        { type: 'cohort', ignored: false, bottomMargin: true },
        { type: 'cohort', ignored: false },
      ],
    },
  },
  {
    title:
      '"Before" - Find all <%= appendActivityName %> activities that happened BEFORE  the <%= cohortActivityName %> ',
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
      relationshipTitles: [{ title: 'Aggregate **Before**', start: null, end: 0 }],
      customer: [
        { type: 'cohort', ignored: false, bottomMargin: true, highlighted: true },
        { type: 'cohort', ignored: false, bottomMargin: true },
        { type: 'cohort', ignored: false },
      ],
    },
  },
  {
    title: '"Aggregate Before" - AGGREGATE the data from those <%= appendActivityName %> activities',
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
      relationshipTitles: [{ title: '**Aggregate** Before', start: null, end: 0, aggFunction: true }],
      customer: [
        { type: 'cohort', ignored: false, bottomMargin: true, highlighted: true },
        { type: 'cohort', ignored: false, bottomMargin: true },
        { type: 'cohort', ignored: false },
      ],
    },
  },
  {
    title:
      'There are no <%= appendActivityName %> activities BEFORE, so a 0 value is added to the corresponding activity in the dataset',
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
        { type: 'value', value: 0, highlighted: true },
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
        { type: 'cohort', ignored: true, bottomMargin: true },
        { type: 'cohort', ignored: false, bottomMargin: true },
        { type: 'cohort', ignored: false },
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
        { type: 'value', value: 0 },
        { type: 'value', value: 0 },
        { type: 'value', value: 0 },
        { type: 'value', value: 0 },
        { type: 'value', value: 0 },
        { type: 'value', value: 0 },
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
