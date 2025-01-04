import { ICompany_User_Role_Enum, IUser_Role_Enum } from 'graph/generated'

// On the company user table:
export const COMPANY_ADMIN_ROLE = ICompany_User_Role_Enum.Admin
export const COMPANY_MEMBER_ROLE = ICompany_User_Role_Enum.User
// On the user table:
export const SUPER_ADMIN_ROLE = IUser_Role_Enum.InternalAdmin

export const COMPANY_USER_ROLE_OPTIONS = Object.entries(ICompany_User_Role_Enum).map(([label, value]) => {
  if (value === COMPANY_MEMBER_ROLE) {
    // label should be "Member" instead of "User"
    return {
      label: 'Member',
      value,
    }
  }
  return { label, value }
})
