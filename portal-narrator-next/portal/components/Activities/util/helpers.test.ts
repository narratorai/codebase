import { transformationSearch, columnRenameSearch } from './helpers'

const activity1 = {
  id: '1',
  transformations: [
    {
      transformation: {
        name: 'first name',
      },
    },
    {
      transformation: {
        name: 'second name',
      },
    },
  ],
  column_renames: [
    {
      id: '1',
      label: 'first label',
      name: 'reg_name',
    },
    {
      id: '2',
      label: 'second label',
      name: 'ordinary_name',
    },
  ],
}

const activity2 = {
  id: '2',
  transformations: [
    {
      transformation: {
        name: 'first name',
      },
    },
    {
      transformation: {
        name: 'second name',
      },
    },
    {
      transformation: {
        name: 'third name',
      },
    },
    {
      transformation: {
        name: 'fourth name',
      },
    },
  ],
  column_renames: [
    {
      id: '1',
      label: 'first label',
      name: 'feature_1',
    },
    {
      id: '2',
      label: 'second label',
      name: 'reg_name',
    },
    {
      id: '3',
      label: 'third label',
      name: 'ordinary_name',
    },
  ],
}

const activity3 = {
  id: '3',
  transformations: [],
  column_renames: [],
}

describe('Activities/util/helpers', () => {
  describe('#transformationSearch', () => {
    it('returns true for a match', () => {
      expect(transformationSearch(activity1, 'second')).toBe(true)
    })
    it('returns false when no matches', () => {
      expect(transformationSearch(activity1, 'asfdfdasasdfdsafdsafsad')).toBe(false)
    })
  })

  describe('#columnRenameSearch', () => {
    it('returns true for match with feature column', () => {
      expect(columnRenameSearch(activity2, 'first')).toBe(true)
    })
    it('returns false for match without feature column', () => {
      expect(columnRenameSearch(activity1, 'first')).toBe(false)
    })
    it('returns false if no match', () => {
      expect(columnRenameSearch(activity1, 'asdfsdafasdf')).toBe(false)
    })
  })
})
