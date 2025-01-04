import { Tooltip } from 'antd-next'
import { DatasetIcon } from 'components/Navbar/NavIcons'
import { Link } from 'components/shared/jawns'
import { ICompany } from 'graph/generated'

interface Props {
  datasetSlug: string
  groupName: string
  company: ICompany
  searchParams: string
}

const LinkToDataset = ({ datasetSlug, groupName, company, searchParams }: Props) => {
  const { slug: companySlug } = company
  const path = `/${companySlug}/datasets/edit/${datasetSlug}?${searchParams}`

  return (
    <Tooltip title={`Source Dataset (${groupName})`}>
      <Link href={path} style={{ color: 'inherit' }} target="_blank" data-test="link-to-dataset">
        <DatasetIcon />
      </Link>
    </Tooltip>
  )
}

export default LinkToDataset
