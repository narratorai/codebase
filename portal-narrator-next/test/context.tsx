import { useMachine } from '@xstate/react'
import { ConfigProvider } from 'antd-next'
import { Auth0Context } from 'components/context/auth/Provider'
import { CompanyContext } from 'components/context/company/Provider'
import { UserContext } from 'components/context/user/Provider'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { ICompany, ICompany_User_Role_Enum, IUser } from 'graph/generated'
import { buildDatasetMachine, machineServices } from 'machines/datasets'
import { ReactNode } from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'

import Auth0Factory from './factories/Auth0Factory'
import CompanyFactory from './factories/CompanyFactory'
import CompanyUserFactory from './factories/CompanyUserFactory'
import DatasetFactory from './factories/DatasetFactory'
import { AdminUser, NonAdminUser } from './factories/UserFactory'

// https://testing-library.com/docs/example-react-router/#testing-library-and-react-router-v5
const LocationDisplay = () => {
  const location = useLocation()

  return <div data-testid="location-display">{location.pathname}</div>
}

export function AdminTestContext({ children, initialEntries }: { children: ReactNode; initialEntries?: string[] }) {
  return (
    <TestContext isAdmin initialEntries={initialEntries}>
      {children}
    </TestContext>
  )
}

export function NonAdminTestContext({ children, initialEntries }: { children: ReactNode; initialEntries?: string[] }) {
  return <TestContext initialEntries={initialEntries}>{children}</TestContext>
}

export function TestContext({
  children,
  isAdmin = false,
  initialEntries = ['/'],
}: {
  children: ReactNode
  isAdmin?: boolean
  initialEntries?: string[]
}) {
  const getTokenSilently = jest.fn().mockReturnValue(Promise.resolve('auth0-token'))
  const company = CompanyFactory.build()
  const companyUser = CompanyUserFactory.build({
    role: isAdmin ? ICompany_User_Role_Enum.Admin : ICompany_User_Role_Enum.User,
  })
  const auth0 = Auth0Factory.build({ getTokenSilently })

  return (
    <ConfigProvider prefixCls="antd5">
      <MemoryRouter initialEntries={initialEntries}>
        <LocationDisplay />
        <Auth0Context.Provider value={auth0}>
          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
          {/* @ts-ignore */}
          <CompanyContext.Provider value={{ result: { data: { company: [company] } } }}>
            <UserContext.Provider value={{ companyUser }}>{children}</UserContext.Provider>
          </CompanyContext.Provider>
        </Auth0Context.Provider>
      </MemoryRouter>
    </ConfigProvider>
  )
}

export const DatasetContext = ({ children, isAdmin = false }: { children: ReactNode; isAdmin?: boolean }) => {
  const getTokenSilently = jest.fn().mockReturnValue(Promise.resolve('auth0-token'))
  const getDatasetGraph = jest.fn().mockReturnValue(Promise.resolve({ id: '1234' }))
  const company = CompanyFactory.build() as unknown as ICompany
  const dataset = DatasetFactory.build()
  const user = isAdmin ? AdminUser.build() : NonAdminUser.build()

  const [machineCurrent, machineSend] = useMachine(
    buildDatasetMachine.withConfig({
      services: machineServices({
        company,
        user: user as unknown as IUser,
        getToken: getTokenSilently,
        getDatasetGraph,
      }),
    }),
    {
      devTools: true,
    }
  )

  return (
    <DatasetFormContext.Provider
      value={{
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        machineCurrent,
        machineSend,
        ...dataset,
      }}
    >
      {children}
    </DatasetFormContext.Provider>
  )
}
