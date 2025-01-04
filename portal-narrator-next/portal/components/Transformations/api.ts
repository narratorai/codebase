import { ICompany } from 'graph/generated'
import { GetToken } from 'util/interfaces'
import { mavisRequest } from 'util/mavis-api'

interface IDeleteTransformationProps {
  id: string
  getToken: GetToken
  company: ICompany
}

export const deleteTransformation = async ({ id, getToken, company }: IDeleteTransformationProps) => {
  const response = await mavisRequest({
    method: 'DELETE',
    path: `/admin/v1/transformation/${id}`,
    params: {
      company: company.slug,
    },
    getToken,
    retryable: true,
    company,
  })

  return response
}
