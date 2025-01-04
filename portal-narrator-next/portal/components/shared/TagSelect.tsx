import { PlusOutlined } from '@ant-design/icons'
import { Button, Divider, Input, InputRef, Space, Spin } from 'antd-next'
import { FormItem, SearchSelect } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { getSharedCompanyTags } from 'components/shared/IndexPages/helpers'
import { IListCompanyTagsQuery, useCompanyTagsSubscription } from 'graph/generated'
import { isEmpty, map, uniqBy } from 'lodash'
import { ChangeEvent, MouseEvent, ReactNode, useEffect, useRef, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

type Tag = IListCompanyTagsQuery['company_tags']

interface Props {
  fieldName: string
  help?: string | ReactNode
}

// Allows user to select existing tags and add new ones
const TagSelect = ({ fieldName, help }: Props) => {
  const { user } = useUser()
  const company = useCompany()
  const { control, setValue, watch } = useFormContext()
  const selectedTags = watch(fieldName)
  const inputRef = useRef<InputRef>(null)
  const [newTag, setNewTag] = useState<string | undefined>()

  const onNewTagChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNewTag(event.target.value)
  }

  const [allTags, setAllTags] = useState<Tag>([])

  // Get all Tags for "Share With"
  const { data: tagsResult, loading: tagsLoading } = useCompanyTagsSubscription({
    variables: { company_id: company?.id, user_id: user.id },
  })

  // add tags to all tags to account for newly added tags
  useEffect(() => {
    if (tagsResult?.company_tags && isEmpty(allTags)) {
      setAllTags(uniqBy([...tagsResult.company_tags, ...allTags], 'id'))
    }
  }, [tagsResult?.company_tags, allTags])

  // const tags = tagsResult?.company_tags
  const sharedTags = getSharedCompanyTags(allTags) || []
  const tagOptions = map(sharedTags, (tag) => ({ key: tag.id, value: tag.id, label: tag.tag }))

  const addTag = (e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    e.preventDefault()

    if (newTag) {
      // Add tag to list of tags
      setAllTags([...allTags, { id: newTag, tag: newTag }])
      // Clear newTag
      setNewTag(undefined)

      // Add new tag to selected tags
      setValue(fieldName, [...(selectedTags || []), newTag], { shouldValidate: true })

      // Clear input
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }
  }

  return (
    <Spin spinning={tagsLoading}>
      <Controller
        control={control}
        name={fieldName}
        render={({ field, fieldState: { isTouched, error } }) => (
          <FormItem label="Share with" meta={{ touched: isTouched, error: error?.message }} help={help}>
            <SearchSelect
              mode="multiple"
              options={tagOptions}
              {...field}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <Divider style={{ margin: '8px 0' }} />
                  <Space style={{ padding: '0 8px 4px' }}>
                    <Input
                      placeholder="Please enter tag name"
                      ref={inputRef}
                      value={newTag}
                      onChange={onNewTagChange}
                      onKeyDown={(e) => e.stopPropagation()}
                    />

                    <Button icon={<PlusOutlined />} onClick={addTag} disabled={isEmpty(newTag)} type="primary">
                      Add tag
                    </Button>
                  </Space>
                </>
              )}
            />
          </FormItem>
        )}
      />
    </Spin>
  )
}

export default TagSelect
