import { Breadcrumb } from 'antd-next'
import { Link } from 'components/shared/jawns'
import { isEmpty, map } from 'lodash'
import styled from 'styled-components'
import { breakpoints } from 'util/constants'

export interface MobileBreadcrumb {
  url?: string | null
  text: string
}

const StyledBreadcrumbs = styled(Breadcrumb)`
  @media only screen and (min-width: ${breakpoints.md}) {
    display: none;
  }

  .antd5-breadcrumb-separator {
    color: white;
  }
`

interface Props {
  breadcrumbs?: MobileBreadcrumb[]
}

const MobileBreadcrumbs = ({ breadcrumbs }: Props) => {
  if (isEmpty(breadcrumbs)) {
    return null
  }

  const breadcrumbItems = map(breadcrumbs, (crumb) => ({
    title: crumb.url ? (
      <Link to={crumb.url} color="white">
        {crumb.text}
      </Link>
    ) : (
      <span style={{ color: 'white' }}>{crumb.text}</span>
    ),
  }))

  return <StyledBreadcrumbs items={breadcrumbItems} />
}

export default MobileBreadcrumbs
