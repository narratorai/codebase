/* eslint-disable @next/next/no-img-element */

import { useCompany } from 'components/context/company/hooks'
import { ITakeaway } from 'components/Narratives/interfaces'
import ActionableTag from 'components/Narratives/shared/ActionableTag'
import TakeawayValueIcon from 'components/Narratives/shared/TakeawayValueIcon'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { ExtraLargeScreenOnly } from 'components/shared/LargeScreenOnly'
import { isEmpty, map } from 'lodash'
import { readableColor } from 'polished'
import MavisLogo from 'static/svg/Analyses/MavisLogo.svg'
import styled from 'styled-components'
import { COPY_MAXWIDTH, ICON_BOX_WIDTH, INSIGHT_MAXWIDTH } from 'util/analyses/constants'
import { breakpoints, colors, semiBoldWeight } from 'util/constants'

interface InsightSummaryContainerProps {
  textColor: string
}

const InsightSummaryContainer = styled(Flex)<InsightSummaryContainerProps>`
  p {
    color: ${({ textColor }) => textColor};
  }

  margin-left: auto;
  margin-right: auto;
  margin-bottom: 48px;
  border-radius: 8px;
  box-shadow: 0 16px 32px 0 rgb(0 0 0 / 15%);
  max-width: ${INSIGHT_MAXWIDTH};

  p.takeaway-title {
    font-size: 1.3em;
  }

  @media print {
    p {
      color: black !important;
    }

    background-color: white;
    box-shadow: none;
  }

  @media only screen and (max-width: ${breakpoints.md}) {
    border-radius: 0;
    box-shadow: none;
    margin-bottom: 0;
  }
`

interface Props {
  recommendation?: {
    title?: string
    explanation?: string
  }
  keyTakeaways?: ITakeaway[]
  editing?: boolean
  isActionable?: boolean | string | number | null
}

const InsightSummary = ({ recommendation, keyTakeaways, editing = false, isActionable }: Props) => {
  const company = useCompany()
  const { title: recommendationTitle, explanation: recommendationExplanation } = recommendation || {}

  if (!editing && isEmpty(recommendationTitle) && isEmpty(recommendationExplanation) && isEmpty(keyTakeaways)) {
    return null
  }

  const { branding_color: brandingColor, logo_url: logoUrl } = company

  const insightBackgroundColor = isEmpty(brandingColor) ? colors.blue800 : brandingColor
  const textColor = readableColor(insightBackgroundColor || colors.blue800)

  return (
    <InsightSummaryContainer bg={insightBackgroundColor} py={4} px={3} textColor={textColor}>
      <ExtraLargeScreenOnly style={{ minWidth: ICON_BOX_WIDTH }}>
        <Flex justifyContent="flex-end" pr={3}>
          {isEmpty(logoUrl) ? (
            <MavisLogo width={120} height={120} />
          ) : (
            <img
              src={logoUrl || undefined}
              alt={`${company.name} Logo`}
              style={{ maxWidth: '120px', maxHeight: '120px' }}
            />
          )}
        </Flex>
      </ExtraLargeScreenOnly>
      <Box flexGrow={1}>
        <Box maxWidth={COPY_MAXWIDTH}>
          {(recommendationTitle || recommendationExplanation) && (
            <Box>
              <Flex>
                <Typography color="white" fontWeight={semiBoldWeight} type="body100" mb={2}>
                  RECOMMENDATION
                </Typography>

                <Box ml={1}>
                  <ActionableTag compiledActionable={isActionable} />
                </Box>
              </Flex>

              <Typography
                color="white"
                fontWeight={semiBoldWeight}
                type="title200"
                mb={2}
                data-test="narrative-recommendation-title-preview"
                // Preserve line breaks in formatting:
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {recommendationTitle}
              </Typography>

              {recommendationExplanation && (
                <Typography
                  color="white"
                  type="title400"
                  mb="40px"
                  data-test="narrative-recommendation-explanation-preview"
                >
                  <b>Why:</b> {recommendationExplanation}
                </Typography>
              )}
            </Box>
          )}

          {!isEmpty(keyTakeaways) && (
            <Box data-test="key-takeaway-preview">
              <Typography color="white" fontWeight={semiBoldWeight} type="body100" mb={2}>
                KEY TAKEAWAYS
              </Typography>

              {keyTakeaways &&
                map(keyTakeaways, (takeaway, index) => {
                  const { title, explanation, value, conditioned_on } = takeaway

                  // conditioned_on has already been compiled
                  // so it will either be bool, string, or num
                  // no field input here so can't use 'assembledSectionContentIsVisible' function
                  const showAssembledTakeaway = conditioned_on !== false && conditioned_on !== 0
                  return (
                    <Box
                      mb={index === keyTakeaways.length - 1 ? '0' : '24px'}
                      key={`${JSON.stringify(takeaway)}__${index}`}
                      style={{ opacity: showAssembledTakeaway ? '1' : '0.5' }}
                    >
                      {title && (
                        <Flex mb="4px">
                          <Box mr="8px">
                            <TakeawayValueIcon value={value} />
                          </Box>
                          <Typography className="takeaway-title" color="white" data-test="key-takeaway-title-preview">
                            {title}
                          </Typography>
                        </Flex>
                      )}
                      <Box maxWidth="600px" ml={3}>
                        <Typography color="white" type="body50" data-test="key-takeaway-explanation-preview">
                          {explanation}
                        </Typography>
                      </Box>
                    </Box>
                  )
                })}
            </Box>
          )}
        </Box>
      </Box>
    </InsightSummaryContainer>
  )
}

export default InsightSummary
