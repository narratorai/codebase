import { IRelationshipConstants } from '../interfaces'

export const PRIMARY_CUSTOMER = 'Harry'

export const CUSTOMER_JOURNEY_COHORT_LABELS = {
  [PRIMARY_CUSTOMER]: ['2018-06-01', null, null, '2018-07-21', null, null, '2019-02-04'],
  Britt: [null, null, '2018-12-11', '2018-12-12'],
}

export const RELATIONSHIP_CONTEXT = {
  description:
    'This temporal join aggregates all the join activities (<%= appendActivityName %> activities) that happened AFTER the primary activity (<%= cohortActivityName %>). Then the aggregate value (SUM, COUNT, MAX, etc) is appended to the dataset.',
  link: 'https://docs.narrator.ai/docs/relationships#aggregate-after',

  common_uses: [
    {
      key: 1,
      text: 'Enrich your dataset with the COUNT of all Calls Submitted after a Started Subscription (How many calls does each subscription generate?)',
    },
    {
      key: 2,
      text: 'Enrich your dataset with the SUM of the revenue after an upgrade.',
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
    key: '2',
    timestamp: '2018-12-11',
    customer: 'Britt',
  },
  {
    key: '3',
    timestamp: '2019-01-21',
    customer: 'Abdul',
  },
  {
    key: '4',
    timestamp: '2019-02-04',
    customer: 'Jackie',
  },

  {
    key: '5',
    timestamp: '2018-06-04',
    customer: 'Sara',
  },
  {
    key: '6',
    timestamp: '2019-01-23',
    customer: 'Art',
  },

  {
    key: '7',
    timestamp: '2018-06-07',
    customer: 'Sam',
  },
  {
    key: '8',
    timestamp: '2018-06-08',
    customer: 'Greg',
  },
  {
    key: '9',
    timestamp: '2018-06-08',
    customer: 'TJ',
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
      focusCustomer: true,
      cohort: [
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
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
        { type: 'unknown', ignored: true },
        { type: 'unknown', ignored: true },
        { type: 'unknown', ignored: true },
      ],
    },
    customerJourney: {
      show: true,
      relationshipTitles: [],
      customer: [
        { type: 'cohort', ignored: false, section: 1 },
        { type: 'append', ignored: true, section: 1 },
        { type: 'append', ignored: true, section: 1 },
        { type: 'cohort', ignored: false, section: 2 },
        { type: 'append', ignored: true, section: 2 },
        { type: 'cohort', ignored: false, section: 2, bottomMargin: true },
        { type: 'cohort', ignored: false, section: 3 },
      ],
    },
  },
  {
    title: 'You selected LAST so only the last <%= cohortActivityName %> is in your dataset',
    table: {
      show: true,
      focusCustomer: true,
      cohort: [
        { type: 'cohort', ignored: false, highlighted: true },
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
      ],
      append: [
        { type: 'unknown', ignored: false },
        { type: 'unknown', ignored: false },
        { type: 'unknown', ignored: false },
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
        { type: 'cohort', ignored: false, section: 1, crossedOut: true },
        { type: 'append', ignored: true, section: 1 },
        { type: 'append', ignored: true, section: 1 },
        { type: 'cohort', ignored: false, crossedOut: true, section: 2 },
        { type: 'append', ignored: true, section: 2 },
        { type: 'cohort', ignored: false, section: 2, crossedOut: true, bottomMargin: true },
        { type: 'cohort', ignored: false, section: 3, highlighted: true },
      ],
    },
  },
  {
    title: 'After - Find all <%= appendActivityName %> activities that happened AFTER that <%= cohortActivityName %> ',
    table: {
      show: true,
      focusCustomer: true,
      cohort: [
        { type: 'cohort', ignored: false, highlighted: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
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
        { type: 'unknown', ignored: true },
        { type: 'unknown', ignored: true },
        { type: 'unknown', ignored: true },
      ],
    },
    customerJourney: {
      show: true,
      relationshipTitles: [{ title: 'Aggregate **After**', start: 6, end: null }],
      customer: [
        { type: 'cohort', ignored: true, crossedOut: true },
        { type: 'append', ignored: true },
        { type: 'append', ignored: true, bottomMargin: true },
        { type: 'cohort', ignored: true, crossedOut: true },
        { type: 'append', ignored: true, bottomMargin: true },
        { type: 'cohort', ignored: true, crossedOut: true, bottomMargin: true },
        { type: 'cohort', ignored: false, highlighted: true },
      ],
    },
  },
  {
    title: 'Aggregate After - AGGREGATE the data from those <%= appendActivityName %> activities',
    table: {
      show: true,
      focusCustomer: true,
      cohort: [
        { type: 'cohort', ignored: false, highlighted: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
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
        { type: 'unknown', ignored: true },
        { type: 'unknown', ignored: true },
        { type: 'unknown', ignored: true },
      ],
    },
    customerJourney: {
      show: true,
      relationshipTitles: [{ title: '**Aggregate** After', start: 6, end: null, aggFunction: true }],
      customer: [
        { type: 'cohort', ignored: true, crossedOut: true },
        { type: 'append', ignored: true },
        { type: 'append', ignored: true, bottomMargin: true },
        { type: 'cohort', ignored: true, crossedOut: true },
        { type: 'append', ignored: true, bottomMargin: true },
        { type: 'cohort', ignored: true, crossedOut: true, bottomMargin: true },
        { type: 'cohort', ignored: false, highlighted: true },
      ],
    },
  },
  {
    title:
      "There's nothing after the <%= cohortActivityName %> activity, so add a 0 to <%= customer %>'s row in your dataset",
    table: {
      show: true,
      focusCustomer: true,
      cohort: [
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
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
        { type: 'unknown', ignored: true },
        { type: 'unknown', ignored: true },
        { type: 'unknown', ignored: true },
      ],
    },
    customerJourney: {
      show: true,
      relationshipTitles: [{ title: '**Aggregate** After', start: 6, end: null, aggFunction: true }],
      customer: [
        { type: 'cohort', ignored: true, crossedOut: true },
        { type: 'append', ignored: true },
        { type: 'append', ignored: true, bottomMargin: true },
        { type: 'cohort', ignored: true, crossedOut: true },
        { type: 'append', ignored: true, bottomMargin: true },
        { type: 'cohort', ignored: true, crossedOut: true, bottomMargin: true },
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
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: false },
      ],
      append: [
        { type: 'value', value: 0 },
        { type: 'value', value: 0 },
        { type: 'append', ignored: false, aggFunction: true },
        { type: 'append', ignored: false, aggFunction: true },
        { type: 'append', ignored: false, aggFunction: true },
        { type: 'value', value: 0 },
        { type: 'append', ignored: false, aggFunction: true },
        { type: 'value', value: 0 },
        { type: 'append', ignored: false, aggFunction: true },
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
