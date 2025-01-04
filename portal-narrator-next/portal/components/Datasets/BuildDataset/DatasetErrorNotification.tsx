import { Button, Typography } from 'components/shared/jawns'
import styled from 'styled-components'
import { openChat } from 'util/chat'

const ReportLink = styled(Button)`
  display: inline;
  text-decoration: underline;

  &:hover {
    cursor: pointer;
  }
`

const DatasetErrorNotification = () => {
  return (
    <div>
      <Typography type="title400" fontWeight="bold" my="4px">
        Sorry, something went wrong!
      </Typography>
      <Typography as="div" type="body100" my="4px">
        Our team has been notified.
      </Typography>
      <Typography as="div" type="body100" my="4px">
        Please try again, or{' '}
        <ReportLink as="span" onClick={() => openChat()}>
          talk to our support team
        </ReportLink>
      </Typography>
    </div>
  )
}

export default DatasetErrorNotification
