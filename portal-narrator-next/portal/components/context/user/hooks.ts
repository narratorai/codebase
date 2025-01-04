import { COMPANY_ADMIN_ROLE, SUPER_ADMIN_ROLE } from 'components/context/auth/constants'
import { ICompany_User, IDocument_Live, IUser } from 'graph/generated'
import { useContext } from 'react'

import { UserContext } from './Provider'

export const useUserContext = () => useContext(UserContext)

// TODO migrate all use of redux User to here
// selectedUser selector etc etc
// then we can sunset the User reducer
interface UseUserObject {
  user: IUser
  companyUser?: Partial<ICompany_User>
  isCompanyAdmin: boolean
  isSuperAdmin: boolean
}

export const useUser = (): UseUserObject => {
  const ctx = useUserContext()

  const user = ctx?.result?.data?.user[0] as IUser
  const companyUser = ctx?.companyUser

  const isCompanyAdmin = companyUser ? companyUser.role === COMPANY_ADMIN_ROLE : false
  const isSuperAdmin = user?.role === SUPER_ADMIN_ROLE

  return {
    user,
    companyUser,
    isCompanyAdmin: isCompanyAdmin || isSuperAdmin,
    isSuperAdmin,
  }
}

export const useTerms = (): IDocument_Live => {
  const ctx = useUserContext()
  const terms = ctx?.result?.data?.terms[0]
  return terms as IDocument_Live
}
