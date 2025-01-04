import { QuestionCircleFilled } from '@ant-design/icons'
import { useCompany } from 'components/context/company/hooks'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { ExtraLargeScreenOnly } from 'components/shared/LargeScreenOnly'
import { isEmpty } from 'lodash'
import { darken, readableColor } from 'polished'
import styled from 'styled-components'
import { COPY_MAXWIDTH, ICON_BOX_WIDTH } from 'util/analyses/constants'
import { breakpoints, colors, semiBoldWeight } from 'util/constants'

interface QuestionAndGoalContainerProps {
  textColor: string
  backgroundColor: string
}

const QuestionAndGoalContainer = styled(Flex)<QuestionAndGoalContainerProps>`
  background-color: ${({ backgroundColor }) => backgroundColor};
  border-radius: 8px;
  max-width: 920px;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 48px;
  box-shadow: 0 16px 32px 0 rgb(0 0 0 / 5%);

  p,
  div {
    color: ${({ textColor }) => textColor};
  }

  @media only screen and (max-width: ${breakpoints.md}) {
    border-radius: 0;
    box-shadow: none;
    margin-bottom: 0;
  }
`

// todo: fix branding if we go dark like this
// make a darker version of their branding color
const DEFAULT_BACKGROUND_COLOR = colors.blue600

interface Props {
  question?: string
  goal?: string
}

const QuestionAndGoalWidget = ({ question, goal }: Props) => {
  const company = useCompany()
  const { branding_color: brandingColor } = company

  if (isEmpty(question) && isEmpty(goal)) return null

  // If a company has a branding color
  // use a darker version of their branding color for this section

  const questionGoalBackgroundColor =
    isEmpty(brandingColor) || brandingColor == undefined ? DEFAULT_BACKGROUND_COLOR : darken(0.2, brandingColor)
  const textColor = readableColor(questionGoalBackgroundColor || DEFAULT_BACKGROUND_COLOR)
  const iconColor = isEmpty(brandingColor) ? colors.blue100 : textColor

  return (
    <QuestionAndGoalContainer textColor={textColor} backgroundColor={questionGoalBackgroundColor} mb={5} py={4} px={3}>
      <ExtraLargeScreenOnly style={{ minWidth: ICON_BOX_WIDTH }}>
        <Flex justifyContent="flex-end" pr={3}>
          <QuestionCircleFilled
            style={{ fontSize: '80px', marginLeft: 'auto', marginRight: 'auto' }}
            color={iconColor}
          />
        </Flex>
      </ExtraLargeScreenOnly>
      <Box flexGrow={1}>
        <Box maxWidth={COPY_MAXWIDTH} mx="auto">
          <Typography type="title200" fontWeight={semiBoldWeight} mt="5px" data-test="narrative-question-preview">
            {question}
          </Typography>

          {goal && (
            <Typography type="title400" color="blue800" mt={3} data-test="narrative-goal-preview">
              <b>Goal:</b> {goal}
            </Typography>
          )}
        </Box>
      </Box>
    </QuestionAndGoalContainer>
  )
}

export default QuestionAndGoalWidget
