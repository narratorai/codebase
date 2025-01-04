import { Checkbox, Divider, Select, Space, Tag, Typography } from 'antd-next'
import { RefSelectProps, SelectProps } from 'antd-next/es/select'
import { SearchSelect, SearchSelectOptionProps } from 'components/antd/staged'
import { IActivity } from 'graph/generated'
import { filter, flatMap, forEach, get, isEmpty, map, startsWith } from 'lodash'
import { readableColor } from 'polished'
import React, { useMemo } from 'react'
import styled from 'styled-components'
import { colors } from 'util/constants'

import { IActivityWithFeatures } from './ActivityFeaturesTooltip'
import ActivitySelectOption from './ActivitySelectOption'

const SHOW_ENRICHMENT_OPTION_CONTENT = 100

const WEIGHTED_SEARCH_KEYS = [
  {
    name: 'activity.name',
    weight: 50,
  },
  {
    name: 'activity.description',
    weight: 30,
  },
  {
    name: 'activity.feature_1.label',
    weight: 3,
  },
  {
    name: 'activity.feature_2.label',
    weight: 3,
  },
  {
    name: 'activity.feature_3.label',
    weight: 3,
  },
]

const StyledSelectWrapper = styled.div`
  && .antd5-select-selector,
  && .antd5-select-selection-item {
    background-color: ${({ inputColor, theme }: { inputColor: string | undefined; theme: any }) =>
      inputColor ? theme.colors[inputColor] : null};
    color: ${({ inputColor, theme }: { inputColor: string | undefined; theme: any }) =>
      inputColor ? readableColor(theme.colors[inputColor]) : null};
    font-weight: 600;
  }

  && .antd5-select-selection-placeholder {
    color: ${colors.gray400};
  }

  && .antd5-select-selection-item-remove .anticon-close {
    color: ${({ inputColor, theme }: { inputColor: string | undefined; theme: any }) =>
      inputColor ? readableColor(theme.colors[inputColor]) : null};
  }

  && .antd5-select-arrow {
    color: ${({ inputColor, theme }: { inputColor: string | undefined; theme: any }) =>
      inputColor ? readableColor(theme.colors[inputColor]) : null};
  }
`

const getActivityFeatures = (activity: IActivity) =>
  filter(activity.column_renames, (col) => {
    if (col.name && startsWith(col.name, 'feature_') && col.has_data) {
      return col
    }
  })

interface Props extends SelectProps {
  activities?: IActivity[]
  selectRef?: React.RefObject<RefSelectProps>
  inputColor?: string | undefined
  multiSelect?: boolean
  onToggleMultiSelect?(): void
  onToggleShowEnrichmentActivities?(): void
  showEnrichmentActivities?: boolean
}

const ActivitySelect = ({
  activities = [],
  selectRef,
  inputColor,
  multiSelect = false,
  onToggleMultiSelect,
  onToggleShowEnrichmentActivities,
  showEnrichmentActivities = true,
  ...selectProps
}: Props) => {
  const activitiesCount = activities?.length || 0
  const showEnrichment = activitiesCount <= SHOW_ENRICHMENT_OPTION_CONTENT

  // Add feature columns to render/filter on:
  const activitiesWithFeatures: IActivityWithFeatures[] = useMemo(() => {
    if (!showEnrichment) {
      return activities
    }

    let showableActivities = activities
    if (!showEnrichmentActivities) {
      showableActivities = filter(activities, (act) => isEmpty(get(act, 'enriched_by[0].transformation')))
    }

    return map(showableActivities, (activity) => {
      const activityFeatures = getActivityFeatures(activity) as IActivity['column_renames']
      const activityWithFeatures = { ...activity, features: activityFeatures }

      // add feature columns for fuse js weighted search keys (WEIGHTED_SEARCH_KEYS)
      forEach(activityFeatures, (feature) => {
        if (feature.name && feature.label) {
          const featureName = feature.name
          // @ts-ignore: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type
          // featureName will be feature_1, feature_2, or feature_3... which is correct
          activityWithFeatures[featureName] = { label: feature.label }
        }
      })

      return activityWithFeatures
    })
  }, [activities, showEnrichmentActivities, showEnrichment])

  const options = map(activitiesWithFeatures, (act) => {
    const flattenedEnrichedColumns = flatMap(
      act?.enriched_by[0]?.transformation?.column_renames,
      (col) => `${col.label} ${col.name}`
    ).join(' ')

    const enrichmentTable = get(act, 'enriched_by[0].transformation')
    const enrichmentTableValues = isEmpty(enrichmentTable) ? '' : `${enrichmentTable?.name} ${enrichmentTable?.table}`

    return {
      key: act.id,
      value: act.id,
      label: act.name,
      activity: act,
      extraSearchValues: showEnrichment ? `${flattenedEnrichedColumns} ${enrichmentTableValues}` : undefined,
    }
  })

  const handleCreateOptionContent = ({
    searchValue,
    option,
  }: {
    searchValue: string
    option: SearchSelectOptionProps
  }) => (
    <Select.Option
      data-test="activity-select-option"
      key={option.key || option.value}
      value={option.value}
      label={option.label}
      style={{ borderBottom: `1px solid ${colors.gray200}` }}
    >
      <ActivitySelectOption activity={option.activity} searchValue={searchValue} activitiesCount={activitiesCount} />
    </Select.Option>
  )

  return (
    <StyledSelectWrapper inputColor={inputColor}>
      <SearchSelect
        selectRef={selectRef}
        data-test="activity-select"
        mode={multiSelect ? 'multiple' : undefined}
        style={{ minWidth: 180 }}
        showAction={['focus']}
        showSearch
        popupMatchSelectWidth={false}
        placeholder="Select an activity"
        optionLabelProp="label"
        listHeight={window.innerHeight > 760 ? 480 : 280}
        dropdownRender={(menu: any) => (
          <div>
            {menu}
            {onToggleMultiSelect && (
              <>
                <Divider style={{ margin: 0 }} />
                <Space size="middle" style={{ padding: 8 }} split>
                  {onToggleMultiSelect && (
                    <Checkbox checked={multiSelect} onClick={onToggleMultiSelect}>
                      <Space>
                        <Typography.Text>Use OR Activities</Typography.Text>
                        <Tag bordered={false} color="processing">
                          advanced
                        </Tag>
                      </Space>
                    </Checkbox>
                  )}

                  {onToggleShowEnrichmentActivities && showEnrichment && (
                    <Checkbox checked={showEnrichmentActivities} onClick={onToggleShowEnrichmentActivities}>
                      Show Enrichment Activities
                    </Checkbox>
                  )}
                </Space>
              </>
            )}
          </div>
        )}
        options={options}
        weightedSearchKeys={WEIGHTED_SEARCH_KEYS}
        createOptionContent={handleCreateOptionContent}
        {...selectProps}
      />
    </StyledSelectWrapper>
  )
}

export default ActivitySelect
