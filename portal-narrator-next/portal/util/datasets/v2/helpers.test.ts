import { makeColumnSearchSelectOptions } from './helpers'
import { makeFilterValueString } from './filterHelpers'
import { COLUMN_TYPE_STRING } from '../constants'
import { replaceColumnLabelWithId } from './freehandHelpers'
import graphActivitiesRaw from '../../../../test/fixtures/dataset/graphActivities.json'
import queryDefinitionRaw from '../../../../test/fixtures/dataset/queryDefinition.json'
import { IActivity } from 'graph/generated'
import { IDatasetQueryDefinition } from '../interfaces'

const graphActivities = graphActivitiesRaw as IActivity[]
const queryDefinition = queryDefinitionRaw as unknown as IDatasetQueryDefinition

describe('#makeColumnSearchSelectOptions', () => {
  describe('with no groupSlug', () => {
    it('returns grouped parent columns by activity', () => {
      const groupedColumns = makeColumnSearchSelectOptions({
        activities: graphActivities,
        queryDefinition,
      })

      expect(groupedColumns).toMatchSnapshot()
    })

    describe('with columnTypes limitation', () => {
      it('disabled columns properly', () => {
        const groupedColumns = makeColumnSearchSelectOptions({
          activities: graphActivities,
          queryDefinition,
          columnTypes: [COLUMN_TYPE_STRING],
        })

        expect(groupedColumns).toMatchSnapshot()
      })
    })

    describe('with omitColumnIds limitation', () => {
      it('disabled columns properly', () => {
        const groupedColumns = makeColumnSearchSelectOptions({
          activities: graphActivities,
          queryDefinition,
          omitColumnIds: ['limiting_started_session_3aQ4ZrGo_ts'],
        })

        expect(groupedColumns).toMatchSnapshot()
      })
    })
  })

  describe('with groupSlug', () => {
    it('returns group columns by type', () => {
      const groupedColumns = makeColumnSearchSelectOptions({
        activities: graphActivities,
        queryDefinition,
        groupSlug: 'week',
      })

      expect(groupedColumns).toMatchSnapshot()
    })
  })
})

