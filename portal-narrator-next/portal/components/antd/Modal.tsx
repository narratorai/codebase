import { Modal as AntdModal } from 'antd-next'
import { ModalProps as AntdModalProps } from 'antd-next/es/modal'
import styled, { css } from 'styled-components'

interface ModalProps extends AntdModalProps {
  children: React.ReactNode
  full?: boolean
  width?: string | number
  justify?: string
}

const Modal = styled(({ full = false, width = 600, ...props }: ModalProps) => {
  return <AntdModal width={full ? '100%' : width} {...props} />
})`
  ${({ full, width, justify = 'center' }) =>
    (full || !!width) &&
    css`
      display: flex;
      justify-content: ${justify};
      height: 100vh;
      top: 0;
      padding: 0;

      .antd5-modal-content {
        display: flex;
        flex-direction: column;

        /* flex: 1; */
        width: ${width || '100%'};
        max-width: 1600px;
        margin: 24px;
        overflow: auto;
      }

      .antd5-modal-body {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
    `}
`

export default Modal
