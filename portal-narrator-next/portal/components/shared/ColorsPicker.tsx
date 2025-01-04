import { PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd-next'
import { Box, Flex } from 'components/shared/jawns'
import { map } from 'lodash'
import { useState } from 'react'
import { colors as utilColors } from 'util/constants'

import SimpleColorPickerWrapper from './SimpleColorPickerWrapper'

interface Props {
  disabled?: boolean
  readonly?: boolean
  onChange: (value: string[]) => void
  value: string[]
}

const ColorsPicker = ({ disabled, readonly, onChange, value }: Props) => {
  const [colors, setColors] = useState<string[]>(value || [])

  // remove the color from array
  const deleteColor = (index: number) => {
    const updatedColors = [...colors]
    updatedColors.splice(index, 1)

    // set colors locally
    setColors(updatedColors)

    // update values from callback
    onChange(updatedColors)
  }

  const updateColor = ({ value, index }: { value: string; index: number }) => {
    const updatedColors = [...colors]
    updatedColors[index] = value

    // set colors locally
    setColors(updatedColors)

    // update values from callback
    onChange(updatedColors)
  }

  const addColor = () => {
    const updatedColors = [...colors, utilColors.blue500]

    // set colors locally
    setColors(updatedColors)

    // update values from callback
    onChange(updatedColors)
  }

  return (
    <Flex alignItems="center">
      {map(colors, (color, index) => (
        <Box mr={1}>
          <SimpleColorPickerWrapper
            index={index}
            value={color}
            onChange={updateColor}
            onDelete={deleteColor}
            disabled={disabled}
            readonly={readonly}
          />
        </Box>
      ))}
      <Button size="small" icon={<PlusOutlined />} onClick={addColor} />
    </Flex>
  )
}

export default ColorsPicker
