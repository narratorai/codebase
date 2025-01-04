import { Divider } from 'components/antd/staged'
import { useUser } from 'components/context/user/hooks'
import { GetFileAPIReturn } from 'components/Narratives/interfaces'
import { Box, Flex, Link, Typography } from 'components/shared/jawns'
import { INarrative } from 'graph/generated'
import { compact, get, isEmpty, map } from 'lodash'
import styled from 'styled-components'
import { breakpoints } from 'util/constants'
import { ASSEMBLED_NARRATIVE_SUMMARY_OFFSET, ASSEMBLED_NARRATIVE_SUMMARY_WIDTH } from 'util/narratives/constants'

import AnalysisView from './AnalysisView'
import AssembledNarrativeTopBar from './AssembledNarrativeTopBar'
import SnapshotTextAndButton from './SnapshotTextAndButton'

// keep media queries here instead of using
// LargeScreenOnly and ScreenOnly
// to maintain sticky position
// (LargeScreenOnly and ScreenOnly have divs/box that break sticky)
const StyledSummaryBox = styled(Box)`
  position: sticky;
  top: ${ASSEMBLED_NARRATIVE_SUMMARY_OFFSET}px;
  width: ${ASSEMBLED_NARRATIVE_SUMMARY_WIDTH}px;
  height: calc(100vh - ${ASSEMBLED_NARRATIVE_SUMMARY_OFFSET}px);

  @media only screen and (max-width: ${breakpoints.md}) {
    display: none;
  }

  @media print {
    display: none !important;
  }
`

// take full width on non-mobile b/c section-link sider is gone
const AnalysisContainer = styled(Box)`
  width: calc(100% - ${ASSEMBLED_NARRATIVE_SUMMARY_WIDTH + 54}px);
  overflow-y: scroll;
  padding: 16px 16px 0;

  @media only screen and (max-width: ${breakpoints.md}) {
    width: 100%;
    padding: 0;
  }

  /* would be nice to raise the size of the copy within the narrative to wider than 700px 
     but it's not a big deal and a fair bit of trouble */
  @media print {
    width: 100%;
    overflow-y: auto;
  }
`

interface Props {
  narrative: INarrative
  fileResponse: GetFileAPIReturn
  toggleDynamicFieldDrawer: () => void
  handleRunNarrative: () => void
  refetchNarrative: () => void
  setSelectedSectionIndex: any
  selectedFile: any
}

export default function AnalysisMain({
  narrative,
  fileResponse,
  toggleDynamicFieldDrawer,
  handleRunNarrative,
  refetchNarrative,
  setSelectedSectionIndex,
  selectedFile,
}: Props) {
  const { user, isCompanyAdmin } = useUser()

  const sections = fileResponse?.narrative?.sections
  const notAllowedToUpdate = user.id !== narrative.created_by && !isCompanyAdmin

  return (
    <Flex>
      {/* We need to set a calculated width on this Box so that the
                      plots resize correctly when user resizes their window. */}
      <AnalysisContainer>
        {/* TODO: Add 'react-headroom' to AssembledNarrativeTopBar
                    // Current issue: Headroom is not respecting the SideNavbar (covering it and taking full screen width)
                    // I tried passing a parent to Headroom: https://kyleamathews.github.io/react-headroom/
                    // i.e. <Headroom parent={() => containerRef?.current}>
                    // but getting null on addEventListener error
                    // Looks like this was solved in: https://github.com/KyleAMathews/react-headroom/issues/169
                    // but still seeing the issue
                    */}

        <AssembledNarrativeTopBar
          narrative={narrative}
          notAllowedToUpdate={notAllowedToUpdate}
          toggleDynamicFieldDrawer={toggleDynamicFieldDrawer}
          handleRunNarrative={handleRunNarrative}
          refetchNarrative={refetchNarrative}
        />

        <AnalysisView narrative={narrative} selectedFile={selectedFile} analysisData={fileResponse} />
      </AnalysisContainer>

      <StyledSummaryBox ml={2}>
        <Flex justifyContent="space-between" flexDirection="column" style={{ height: '100%', flexGrow: 1 }}>
          <Box>
            <Typography type="body300" color="gray700" mb={1}>
              SUMMARY
            </Typography>
            {(sections || []).map((section, index) => {
              return (
                <Box mb={1} key={`${section.title}.${get(section, 'takeaway.title')}`}>
                  <a
                    href={`#step-${index + 1}`}
                    onClick={(event) => {
                      event.preventDefault()
                      setSelectedSectionIndex(index)
                    }}
                    style={{
                      display: 'block',
                    }}
                  >
                    <Typography as="div" type="body200">
                      {section.title}
                    </Typography>
                  </a>
                </Box>
              )
            })}
          </Box>

          <Box>
            {/* Datasets in Narrative WIP */}
            {!isEmpty(narrative?.narrative_datasets) && (
              <>
                <Box mb={3}>
                  <Typography type="body300" color="gray700" mb={1}>
                    LINKED DATASETS
                  </Typography>
                  {compact(
                    map(narrative?.narrative_datasets, (item) => {
                      // FIXME: a dataset might have a status of in_progress or archived
                      // and not belong to someone viewing this narrative
                      // currently graph isn't pulling those datasets b/c of perrmissions
                      // so don't render broken links if dataset is not present in graph resp
                      if (item.dataset) {
                        return (
                          <Box key={item.id} mb={1}>
                            <Link to={`/datasets/edit/${item.dataset.slug}`}>
                              <Typography as="div" type="body200">
                                {item.dataset.name}
                              </Typography>
                            </Link>
                          </Box>
                        )
                      }

                      return null
                    })
                  )}
                </Box>
                <Box>
                  <Divider />
                </Box>
              </>
            )}
            {/* End Datasets in Narrative WIP */}
            <Box pb={3} pr={1}>
              <SnapshotTextAndButton />
            </Box>
          </Box>
        </Flex>
      </StyledSummaryBox>
    </Flex>
  )
}
