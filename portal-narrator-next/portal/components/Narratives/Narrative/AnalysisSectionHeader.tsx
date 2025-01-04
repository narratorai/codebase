import { App } from 'antd-next'
import SectionHeader from 'components/Narratives/shared/SectionHeader'
import CopyToClipboard from 'components/shared/CopyToClipboard'
import { Box } from 'components/shared/jawns'
import { isEmpty } from 'lodash'
import styled, { css } from 'styled-components'
import { INSIGHT_MAXWIDTH } from 'util/analyses/constants'
import { breakpoints, colors } from 'util/constants'

import LargeScreenOnly from '../../shared/LargeScreenOnly'
import CopySectionUrlIcon from './CopySectionUrlIcon'

const StyledHeader = styled(Box)<{ hideTopContent?: boolean; noQuestionsGoalsRecsTakeaways?: boolean }>`
  ${({ hideTopContent }) =>
    !hideTopContent &&
    css`
      @media only screen and (max-width: ${breakpoints.md}) {
        padding-top: 32px;
        margin: 24px 0;
      }

      min-height: 64px;
      margin-bottom: 24px;
      padding-top: 56px;
      border-top: 2px solid ${colors.gray300};
    `};

  width: 100%;
  max-width: ${INSIGHT_MAXWIDTH};
  margin-left: auto;
  margin-right: auto;
  background: white;

  @media only screen and (min-width: ${breakpoints.md}) {
    padding-left: ${({ noQuestionsGoalsRecsTakeaways }) => (noQuestionsGoalsRecsTakeaways ? '50px' : '0')};
  }

  @media print {
    .icon {
      display: none;
    }
  }
`

interface Props {
  index: number
  title: string
  sectionUrl: string
  noQuestionsGoalsRecsTakeaways?: boolean
}

const AnalysisSectionHeader = ({ index, title, sectionUrl, noQuestionsGoalsRecsTakeaways }: Props) => {
  const { notification } = App.useApp()

  // hide the first sections border and reduce spacing if noQuestionsGoalsRecsTakeaways
  const hideTopContent = index === 0 && noQuestionsGoalsRecsTakeaways

  const showUrlCopiedNotification = () => {
    notification.success({
      message: 'Copied URL to clipboard',
      placement: 'topRight',
      duration: 2,
    })
  }

  return (
    <StyledHeader hideTopContent={hideTopContent} noQuestionsGoalsRecsTakeaways={noQuestionsGoalsRecsTakeaways}>
      {!isEmpty(title) && (
        <Box>
          <CopyToClipboard text={sectionUrl} onCopy={showUrlCopiedNotification}>
            <a
              href={`#step-${index + 1}`}
              onClick={(e) => e.preventDefault()}
              style={{
                position: 'relative',
                display: 'block',
                textDecoration: 'none',
              }}
            >
              <LargeScreenOnly>
                <CopySectionUrlIcon />
              </LargeScreenOnly>
              <SectionHeader title={title} />
            </a>
          </CopyToClipboard>
        </Box>
      )}
    </StyledHeader>
  )
}

export default AnalysisSectionHeader
