import React from 'react'
import styled from 'styled-components'
import { Submenu as ReactContexifySubmenu } from 'react-contexify'

export default styled(({ children, label, ...props }) => (
  <ReactContexifySubmenu label={label} {...props}>
    {children}
  </ReactContexifySubmenu>
))`
  font-family: 'Source Sans Pro', sans-serif;
  padding: 8px 16px;
  cursor: 'pointer';
`
