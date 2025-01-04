import { compileParentColumns } from './columnCompilers'

describe('compileParentColumns', () => {
  it('should return tokens that produce "Add <gt>Timestamp</gt> <gt>Customer</gt> and <gt>Month</gt>"', () => {
    const columns = [
      {
        id: 'ats_5548547d',
        label: 'Timestamp',
        type: 'timestamp',
        filters: [{ logical_operator: 'AND', operands: [], is_not: false }],
        output: true,
        display_format: null,
        pinned: null,
        order: 0,
        auto_metrics: [],
        apply_time_resolution: null,
        base_column_id: null,
        details: {
          kind: 'activity',
          name: 'ts',
          activity_id: 'aopened_email_16af6166',
          dim_id: null,
          applied_function: null,
          percentile: null,
        },
      },
      {
        id: 'acustomer_00a530c1',
        label: 'Customer',
        type: 'string',
        filters: [{ logical_operator: 'AND', operands: [], is_not: false }],
        output: true,
        display_format: null,
        pinned: null,
        order: 0,
        auto_metrics: [],
        apply_time_resolution: null,
        base_column_id: null,
        details: {
          kind: 'activity',
          name: 'customer',
          activity_id: 'aopened_email_16af6166',
          dim_id: null,
          applied_function: null,
          percentile: null,
        },
      },
      {
        id: 'amonth_d1989ec4',
        label: 'Month',
        type: 'timestamp',
        filters: [{ logical_operator: 'AND', operands: [], is_not: false }],
        output: true,
        display_format: null,
        pinned: null,
        order: 0,
        auto_metrics: [],
        apply_time_resolution: null,
        base_column_id: null,
        details: {
          kind: 'computed',
          raw_str: "date_trunc('month', ats_5548547d)",
          used_custom_functions: false,
          form_config: null,
          activity_id: null,
        },
      },
    ]
    const result = compileParentColumns(columns)
    const expected = [
      { format: 'regular', value: 'Add' },
      { format: 'regular', value: ' ' },
      { format: 'greenTag', value: 'Timestamp' },
      { format: 'regular', value: ' ' },
      { format: 'greenTag', value: 'Customer' },
      { format: 'regular', value: ' ' },
      { format: 'regular', value: 'and' },
      { format: 'regular', value: ' ' },
      { format: 'greenTag', value: 'Month' },
    ]
    expect(result).toEqual(expected)
  })
})
