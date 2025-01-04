import { ApiOutlined, LockFilled } from '@ant-design/icons'
import { Result, Tabs } from 'antd-next'
import { TabsProps } from 'antd-next/lib/tabs'
import { COMPANY_ADMIN_ONLY_NOTICE } from 'components/context/auth/protectedComponents'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import ManageIcons from 'components/Manage//Company/ManageIcons'
import Account from 'components/Manage/Account/Account'
import Billing from 'components/Manage/Company/Billing'
import CompanyBranding from 'components/Manage/Company/CompanyBranding'
import Connections from 'components/Manage/Company/Connections'
import EditCompany from 'components/Manage/Company/EditCompany'
import { ManagePaths } from 'components/Manage/Company/interfaces'
import { LayoutContent } from 'components/shared/layout/LayoutWithFixedSider'
import Page from 'components/shared/Page'
import { useFlags } from 'launchdarkly-react-client-sdk'
import { useHistory, useParams } from 'react-router-dom'
import { colors } from 'util/constants'

import ApiKeys from '../ApiKeys/ApiKeys'
import Warehouse from './Warehouse'

const pathToTitle: { [key in ManagePaths]: string } = {
  company: 'Company Settings',
  warehouse: 'Warehouse Settings',
  users: 'User Access',
  billing: 'Billing',
  'api-keys': 'API Keys',
  branding: 'Branding',
  connections: 'Connections',
}

// eslint-disable-next-line max-lines-per-function
const Company = () => {
  const { isCompanyAdmin } = useUser()
  const company = useCompany()
  const history = useHistory()
  const params = useParams<{ path: ManagePaths }>()
  const flags = useFlags()
  const path = params.path as ManagePaths

  const RestrictedMessage = (
    <Result
      icon={<LockFilled style={{ color: colors.red500 }} />}
      title={pathToTitle[path]}
      subTitle={COMPANY_ADMIN_ONLY_NOTICE}
    />
  )

  return (
    <Page
      title={`${pathToTitle[path]} | Narrator`}
      bg="white"
      breadcrumbs={[{ text: pathToTitle[path] }]}
      hasSider={false}
    >
      <LayoutContent siderWidth={0} style={{ marginLeft: 0 }}>
        <Tabs
          activeKey={path}
          defaultActiveKey="warehouse"
          onChange={(tab) => history.push(`/${company.slug}/manage/${tab}`)}
          items={
            [
              {
                key: 'warehouse',
                label: (
                  <span>
                    <ManageIcons type="warehouse" data-public />
                    Warehouse Settings
                  </span>
                ),
                children: isCompanyAdmin ? <Warehouse /> : RestrictedMessage,
              },
              {
                key: 'company',
                label: (
                  <span>
                    <ManageIcons type="company" data-public />
                    Company Settings
                  </span>
                ),
                children: isCompanyAdmin ? <EditCompany /> : RestrictedMessage,
              },
              {
                key: 'users',
                label: (
                  <span>
                    <ManageIcons type="users" data-public />
                    User Access
                  </span>
                ),
                children: isCompanyAdmin ? <Account /> : RestrictedMessage,
              },
              {
                key: 'api-keys',
                label: (
                  <span>
                    <ApiOutlined data-public />
                    API Keys
                  </span>
                ),
                children: isCompanyAdmin ? <ApiKeys /> : RestrictedMessage,
              },
              {
                key: 'billing',
                label: (
                  <span>
                    <ManageIcons type="billing" data-public />
                    Billing
                  </span>
                ),
                children: isCompanyAdmin ? <Billing /> : RestrictedMessage,
              },
              {
                key: 'branding',
                label: (
                  <span>
                    <ManageIcons type="branding" data-public />
                    Branding
                  </span>
                ),
                children: isCompanyAdmin ? <CompanyBranding /> : RestrictedMessage,
              },
              flags['manage-connections']
                ? {
                    key: 'connections',
                    label: (
                      <span>
                        <ManageIcons type="connections" data-public />
                        Connections
                      </span>
                    ),
                    children: isCompanyAdmin ? <Connections /> : RestrictedMessage,
                  }
                : null,
            ].filter(Boolean) as TabsProps['items']
          }
        />
      </LayoutContent>
    </Page>
  )
}

export default Company
