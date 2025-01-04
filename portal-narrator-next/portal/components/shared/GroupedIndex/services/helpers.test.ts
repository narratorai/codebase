import _ from 'lodash'
import { getAllPossibleGroupKeys, groupItems, searchItems } from './helpers'

const mockItems = [
  {
    name: 'Fancy Name',
    description: 'This is a description',
    category: 'fancy',
    validated: false,
    null_category: null,
    other: 'Should not be searched',
    nested: {
      value: 'nested is fun!',
    },
    only_in_fancy_name: 'better only see me in fancy!',
  },
  {
    name: 'Hipster Ipsum',
    description: 'Banjo anim ramps chia VHS batch flexitarian bespoke meh pinterest esse beard.',
    category: 'hipster',
    validated: false,
    null_category: null,
    other: 'Should not be searched',
    nested: {
      value: 'Green juice cillum ut, 3 wolf moon',
    },
  },
]

describe('GroupedIndex/services/helpers', () => {
  describe('#getAllPossibleGroupKeys', () => {
    it('gets all group keys including GROUP_RECENT keys', () => {
      expect(
        getAllPossibleGroupKeys({
          items: mockItems,
          groupConfigs: [{ label: 'category', group: 'category group', pathToValue: 'category' }],
        })
      ).toMatchSnapshot()
    })

    describe('with groupLabelOverrides', () => {
      it('gets all group keys from overrides as well', () => {
        expect(
          getAllPossibleGroupKeys({
            items: mockItems,
            groupConfigs: [
              {
                label: 'validated',
                group: 'validated',
                pathToValue: 'validated',
                groupLabelOverrides: [
                  { key: 'true', label: 'Validated' },
                  { key: 'false', label: 'Not Validated' },
                ],
              },
            ],
          })
        ).toMatchSnapshot()
      })
    })
  })

  describe('#groupItems', () => {
    it('groups items', () => {
      expect(
        groupItems({
          items: mockItems,
          groupConfigs: [{ label: 'category', group: 'category group', pathToValue: 'category' }],
          selectedGroup: 'category group',
        })
      ).toMatchSnapshot()
    })

    describe('with null group values', () => {
      it('includes items with null groups into an "Uncategorized" group', () => {
        expect(
          groupItems({
            items: mockItems,
            groupConfigs: [{ label: 'null_category', group: 'null_category', pathToValue: 'null_category' }],
            selectedGroup: 'null_category',
          })
        ).toMatchSnapshot()
      })

      it('should put falsy values at the bottom', () => {
        const groupedItems = groupItems({
          items: mockItems,
          groupConfigs: [
            { label: 'only_in_fancy_name', group: 'only_in_fancy_name', pathToValue: 'only_in_fancy_name' },
          ],
          selectedGroup: 'only_in_fancy_name',
        })

        expect(_.last(_.keys(groupedItems))).toBe('undefined')
      })
    })

    describe('with groupLabelOverrides', () => {
      it('only overrides the default group names from _.groupBy', () => {
        expect(
          groupItems({
            items: mockItems,
            groupConfigs: [
              {
                label: 'validated',
                group: 'validated',
                pathToValue: 'validated',
                groupLabelOverrides: [
                  { key: 'true', label: 'Validated' },
                  { key: 'false', label: 'Not Validated' },
                ],
              },
            ],
            selectedGroup: 'validated',
          })
        ).toMatchSnapshot()
      })

      it('adds values from one group to both when passed addToGroup', () => {
        expect(
          groupItems({
            items: mockItems,
            groupConfigs: [
              {
                label: 'category',
                group: 'category',
                pathToValue: 'category',
                addToGroup: [{ from: 'fancy', to: 'hipster' }],
              },
            ],
            selectedGroup: 'category',
          })
        ).toMatchSnapshot()
      })
    })
  })

  describe('#searchItems', () => {
    describe('with lower case values', () => {
      it('returns filtered items with mixed casing', () => {
        expect(
          searchItems({
            items: mockItems,
            searchablePaths: ['name', 'description'],
            searchValue: 'hipster',
          })
        ).toEqual([mockItems[1]])
      })
    })

    describe('with nested searchablePaths', () => {
      it('returns filtered items', () => {
        expect(
          searchItems({
            items: mockItems,
            searchablePaths: ['nested.value'],
            searchValue: 'nested is',
          })
        ).toEqual([mockItems[0]])
      })
    })

    describe('with searchablePath as a function', () => {
      it('returns an item when conditions are met', () => {
        const conditionalFunction = (item: any, searchValue: string) => {
          const category = _.get(item, 'category')
          const searchValueInLabel = _.includes(_.lowerCase(category), _.lowerCase(searchValue))

          if (searchValueInLabel && item.description === 'This is a description') {
            return true
          }

          return false
        }
        expect(
          searchItems({
            items: mockItems,
            searchablePaths: [conditionalFunction],
            searchValue: 'fancy',
          })
        ).toEqual([mockItems[0]])
      })

      it('does not return any items when conditions are not met', () => {
        const conditionalFunction = (item: any, searchValue: string) => {
          const category = _.get(item, 'category')
          const searchValueInLabel = _.includes(_.lowerCase(category), _.lowerCase(searchValue))

          if (searchValueInLabel && item.description === 'Incorrect!!!!') {
            return true
          }

          return false
        }

        expect(
          searchItems({
            items: mockItems,
            searchablePaths: [conditionalFunction],
            searchValue: 'fancy',
          })
        ).toHaveLength(0)
      })
    })
  })
})
