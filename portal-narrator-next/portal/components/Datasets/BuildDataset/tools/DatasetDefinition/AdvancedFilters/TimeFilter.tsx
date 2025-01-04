import { CloseCircleOutlined } from '@ant-design/icons'
import { Input, InputNumber, Space } from 'antd-next'
import { SearchSelect } from 'components/antd/staged'
import { Box, Typography } from 'components/shared/jawns'
import { map, startCase } from 'lodash'
import pluralize from 'pluralize'
import { Control, Controller } from 'react-hook-form'
import styled from 'styled-components'
import { RELATIONSHIP_AT_LEAST_TIME, RELATIONSHIP_WITHIN_TIME, TIME_FILTER_ALL_OPTIONS } from 'util/datasets'
import { required } from 'util/forms'

import BeforeOrAfterText from './BeforeOrAfterText'
import ConnectingFilterBox from './ConnectingFilterBox'

const timeOptionOptions = [
  {
    label: 'within',
    value: RELATIONSHIP_WITHIN_TIME,
  },
  {
    label: 'at least',
    value: RELATIONSHIP_AT_LEAST_TIME,
  },
]

const relationshipTimeOptions = map(TIME_FILTER_ALL_OPTIONS, (time) => ({
  label: startCase(pluralize(time)),
  value: time,
}))

const StyledClose = styled.div`
  position: absolute;
  top: 0;
  z-index: 1;
  margin-left: -20px;
  margin-top: 5px;

  & > span.anticon {
    background-color: white;
  }
`

interface Props {
  control: Control<any>
  fieldName: string
  parentFieldName: string
  onRemove: () => void
  isViewMode?: boolean
}

const TimeFilter = ({ control, fieldName, parentFieldName, onRemove, isViewMode = false }: Props) => {
  return (
    <Box key={fieldName} my={1} relative>
      <Space align="start">
        <ConnectingFilterBox mt="5px">
          <Typography type="body50">but only if it occurred</Typography>
        </ConnectingFilterBox>

        <Input.Group compact>
          <Controller
            control={control}
            name={`${fieldName}.time_option`}
            rules={{ validate: required }}
            render={({ field }) => <SearchSelect options={timeOptionOptions} {...field} />}
          />

          <Controller
            control={control}
            name={`${fieldName}.value`}
            rules={{ validate: required }}
            render={({ field }) => <InputNumber min={1} {...field} />}
          />

          <Controller
            control={control}
            name={`${fieldName}.resolution`}
            rules={{ validate: required }}
            render={({ field }) => (
              <SearchSelect
                options={relationshipTimeOptions}
                style={{ minWidth: '72px' }}
                popupMatchSelectWidth={false}
                {...field}
              />
            )}
          />
        </Input.Group>

        <BeforeOrAfterText fieldName={fieldName} parentFieldName={parentFieldName} />
      </Space>
      {!isViewMode && (
        <StyledClose>
          <CloseCircleOutlined onClick={onRemove} />
        </StyledClose>
      )}
    </Box>
  )
}

export default TimeFilter
