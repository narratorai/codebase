import { compileBooleanExpression, compileJoinConditonExpression } from './expressionCompilers'

describe('compileBooleanExpression', () => {
  it('should return tokens that produce "not ((contains `active` or contains `draft`) and not contains any `completed`, `inactive`"', () => {
    const filters = {
      logicalOperator: 'AND',
      operands: [
        {
          logicalOperator: 'OR',
          operands: [
            {
              operator: 'contains',
              value: 'active',
            },
            {
              operator: 'contains',
              value: 'draft',
            },
          ],
        },
        {
          operator: 'not_contains_any',
          values: ['completed', 'inactive'],
        },
      ],
      isNot: true,
    }
    const result = compileBooleanExpression(filters)
    const expected = [
      { format: 'regular', value: 'not' },
      { format: 'regular', value: ' ' },
      { format: 'regular', value: '(' },
      { format: 'regular', value: '(' },
      { format: 'regular', value: 'contains' },
      { format: 'regular', value: ' ' },
      { format: 'bold', value: `'active'` },
      { format: 'regular', value: ' ' },
      { format: 'regular', value: 'or' },
      { format: 'regular', value: ' ' },
      { format: 'regular', value: 'contains' },
      { format: 'regular', value: ' ' },
      { format: 'bold', value: `'draft'` },
      { format: 'regular', value: ')' },
      { format: 'regular', value: ' ' },
      { format: 'regular', value: 'and' },
      { format: 'regular', value: ' ' },
      { format: 'regular', value: 'not contains any' },
      { format: 'regular', value: ' ' },
      { format: 'bold', value: `'completed', 'inactive'` },
      { format: 'regular', value: ')' },
    ]
    expect(result).toEqual(expected)
  })
})

describe('compileJoinConditonExpression', () => {
  it('should return tokens that produce "(<b>Column A</b> not equal <b>Column B</b> or <b>Column C</b> less than <b>Column D</b>) and <b>Column B</b> greater than <b>Column C</b>"', () => {
    const joins = {
      logicalOperator: 'AND',
      operands: [
        {
          logicalOperator: 'OR',
          operands: [
            {
              operator: 'not_equal',
              cohortColumn: {
                label: 'Column A',
              },
              column: {
                label: 'Column B',
              },
            },
            {
              operator: 'less_than',
              cohortColumn: {
                label: 'Column C',
              },
              column: {
                label: 'Column D',
              },
            },
          ],
        },
        {
          operator: 'greater_than',
          cohortColumn: {
            label: 'Column B',
          },
          column: {
            label: 'Column C',
          },
        },
      ],
    }
    const result = compileJoinConditonExpression(joins)
    const expected = [
      { format: 'regular', value: '(' },
      { format: 'bold', value: 'Column A' },
      { format: 'regular', value: ' ' },
      { format: 'regular', value: 'not equal' },
      { format: 'regular', value: ' ' },
      { format: 'bold', value: 'Column B' },
      { format: 'regular', value: ' ' },
      { format: 'regular', value: 'or' },
      { format: 'regular', value: ' ' },
      { format: 'bold', value: 'Column C' },
      { format: 'regular', value: ' ' },
      { format: 'regular', value: 'less than' },
      { format: 'regular', value: ' ' },
      { format: 'bold', value: 'Column D' },
      { format: 'regular', value: ')' },
      { format: 'regular', value: ' ' },
      { format: 'regular', value: 'and' },
      { format: 'regular', value: ' ' },
      { format: 'bold', value: 'Column B' },
      { format: 'regular', value: ' ' },
      { format: 'regular', value: 'greater than' },
      { format: 'regular', value: ' ' },
      { format: 'bold', value: 'Column C' },
    ]
    expect(result).toEqual(expected)
  })
})
