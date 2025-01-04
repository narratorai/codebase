import { FullscreenOutlined } from '@ant-design/icons'
import { Button, Modal, Tooltip } from 'antd-next'
import { Box } from 'components/shared/jawns'
import styled from 'styled-components'
import useToggle from 'util/useToggle'

const OVERFLOW_BUFFER = 20
const BUTTON_CLASSNAME = 'overflow-modal-button'

const OverflowContainer = styled(Box)`
  .${BUTTON_CLASSNAME} {
    position: absolute;
    right: 0;
    bottom: 0;
    opacity: 0;
    will-change: opacity;
    transition: opacity 150ms ease-in-out;
  }

  &:hover {
    .${BUTTON_CLASSNAME} {
      opacity: 1;
    }
  }
`

interface Props {
  contentId: string
  type: 'metric' | 'markdown'
  children: React.ReactNode
}

const OverflowModalContainer = ({ contentId, type, children }: Props) => {
  const [modalVisible, toggleModalVisible] = useToggle(false)

  const elementContainer = document.getElementById(contentId)

  // check if markdown, metric, or table as markdown is overflowing
  // if so, show option to view full content
  const isOverflowing = !!(
    elementContainer &&
    (elementContainer?.scrollHeight - OVERFLOW_BUFFER > elementContainer?.clientHeight ||
      elementContainer?.scrollWidth - OVERFLOW_BUFFER > elementContainer?.clientWidth)
  )

  // do nothing if not overflowing
  if (!isOverflowing) {
    return <div>{children}</div>
  }

  // if overflowing, show button + modal
  return (
    <div>
      <OverflowContainer>
        {children}

        <Tooltip title="Show overflow content">
          <Button
            className={BUTTON_CLASSNAME}
            onClick={toggleModalVisible}
            icon={<FullscreenOutlined />}
            size="small"
          />
        </Tooltip>
      </OverflowContainer>

      <Modal
        open={modalVisible}
        onCancel={toggleModalVisible}
        footer={null}
        // markdown (especially tables as markdown)
        // needs more width than metrics
        width={type === 'markdown' ? '80vw' : undefined}
        styles={{
          body: { overflow: 'auto' },
        }}
      >
        {children}
      </Modal>
    </div>
  )
}

export default OverflowModalContainer
