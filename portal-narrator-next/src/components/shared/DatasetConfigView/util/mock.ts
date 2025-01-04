import camelcaseKeys from 'camelcase-keys'

const data = {
  kind: 'activity',
  table_id: '928e013a-2a95-4497-b17e-487b70817202',
  sql_query: null,
  cohort_time: null,
  cohort_activity: {
    id: 'aopened_email_16af6166',
    slugs: ['opened_email'],
    activity_ids: ['788999a7-16f4-4811-b49e-34e0bd11a46c'],
    has_source: true,
    display_name: 'Opened Email',
    prefilter_columns: [
      {
        label: 'Campaign Type',
        type: 'string',
        applyTimeResolution: null,
        filters: [
          {
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
            is_not: true,
          },
        ],
      },
    ],
    dims: [],
    fetch_type: 'all',
  },
  append_activities: [
    {
      id: 'acompleted_order_ad326bcc',
      slugs: ['completed_order'],
      activity_ids: ['920c93f1-f5dc-44a7-8935-ccd8110dd3d1'],
      has_source: true,
      display_name: 'Completed Order',
      prefilter_columns: [],
      dims: [],
      fetch_type: 'first',
      relation: 'in_between',
      time_refinement: [],
      joins: [{ logical_operator: 'AND', operands: [] }],
      relative_activities: [],
    },
  ],
  columns: [
    {
      id: 'aactivity_id_34f06259',
      label: 'Activity Id',
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
        name: 'activity_id',
        activity_id: 'aopened_email_16af6166',
        dim_id: null,
        applied_function: null,
        percentile: null,
      },
    },
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
      id: 'ajoin_customer_d71187e1',
      label: 'Unique Identifier',
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
        name: 'join_customer',
        activity_id: 'aopened_email_16af6166',
        dim_id: null,
        applied_function: null,
        percentile: null,
      },
    },
    {
      id: 'aactivity_occurrence_7900cbfb',
      label: 'Activity Occurrence',
      type: 'number',
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
        name: 'activity_occurrence',
        activity_id: 'aopened_email_16af6166',
        dim_id: null,
        applied_function: null,
        percentile: null,
      },
    },
    {
      id: 'afeature_campaign_type_775a7670',
      label: 'Campaign Type',
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
        name: 'feature_campaign_type',
        activity_id: 'aopened_email_16af6166',
        dim_id: null,
        applied_function: null,
        percentile: null,
      },
    },
    {
      id: 'ats_c5b168ce',
      label: 'First In Between Completed Orders Timestamp',
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
        activity_id: 'acompleted_order_ad326bcc',
        dim_id: null,
        applied_function: null,
        percentile: null,
      },
    },
    {
      id: 'adid_completed_order_c02f2449',
      label: 'Did Completed Order Between',
      type: 'number',
      filters: [{ logical_operator: 'AND', operands: [], is_not: false }],
      output: true,
      display_format: null,
      pinned: null,
      order: 0,
      auto_metrics: ['sum', 'average'],
      apply_time_resolution: null,
      base_column_id: null,
      details: {
        kind: 'computed',
        raw_str: 'exists(ats_c5b168ce)',
        used_custom_functions: false,
        form_config: null,
        activity_id: null,
      },
    },
    {
      id: 'aday_completed_order_2feb4dd3',
      label: 'Days To Completed Order',
      type: 'number',
      filters: [{ logical_operator: 'AND', operands: [], is_not: false }],
      output: true,
      display_format: null,
      pinned: null,
      order: 0,
      auto_metrics: ['average'],
      apply_time_resolution: null,
      base_column_id: null,
      details: {
        kind: 'computed',
        raw_str: "time_diff('day', join_ts.local, ats_c5b168ce)",
        used_custom_functions: false,
        form_config: null,
        activity_id: null,
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
  ],
  order: [{ column_id: 'ats_5548547d', asc: false }],
  all_tabs: [
    {
      kind: 'parent',
      slug: 'parent_duplicate',
      label: 'PARENT',
      parent_filters: [{ logical_operator: 'AND', operands: [] }],
      order: [{ column_id: 'ats_5548547d', asc: false }],
      hide_show: { mode: 'show', column_ids: ['aactivity_id_34f06259', 'ats_5548547d', 'acustomer_00a530c1'] },
      columns: [],
      aggregate_dims: [],
      plots: [],
    },
    {
      kind: 'group',
      slug: 'month0798ca01',
      label: 'by Month',
      parent_filters: [{ logical_operator: 'AND', operands: [] }],
      order: [{ column_id: 'amonth_fb0721d9', asc: false }],
      hide_show: null,
      columns: [
        {
          id: 'amonth_fb0721d9',
          label: 'Month',
          type: 'timestamp',
          filters: [{ logical_operator: 'AND', operands: [], is_not: false }],
          output: true,
          display_format: null,
          pinned: null,
          order: 0,
          details: { kind: 'group', column_id: 'amonth_d1989ec4', pivoted: false, use_as_column: false },
        },
        {
          id: 'atotal_opened_email_rows_a25753c1',
          label: 'Total Opened Email Rows',
          type: 'number',
          filters: [{ logical_operator: 'AND', operands: [], is_not: false }],
          output: true,
          display_format: 'number',
          pinned: null,
          order: 0,
          details: {
            kind: 'metric',
            agg_function: 'count_all',
            pivoted_on: null,
            column_id: null,
            percentile: null,
            conditioned_on_columns: null,
          },
        },
        {
          id: 'atotal_completed_order_between_6325f4ed',
          label: 'Total Completed Order Between',
          type: 'number',
          filters: [{ logical_operator: 'AND', operands: [], is_not: false }],
          output: true,
          display_format: 'number',
          pinned: null,
          order: 0,
          details: {
            kind: 'metric',
            agg_function: 'sum',
            pivoted_on: null,
            column_id: 'adid_completed_order_c02f2449',
            percentile: null,
            conditioned_on_columns: null,
          },
        },
        {
          id: 'aconversion_rate_to_completed_o_ab730c8b',
          label: 'Conversion Rate to Completed Order Between',
          type: 'number',
          filters: [{ logical_operator: 'AND', operands: [], is_not: false }],
          output: true,
          display_format: 'percent',
          pinned: null,
          order: 0,
          details: {
            kind: 'metric',
            agg_function: 'average',
            pivoted_on: null,
            column_id: 'adid_completed_order_c02f2449',
            percentile: null,
            conditioned_on_columns: null,
          },
        },
        {
          id: 'aaverage_days_to_completed_orde_5e662212',
          label: 'Average Days To Completed Order',
          type: 'number',
          filters: [{ logical_operator: 'AND', operands: [], is_not: false }],
          output: true,
          display_format: 'number',
          pinned: null,
          order: 0,
          details: {
            kind: 'metric',
            agg_function: 'average',
            pivoted_on: null,
            column_id: 'aday_completed_order_2feb4dd3',
            percentile: null,
            conditioned_on_columns: null,
          },
        },
      ],
      aggregate_dims: [],
      plots: [
        {
          name: 'Conversion Rate to Completed Order Between by Month',
          slug: 'conversion_rate_to_completed_order_between_by_month',
          config: {
            columns: {
              y2_available: false,
              ys: ['aconversion_rate_to_completed_o_ab730c8b'],
              xs: ['amonth_fb0721d9'],
              color_bys: [],
              y2: null,
            },
            axes: {
              autogen_title: 'Conversion Rate to Completed Order Between by Month',
              title: 'Conversion Rate to Completed Order Between by Month',
              y_axis: 'Conversion Rate to Completed Order Between',
              x_axis: 'Month',
              y_log: false,
              y2_axis: '',
              plot_kind: 'line',
              smooth: true,
              y_start: null,
              y_end: null,
              add_conversion: false,
              show_labels: false,
              add_sliders: true,
              slider_start: 0,
              slider_end: 100,
              is_percent: false,
              hide_legend: false,
              shared_hover: false,
              highlight_on_legend: true,
              add_hover_highlighting: false,
              add_brush: false,
              replace_0_1_with_did: false,
              add_regression_line: null,
              overide_theme_colors: false,
              plot_colors: null,
              y2_color: '#5AD8A6',
              y2_line_dash: true,
              hidden_values: [],
              limit_rows: null,
              cluster_x_values: false,
              add_animation: false,
              animation_duration: 1000,
            },
            annotations: [],
            question: 'what is my email to order rate over time?',
          },
        },
      ],
    },
    {
      kind: 'group',
      slug: 'campaign_typec983506a',
      label: 'by Campaign Type',
      parent_filters: [{ logical_operator: 'AND', operands: [] }],
      order: [{ column_id: 'atotal_opened_email_rows_ab34b2d6', asc: false }],
      hide_show: null,
      columns: [
        {
          id: 'acampaign_type_f38d2167',
          label: 'Campaign Type',
          type: 'string',
          filters: [{ logical_operator: 'AND', operands: [], is_not: false }],
          output: true,
          display_format: null,
          pinned: null,
          order: 0,
          details: {
            kind: 'group',
            column_id: 'afeature_campaign_type_775a7670',
            pivoted: false,
            use_as_column: false,
          },
        },
        {
          id: 'atotal_opened_email_rows_ab34b2d6',
          label: 'Total Opened Email Rows',
          type: 'number',
          filters: [{ logical_operator: 'AND', operands: [], is_not: false }],
          output: true,
          display_format: 'number',
          pinned: null,
          order: 0,
          details: {
            kind: 'metric',
            agg_function: 'count_all',
            pivoted_on: null,
            column_id: null,
            percentile: null,
            conditioned_on_columns: null,
          },
        },
        {
          id: 'atotal_completed_order_between_3c79e80c',
          label: 'Total Completed Order Between',
          type: 'number',
          filters: [{ logical_operator: 'AND', operands: [], is_not: false }],
          output: true,
          display_format: 'number',
          pinned: null,
          order: 0,
          details: {
            kind: 'metric',
            agg_function: 'sum',
            pivoted_on: null,
            column_id: 'adid_completed_order_c02f2449',
            percentile: null,
            conditioned_on_columns: null,
          },
        },
        {
          id: 'aconversion_rate_to_completed_o_18ae94d3',
          label: 'Conversion Rate to Completed Order Between',
          type: 'number',
          filters: [{ logical_operator: 'AND', operands: [], is_not: false }],
          output: true,
          display_format: 'percent',
          pinned: null,
          order: 0,
          details: {
            kind: 'metric',
            agg_function: 'average',
            pivoted_on: null,
            column_id: 'adid_completed_order_c02f2449',
            percentile: null,
            conditioned_on_columns: null,
          },
        },
        {
          id: 'aaverage_days_to_completed_orde_8492cb1a',
          label: 'Average Days To Completed Order',
          type: 'number',
          filters: [{ logical_operator: 'AND', operands: [], is_not: false }],
          output: true,
          display_format: 'number',
          pinned: null,
          order: 0,
          details: {
            kind: 'metric',
            agg_function: 'average',
            pivoted_on: null,
            column_id: 'aday_completed_order_2feb4dd3',
            percentile: null,
            conditioned_on_columns: null,
          },
        },
      ],
      aggregate_dims: [],
      plots: [],
    },
  ],
  version: 2,
  name: 'New Dataset',
}

export default camelcaseKeys(data, { deep: true })
