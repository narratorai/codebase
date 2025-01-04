import { InfoCircleOutlined } from '@ant-design/icons'
import { Select, Tooltip } from 'antd-next'
import { SearchSelect, SearchSelectOptionProps } from 'components/antd/staged'
import { useCompany, useCompanyRefetch } from 'components/context/company/hooks'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import DatasetDefinitionContext from 'components/Datasets/BuildDataset/tools/DatasetDefinition/DatasetDefinitionContext'
import { IDatasetDefinitionContext } from 'components/Datasets/BuildDataset/tools/DatasetDefinition/interfaces'
import { Box, Flex, Typography } from 'components/shared/jawns'
import Mark from 'components/shared/Mark'
import { find, isEmpty } from 'lodash'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { loadPersistedActivityStreamSlug, persistActivityStream } from 'util/persistActivityStream'

const { Option } = Select

interface Props {
  activityStreamValue?: string | null
  setDefaultValueOnEmpty?: boolean
}

const ActivityStreamSelect = ({ activityStreamValue, setDefaultValueOnEmpty = true }: Props) => {
  const company = useCompany()

  const { datasetSlug, machineSend } = useContext<IDatasetDefinitionContext>(DatasetDefinitionContext)
  const isNewDataset = !datasetSlug

  const refetchCompanySeed = useCompanyRefetch()

  // hasSubmittedDefinition is only used by BuildDataset machine (not Explore)
  const { hasSubmittedDefinition } = useContext(DatasetFormContext)

  // on page load
  // make sure company is up-to-date (for activity stream select)
  const [hasRefetchedCompany, setHasRefetchedCompany] = useState(false)
  useEffect(() => {
    if (!hasRefetchedCompany && refetchCompanySeed) {
      refetchCompanySeed()
      setHasRefetchedCompany(true)
    }
  }, [hasRefetchedCompany, setHasRefetchedCompany, refetchCompanySeed])

  const defaultActivityStream = loadPersistedActivityStreamSlug(company)
  const defaultSelectedActivityStream = !isEmpty(defaultActivityStream)
    ? // if activty stream is in local storage - use it as default
      defaultActivityStream
    : // otherwise use the first activity stream as default
      company?.tables?.[0].activity_stream

  const handleOnChange = useCallback(
    (stream: string) => {
      // set the activity stream to local storage
      // so it can be used as a default in:
      // customer journey, activity index, and create dataset
      if (stream) {
        persistActivityStream(stream)
      }

      machineSend('SET_ACTIVITY_STREAM', { activityStream: stream })
    },
    [persistActivityStream, machineSend]
  )

  // if default activity stream, add it to the machine
  useEffect(() => {
    if (setDefaultValueOnEmpty && isEmpty(activityStreamValue) && !!defaultSelectedActivityStream) {
      handleOnChange(defaultSelectedActivityStream)
    }
  }, [activityStreamValue, defaultSelectedActivityStream, handleOnChange, setDefaultValueOnEmpty])

  const activitySelectOptions = useMemo(() => {
    return company?.tables?.map((table) => ({
      key: table.activity_stream,
      label: table.identifier,
      value: table.activity_stream,
      extraSearchValues: `${company?.production_schema} ${table.activity_stream} ${table.customer_table}`,
    }))
  }, [company?.tables, company?.production_schema])

  const handleCreateOptionContent = ({
    searchValue,
    option,
  }: {
    searchValue: string
    option: SearchSelectOptionProps
  }) => {
    const table = find(company?.tables, ['activity_stream', option.value])

    return (
      <Option
        key={option.value}
        value={option.value}
        // show the acitivity stream in the selected label
        label={`${!isEmpty(option.label) && `${option.label}: `}${option.value}`}
      >
        <Box>
          {option.value && (
            <Typography type="title500" fontWeight="bold" mb={1}>
              {option.label}
            </Typography>
          )}
          <Box ml={1}>
            <Typography type="body300" mb={1} data-test="stream-select-radio-activity-stream">
              <b>Stream:</b>{' '}
              <Mark value={`${company?.production_schema}.${table?.activity_stream}`} snippet={searchValue} />
            </Typography>
            <Typography type="body300">
              <b>Customer Table:</b>{' '}
              <Mark
                value={`${company?.production_schema}.${table?.customer_table ? table?.customer_table : ''}`}
                snippet={searchValue}
              />
            </Typography>
          </Box>
        </Box>
      </Option>
    )
  }

  const showText = !isNewDataset || hasSubmittedDefinition
  const selectedIdentifier = find(company?.tables, ['activity_stream', activityStreamValue])?.identifier

  if (showText) {
    return (
      <Flex alignItems="baseline">
        <Typography mr={1}>Activity Stream:</Typography>
        <Typography type="title300" mr={1}>
          {`${!isEmpty(selectedIdentifier) && `${selectedIdentifier}: `}${activityStreamValue}`}
        </Typography>
        <Tooltip placement="right" title="Create a new dataset if you want to change your activity stream">
          <InfoCircleOutlined />
        </Tooltip>
      </Flex>
    )
  }

  return (
    <SearchSelect
      data-test="activity-stream-select"
      options={activitySelectOptions}
      createOptionContent={handleCreateOptionContent}
      onChange={handleOnChange}
      value={activityStreamValue}
      placeholder="Select an Activity Stream"
      popupMatchSelectWidth={false}
      optionLabelProp="label"
      style={{ minWidth: '340px' }}
      disabled={!isNewDataset || hasSubmittedDefinition}
    />
  )
}

export default ActivityStreamSelect
