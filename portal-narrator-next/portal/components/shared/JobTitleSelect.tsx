import { PlusOutlined } from '@ant-design/icons'
import { Button, Divider, Input, Space } from 'antd-next'
import { SelectProps } from 'antd-next/es/select'
import { SearchSelect } from 'components/antd/staged'
import { includes, isArray, isEmpty, map } from 'lodash'
import { ChangeEvent, KeyboardEvent, MouseEvent, RefObject, useState } from 'react'

interface Props extends SelectProps {
  jobTitles: string[]
  onChange: (value: string[] | string) => void | Promise<void>
  value?: string[] | string
  selectRef?: RefObject<any>
  mode?: 'multiple'
}

const getDefaultValue = (mode?: 'multiple') => {
  if (mode === 'multiple') {
    return []
  }
  return null
}

const JobTitleSelect = ({ jobTitles, onChange, value, selectRef, mode, ...rest }: Props) => {
  const isMultiple = mode === 'multiple'
  const valueWithDefault = isEmpty(value) ? getDefaultValue(mode) : value
  const defaultOptions = map(jobTitles, (jobTitle) => ({ label: jobTitle, value: jobTitle }))
  const [options, setOptions] = useState(defaultOptions)

  const [newJobTitle, setNewJobTitle] = useState<string | undefined>()
  const handleSetNewJobTitle = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setNewJobTitle(value)
  }

  const handleAddNewJobTitle = async (e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    e.preventDefault()

    if (newJobTitle && !includes(jobTitles, newJobTitle)) {
      // Add tag to list of tags
      setOptions([...options, { label: newJobTitle, value: newJobTitle }])
      // Clear newTag
      setNewJobTitle(undefined)

      // Add new tag to selected tags
      if (isMultiple && isArray(valueWithDefault)) {
        await onChange([...valueWithDefault, newJobTitle])
      }

      if (!isMultiple) {
        await onChange(newJobTitle)
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    e.stopPropagation()

    if (e.key === 'Enter') {
      handleAddNewJobTitle(e as any)
    }
  }

  return (
    <SearchSelect
      options={options}
      onChange={onChange}
      value={value}
      selectRef={selectRef}
      mode={mode}
      popupMatchSelectWidth={false}
      allowClear
      dropdownRender={(menu) => (
        <>
          {menu}
          <Divider style={{ margin: '8px 0' }} />
          <Space style={{ padding: '0 8px 4px' }}>
            <Input
              placeholder="Enter new job title"
              value={newJobTitle}
              onChange={handleSetNewJobTitle}
              onKeyDown={handleKeyDown}
            />

            <Button
              icon={<PlusOutlined />}
              onClick={handleAddNewJobTitle}
              disabled={isEmpty(newJobTitle)}
              type="primary"
            >
              Add Job Title
            </Button>
          </Space>
        </>
      )}
      {...rest}
    />
  )
}

export default JobTitleSelect