describe('#replaceColumnLabelWithId', () => {
  it('replaces a label with an id', () => {
    expect(replaceColumnLabelWithId({ text: 'replace', label: 'replace', id: '1234' })).toBe('1234')
  })
  it('replaces a label with a space after label in text', () => {
    expect(replaceColumnLabelWithId({ text: 'replace me', label: 'replace', id: '1234' })).toBe('1234 me')
  })
  it('replaces a label with a ) after label in text', () => {
    expect(replaceColumnLabelWithId({ text: '(replace) me', label: 'replace', id: '1234' })).toBe('(1234) me')
  })

  it('replaces a label with a + after label in text', () => {
    expect(replaceColumnLabelWithId({ text: 'replace+ me', label: 'replace', id: '1234' })).toBe('1234+ me')
  })

  it('replaces a label with a + after label in text even if there is no space between labels and math operator', () => {
    expect(replaceColumnLabelWithId({ text: 'replace+me', label: 'replace', id: '1234' })).toBe('1234+me')
  })

  it('replaces a label with a - after label in text', () => {
    expect(replaceColumnLabelWithId({ text: 'replace- me', label: 'replace', id: '1234' })).toBe('1234- me')
  })

  it('replaces a label with a * after label in text', () => {
    expect(replaceColumnLabelWithId({ text: 'replace* me', label: 'replace', id: '1234' })).toBe('1234* me')
  })

  it('replaces a label with a / after label in text', () => {
    expect(replaceColumnLabelWithId({ text: 'replace/ me', label: 'replace', id: '1234' })).toBe('1234/ me')
  })

  it('replaces a label with a % after label in text', () => {
    expect(replaceColumnLabelWithId({ text: 'replace% me', label: 'replace', id: '1234' })).toBe('1234% me')
  })

  it('replaces a label with a . after label in text', () => {
    expect(replaceColumnLabelWithId({ text: 'replace. me', label: 'replace', id: '1234' })).toBe('1234. me')
  })

  it('replaces a label with a , after label in text', () => {
    expect(replaceColumnLabelWithId({ text: 'replace, me', label: 'replace', id: '1234' })).toBe('1234, me')
  })

  it('replaces a label with a ] after label in text', () => {
    expect(replaceColumnLabelWithId({ text: 'replace] me', label: 'replace', id: '1234' })).toBe('1234] me')
  })

  it('replaces a label with a [ before the label and a ] after label in text', () => {
    expect(replaceColumnLabelWithId({ text: '[replace] me', label: 'replace', id: '1234' })).toBe('[1234] me')
  })

  it('replaces all labels that match', () => {
    expect(replaceColumnLabelWithId({ text: 'replace me replace you', label: 'replace', id: '1234' })).toBe(
      '1234 me 1234 you'
    )
  })
  it('replaces all labels that match even if one has a ) or space after it', () => {
    expect(replaceColumnLabelWithId({ text: 'replace me (replace) you', label: 'replace', id: '1234' })).toBe(
      '1234 me (1234) you'
    )
  })

  it('does not replace a label with a ( after label in text', () => {
    expect(replaceColumnLabelWithId({ text: 'replace(me)', label: 'replace', id: '1234' })).toBe('replace(me)')
  })
  it('does not replace a label with an extra alpha character after label in text', () => {
    expect(replaceColumnLabelWithId({ text: 'replaced', label: 'replace', id: '1234' })).toBe('replaced')
  })
  it('does not replace a label with an extra special character after label in text', () => {
    expect(replaceColumnLabelWithId({ text: 'replace_', label: 'replace', id: '1234' })).toBe('replace_')
  })
  it('does not replace a label with an extra number after label in text', () => {
    expect(replaceColumnLabelWithId({ text: 'replace2', label: 'replace', id: '1234' })).toBe('replace2')
  })

  it('replaces only labels that match and do not have an alpha character after label in text', () => {
    expect(replaceColumnLabelWithId({ text: 'replace me replaced you', label: 'replace', id: '1234' })).toBe(
      '1234 me replaced you'
    )
  })
  it('replaces only labels that match and do not have a number after label in text', () => {
    expect(replaceColumnLabelWithId({ text: 'replace me replace2 you', label: 'replace', id: '1234' })).toBe(
      '1234 me replace2 you'
    )
  })
  it('replaces only labels that match and do not have a special character after label in text', () => {
    expect(replaceColumnLabelWithId({ text: 'replace me replace_ you', label: 'replace', id: '1234' })).toBe(
      '1234 me replace_ you'
    )
  })

  it('replaces labels containing special characters', () => {
    expect(
      replaceColumnLabelWithId({
        text: 'replace (new) [first] * . $ me replace_ you',
        label: 'replace (new) [first] * . $',
        id: '1234',
      })
    ).toBe('1234 me replace_ you')
  })

  it('replaces labels containing dashes', () => {
    expect(
      replaceColumnLabelWithId({
        text: 'my column replace - version me replace_ you',
        label: 'replace - version',
        id: '1234',
      })
    ).toBe('my column 1234 me replace_ you')
  })
})

const timezone = 'America/Los_Angeles'
describe('#makeFilterValueString', () => {
  it('returns a string for string input', () => {
    expect(makeFilterValueString('testing', timezone)).toBe('testing')
  })

  it('returns a string for 0 input', () => {
    expect(makeFilterValueString(0, timezone)).toBe('0')
  })

  it('returns a string for number input', () => {
    expect(makeFilterValueString(3, timezone)).toBe('3')
  })

  it('returns a formatted string for timestamp', () => {
    expect(makeFilterValueString('2022-06-14T07:00:00.000Z', timezone)).toBe('Jun 14th 2022, 12:00am PDT')
  })
})
