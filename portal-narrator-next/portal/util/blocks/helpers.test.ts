import React from 'react'
import {
  findBlockContentByType,
  findAllBlockContentByType,
  groupPropertiesByTab,
  getAllDependentFields,
  getDependentFieldsForField,
} from './helpers'
import { BlockContent, PlotContent, MarkdownContent, JsonContent } from './interfaces'
import fieldConfigs from '../../../test/fixtures/fieldConfigs.json'

describe('util/blocks/helpers', () => {
  describe('#findBlockContentByType', () => {
    it('handles `null` as blockContent', () => {
      expect(findBlockContentByType<any>('plot', null)).toEqual(undefined)
    })

    it('returns plot content based on type', () => {
      const blockContent: BlockContent[] = [
        {
          type: 'plot',
          value: {
            data: [{}],
            layout: {},
            config: {},
          },
        },
        {
          type: 'markdown',
          value: '#hello',
        },
      ]

      const { type, value } = findBlockContentByType<PlotContent>('plot', blockContent) || {}
      const data = value?.data

      expect(type).toEqual('plot')
      expect(data).toEqual([{}])
    })

    it('returns markdown content based on type', () => {
      const blockContent: BlockContent[] = [
        {
          type: 'plot',
          value: {
            data: [{}],
            layout: {},
            config: {},
          },
        },
        {
          type: 'markdown',
          value: '#hello',
        },
      ]

      const { type, value } = findBlockContentByType('markdown', blockContent) as MarkdownContent

      expect(type).toEqual('markdown')
      expect(value).toEqual('#hello')
    })
  })

  describe('#findAllBlockContentByType', () => {
    it('handles `null` as blockContent', () => {
      expect(findAllBlockContentByType<any>('plot', null)).toEqual([])
    })

    it('returns plot content based on type', () => {
      const blockContent: BlockContent[] = [
        {
          type: 'plot',
          value: {
            data: [{}],
            layout: {},
            config: {},
          },
        },
        {
          type: 'markdown',
          value: '#hello',
        },
      ]
      const resp = findAllBlockContentByType<PlotContent[]>('plot', blockContent)
      const type = resp?.[0]?.type
      const value = resp?.[0]?.value
      const data = value?.data

      expect(type).toEqual('plot')
      expect(data).toEqual([{}])
    })

    it('returns multiple plot content based on type', () => {
      const blockContent: BlockContent[] = [
        {
          type: 'plot',
          value: {
            data: [{}],
            layout: {},
            config: {},
          },
        },
        {
          type: 'markdown',
          value: '#hello',
        },
        {
          type: 'plot',
          value: {
            data: [{}],
            layout: {},
            config: {},
          },
        },
      ]

      const resp = findAllBlockContentByType<PlotContent[]>('plot', blockContent)

      const type1 = resp?.[0]?.type
      const value1 = resp?.[0]?.value
      const type2 = resp?.[1]?.type
      const value2 = resp?.[1]?.value

      const data1 = value1?.data
      const data2 = value2?.data

      expect(type1).toEqual('plot')
      expect(data1).toEqual([{}])
      expect(type2).toEqual('plot')
      expect(data2).toEqual([{}])
      expect(resp?.length).toEqual(2)
    })

    it('returns multiple markdown content based on type', () => {
      const blockContent: BlockContent[] = [
        {
          type: 'markdown',
          value: '#hello',
        },
        {
          type: 'plot',
          value: {
            data: [{}],
            layout: {},
            config: {},
          },
        },
        {
          type: 'markdown',
          value: '#hello',
        },
      ]

      const resp = findAllBlockContentByType<MarkdownContent[]>('markdown', blockContent)

      const type1 = resp?.[0]?.type
      const value1 = resp?.[0]?.value
      const type2 = resp?.[1]?.type
      const value2 = resp?.[1]?.value

      expect(type1).toEqual('markdown')
      expect(value1).toEqual('#hello')
      expect(type2).toEqual('markdown')
      expect(value2).toEqual('#hello')
      expect(resp?.length).toEqual(2)
    })

    it('returns multiple json content based on type', () => {
      const blockContent: BlockContent[] = [
        {
          type: 'json',
          value: {
            name: 'first_record_count_records',
            format: {},
            kind: 'dataset_metric',
            value: {
              dataset_slug: 'testing_state_machine',
              group_slug: 'group_2',
            },
            field_depends_on: [],
          },
        },
        {
          type: 'markdown',
          value: '#hello',
        },
        {
          type: 'json',
          value: {
            name: 'first_record_count_records',
            format: {},
            kind: 'dataset_metric',
            value: {
              dataset_slug: 'testing_state_machine',
              group_slug: 'group_2',
            },
            field_depends_on: [],
          },
        },
      ]

      const resp = findAllBlockContentByType<JsonContent[]>('json', blockContent)

      const type1 = resp?.[0]?.type
      const value1 = resp?.[0]?.value
      const type2 = resp?.[1]?.type
      const value2 = resp?.[1]?.value

      const name1 = value1?.name
      const name2 = value2?.name

      expect(type1).toEqual('json')
      expect(name1).toEqual('first_record_count_records')
      expect(type2).toEqual('json')
      expect(name2).toEqual('first_record_count_records')
      expect(resp?.length).toEqual(2)
    })
  })

  describe('#groupPropertiesByTab', () => {
    it('returns grouped properties by tab', () => {
      const tabsConfig = {
        tabs: [
          {
            label: 'Tab A',
            property_names: ['slug', 'notes'],
            tab_id: 'tab_a',
            redirect_tab_ids: [],
          },
        ],
      }
      const properties = [
        { content: React.createElement('div'), name: 'slug', disabled: false, readonly: false },
        { content: React.createElement('div'), name: 'other_a', disabled: false, readonly: false },
        { content: React.createElement('div'), name: 'notes', disabled: false, readonly: false },
        { content: React.createElement('div'), name: 'other_b', disabled: false, readonly: false },
        { content: React.createElement('div'), name: 'other_c', disabled: false, readonly: false },
      ]
      expect(groupPropertiesByTab(tabsConfig, properties)).toMatchSnapshot()
    })
  })

  describe('#getAllDependentFields', () => {
    it('should return all dependent fields for a set of fields', () => {
      const fields = [
        {
          name: 'engagement_rate_local_trvl',
          kind: 'value',
          format: 'percent',
          value: '$$eval({engagement_rate}*(1+{percent_diff_in_distribution_local_trvl}))',
          field_depends_on: ['engagement_rate', 'percent_diff_in_distribution_local_trvl'],
        },
        {
          name: 'dist_all_category',
          kind: 'value',
          format: 'percent',
          value: '$$eval(1-{percent_of_LCL_trvl})',
          field_depends_on: ['percent_of_LCL_trvl'],
        },
      ]

      const expected = ['engagement_rate', 'percent_diff_in_distribution_local_trvl', 'percent_of_LCL_trvl']
      expect(getAllDependentFields(fields)).toEqual(expect.arrayContaining(expected))
    })

    it('should return an empty array for fields with no field_depends_on values', () => {
      const fields = [
        {
          name: 'TRVL_percent_of_total_taps',
          kind: 'dataset_metric',
          format: 'percent',
          value: {
            dataset_slug: 'content_viewed_before_transactions',
          },
          field_depends_on: [],
        },
        {
          name: 'TRVL_percent_of_total_taps_w_transactions',
          kind: 'dataset_metric',
          format: 'percent',
          value: {
            dataset_slug: 'content_viewed_before_transactions',
          },
          field_depends_on: [],
        },
      ]

      expect(getAllDependentFields(fields)).toEqual([])
    })
    it('should return an empty array when passed an empty array', () => {
      expect(getAllDependentFields([])).toEqual([])
    })
    it('should match snapshot', () => {
      expect(getAllDependentFields(fieldConfigs)).toMatchSnapshot()
    })
  })

  describe('#getDependentFieldsForField', () => {
    it('should return an empty array for a field that is NOT referenced by any other field', () => {
      const fieldConfigs = [
        {
          name: 'last_month_txns',
          kind: 'dataset_metric',
          format: {},
          value: {
            dataset_slug: 'content_and_transactions',
          },
          field_depends_on: ['last_month'],
        },
        {
          name: 'last_month_conv_to_completed_transaction',
          kind: 'dataset_metric',
          format: 'percent',
          value: {
            dataset_slug: 'content_and_transactions',
          },
          field_depends_on: ['last_month'],
        },
      ]

      expect(getDependentFieldsForField({ fieldConfigs, fieldConfig: fieldConfigs[0] })).toEqual([])
    })
    it('should return an array of fields that reference a field', () => {
      const fieldConfigs = [
        {
          name: 'percent_of_LCL_trvl',
          kind: 'dataset_metric',
          format: 'percent',
          value: {
            dataset_slug: 'card_taps_with_swipes',
          },
          field_depends_on: [],
        },
        {
          name: 'dist_all_category',
          kind: 'value',
          format: 'percent',
          value: '$$eval(1-{percent_of_LCL_trvl})',
          field_depends_on: ['percent_of_LCL_trvl'],
        },
      ]

      expect(getDependentFieldsForField({ fieldConfigs, fieldConfig: fieldConfigs[0] })).toEqual(['dist_all_category'])
    })

    it('should match the snapshot', () => {
      // fieldConfigs[22] has name: 'last_month_total_taps'
      expect(getDependentFieldsForField({ fieldConfigs, fieldConfig: fieldConfigs[22] })).toMatchSnapshot()
    })
  })
})
