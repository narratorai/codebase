import { CloseOutlined } from '@ant-design/icons'
import { RenderFunction, TooltipPlacement } from 'antd/es/tooltip'
import { Popconfirm } from 'antd-next'
import Plus from 'components/shared/icons/Plus'
import { Box, BoxProps, Flex, Typography } from 'components/shared/jawns'
import { noop } from 'lodash'
import React from 'react'
import styled from 'styled-components'
import { semiBoldWeight } from 'util/constants'

const ListItemWrapper = styled(Box)<{ clickable?: boolean }>`
  position: relative;
  border: ${({ clickable, theme }) => (clickable ? `1px solid ${theme.colors.blue500}` : 'none')};
  border-style: ${({ clickable }) => (clickable ? 'dashed' : 'none')};
  background-color: ${({ clickable, bg, theme }) => (clickable ? 'none' : theme.colors[(bg || 'gray200') as string])};
  cursor: ${({ clickable }) => (clickable ? 'pointer' : 'inherit')};

  &:hover {
    background-color: ${({ clickable, theme }) => (clickable ? theme.colors.blue100 : 'none')};
  }
`

const MessageWrapper = styled(Flex)`
  position: absolute;
  top: 0;
`

const CloseWrapper = styled.div`
  display: flex;
  position: absolute;
  cursor: pointer;
  top: 8px;
  right: 4px;
  z-index: 1;
  padding: 4px 8px 4px 6px;
`

interface ListItemCardProps extends BoxProps {
  ctaMessage?: string
  onClose?: () => void
  clickable?: boolean
  removable?: boolean
  disableRemove?: boolean
  bg?: string
  popconfirm?: React.ReactNode | RenderFunction
  popconfirmPlacement?: TooltipPlacement
}

const ListItemCard: React.FC<ListItemCardProps> = ({
  children,
  onClose = noop,
  ctaMessage,
  clickable = false,
  removable = true,
  disableRemove = false,
  popconfirm,
  popconfirmPlacement,
  p = '16px',
  mb = '16px',
  ...props
}) => {
  return (
    <ListItemWrapper p={p} mb={mb} {...props}>
      {!clickable && removable && (
        <CloseWrapper>
          {popconfirm ? (
            <Popconfirm disabled={disableRemove} placement={popconfirmPlacement} title={popconfirm} onConfirm={onClose}>
              <CloseOutlined
                data-test="list-item-card-close"
                disabled={disableRemove}
                style={{
                  opacity: disableRemove ? 0.35 : 1,
                  cursor: disableRemove ? 'not-allowed' : 'default',
                }}
              />
            </Popconfirm>
          ) : (
            <CloseOutlined
              data-test="list-item-card-close"
              disabled={disableRemove}
              style={{
                opacity: disableRemove ? 0.35 : 1,
                cursor: disableRemove ? 'not-allowed' : 'default',
              }}
              onClick={onClose}
            />
          )}
        </CloseWrapper>
      )}

      {clickable && ctaMessage && (
        <MessageWrapper alignItems="center">
          <Box mr="4px">
            <Plus width={8} height={8} color="blue500" />
          </Box>
          <Typography type="body400" color="blue500" fontWeight={semiBoldWeight}>
            {ctaMessage}
          </Typography>
        </MessageWrapper>
      )}

      <Box pt={ctaMessage ? '4px' : null} relative>
        {children}
      </Box>
    </ListItemWrapper>
  )
}

export default ListItemCard
