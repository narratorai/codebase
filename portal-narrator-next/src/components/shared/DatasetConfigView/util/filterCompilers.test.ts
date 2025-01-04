/* eslint-disable max-lines-per-function */
// filterCompilers.test.ts

import {
  BooleanOperator,
  NullOperator,
  NumberArrayOperator,
  NumberOperator,
  StringArrayOperator,
  StringOperator,
  TimeOperator,
  TimeReference,
  TimeResolution,
} from '../../../../stores/datasets'
import { compileFilter } from './filterCompilers'

describe('compileFilter', () => {
  it('should return tokens that produce "<b>is null</b>"', () => {
    const filter = {
      operator: NullOperator.IsNull,
    }
    const result = compileFilter(filter)
    const expected = [{ format: 'bold', value: 'is null' }]
    expect(result).toEqual(expected)
  })

  it('should return tokens that produce "<b>not is null</b>"', () => {
    const filter = {
      operator: NullOperator.NotIsNull,
    }
    const result = compileFilter(filter)
    const expected = [{ format: 'bold', value: 'not is null' }]
    expect(result).toEqual(expected)
  })

  it('should return tokens that produce "equal <b>true</b>"', () => {
    const filter = {
      operator: BooleanOperator.Equal,
      value: true,
    }
    const result = compileFilter(filter)
    const expected = [
      { format: 'regular', value: 'equal' },
      { format: 'regular', value: ' ' },
      { format: 'bold', value: 'true' },
    ]
    expect(result).toEqual(expected)
  })

  it('should return tokens that produce "not equal <b>true</b>"', () => {
    const filter = {
      operator: BooleanOperator.NotEqual,
      value: true,
    }
    const result = compileFilter(filter)
    const expected = [
      { format: 'regular', value: 'not equal' },
      { format: 'regular', value: ' ' },
      { format: 'bold', value: 'true' },
    ]
    expect(result).toEqual(expected)
  })

  it('should return tokens that produce "equal <b>false</b>"', () => {
    const filter = {
      operator: BooleanOperator.Equal,
      value: false,
    }
    const result = compileFilter(filter)
    const expected = [
      { format: 'regular', value: 'equal' },
      { format: 'regular', value: ' ' },
      { format: 'bold', value: 'false' },
    ]
    expect(result).toEqual(expected)
  })

  it('should return tokens that produce "not equal <b>false</b>"', () => {
    const filter = {
      operator: BooleanOperator.NotEqual,
      value: false,
    }
    const result = compileFilter(filter)
    const expected = [
      { format: 'regular', value: 'not equal' },
      { format: 'regular', value: ' ' },
      { format: 'bold', value: 'false' },
    ]
    expect(result).toEqual(expected)
  })

  it('should return tokens that produce "equal <b>5</b>"', () => {
    const filter = {
      operator: NumberOperator.Equal,
      value: 5,
    }
    const result = compileFilter(filter)
    const expected = [
      { format: 'regular', value: 'equal' },
      { format: 'regular', value: ' ' },
      { format: 'bold', value: '5' },
    ]
    expect(result).toEqual(expected)
  })

  it('should return tokens that produce "not equal <b>5</b>"', () => {
    const filter = {
      operator: NumberOperator.NotEqual,
      value: 5,
    }
    const result = compileFilter(filter)
    const expected = [
      { format: 'regular', value: 'not equal' },
      { format: 'regular', value: ' ' },
      { format: 'bold', value: '5' },
    ]
    expect(result).toEqual(expected)
  })

  it('should return tokens that produce "greater than <b>5</b>"', () => {
    const filter = {
      operator: NumberOperator.GreaterThan,
      value: 5,
    }
    const result = compileFilter(filter)
    const expected = [
      { format: 'regular', value: 'greater than' },
      { format: 'regular', value: ' ' },
      { format: 'bold', value: '5' },
    ]
    expect(result).toEqual(expected)
  })

  it('should return tokens that produce "less than <b>5</b>"', () => {
    const filter = {
      operator: NumberOperator.LessThan,
      value: 5,
    }
    const result = compileFilter(filter)
    const expected = [
      { format: 'regular', value: 'less than' },
      { format: 'regular', value: ' ' },
      { format: 'bold', value: '5' },
    ]
    expect(result).toEqual(expected)
  })

  it('should return tokens that produce "greater than or equal <b>5</b>"', () => {
    const filter = {
      operator: NumberOperator.GreaterThanOrEqual,
      value: 5,
    }
    const result = compileFilter(filter)
    const expected = [
      { format: 'regular', value: 'greater than or equal' },
      { format: 'regular', value: ' ' },
      { format: 'bold', value: '5' },
    ]
    expect(result).toEqual(expected)
  })

  it('should return tokens that produce "less than or equal <b>5</b>"', () => {
    const filter = {
      operator: NumberOperator.LessThanOrEqual,
      value: 5,
    }
    const result = compileFilter(filter)
    const expected = [
      { format: 'regular', value: 'less than or equal' },
      { format: 'regular', value: ' ' },
      { format: 'bold', value: '5' },
    ]
    expect(result).toEqual(expected)
  })

  it('should return tokens that produce "is in <b>5</b>"', () => {
    const filter = {
      operator: NumberArrayOperator.IsIn,
      values: [5],
    }
    const result = compileFilter(filter)
    const expected = [
      { format: 'regular', value: 'is in' },
      { format: 'regular', value: ' ' },
      { format: 'bold', value: '5' },
    ]
    expect(result).toEqual(expected)
  })

  it('should return tokens that produce "is in <b>5, 3, 1</b>"', () => {
    const filter = {
      operator: NumberArrayOperator.IsIn,
      values: [5, 3, 1],
    }
    const result = compileFilter(filter)
    const expected = [
      { format: 'regular', value: 'is in' },
      { format: 'regular', value: ' ' },
      { format: 'bold', value: '5, 3, 1' },
    ]
    expect(result).toEqual(expected)
  })

  it('should return tokens that produce "equal `<b>some string</b>`"', () => {
    const filter = {
      operator: StringOperator.Equal,
      value: 'some string',
    }
    const result = compileFilter(filter)
    const expected = [
      { format: 'regular', value: 'equal' },
      { format: 'regular', value: ' ' },
      { format: 'bold', value: `'some string'` },
    ]
    expect(result).toEqual(expected)
  })

  it('should return tokens that produce "not equal `<b>some string</b>`"', () => {
    const filter = {
      operator: StringOperator.NotEqual,
      value: 'some string',
    }
    const result = compileFilter(filter)
    const expected = [
      { format: 'regular', value: 'not equal' },
      { format: 'regular', value: ' ' },
      { format: 'bold', value: `'some string'` },
    ]
    expect(result).toEqual(expected)
  })

  it('should return tokens that produce "contains `<b>some string</b>`"', () => {
    const filter = {
      operator: StringOperator.Contains,
      value: 'some string',
    }
    const result = compileFilter(filter)
    const expected = [
      { format: 'regular', value: 'contains' },
      { format: 'regular', value: ' ' },
      { format: 'bold', value: `'some string'` },
    ]
    expect(result).toEqual(expected)
  })

  it('should return tokens that produce "is in `<b>some string</b>`"', () => {
    const filter = {
      operator: StringArrayOperator.IsIn,
      values: ['some string'],
    }
    const result = compileFilter(filter)
    const expected = [
      { format: 'regular', value: 'is in' },
      { format: 'regular', value: ' ' },
      { format: 'bold', value: `'some string'` },
    ]
    expect(result).toEqual(expected)
  })

  it('should return tokens that produce "is in `<b>some string</b>`, `<b>another string</b>`"', () => {
    const filter = {
      operator: StringArrayOperator.IsIn,
      values: ['some string', 'another string'],
    }
    const result = compileFilter(filter)
    const expected = [
      { format: 'regular', value: 'is in' },
      { format: 'regular', value: ' ' },
      { format: 'bold', value: `'some string', 'another string'` },
    ]
    expect(result).toEqual(expected)
  })

  it('should return tokens that produce "from <b>5 days ago</b>"', () => {
    const filter = {
      operator: TimeOperator.TimeRange,
      fromCondition: {
        reference: TimeReference.Relative,
        details: {
          resolution: TimeResolution.Day,
          value: 5,
        },
      },
    }
    const result = compileFilter(filter)
    const expected = [
      { format: 'regular', value: 'from' },
      { format: 'regular', value: ' ' },
      { format: 'bold', value: '5' },
      { format: 'regular', value: ' ' },
      { format: 'bold', value: 'days' },
      { format: 'regular', value: ' ' },
      { format: 'bold', value: 'ago' },
    ]
    expect(result).toEqual(expected)
  })

  it('should return tokens that produce "from <b>2021-01-01T00:00:00Z</b>"', () => {
    const filter = {
      operator: TimeOperator.TimeRange,
      fromCondition: {
        reference: TimeReference.Absolute,
        details: {
          dateTime: '2021-01-01T00:00:00Z',
        },
      },
    }
    const result = compileFilter(filter)
    const expected = [
      { format: 'regular', value: 'from' },
      { format: 'regular', value: ' ' },
      { format: 'bold', value: '2021-01-01T00:00:00Z' },
    ]
    expect(result).toEqual(expected)
  })

  it('should return tokens that produce "from start of week"', () => {
    const filter = {
      operator: TimeOperator.TimeRange,
      fromCondition: {
        reference: TimeReference.StartOf,
        details: {
          resolution: TimeResolution.Week,
        },
      },
    }
    const result = compileFilter(filter)
    const expected = [
      { format: 'regular', value: 'from' },
      { format: 'regular', value: ' ' },
      { format: 'regular', value: 'start of' },
      { format: 'regular', value: ' ' },
      { format: 'regular', value: 'week' },
    ]
    expect(result).toEqual(expected)
  })
})
