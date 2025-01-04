import React from 'react'
import styled from 'styled-components'
import sanitize from 'util/sanitize'

const DangerousText = (props) => {
  const { text, className } = props
  const dangerousHtml = { __html: sanitize(text) }
  return <div className={className} dangerouslySetInnerHTML={dangerousHtml} />
}

export default styled(DangerousText)`
  font-size: ${(props) => props.theme.fontSizes[1]};

  .highlighted {
    font-weight: 600;
    background-color: ${(props) => props.theme.colors.teal200};
  }
`
