import {
  getKeyJoinColumnOptions,
  makeActivityColumn,
  makeExistingColumnSelectOptions,
  shouldRedirectBadGroup,
  makeSanitizedId,
  getActivityBySlug,
  hasAllTheSameSlugs,
  makeStringFilterAutocompleteOptions,
} from './helpers'

import makeFormState from './makeFormState'

import {
  DATASET_ACTIVITY_KIND_BEHAVIOR,
  DATASET_ACTIVITY_KIND_ATTRIBUTE,
  COLUMN_SOURCE_KIND_ENRICHMENT,
  COLUMN_TYPE_BOOLEAN,
  COLUMN_TYPE_NUMBER,
  COLUMN_TYPE_STRING,
  COLUMN_TYPE_TIMESTAMP,
} from './constants'

import { mockActivity } from '../../../test/mockStore'

import datasetFullResponse from '../../../test/fixtures/datasetFullResponse.json'
import datasetGroupResponse from '../../../test/fixtures/datasetGroupResponse.json'
import orActivities from '../../../test/fixtures/orActivities.json'

//////////////// Form Row EXAMPLES ////////////////

describe('helpers', () => {
  describe('#getKeyJoinColumnOptions', () => {
    it('gets column options based on selected activities', () => {
      const activity = {
        ...mockActivity,
        slug: 'slug-1',
        features: [
          {
            enrichment_table: null,
            kind: 'string',
            label: 'this should exist',
            name: 'feature_1',
          },
          {
            enrichment_table: null,
            name: 'activity_id',
            label: 'fancy_activity_id',
            kind: 'string',
          },
        ],
        meta: {
          columns: [
            {
              enrichment_table: null,
              kind: 'string',
              label: 'this should exist',
              name: 'feature_1',
            },
            {
              enrichment_table: null,
              name: 'activity_id',
              label: 'fancy_activity_id',
              kind: 'string',
            },
          ],
        },
      }
      const referencingActivity = {
        ...mockActivity,
        slug: 'slug-2',
        features: [
          {
            enrichment_table: null,
            kind: 'string',
            label: 'this should exist',
            name: 'feature_3',
          },
          {
            enrichment_table: null,
            name: 'activity_id',
            label: 'fancy_activity_id',
            kind: 'string',
          },
        ],
        meta: {
          columns: [
            {
              enrichment_table: null,
              kind: 'string',
              label: 'this should exist',
              name: 'feature_3',
            },
            {
              enrichment_table: null,
              name: 'activity_id',
              label: 'fancy_activity_id',
              kind: 'string',
            },
          ],
        },
      }

      expect(getKeyJoinColumnOptions({ activity, referencingActivity })).toMatchSnapshot()
    })
  })

  describe('#makeActivityColumn', () => {
    it('creates proper column label', () => {
      expect(
        makeActivityColumn({
          activity: mockActivity,
          activityId: 'test-activity-id',
          column: {
            name: 'activity_id',
            kind: 'string',
            enrichment_table: null,
          },
          activityKind: DATASET_ACTIVITY_KIND_BEHAVIOR,
        })
      ).toMatchSnapshot()
    })

    describe('for feature columns', () => {
      it('creates proper column label', () => {
        expect(
          makeActivityColumn({
            activity: mockActivity,
            activityId: 'test-activity-id',
            column: {
              name: 'feature_1',
              kind: 'string',
              label: 'this should exist',
              enrichment_table: null,
            },
            activityKind: DATASET_ACTIVITY_KIND_BEHAVIOR,
          })
        ).toMatchSnapshot()
      })

      describe('with activity.meta.columns', () => {
        it('creates proper column label', () => {
          expect(
            makeActivityColumn({
              activity: {
                ...mockActivity,
                meta: {
                  columns: [{ name: 'feature_1', label: 'im_a_fancy_meta_label' }],
                },
              },
              activityId: 'test-activity-id',
              column: {
                name: 'feature_1',
                kind: 'string',
                label: 'this should exist',
                enrichment_table: null,
              },
              activityKind: DATASET_ACTIVITY_KIND_BEHAVIOR,
            })
          ).toMatchSnapshot()
        })
      })
    })

    describe('for DATASET_ACTIVITY_KIND_ATTRIBUTE', () => {
      it('prepends activity name to column label', () => {
        expect(
          makeActivityColumn({
            activity: mockActivity,
            activityId: 'test-activity-id',
            column: {
              name: 'activity_id',
              kind: 'string',
              enrichment_table: null,
            },
            activityKind: DATASET_ACTIVITY_KIND_ATTRIBUTE,
          })
        ).toMatchSnapshot()
      })
    })

    describe('for enrichment', () => {
      it('prepends activity name to column label', () => {
        expect(
          makeActivityColumn({
            activity: mockActivity,
            activityId: 'test-activity-id',
            column: {
              name: 'referral_kind',
              kind: 'string',
              enrichment_table: 'enriched_pages',
            },
            activityKind: COLUMN_SOURCE_KIND_ENRICHMENT,
          })
        ).toMatchSnapshot()
      })
    })
  })

  describe('#makeExistingColumnSelectOptions', () => {
    it('creates grouped column options for Select', () => {
      const columnTypes = [COLUMN_TYPE_BOOLEAN, COLUMN_TYPE_NUMBER, COLUMN_TYPE_STRING, COLUMN_TYPE_TIMESTAMP]
      const formValue = makeFormState({ queryDefinition: datasetFullResponse.query_definition })
      expect(
        makeExistingColumnSelectOptions({
          formValue,
          columnTypes,
        })
      ).toMatchSnapshot()
    })

    describe('with groupSlug', () => {
      it('creates grouped column options for Select from group', () => {
        const columnTypes = [COLUMN_TYPE_BOOLEAN, COLUMN_TYPE_NUMBER, COLUMN_TYPE_STRING, COLUMN_TYPE_TIMESTAMP]
        const formValue = makeFormState({
          queryDefinition: datasetGroupResponse.groupings.group_by_kind_and_source.query_definition,
        })
        expect(
          makeExistingColumnSelectOptions({
            formValue,
            groupSlug: 'group_by_kind_and_source',
            columnTypes,
          })
        ).toMatchSnapshot()
      })
    })

    describe('with columnTypes', () => {
      it('disables every column but strings', () => {
        const formValue = makeFormState({ queryDefinition: datasetFullResponse.query_definition })
        const columnTypes = [COLUMN_TYPE_STRING]
        expect(
          makeExistingColumnSelectOptions({
            formValue,
            columnTypes,
          })
        ).toMatchSnapshot()
      })
    })

    describe('with selectColumnIds', () => {
      it('only allows those columns', () => {
        const formValue = makeFormState({ queryDefinition: datasetFullResponse.query_definition })
        expect(
          makeExistingColumnSelectOptions({
            formValue,
            selectColumnIds: ['segment_id', 'converted_to_survey_wizard_completed'],
          })
        ).toMatchSnapshot()
      })
    })

    describe('with omitColumnIds', () => {
      it('disable those columns', () => {
        const formValue = makeFormState({ queryDefinition: datasetFullResponse.query_definition })
        const columnTypes = [COLUMN_TYPE_BOOLEAN, COLUMN_TYPE_NUMBER, COLUMN_TYPE_STRING, COLUMN_TYPE_TIMESTAMP]
        expect(
          makeExistingColumnSelectOptions({
            columnTypes,
            formValue,
            omitColumnIds: ['segment_id', 'converted_to_survey_wizard_completed'],
          })
        ).toMatchSnapshot()
      })
    })
  })

  describe('#shouldRedirectBadGroup', () => {
    it('should return false for an existing group', () => {
      const prevFormValue = makeFormState({ queryDefinition: datasetFullResponse.query_definition })
      const formValue = makeFormState({ queryDefinition: datasetFullResponse.query_definition })
      const groupSlug = 'group_by_device'
      expect(shouldRedirectBadGroup({ prevFormValue, formValue, groupSlug })).toBe(false)
    })

    it('should return false for a new group that does not yet exist in formValues', () => {
      // this should return false because the prevFormValue is not empty
      // (meaning it's not the first time the page has loaded)
      const prevFormValue = makeFormState({ queryDefinition: datasetFullResponse.query_definition })
      const formValue = makeFormState({ queryDefinition: datasetFullResponse.query_definition })
      const groupSlug = 'new_group_slug_coming_in_hot'
      expect(shouldRedirectBadGroup({ prevFormValue, formValue, groupSlug })).toBe(false)
    })

    it('should return true for a non-existing group on page load', () => {
      const prevFormValue = {}
      const formValue = makeFormState({ queryDefinition: datasetFullResponse.query_definition })
      const groupSlug = 'fake_group_slug_this_should_redirect'
      expect(shouldRedirectBadGroup({ prevFormValue, formValue, groupSlug })).toBe(true)
    })
  })

  describe('#makeSanitizedId', () => {
    it('should remove all special characters and replace with underscores', () => {
      const id = 'this-is-@_bad-%$5-id'
      expect(makeSanitizedId(id)).toBe('this_is___bad___5_id')
    })
    it('should remove all spaces and replace with underscores', () => {
      const id = 'this is  a great id_12345'
      expect(makeSanitizedId(id)).toBe('this_is__a_great_id_12345')
    })
    it('should remove all spaces and special characters and replace with underscores', () => {
      const id = 'this is & a! great id_12345'
      expect(makeSanitizedId(id)).toBe('this_is___a__great_id_12345')
    })
    it('should make all characters lowercase', () => {
      const id = 'this Is & A! greAt id_12345'
      expect(makeSanitizedId(id)).toBe('this_is___a__great_id_12345')
    })
    it('should return the same id if it does not have any special characters', () => {
      const id = 'this_is_a_great_id_12345'
      expect(makeSanitizedId(id)).toBe(id)
    })
  })

  describe('#getActivityBySlug', () => {
    it('should find the correct OR activity when given multiple slugs', () => {
      const slugs = ['complete_company_setup', 'created_a_dashboard']
      expect(getActivityBySlug({ activities: orActivities, slug: slugs })).toMatchSnapshot()
    })
    it('should find the correct OR activity when given a single slug', () => {
      const slug = 'complete_company_setup'
      expect(getActivityBySlug({ activities: orActivities, slug })).toMatchSnapshot()
    })
    it('should return an empty object if it cannot find an activity with string slug', () => {
      expect(getActivityBySlug({ activities: orActivities, slug: 'this_is_not_a_real_slug' })).toMatchObject({})
    })
    it('should return an empty object if it cannot find an activity with array of slug strings', () => {
      expect(
        getActivityBySlug({
          activities: orActivities,
          slug: ['this_is_not_a_real_slug', 'this_is_also_not_a_real_slug'],
        })
      ).toMatchObject({})
    })
    it('should return an empty object if not all of the slugs match', () => {
      expect(
        getActivityBySlug({
          activities: orActivities,
          slug: ['created_a_dashboard', 'added_metric', 'batch_runs', 'this_is_also_not_a_real_slug'],
        })
      ).toMatchObject({})
    })
    it('should return an OR activity if the array of slugs match, even if they are not in the same order', () => {
      expect(
        getActivityBySlug({
          activities: orActivities,
          slug: ['created_a_dashboard', 'added_metric', 'complete_company_setup'],
        })
      ).toMatchSnapshot()
    })
  })

  describe('#hasAllTheSameSlugs', () => {
    it('should return false if slug1 is and empty string', () => {
      const slug1 = ''
      const slug2 = 'fake_slug'
      expect(hasAllTheSameSlugs({ slug1, slug2 })).toBe(false)
    })
    it('should return false if slug2 is and empty string', () => {
      const slug1 = 'fake_slug'
      const slug2 = ''
      expect(hasAllTheSameSlugs({ slug1, slug2 })).toBe(false)
    })
    it('should return false if slug1 is and empty array', () => {
      const slug1 = []
      const slug2 = 'fake_slug'
      expect(hasAllTheSameSlugs({ slug1, slug2 })).toBe(false)
    })
    it('should return false if slug2 is and empty array', () => {
      const slug1 = 'fake_slug'
      const slug2 = []
      expect(hasAllTheSameSlugs({ slug1, slug2 })).toBe(false)
    })
    it('should return false if slug1 and slug2 are strings but unequal', () => {
      const slug1 = 'fake_slug'
      const slug2 = 'fake_slug_two'
      expect(hasAllTheSameSlugs({ slug1, slug2 })).toBe(false)
    })
    it('should return false if slug1 and slug2 are arrays but unequal', () => {
      const slug1 = ['fake_slug']
      const slug2 = ['fake_slug_two']
      expect(hasAllTheSameSlugs({ slug1, slug2 })).toBe(false)
    })
    it('should return false if slug1 and slug2 are arrays and have an unequal length', () => {
      const slug1 = ['fake_slug']
      const slug2 = ['fake_slug_1', 'fake_slug_2']
      expect(hasAllTheSameSlugs({ slug1, slug2 })).toBe(false)
    })
    it('should return false if slug1 and slug2 have some of the same slugs, but have an unequal length', () => {
      const slug1 = ['fake_slug']
      const slug2 = ['fake_slug', 'fake_slug_2']
      expect(hasAllTheSameSlugs({ slug1, slug2 })).toBe(false)
    })
    it('should return true if slug1 and slug2 have the same slugs in the same order', () => {
      const slug1 = ['fake_slug', 'fake_slug_2', 'fake_slug_3']
      const slug2 = ['fake_slug', 'fake_slug_2', 'fake_slug_3']
      expect(hasAllTheSameSlugs({ slug1, slug2 })).toBe(true)
    })
    it('should return true if slug1 and slug2 have the same slugs in a different order', () => {
      const slug1 = ['fake_slug_2', 'fake_slug', 'fake_slug_3']
      const slug2 = ['fake_slug_3', 'fake_slug', 'fake_slug_2']
      expect(hasAllTheSameSlugs({ slug1, slug2 })).toBe(true)
    })
    it('should return true if slug1 and slug2 are strings and are equal', () => {
      const slug1 = 'fake_slug_2'
      const slug2 = 'fake_slug_2'
      expect(hasAllTheSameSlugs({ slug1, slug2 })).toBe(true)
    })
  })
})

