import { RightOutlined } from '@ant-design/icons'
import { Badge, Flex, Tooltip } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import styled from 'styled-components'
import { colors } from 'util/constants'
import { timeFromNow } from 'util/helpers'

import { CustomerExample } from './interfaces'

const CustomerRow = styled(Flex)<{ isLast: boolean; hasDisplayName: boolean }>`
  padding: 8px;
  margin-left: 8px;
  width: 100%;
  overflow: hidden;
  ${({ isLast }) =>
    !isLast &&
    `
    border-bottom: 1px solid ${colors.mavis_light_gray};
    `}

  .name-email-container {
    flex: 1;
    min-width: 0;
    margin-right: 8px;

    .name-email-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .name-text {
      font-size: 16px;
      line-height: 20px;
      transition: font-weight 200ms ease-in-out;
      font-weight: 400;
    }

    .email-text {
      font-size: ${({ hasDisplayName }) => (hasDisplayName ? '12px' : '16px')};
      line-height: ${({ hasDisplayName }) => (hasDisplayName ? '16px' : '32px')};
      color: ${({ hasDisplayName }) => (hasDisplayName ? colors.mavis_text_gray : 'initial')};
      transition: font-weight 200ms ease-in-out;
      font-weight: 400;
    }
  }

  .go-to-customer-journey-arrow {
    svg {
      transition: font-size 200ms ease-in-out;
      font-size: 12px;
    }
  }

  &:hover {
    cursor: pointer;

    .go-to-customer-journey-arrow {
      svg {
        font-size: 16px;
      }
    }

    .name-text {
      font-weight: 600;
    }

    ${({ hasDisplayName }) =>
      !hasDisplayName &&
      `
      .email-text {
        font-weight: 600;
    `}
  }
`

interface Props {
  example: CustomerExample
  isLast: boolean
  onClick: (customerEmail: string) => void
}

const ActivityExample = ({ example, isLast, onClick }: Props) => {
  const company = useCompany()

  const customerEmail = example.customer
  const customerName = example.customer_display_name
  const hasDisplayName = !!customerName
  const lastOccurrenceTimeAgo = timeFromNow(example.ts, company.timezone)

  const handleSelectCustomer = () => {
    onClick(customerEmail)
  }

  return (
    <CustomerRow
      justify="space-between"
      align="center"
      key={customerEmail}
      isLast={isLast}
      hasDisplayName={hasDisplayName}
      onClick={handleSelectCustomer}
    >
      <div className="name-email-container">
        {/* There might not be a name associated with the customer */}
        {hasDisplayName && <div className="name-email-text name-text">{customerName}</div>}

        {/* There will always be an email */}
        <div className="name-email-text email-text">{customerEmail}</div>
      </div>

      <Flex align="flex-start" style={{ marginRight: '8px' }}>
        <div style={{ marginRight: '8px', color: colors.mavis_text_gray, whiteSpace: 'nowrap' }}>
          ({lastOccurrenceTimeAgo})
        </div>

        <Badge count={example.occurrence} color={colors.gray400} style={{ marginRight: '8px' }} />

        <div className="go-to-customer-journey-arrow">
          <Tooltip title={`Go to ${customerEmail}'s customer journey`}>
            <RightOutlined style={{ color: colors.mavis_text_gray, fontSize: '12px' }} />
          </Tooltip>
        </div>
      </Flex>
    </CustomerRow>
  )
}

export default ActivityExample
