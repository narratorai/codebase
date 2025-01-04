import styled from 'styled-components'

const StyledPrintOnly = styled.div`
  display: none !important;

  @media print {
    display: block !important;
  }
`

export default StyledPrintOnly