const stubbedSelectedApiData = {
  metrics: [
    {
      id: 'customer_name',
      label: 'customer_name',
      type: 'string',
      kind: 'exact',
      metrics_type: 'duplicates',
      metrics: [
        {
          name: 'Billy Bob',
          value: 'BB',
          format: 'string',
        },
        {
          name: 'James Dean',
          value: 'James Dean',
          format: 'string',
        },
        {
          name: 'Alex Ham',
          value: 'Alex Ham',
          format: 'string',
        },
      ],
    },
  ],
}
const stubbedColumnId = 'customer_name'
const stubbedColumnValues = [
  { key: 'first_key', value: 'first_value' },
  { key: 'second_key', value: 'second_value' },
]

describe('#makeStringFilterAutocompleteOptions', () => {
  it('returns an empry array if no arguments are passed', () => {
    expect(makeStringFilterAutocompleteOptions({})).toEqual([])
  })

  it('returns options for columnValues', () => {
    expect(makeStringFilterAutocompleteOptions({ columnValues: stubbedColumnValues })).toEqual(
      expect.arrayContaining([
        { label: 'first_key', value: 'first_key' },
        { label: 'second_key', value: 'second_key' },
      ])
    )
  })

  it('returns options for selectedApiData and columnId', () => {
    expect(
      makeStringFilterAutocompleteOptions({ columnId: stubbedColumnId, selectedApiData: stubbedSelectedApiData })
    ).toEqual(
      expect.arrayContaining([
        { label: 'Billy Bob', value: 'Billy Bob' },
        { label: 'James Dean', value: 'James Dean' },
        { label: 'Alex Ham', value: 'Alex Ham' },
      ])
    )
  })

  it('return an empty array if selectedApiData is provided, but columnId is not', () => {
    expect(makeStringFilterAutocompleteOptions({ selectedApiData: stubbedSelectedApiData })).toEqual([])
  })

  it('return an empty array if columnId is provided, but selectedApiData is not', () => {
    expect(makeStringFilterAutocompleteOptions({ columnId: stubbedColumnId })).toEqual([])
  })
})
