import { ICompany } from 'graph/generated'
import { GetToken } from 'util/interfaces'
import { mavisRequest } from 'util/mavis-api'

interface ITokenAndCompany {
  company: ICompany
  getToken: GetToken
}

interface DeleteTaskProps extends ITokenAndCompany {
  id: string
}

interface CancelTaskProps extends ITokenAndCompany {
  id: string
}

interface GetRunningQueriesProps extends ITokenAndCompany {
  after?: string
}

export const deleteTask = async ({ getToken, id, company }: DeleteTaskProps) => {
  return await mavisRequest<any>({
    method: 'DELETE',
    path: `/v1/task_tracker/task/${id}`,
    params: {
      company: company.slug,
    },
    getToken,
    company,
  })
}

export const cancelTaskExecution = async ({ getToken, id, company }: CancelTaskProps) => {
  const body = JSON.stringify({ id })

  return await mavisRequest<any>({
    method: 'POST',
    path: '/admin/v1/task/execution/cancel',
    params: {
      company: company.slug,
    },
    body,
    getToken,
    company,
  })
}

export const getRunningQueries = async ({ getToken, after, company }: GetRunningQueriesProps) => {
  return await mavisRequest<any>({
    method: 'GET',
    path: '/admin/v1/query_history',
    params: {
      company: company.slug,
      after,
    },
    getToken,
    company,
  })
}
