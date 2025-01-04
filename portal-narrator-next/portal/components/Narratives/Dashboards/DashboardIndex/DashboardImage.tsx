import { Skeleton } from 'antd-next'
import { DASHBOARD_BACKGROUND_COLOR } from 'components/Narratives/Dashboards/BuildDashboard/constants'
import { Box, Flex, Link } from 'components/shared/jawns'
import styled from 'styled-components'

import { DashboardType } from './interfaces'

export const CARD_WIDTH = 256
export const CARD_HEIGHT = 176
export const IMAGE_HEIGHT = CARD_HEIGHT - 54

const StyledImage = styled(Flex)<{ hasRuns: boolean }>`
  width: 100%;
  height: 100%;
  position: relative;

  .image-link {
    ${({ hasRuns }) => (hasRuns ? `cursor: pointer;` : `cursor: default;`)}
    ${({ hasRuns }) => !hasRuns && `pointer-events: none;`}
  }

  .inner-image-container {
    width: 100%;
    height: ${IMAGE_HEIGHT}px;
    background-color: ${DASHBOARD_BACKGROUND_COLOR};
    overflow: hidden;
    position: absolute;
    top: 12px;
    left: 0;
    right: 0;
    margin: auto;
  }

  img {
    width: 100%;
    height: auto;
    overflow-clip-margin: content-box;
    overflow: clip;
  }
`

const SkeletonContainer = styled(Box)`
  height: 100%;

  .antd5-skeleton,
  .antd5-skeleton-element {
    width: 100% !important;
    height: 100% !important;
    background-color: ${DASHBOARD_BACKGROUND_COLOR};

    .antd5-skeleton-image {
      position: absolute;
      left: 0;
      right: 0;
      margin: auto;
      height: 100%;
      width: 100%;
      background: ${DASHBOARD_BACKGROUND_COLOR} !important;
    }
  }
`

interface Props {
  image?: string
  loadingDashboardImages?: boolean
  hasRuns: boolean
  dashboard: DashboardType
}

const DashboardImage = ({ image, loadingDashboardImages, hasRuns, dashboard }: Props) => {
  return (
    <StyledImage justifyContent="center" hasRuns={hasRuns}>
      {/* link disabled via css if no assembled runs */}
      <Link className="image-link" to={`/dashboards/a/${dashboard.slug}`}>
        <Box className="inner-image-container">
          {image ? (
            <img src={image} alt="" />
          ) : (
            <SkeletonContainer>
              <Skeleton.Image active={loadingDashboardImages} />
            </SkeletonContainer>
          )}
        </Box>
      </Link>
    </StyledImage>
  )
}

export default DashboardImage
