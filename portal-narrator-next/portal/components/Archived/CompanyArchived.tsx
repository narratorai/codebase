import { Button, Result } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { Typography } from 'components/shared/jawns'
import Page from 'components/shared/Page'
import { openChat } from 'util/chat'

const CompanyArchived = () => {
  const company = useCompany()

  return (
    <Page title="Archived" bg="transparent" data-public breadcrumbs={[{ text: 'Company Archived' }]}>
      <Result
        title={`${company.name} has been archived`}
        subTitle={<Typography>Please contact support if you have any questions</Typography>}
        extra={
          <Button type="primary" onClick={() => openChat()}>
            Contact Support
          </Button>
        }
      />
    </Page>
  )
}

export default CompanyArchived
