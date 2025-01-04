import { createInitialScriptsFormValue, getActivitiesGenerated, mergeQueryColumnLabelsIntoColumnOverrides } from './'

import {
  ACTIVITY_SCRIPT_LIFECYCLE_LIVE,
  ACTIVITY_SCRIPT_LIFECYCLE_PENDING,
  SCRIPT_TYPE_CUSTOMER_ATTRIBUTE,
  SCRIPT_TYPE_STREAM,
} from 'util/manage'

import {
  TASK_CATEGORY_MATERIALIZATIONS,
  TASK_CATEGORY_NARRATIVES,
  TASK_CATEGORY_PROCESSING,
} from '../../components/TaskTracker/services/constants'
import {
  makeTaskExecutionHoneycombLinks,
  makeTaskOrExecutionSupportDescription,
  taskPrettyName,
} from '../../components/TaskTracker/services/helpers'

// Script Form creates an object that looks like this:
const existingActivities = [
  {
    id: '1614fd41-5f99-48b3-8462-d5cdd7832c97',
    name: 'Run Segment',
    slug: 'run_segment',
    kind: 'funnel',
    level: 1100,
    is_key: false,
    description: '',
    updated_at: '2019-01-01T17:00:49.792Z',
    deleted_at: null,
    status: 'live',
    category: null,
    script_lifecycle: ACTIVITY_SCRIPT_LIFECYCLE_LIVE,
  },
  {
    id: 'b75747d0-b4d0-4b05-89b3-bd29428cccc3',
    name: 'Loaded Activity',
    slug: 'loaded_activity',
    kind: 'funnel',
    level: 1200,
    is_key: false,
    description: 'The activity metrics page was loaded',
    updated_at: '2019-01-01T17:00:49.816Z',
    deleted_at: null,
    status: 'live',
    category: null,
    script_lifecycle: ACTIVITY_SCRIPT_LIFECYCLE_LIVE,
  },
  {
    id: 'b75747d0-b4d0-4b05-89b3-bd29428cccc3',
    name: 'Was Retired',
    slug: 'was_retired',
    kind: 'funnel',
    level: 1200,
    is_key: false,
    description: 'The activity metrics page was loaded',
    updated_at: '2019-01-01T17:00:49.816Z',
    deleted_at: null,
    status: 'retired',
    category: null,
    script_lifecycle: ACTIVITY_SCRIPT_LIFECYCLE_LIVE,
  },
]

const activitiesGenerated = [
  'run_segment',
  'load_segment_agg',
  'this_one_should_be_in_snapshot_with_pending_status',
  'was_retired',
]

const activitiesGeneratedCurrentlyInForm = [
  {
    slug: 'should_not_be_in_snapshot',
    status: 'ignored',
    script_lifecycle: ACTIVITY_SCRIPT_LIFECYCLE_PENDING,
  },
  {
    slug: 'load_segment_agg',
    status: 'ignored',
    script_lifecycle: ACTIVITY_SCRIPT_LIFECYCLE_PENDING,
  },
]

describe('#getActivitiesGenerated', () => {
  it('keeps activities that were generated and were still being generated and removes the ones that are no longer being generated. The list will not include activities the rails app already knows about.', () => {
    expect(
      getActivitiesGenerated({ existingActivities, activitiesGenerated, activitiesGeneratedCurrentlyInForm })
    ).toMatchSnapshot()
  })
})

describe('#createInitialScriptsFormValue', () => {
  describe('isNew', () => {
    it('make initial script', () => {
      expect(
        createInitialScriptsFormValue({
          isNew: true,
          userEmail: 'hotmcbuttbutt@hotmail.com',
          type: SCRIPT_TYPE_STREAM,
          streamTable: 'activity_stream',
        })
      ).toMatchSnapshot()
    })
  })

  describe('isNew customer table', () => {
    it('make initial script with customer table', () => {
      expect(
        createInitialScriptsFormValue({
          isNew: true,
          userEmail: 'hotmcbuttbutt@hotmail.com',
          customerTable: 'customer',
          type: SCRIPT_TYPE_CUSTOMER_ATTRIBUTE,
          streamTable: 'activity_stream',
        })
      ).toMatchSnapshot()
    })
  })
})

const formValue = {
  column_overrides: [
    {
      label: 'Custom Column Name',
      name: 'feature_1',
      kind: 'number',
    },
    {
      name: 'ts',
      kind: 'timestamp',
    },
    {
      name: 'activity',
      kind: 'string',
    },
  ],
}

const named_columns = [
  {
    label: 'Date it Happened',
    column_name: 'feature_1',
  },
  {
    label: 'fancy timestamp',
    column_name: 'ts',
  },
  {
    label: 'Fancy Ignore Name',
    column_name: 'activity',
  },
]

