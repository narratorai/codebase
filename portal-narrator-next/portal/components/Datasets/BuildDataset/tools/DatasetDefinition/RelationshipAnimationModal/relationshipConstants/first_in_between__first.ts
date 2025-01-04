import { IRelationshipConstants } from '../interfaces'

export const PRIMARY_CUSTOMER = 'Harry'

export const CUSTOMER_JOURNEY_COHORT_LABELS = {
  [PRIMARY_CUSTOMER]: ['2018-06-01', null, null, '2018-07-21', null, null, '2019-02-04'],
  Britt: [null, null, '2018-12-11', '2018-12-12'],
}

export const RELATIONSHIP_CONTEXT = {
  description:
    "This temporal join adds the FIRST time the join activity (<%= appendActivityName %>) happened after a customer's first primary activity (<%= cohortActivityName %>).",
  link: 'https://docs.narrator.ai/docs/relationships#first-in-between',
  common_uses: [
    { key: 1, text: 'Calculate the unique visitor conversion rate from the website' },
    { key: 2, text: 'Enrich your dataset with the first order after a session started but only for the first session' },
    { key: 3, text: 'Find the churn rate for first time subscribers' },
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
    title: 'You selected FIRST so only the FIRST <%= cohortActivityName %> is in your dataset',
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
        { type: 'cohort', ignored: false, section: 1, highlighted: true },
        { type: 'append', ignored: true, section: 1 },
        { type: 'append', ignored: true, section: 1 },
        { type: 'cohort', ignored: false, crossedOut: true, section: 2 },
        { type: 'append', ignored: true, section: 2 },
        { type: 'cohort', ignored: false, section: 2, crossedOut: true, bottomMargin: true },
        { type: 'cohort', ignored: false, section: 3, crossedOut: true },
      ],
    },
  },
  {
    title:
      'In Between - Find all <%= appendActivityName %> activities that happened AFTER that <%= cohortActivityName %> ',
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
      relationshipTitles: [{ title: 'First **In Between**', start: 0, end: null }],
      customer: [
        { type: 'cohort', ignored: false, highlighted: true },
        { type: 'append', ignored: false, leftMargin: true },
        { type: 'append', ignored: false, bottomMargin: true, leftMargin: true },
        { type: 'cohort', ignored: true, crossedOut: true },
        { type: 'append', ignored: false, bottomMargin: true, leftMargin: true },
        { type: 'cohort', ignored: true, crossedOut: true, bottomMargin: true },
        { type: 'cohort', ignored: true, crossedOut: true },
      ],
    },
  },
  {
    title: 'First In Between - Choose the FIRST <%= appendActivityName %> from those activities',
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
      relationshipTitles: [{ title: '**First** In Between', start: 0, end: null }],
      customer: [
        { type: 'cohort', ignored: false, highlighted: true },
        { type: 'append', ignored: false, leftMargin: true, highlighted: true },
        { type: 'append', ignored: false, bottomMargin: true, leftMargin: true, crossedOut: true },
        { type: 'cohort', ignored: true, crossedOut: true },
        { type: 'append', ignored: false, bottomMargin: true, leftMargin: true, crossedOut: true },
        { type: 'cohort', ignored: true, crossedOut: true, bottomMargin: true },
        { type: 'cohort', ignored: true, crossedOut: true },
      ],
    },
  },
  {
    title: "Add the <%= appendActivityName %> activity to <%= customer %>'s row in your dataset",
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
        { type: 'append', ignored: false },
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
      relationshipTitles: [{ title: '**First** In Between', start: 0, end: null }],
      customer: [
        { type: 'cohort', ignored: false, highlighted: true },
        { type: 'append', ignored: false, leftMargin: true, highlighted: true },
        { type: 'append', ignored: false, bottomMargin: true, leftMargin: true, crossedOut: true },
        { type: 'cohort', ignored: true, crossedOut: true },
        { type: 'append', ignored: false, bottomMargin: true, leftMargin: true, crossedOut: true },
        { type: 'cohort', ignored: true, crossedOut: true, bottomMargin: true },
        { type: 'cohort', ignored: true, crossedOut: true },
      ],
    },
  },

  {
    title: "Let's take another example, <%= customer %>, and look at her customer journey",
    customerName: 'Britt',
    table: {
      show: true,
      focusCustomer: true,
      cohort: [
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: false, highlighted: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
      ],
      append: [
        { type: 'append', ignored: false },
        { type: 'unknown', ignored: false },
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
      show: false,
      relationshipTitles: [],
      customer: [],
    },
  },

  {
    title: 'You selected FIRST so only the FIRST <%= cohortActivityName %> is in your dataset',

    customerName: 'Britt',
    table: {
      show: true,
      focusCustomer: true,
      cohort: [
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: false, highlighted: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
      ],
      append: [
        { type: 'append', ignored: false },
        { type: 'unknown', ignored: false },
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
        { type: 'append', ignored: true, section: 1 },
        { type: 'append', ignored: true, section: 1 },
        { type: 'cohort', ignored: false, section: 1, bottomMargin: true, highlighted: true },
        { type: 'cohort', ignored: false, section: 2, crossedOut: true },
      ],
    },
  },

  {
    title:
      'In Between - Find all <%= appendActivityName %> activities that happened AFTER the <%= cohortActivityName %>',
    customerName: 'Britt',
    table: {
      show: true,
      focusCustomer: true,
      cohort: [
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: false, highlighted: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
      ],
      append: [
        { type: 'append', ignored: false },
        { type: 'unknown', ignored: false, highlighted: true },
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
      relationshipTitles: [{ title: 'First **In Between**', start: 2, end: null }],
      customer: [
        { type: 'append', ignored: true, section: 1 },
        { type: 'append', ignored: true, section: 1 },
        { type: 'cohort', ignored: false, section: 1, highlighted: true, bottomMargin: true },
        { type: 'cohort', ignored: true, section: 2, crossedOut: true },
      ],
    },
  },
  {
    title: 'First In Between - Choose the FIRST <%= appendActivityName %> from those activities',
    customerName: 'Britt',
    table: {
      show: true,
      focusCustomer: true,
      cohort: [
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: false, highlighted: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
      ],
      append: [
        { type: 'append', ignored: false },
        { type: 'unknown', ignored: false, highlighted: true },
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
      relationshipTitles: [{ title: '**First** In Between', start: 2, end: null, showNull: true }],
      customer: [
        { type: 'append', ignored: true, section: 1 },
        { type: 'append', ignored: true, section: 1 },
        { type: 'cohort', ignored: false, section: 1, bottomMargin: true, highlighted: true },
        { type: 'cohort', ignored: true, section: 2, crossedOut: true },
      ],
    },
  },
  {
    title:
      "There is nothing after the <%= cohortActivityName %> activity, so add a NULL to <%= customer %>'s row in your dataset",
    customerName: 'Britt',
    table: {
      show: true,
      focusCustomer: true,
      cohort: [
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: false },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
        { type: 'cohort', ignored: true },
      ],
      append: [
        { type: 'append', ignored: false },
        { type: 'null', ignored: false },
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
      relationshipTitles: [{ title: '**First** In Between', start: 2, end: null, showNull: true }],
      customer: [
        { type: 'append', ignored: true, section: 1 },
        { type: 'append', ignored: true, section: 1 },
        { type: 'cohort', ignored: false, section: 1, bottomMargin: true, highlighted: true },
        { type: 'cohort', ignored: true, section: 2, crossedOut: true },
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
        { type: 'append', ignored: false },
        { type: 'null', ignored: false },
        { type: 'append', ignored: false },
        { type: 'append', ignored: false },
        { type: 'append', ignored: false },
        { type: 'null', ignored: false },
        { type: 'append', ignored: false },
        { type: 'null', ignored: false },
        { type: 'append', ignored: false },
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
