import { CloseOutlined, EditOutlined } from '@ant-design/icons'
import { Input, Tooltip } from 'antd-next'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { IActivity } from 'graph/generated'
import { filter, find } from 'lodash'
import React, { useContext, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import styled from 'styled-components'
import { colors } from 'util/constants'
import { activityNameFromActivityIds, ATTRIBUTE_COLOR, BEHAVIOR_COLOR, makeActivityName } from 'util/datasets'
import { IDatasetQueryActivity } from 'util/datasets/interfaces'
import { DatasetMachineState } from 'util/datasets/interfaces'
import useToggle from 'util/useToggle'

const EditAcitivityHeaderContainer = styled(Flex)`
  align-items: center;

  .append-activity-rename-icon {
    margin-left: 8px;
    display: none;
  }

  &:hover {
    cursor: pointer;

    .append-activity-rename-icon {
      display: block;
    }
  }
`

const TruncatedActivityHeader = styled(Typography)`
  /* stylelint-disable-next-line value-no-vendor-prefix */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const CloseIconContainer = styled(Box)`
  color: ${colors.gray700};

  &:hover {
    cursor: pointer;
  }
`

interface GetHeaderDisplayNameProps {
  machineCurrent: DatasetMachineState
  streamActivities: IActivity[]
  activityDefinition?: IDatasetQueryActivity
  activityFormValue?: any
}

const getHeaderDisplayName = ({
  machineCurrent,
  streamActivities,
  activityDefinition,
  activityFormValue,
}: GetHeaderDisplayNameProps): string => {
  // check if the activity has had its name overridden
  const nameOverride =
    activityFormValue?.name_override ||
    find(machineCurrent.context.activities, ['id', activityFormValue?.original_activity_id])?.name_override

  const queryActivityName = activityNameFromActivityIds(streamActivities, activityDefinition?.activity_ids || [])
  const formActivityName = activityNameFromActivityIds(streamActivities, activityFormValue?.activity_ids || [])

  // DEPRECATED
  // This is to support Dataset 1.0 Query Definition datasets without activityDefinition.activity_ids
  // Treat activityDefinition.slug always as an array of values:
  const deprecatedActivities = filter(streamActivities, ['slug', activityDefinition?.slug])
  const deprecatedActivityName = makeActivityName(deprecatedActivities)

  return nameOverride || queryActivityName || formActivityName || deprecatedActivityName
}

interface ActivityHeaderProps {
  isAppend: boolean
  activityDefinition?: IDatasetQueryActivity
  activityFieldName?: string
}

const InfoPanelActivityHeader = ({
  isAppend,
  activityDefinition,
  activityFieldName = '_IGNORE_',
}: ActivityHeaderProps) => {
  const { watch, setValue } = useFormContext()
  const [isEditName, toggleIsEditName] = useToggle(false)

  const { streamActivities, machineSend, machineCurrent } = useContext(DatasetFormContext)

  // Get activity_id only in edit mode (editing dataset definition)!
  const activityFormValue = watch(activityFieldName)

  const activityName = getHeaderDisplayName({
    machineCurrent,
    streamActivities,
    activityDefinition,
    activityFormValue,
  })
  const [stagedName, setStagedName] = useState(activityName)

  const color = isAppend ? ATTRIBUTE_COLOR : BEHAVIOR_COLOR

  // only allow editing of activity name if it's an append activity
  const handleToggleEdit = () => {
    toggleIsEditName()
  }

  const handleClickEdit = () => {
    // make sure the staged name is set to the activity name
    setStagedName(activityName)
    handleToggleEdit()
  }

  const handleStagedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    setStagedName(value)
  }

  const handleEditName = ({ activityId, name }: { activityId?: string; name?: string }) => {
    // if no activityId or name, do nothing
    if (!name) {
      return null
    }

    setValue(`${activityFieldName}.name_override`, name, { shouldValidate: true })

    // update machine context
    if (activityId) {
      machineSend('EDIT_ACTIVITY_NAME', { id: activityId, name })
    }
  }

  const formActivity = find(machineCurrent.context.activities, ['id', activityFormValue?.original_activity_id])
  const handlePressEnter = (event: any) => {
    if (event.key === 'Enter') {
      const { value } = event.target
      const activityId = activityDefinition?.id || formActivity?.id

      handleEditName({ activityId, name: value })
      handleToggleEdit()
    }
  }

  const handleBlur = (event: any) => {
    const { value } = event.target
    const activityId = activityDefinition?.id || formActivity?.id

    handleEditName({ activityId, name: value })
    handleToggleEdit()
  }

  return (
    <div>
      {isEditName && (
        <Flex justifyContent="space-between" alignItems="center">
          <Input value={stagedName} onChange={handleStagedChange} onPressEnter={handlePressEnter} onBlur={handleBlur} />

          <Tooltip title="Cancel Rename Activity">
            <CloseIconContainer onClick={toggleIsEditName} ml={1}>
              <CloseOutlined />
            </CloseIconContainer>
          </Tooltip>
        </Flex>
      )}

      {!isEditName && (
        <Tooltip title="Click to rename activity">
          <EditAcitivityHeaderContainer onClick={handleClickEdit}>
            <TruncatedActivityHeader
              type="title400"
              title={activityName?.length > 90 ? activityName : undefined}
              color={color}
              data-test="dataset-info-panel-activity-title"
            >
              {activityName}
            </TruncatedActivityHeader>

            <EditOutlined className="append-activity-rename-icon" />
          </EditAcitivityHeaderContainer>
        </Tooltip>
      )}
    </div>
  )
}

export default InfoPanelActivityHeader
