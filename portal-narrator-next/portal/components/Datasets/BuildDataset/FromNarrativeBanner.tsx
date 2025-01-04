import { CloseOutlined } from '@ant-design/icons'
import { Alert, Button, Spin } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { useGetNarrativeBySlugLazyQuery } from 'graph/generated'
import { useContext, useEffect } from 'react'
import styled from 'styled-components'
import { colors, semiBoldWeight, STATUS_PAGE_BANNER_Z_INDEX } from 'util/constants'
import { TOOL_COPY_FROM_NARRATIVE_DATASET } from 'util/datasets'

const StyledCloseIcon = styled(CloseOutlined)`
  color: ${colors.gray500};
  font-size: 12px;

  &:hover {
    color: ${colors.gray600};
  }
`

const FromNarrativeBanner = () => {
  const company = useCompany()
  const { user } = useUser()
  const { machineCurrent, machineSend, onOpenToolOverlay } = useContext(DatasetFormContext)
  const fromNarrative = machineCurrent.context._from_narrative
  const narrativeSlug = fromNarrative?.slug
  const showBanner = fromNarrative?.open

  const [getNarrative, { data: narrativeData, loading: getNarrativeLoading }] = useGetNarrativeBySlugLazyQuery({
    fetchPolicy: 'cache-and-network',
  })

  // if narrative slug is present, get the narrative
  useEffect(() => {
    if (narrativeSlug && company?.id) {
      getNarrative({ variables: { slug: narrativeSlug, company_id: company?.id, user_id: user.id } })
    }
  }, [getNarrative, narrativeSlug, company?.id, user?.id])

  const narrative = narrativeData?.narrative?.[0]
  const handleOpenDuplicateDataset = () => onOpenToolOverlay({ toolType: TOOL_COPY_FROM_NARRATIVE_DATASET })

  const handleCloseBanner = () => {
    machineSend('CLOSE_FROM_NARRATIVE_BANNER')
  }

  if (showBanner) {
    return (
      <Alert
        message={
          <Spin spinning={getNarrativeLoading}>
            <Flex alignItems="center" justifyContent="center">
              {/* Message */}
              <Typography mr={3}>
                Temporary Dataset: Filters from <span style={{ fontWeight: semiBoldWeight }}>{narrative?.name}</span>{' '}
                are applied.
              </Typography>

              {/* CTAs */}
              <Flex alignItems="center">
                <Box mr={1}>
                  <Button size="small" onClick={handleOpenDuplicateDataset}>
                    Save a Copy
                  </Button>
                </Box>

                <Box mr={2}>
                  <a href={`${window.location.origin}/${window.location.pathname}`} target="_blank" rel="noreferrer">
                    <Button size="small">Go to Original</Button>
                  </a>
                </Box>

                <StyledCloseIcon onClick={handleCloseBanner} />
              </Flex>
            </Flex>
          </Spin>
        }
        type="info"
        banner
        showIcon={false}
        style={{
          position: 'absolute',
          top: 0,
          width: '100%',
          zIndex: STATUS_PAGE_BANNER_Z_INDEX - 1,
        }}
      />
    )
  }

  return null
}

export default FromNarrativeBanner
