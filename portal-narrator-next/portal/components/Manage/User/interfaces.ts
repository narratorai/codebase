import { ICompany_User_Role_Enum } from 'graph/generated'

export interface DataRow {
  key: string
  first_name?: string
  last_name?: string
  phone?: string
  email: string
  role: ICompany_User_Role_Enum
  job_title?: any
  updated_at: any
  options: any
}

export interface Record extends Omit<DataRow, 'job_title'> {
  job_title: { jobTitle: string; allJobTitles: string[] }
}
