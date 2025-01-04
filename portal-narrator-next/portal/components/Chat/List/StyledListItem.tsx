import { List } from 'antd-next'
import styled from 'styled-components'
import { colors } from 'util/constants'

import { FEEDBACK_BUTTONS_CLASSNAME } from '../Feedback/FeedbackForm'

const StyledListItem = styled(List.Item)`
  position: relative;
  padding: 0 0 32px !important;
  border: none !important;
  color: ${colors.mavis_dark_gray} !important;

  .${FEEDBACK_BUTTONS_CLASSNAME} {
    transition: opacity 150ms ease-in-out;
    opacity: 0;
  }

  &:hover {
    .${FEEDBACK_BUTTONS_CLASSNAME} {
      opacity: 1;
    }
  }
`

export default StyledListItem
