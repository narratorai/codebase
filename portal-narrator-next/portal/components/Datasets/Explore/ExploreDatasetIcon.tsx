import { ExperimentOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { Link } from 'components/shared/jawns'
import queryString from 'query-string'
import React from 'react'
import { useLocation } from 'react-router'

interface Props {
  datasetSlug?: string
  groupSlug?: string
  plotSlug?: string
  narrativeSlug?: string
  uploadKey?: string
}

const ExploreIconDataset = ({ datasetSlug, groupSlug, plotSlug, narrativeSlug, uploadKey }: Props) => {
  const company = useCompany()
  const location = useLocation()

  // link automatically injects company slug
  // remove slug in link to not get double company slug in url
  const cleanPathname = location.pathname.replace(`/${company.slug}`, '')

  const newSearchParams = {
    previousUrl: window.location.href,
    // below params are only used when coming from a plot in narrative
    groupSlug,
    plotSlug,
    narrativeSlug,
    uploadKey,
  }
  const searchParams = queryString.stringify(newSearchParams)

  return (
    <Tooltip title="Explore Dataset">
      <div data-test="explore-dataset-icon">
        <Link to={`${cleanPathname}/explorer/${datasetSlug}?${searchParams}`}>
          <ExperimentOutlined style={{ color: 'black' }} />
        </Link>
      </div>
    </Tooltip>
  )
}

export default ExploreIconDataset
