import { Button, Result, Tooltip } from 'antd-next'
import { ButtonProps } from 'antd-next/es/button'
import { COMPANY_ADMIN_ROLE, SUPER_ADMIN_ROLE } from 'components/context/auth/constants'
import { useCompany, useOnboardingSubscribedCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { useOnboardingContext } from 'components/Onboarding/OnboardingProvider'
import { CenteredLoader } from 'components/shared/icons/Loader'
import { Flex, Link } from 'components/shared/jawns'
import { ICompany_Status_Enum, ICompany_User_Role_Enum, IUser_Role_Enum } from 'graph/generated'
import { isString } from 'lodash'
import { FC, ReactElement } from 'react'
import { Redirect, RouteProps } from 'react-router'
import Route from 'util/route'

type RoleOptions = IUser_Role_Enum.InternalAdmin | ICompany_User_Role_Enum.Admin

interface UnauthorizedProps {
  buttonText?: string
  buttonTo?: string
  subTitle?: string
}

interface ProtectedRoleLinkProps {
  role?: RoleOptions
  children: ReactElement | string
  to: string
  noTooltip?: boolean
}

interface ProtectedRoleButtonProps extends ButtonProps {
  role?: RoleOptions
  // FIXME - onClick isn't coming back properly from ButtonProps...
  onClick?: any
}

interface ProtectedRoleRouteProps extends RouteProps {
  role?: RoleOptions
  buttonText?: string
  buttonTo?: string
  subTitle?: string
}

interface ProtectedFlagRouteProps extends RouteProps {
  hasFlag: boolean
  buttonText?: string
  buttonTo?: string
}

interface OnboardedRouteProps extends RouteProps {
  adminOnly?: boolean
}

export const COMPANY_ADMIN_ONLY_NOTICE = 'Please contact your company admin to access this feature'

export const ProtectedRoleButton = ({ role = COMPANY_ADMIN_ROLE, ...rest }: ProtectedRoleButtonProps) => {
  const { isCompanyAdmin, isSuperAdmin } = useUser()

  if ((role === COMPANY_ADMIN_ROLE && isCompanyAdmin) || (role === SUPER_ADMIN_ROLE && isSuperAdmin)) {
    return <Button {...rest} />
  }

  return (
    <Tooltip title={COMPANY_ADMIN_ONLY_NOTICE}>
      <div>
        <Button {...rest} disabled />
      </div>
    </Tooltip>
  )
}

const Unauthorized = ({
  buttonText = 'Go To Datasets',
  buttonTo = '/datasets',
  subTitle = 'Sorry, you are not authorized to access this page.',
}: UnauthorizedProps) => {
  return (
    <Flex justifyContent="center" width={1}>
      <Result
        status="403"
        title="403"
        subTitle={subTitle}
        extra={
          <Link unstyled to={buttonTo}>
            <Button type="primary">{buttonText}</Button>
          </Link>
        }
      />
    </Flex>
  )
}

export const ProtectedRoleLink: FC<ProtectedRoleLinkProps> = ({
  role = COMPANY_ADMIN_ROLE,
  children,
  noTooltip,
  to,
}) => {
  const { isCompanyAdmin, isSuperAdmin } = useUser()

  if ((role === COMPANY_ADMIN_ROLE && isCompanyAdmin) || (role === SUPER_ADMIN_ROLE && isSuperAdmin)) {
    return (
      <Link unstyled to={to}>
        {children}
      </Link>
    )
  }

  if (noTooltip) {
    return isString(children) ? <span>{children}</span> : children
  }

  return (
    <div>
      <Tooltip title={COMPANY_ADMIN_ONLY_NOTICE}>{isString(children) ? <span>{children}</span> : children}</Tooltip>
    </div>
  )
}

export const ProtectedFlagRoute: FC<ProtectedFlagRouteProps> = ({
  hasFlag,
  buttonTo = '/datasets',
  buttonText = 'Go To Datasets',
  ...routeProps
}) => {
  if (!hasFlag) {
    return <Route {...routeProps} component={() => <Unauthorized buttonTo={buttonTo} buttonText={buttonText} />} />
  }

  return <Route {...routeProps} />
}

export const ProtectedRoleRoute: FC<ProtectedRoleRouteProps> = ({
  role = COMPANY_ADMIN_ROLE,
  buttonTo = '/datasets',
  buttonText = 'Go To Datasets',
  subTitle = 'Sorry, you are not authorized to access this page.',
  ...routeProps
}) => {
  const { isSuperAdmin, isCompanyAdmin } = useUser()

  if (!isCompanyAdmin && role === COMPANY_ADMIN_ROLE) {
    return (
      <Route
        {...routeProps}
        component={() => <Unauthorized buttonTo={buttonTo} buttonText={buttonText} subTitle={subTitle} />}
      />
    )
  }

  if (!isSuperAdmin && role === SUPER_ADMIN_ROLE) {
    return (
      <Route
        {...routeProps}
        component={() => <Unauthorized buttonTo={buttonTo} buttonText={buttonText} subTitle={subTitle} />}
      />
    )
  }

  return <Route {...routeProps} />
}

export const OnboardedRoute: FC<OnboardedRouteProps> = ({ adminOnly = false, ...routeProps }) => {
  const company = useCompany()
  const subscribedCompany = useOnboardingSubscribedCompany()
  const { loading, isCompanyArchived } = useOnboardingContext()

  // Note company status will move from "new" to "onboarding"
  // once resources have been provisioned successfully
  const companyProvisioningResources = subscribedCompany.status === ICompany_Status_Enum.New

  // If a company has been archived, redirect them to
  // the /archived page
  if (isCompanyArchived) {
    return <Redirect to={`/${company.slug}/archived`} />
  }

  if (companyProvisioningResources) {
    // Provisioning has its own route!
    return <Redirect to={`/${company.slug}/provisioning`} />
  }

  if (loading) {
    return <CenteredLoader id={routeProps.path} />
  }

  if (adminOnly) {
    return <ProtectedRoleRoute {...routeProps} />
  } else {
    return <Route {...routeProps} />
  }
}