describe('#mergeQueryColumnLabelsIntoColumnOverrides', () => {
  it('merges column labels from query into only configurably form column_overrides', () => {
    expect(
      mergeQueryColumnLabelsIntoColumnOverrides({
        columnOverrides: formValue.column_overrides,
        namedColumns: named_columns,
      })
    ).toMatchSnapshot()
  })

  it('will make null a label that was previously set in the query if it comes as null in named_columns', () => {
    expect(
      mergeQueryColumnLabelsIntoColumnOverrides({
        columnOverrides: [
          {
            label: 'Eye Color',
            name: 'feature_1',
            kind: 'number',
          },
        ],
        namedColumns: [
          {
            label: null,
            column_name: 'feature_1',
          },
        ],
      })
    ).toMatchSnapshot()
  })
})

describe('#taskPrettyName', () => {
  it('should return the full name if it is a processing (category) task', () => {
    const task = {
      category: TASK_CATEGORY_PROCESSING,
      task_slug: 'see_this_full_slug_as_pretty',
    }
    expect(taskPrettyName(task)).toBe('See This Full Slug As Pretty')
  })
  it('should return the materialization name minus the preceeding M', () => {
    const task = {
      category: TASK_CATEGORY_MATERIALIZATIONS,
      task_slug: 'm_see_this_full_slug_as_pretty',
    }
    expect(taskPrettyName(task)).toBe('See This Full Slug As Pretty')
  })
  it('should return the materialization name as without removing first section of slug if it does not start with an M', () => {
    const task = {
      category: TASK_CATEGORY_MATERIALIZATIONS,
      task_slug: 'see_this_full_slug_as_pretty',
    }
    expect(taskPrettyName(task)).toBe('See This Full Slug As Pretty')
  })
  it('should return the narratives name minus the preceeding N', () => {
    const task = {
      category: TASK_CATEGORY_NARRATIVES,
      task_slug: 'n_see_this_full_slug_as_pretty',
    }
    expect(taskPrettyName(task)).toBe('See This Full Slug As Pretty')
  })
  it('should return the narratives name as without removing first section of slug if it does not start with an N', () => {
    const task = {
      category: TASK_CATEGORY_NARRATIVES,
      task_slug: 'see_this_full_slug_as_pretty',
    }
    expect(taskPrettyName(task)).toBe('See This Full Slug As Pretty')
  })
})

describe('#makeTaskOrExecutionSupportDescription', () => {
  const id = 'fake-id'
  const type = TASK_CATEGORY_NARRATIVES
  const honeycombLink = [{ link: 'https://1234', name: 'fake-name' }]
  const honeycombLinks = [
    { link: 'https://1234', name: 'fake-name' },
    { link: 'https://5678', name: 'fake-name-1' },
    { link: 'https://91011', name: 'fake-name-2' },
  ]
  it('should return a string with description, type and id if no honeycombLinks are provided', () => {
    expect(makeTaskOrExecutionSupportDescription(id, type)).toBe(
      'ADDITIONAL INFO FOR SUPPORT REP:\n\nNarratives Id: fake-id'
    )
  })
  it('should return a string with description, type, id, and honeycombLink if a honeycombLink is provided', () => {
    expect(makeTaskOrExecutionSupportDescription(id, type, honeycombLink)).toBe(
      'ADDITIONAL INFO FOR SUPPORT REP:\n\nNarratives Id: fake-id\n\nhttps://1234'
    )
  })
  it('should return a string with description, type, id, and honeycombLinks if honeycombLinks are provided', () => {
    expect(makeTaskOrExecutionSupportDescription(id, type, honeycombLinks)).toBe(
      'ADDITIONAL INFO FOR SUPPORT REP:\n\nNarratives Id: fake-id\n\nhttps://1234, https://5678, https://91011'
    )
  })
})

describe('#makeTaskExecutionHoneycombLinks', () => {
  describe('task has no job executions', () => {
    const execution = {
      id: '23fb6c5a-eb0c-4173-a51a-b916ced00fcf',
      details: {
        trace_context: {
          trace_id: '4451011e-c1c4-4f32-bfa4-7312e18b4cc1',
          dataset: 'mavis-worker',
        },
      },
      started_at: '2020-05-07T17:29:34.048985+00:00',
      completed_at: '2020-05-07T17:29:41.398706+00:00',
      job_executions: [],
    }

    const exectutionWithoutDetails = {
      id: '23fb6c5a-eb0c-4173-a51a-b916ced00fcf',
      details: {},
      started_at: '2020-05-07T17:29:34.048985+00:00',
      completed_at: '2020-05-07T17:29:41.398706+00:00',
      job_executions: [],
    }

    it('returns an array of links for the provided task execution', () => {
      const links = makeTaskExecutionHoneycombLinks(execution)

      expect(links.length).toBe(1)
      expect(links).toEqual([
        {
          name: 'Link',
          link: 'https://ui.honeycomb.io/narrator-ai/datasets/mavis-worker/trace?trace_id=4451011e-c1c4-4f32-bfa4-7312e18b4cc1&trace_start_ts=1588872569&trace_end_ts=1588872586',
        },
      ])
    })

    describe('when the trace_context has no details', () => {
      it('returns an empty array', () => {
        const links = makeTaskExecutionHoneycombLinks(exectutionWithoutDetails)
        expect(links.length).toBe(0)
      })
    })
  })
})
