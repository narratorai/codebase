import { WidgetProps } from '@rjsf/core'
import { Box, Flex, Icon, Typography } from 'components/shared/jawns'
import React from 'react'
import ArrowDownIcon from 'static/svg/ArrowDown.svg'
import ArrowRightIcon from 'static/svg/ArrowRight.svg'
import styled from 'styled-components'
import { triggerSchemaAndDataUpdates } from 'util/blocks/helpers'
import { semiBoldWeight } from 'util/constants'

const StyledTypography = styled(Typography)`
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`

const BooleanToggleWidget: React.FC<WidgetProps> = ({ id, value, formContext, label, onChange, options }) => {
  const handleChange = () => {
    // Handle options.process_data and options.update_schema
    triggerSchemaAndDataUpdates(formContext, options, id)

    // Make sure it's cast as a boolean, then set it as the opposite value!
    onChange(!value)
  }

  return (
    <Flex onClick={handleChange} style={{ cursor: 'pointer' }} data-public>
      <Box>
        <Icon svg={value ? ArrowDownIcon : ArrowRightIcon} />
      </Box>
      <Box ml="8px">
        <StyledTypography fontWeight={semiBoldWeight} type="body50">
          {label}
        </StyledTypography>
      </Box>
    </Flex>
  )
}

export default BooleanToggleWidget
