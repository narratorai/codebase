import _ from 'lodash'
import PropTypes from 'prop-types'
import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import Renderer from 'util/markdown/renderer'

const StyledReactMarkdown = styled.div`
  font-size: initial;

  h1,
  h2,
  h3,
  h4,
  h5,
  p,
  li {
    margin-bottom: 8px;
  }

  ol,
  ul {
    padding-inline-start: 2rem;
    margin-block-end: 1em;
  }

  table {
    border-collapse: collapse;

    th,
    td {
      padding: 8px;
      border: 1px solid black;
    }
  }

  code {
    color: ${(props) => props.theme.colors.magenta500};
    font-family: ${(props) => props.theme.fonts.sans};
  }
`

const MarkdownWidget = ({ text }) => {
  const [source, setSource] = useState(text)
  const debouncedSetSource = useRef(_.debounce(setSource, 500))

  useEffect(() => {
    debouncedSetSource.current(text)
  }, [text])

  return (
    <StyledReactMarkdown>
      <Renderer source={source} />
    </StyledReactMarkdown>
  )
}

MarkdownWidget.propTypes = {
  text: PropTypes.string.isRequired,
}

export default MarkdownWidget
