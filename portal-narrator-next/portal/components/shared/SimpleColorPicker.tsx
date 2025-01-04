import { DeleteOutlined } from '@ant-design/icons'
import { Button, Popover } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { compact, isFunction, map, sortBy, split } from 'lodash'
import { parseToHsl } from 'polished'
import { useMemo, useState } from 'react'
import { TwitterPicker } from 'react-color'
import styled from 'styled-components'
import { colors as utilColors } from 'util/constants'

const PopoverContainer = styled(Box)`
  .antd5-popover {
    .antd5-popover-inner-content {
      padding: 0 !important;
    }
  }
`

const TwitterPickerContainer = styled(Box)`
  .twitter-picker {
    box-shadow: none !important;
  }
`

const ColorBox = styled(Box)<{ disabled?: boolean; backgroundColor: string }>`
  ${({ backgroundColor }) => `
    background-color: ${backgroundColor};  
  `}

  height: 32px;
  width: 40px;
  border: 1px solid black;

  ${({ disabled }) => `
    &:hover {
      cursor: ${disabled ? 'auto' : 'pointer'};
    }
  `}
`

const DEFAULT_COLORS = [
  '#c2195b',
  '#eb144c',
  '#d32e30',
  '#f2511c',
  '#ff6900',
  '#ffb300',
  '#fcb900',
  '#0497a7',
  '#44a049',
  '#00d084',
  '#7bdcb5',
  '#1b88e5',
  '#0693e3',
  '#8ed1fc',
  '#4050b5',
  '#8d23ab',
  '#9900ef',
  '#f78da7',
]

interface Props {
  disabled?: boolean
  readonly?: boolean
  onChange: (value: string) => void
  value: string
  colorBoxStyles?: Record<string, any>
  onDelete?: () => void
  hideHexText?: boolean
}

const SimpleColorPicker = ({
  disabled,
  readonly,
  onChange,
  value,
  colorBoxStyles = {},
  onDelete,
  hideHexText = false,
}: Props) => {
  const company = useCompany()
  const companyPlotColors = split(company.plot_colors, ',') || []
  const companyBrandingColor = company.branding_color
  const colors = compact([...DEFAULT_COLORS, ...companyPlotColors, companyBrandingColor])
  const [isOpen, setIsOpen] = useState(false)

  // sort colors by hue
  const sortedColors: string[] = useMemo(() => {
    const hslAndHex = map(colors, (hex) => ({
      hsl: parseToHsl(hex),
      hex,
    }))

    const sortedByHue = sortBy(hslAndHex, ['hsl.hue'])
    return map(sortedByHue, (color) => color.hex)
  }, [colors])

  return (
    <label data-public>
      <Flex alignItems="center" data-public>
        {disabled || readonly ? (
          <ColorBox backgroundColor={value} style={colorBoxStyles} />
        ) : (
          <PopoverContainer>
            <Popover
              trigger="click"
              placement="topLeft"
              open={isOpen}
              onOpenChange={(open: boolean) => {
                setIsOpen(open)
              }}
              getPopupContainer={(trigger: HTMLElement) => trigger.parentNode as HTMLElement}
              // NOTE: this content is unusual in that TwitterPicker
              // hi-jacks a lot of the click events (hence the preventDefault calls below)
              content={
                <Box>
                  {isFunction(onDelete) && (
                    <Flex
                      justifyContent="flex-end"
                      className="delete-row"
                      onClick={(e) => {
                        // don't let container trigger delete
                        e.preventDefault()
                      }}
                    >
                      <Box mr={1} mt={1}>
                        <Button
                          onClick={() => {
                            onDelete()
                            setIsOpen(false)
                          }}
                          type="link"
                          size="small"
                          icon={<DeleteOutlined style={{ color: utilColors.red500 }} />}
                        />
                      </Box>
                    </Flex>
                  )}

                  <TwitterPickerContainer
                    className="twitter-picker-container"
                    onClick={(e) => {
                      // if there is a delete button
                      // don't let click events on colors trigger it
                      e.preventDefault()
                    }}
                  >
                    <Box>
                      <TwitterPicker
                        triangle="hide"
                        onChangeComplete={(value) => {
                          if (value.hex && !disabled) {
                            onChange(value.hex)
                          }
                        }}
                        color={value}
                        colors={sortedColors}
                      />
                    </Box>
                  </TwitterPickerContainer>
                </Box>
              }
            >
              <ColorBox
                backgroundColor={value}
                onClick={(e) => {
                  e.preventDefault()
                }}
                style={colorBoxStyles}
              />
            </Popover>
          </PopoverContainer>
        )}

        {!hideHexText && (
          <Box ml={1}>
            <Typography>{value}</Typography>
          </Box>
        )}
      </Flex>
    </label>
  )
}

export default SimpleColorPicker
