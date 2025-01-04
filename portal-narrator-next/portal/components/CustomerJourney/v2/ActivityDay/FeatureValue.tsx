import { CopyOutlined } from '@ant-design/icons'
import { App, Tooltip } from 'antd-next'
import CopyToClipboard from 'components/shared/CopyToClipboard'
import { Box, Flex } from 'components/shared/jawns'
import styled from 'styled-components'
import { colors } from 'util/constants'

import { ICustomerJourneyActivityRowFeature } from '../services/interfaces'

interface Props {
  feature: ICustomerJourneyActivityRowFeature
}

const HoverIcon = styled(Box)`
  &:hover {
    color: ${colors.blue500};
    cursor: pointer;
  }
`

const FeatureValue = ({ feature }: Props) => {
  const { notification } = App.useApp()

  return (
    <Flex>
      {feature.for_link ? (
        <a href={feature.value} target="_blank" rel="noopener noreferrer">
          {feature.value}
        </a>
      ) : (
        feature.value
      )}
      {feature.for_copy && (
        <CopyToClipboard
          text={feature.value}
          onCopy={() => {
            notification.success({
              message: 'Copied to clipboard',
              placement: 'topRight',
              duration: 2,
            })
          }}
        >
          <Tooltip title="Copy to Clipboard">
            <HoverIcon ml={1}>
              <CopyOutlined />
            </HoverIcon>
          </Tooltip>
        </CopyToClipboard>
      )}
    </Flex>
  )
}

export default FeatureValue
