import { List } from 'antd-next'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import DeleteSpendIcon from 'components/Datasets/BuildDataset/tools/DeleteSpendIcon'
import { Flex, Typography } from 'components/shared/jawns'
import { compact, find, get, isEmpty, map } from 'lodash'
import pluralize from 'pluralize'
import { useContext } from 'react'
import {
  COLUMN_KIND_CAC,
  COLUMN_KIND_COMPUTED,
  COLUMN_KIND_GROUP_BY,
  COLUMN_KIND_GROUP_METRIC,
  COMPUTATION_COLOR,
  getGroupFromContext,
  GROUP_BY_COLOR,
  GROUP_CAC_COLOR,
  GROUP_METRIC_COLOR,
} from 'util/datasets'

import AddGroupColumnCtaAndPopover from './AddGroupColumnCtaAndPopover'
import AddGroupMetricModal from './AddGroupMetricModal'
import ColumnRow from './ColumnRow'
import InfoPanelAddButton from './InfoPanelAddButton'
import InfoPanelSection from './InfoPanelSection'
import TitleRow from './TitleRow'

const GroupColumns = () => {
  const { machineCurrent, machineSend, groupSlug } = useContext(DatasetFormContext)
  const group = getGroupFromContext({ context: machineCurrent.context, groupSlug })
  const isDuplicateParentGroup = machineCurrent.context._is_parent_duplicate

  if (!group) {
    return null
  }

  const hasSpend = get(group, 'spend.columns', []).length > 0
  const spendJoins = get(group, 'spend.joins', [])
  const spendColumnIds = map(spendJoins, (join) => join.column_id)
  const groupColumns = get(group, 'columns', [])

  // match the join column ids to the parent group column ids (in case they renamed them)
  const groupColumnLabelsInSpendJoin = compact(
    map(spendColumnIds, (spendId) => {
      const column = find(groupColumns, (col) => col.id === spendId)
      return column?.label
    })
  )

  return (
    <>
      <InfoPanelSection leftBorderColor={GROUP_BY_COLOR}>
        <TitleRow
          color={GROUP_BY_COLOR}
          title="GROUP COLUMNS"
          description="Group by column(s) to aggregate your dataset."
        />
        <List size="small">
          {group.columns.map((columnDefinition) => (
            <List.Item key={columnDefinition.id}>
              <ColumnRow columnDefinition={columnDefinition} columnKind={COLUMN_KIND_GROUP_BY} />
            </List.Item>
          ))}
        </List>
        <AddGroupColumnCtaAndPopover />
      </InfoPanelSection>

      <InfoPanelSection leftBorderColor={GROUP_METRIC_COLOR} data-test="info-panel-metrics">
        <TitleRow
          color={GROUP_METRIC_COLOR}
          title="METRIC COLUMNS"
          description="Compute a calculation for each unique aggregate group."
        />
        <List size="small">
          {group.metrics.map((columnDefinition) => (
            <List.Item key={columnDefinition.id}>
              <ColumnRow columnDefinition={columnDefinition} columnKind={COLUMN_KIND_GROUP_METRIC} />
            </List.Item>
          ))}
        </List>

        <InfoPanelAddButton
          className="add-button"
          buttonText="Add Column"
          disabled={false}
          onClick={() => machineSend('EDIT_METRIC_COLUMN')}
        />

        <AddGroupMetricModal />
      </InfoPanelSection>

      {/* Spend */}
      <InfoPanelSection leftBorderColor={GROUP_CAC_COLOR}>
        {hasSpend && (
          <TitleRow
            color={GROUP_CAC_COLOR}
            title="AGGREGATION COLUMNS"
            description="Join on aggregate columns to add spend, clicks, and impressions to your group by."
            renderCTAOverride={() => <DeleteSpendIcon />}
          />
        )}
        {!hasSpend && (
          <TitleRow
            color={GROUP_CAC_COLOR}
            title="AGGREGATION COLUMNS"
            description="Join on aggregate columns to add spend, clicks, and impressions to your group by."
          />
        )}

        {!isEmpty(spendJoins) && (
          <Flex px={2}>
            <Typography type="body300" mb="4px" color={GROUP_CAC_COLOR} mr={1}>
              Aggregation distributed by: {groupColumnLabelsInSpendJoin.join(', ')}
            </Typography>
          </Flex>
        )}
        {get(group, 'spend.columns', []).length > 0 && (
          <List size="small">
            {group.spend?.columns?.map((columnDefinition) => (
              <List.Item key={columnDefinition.id}>
                <ColumnRow columnDefinition={columnDefinition} columnKind={COLUMN_KIND_CAC} />
              </List.Item>
            ))}
          </List>
        )}

        {group && !isDuplicateParentGroup && (
          <InfoPanelAddButton
            className="add-button"
            buttonText={`${isEmpty(group.spend?.columns) ? 'Add' : 'Edit'} ${pluralize(
              'Column',
              (group.spend?.columns || []).length
            )}`}
            disabled={false}
            onClick={() => machineSend('EDIT_SPEND')}
          />
        )}
      </InfoPanelSection>

      <InfoPanelSection leftBorderColor={COMPUTATION_COLOR} data-test="info-panel-computation">
        <TitleRow
          color={COMPUTATION_COLOR}
          title="COMPUTATION COLUMNS"
          description="Computed columns can be used to create calculations between columns in your data."
        />
        <List size="small">
          {group.computed_columns.map((columnDefinition) => (
            <List.Item key={columnDefinition.id}>
              <ColumnRow columnDefinition={columnDefinition} columnKind={COLUMN_KIND_COMPUTED} />
            </List.Item>
          ))}
        </List>
        <InfoPanelAddButton
          className="add-button"
          buttonText="Add Column"
          onClick={() => machineSend({ type: 'EDIT_COMPUTATION' })}
        />
      </InfoPanelSection>
    </>
  )
}

export default GroupColumns
