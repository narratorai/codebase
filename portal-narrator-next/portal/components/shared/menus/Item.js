import React from 'react'
import styled from 'styled-components'
import { Item as ReactContexifyItem } from 'react-contexify'
import { colors } from 'util/constants'

export default styled(({ children, disabled, ...props }) => (
  <ReactContexifyItem disabled={disabled} {...props}>
    {children}
  </ReactContexifyItem>
))`
  display: flex;
  align-items: center;
  font-family: 'Source Sans Pro', sans-serif;
  color: ${(props) => (props.disabled ? colors.gray600 : colors.gray800)};
  padding: 8px 16px;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};

  .react-contexify__item__content a {
    color: ${(props) => (props.disabled ? colors.gray600 : colors.gray800)};
  }

  &:hover {
    background-color: white;
    color: ${colors.blue500};
    font-weight: ${(props) => (props.disabled ? 'inherit' : 600)};

    /* Override react-contexify defaults! */
    .react-contexify__item__data {
      background-color: white;
    }

    /* And child <Text /> components! */
    p {
      background-color: white;
    }

    /* And child <a /> components! */
    .react-contexify__item__content a {
      color: ${colors.blue500};
      text-decoration: none;
    }

    /* And child Svg's */
    svg,
    use,
    path,
    mask {
      fill: ${(props) => (props.disabled ? 'inherit' : colors.blue500)};
    }
  }
`
