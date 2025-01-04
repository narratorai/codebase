import { CloseCircleOutlined } from '@ant-design/icons'
import { Select, Space } from 'antd-next'
import { Box, Typography } from 'components/shared/jawns'
import { Control, Controller } from 'react-hook-form'
import styled from 'styled-components'
import { RELATIVE_OCCURRENCE_OPTIONS, RELATIVE_RELATIONSHIP_OPTIONS } from 'util/datasets'
import { required } from 'util/forms'

import ActivitySearchFormItem from '../ActivitySearchFormItem'
import ConnectingFilterBox from './ConnectingFilterBox'

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
  appendActivityName: string
  fieldName: string
  onRemove: () => void
  isViewMode?: boolean
}

const RelativeActivityFilter = ({ control, appendActivityName, fieldName, onRemove, isViewMode = false }: Props) => {
  return (
    <Box key={fieldName} my={1} relative>
      <Space align="start">
        <ConnectingFilterBox mt="5px">
          <Typography type="body50" style={{ whiteSpace: 'nowrap' }}>
            but only if <strong>{appendActivityName}</strong> is
          </Typography>
        </ConnectingFilterBox>

        <Space align="start" style={{ flexWrap: 'wrap', rowGap: 8 }}>
          <Controller
            control={control}
            name={`${fieldName}.relative_relationship`}
            rules={{ validate: required }}
            render={({ field }) => (
              <Select options={RELATIVE_RELATIONSHIP_OPTIONS} placeholder="Relationship" {...field} />
            )}
          />

          <Box mt="5px">
            <Typography type="body50">the</Typography>
          </Box>

          <Controller
            control={control}
            name={`${fieldName}.relative_occurrence`}
            rules={{ validate: required }}
            render={({ field }) => (
              <Select options={RELATIVE_OCCURRENCE_OPTIONS} placeholder="Relationship" {...field} />
            )}
          />

          <ActivitySearchFormItem fieldName={`${fieldName}.activity_ids`} />
        </Space>
      </Space>
      {!isViewMode && (
        <StyledClose>
          <CloseCircleOutlined onClick={onRemove} />
        </StyledClose>
      )}
    </Box>
  )
}

export default RelativeActivityFilter
