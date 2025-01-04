import styled from 'styled-components'

const AddButton = styled.div<{ asEditor?: boolean }>`
  position: absolute;
  left: 0;
  right: 0;
  bottom: ${({ asEditor }) => (asEditor ? '0' : '-24px')};
  z-index: 1;
  padding: 12px 0;
  cursor: auto;

  &::after {
    opacity: 0.5;
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    border-top: 1px dashed ${({ theme }) => theme.colors.gray400};
  }

  .button {
    display: inline-block;
    position: absolute;
    z-index: 1;
    top: 0;
    left: calc(50% + 8px);
    cursor: auto;

    &:hover {
      cursor: auto;
    }
  }

  &:hover {
    &::after {
      opacity: 1;
    }
  }
`

export default AddButton
