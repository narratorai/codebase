import { SearchSelect } from 'components/antd/staged'
import DynamicForm from 'components/shared/DynamicForm/DynamicForm'
import { Box, Flex } from 'components/shared/jawns'
import { noop } from 'lodash'
import { useMemo, useState } from 'react'
import { FormState, GenericBlockOption } from 'util/blocks/interfaces'
import LocalService from 'util/blocks/Test/LocalService'

const PlaygroundPage = () => {
  const service = useMemo<LocalService>(() => new LocalService(), [])
  const [formState, setFormState] = useState<FormState>()

  const handleSelect = async (slug?: string) => {
    if (slug) {
      setFormState(await service.getForm(slug))
    }
  }

  return (
    <Flex flexDirection="column">
      <Box width={1 / 3} mb={2}>
        <SearchSelect
          options={
            (service.loadSchemasDirect()?.blocks as GenericBlockOption[])?.map((option: GenericBlockOption) => ({
              label: option.title,
              value: option.slug,
            })) || []
          }
          onChange={handleSelect}
          placeholder="Load an example"
          popupMatchSelectWidth={false}
          allowClear
          style={{ minWidth: '144px' }}
        />
      </Box>
      <Box>
        {formState && (
          <DynamicForm
            formSchema={{ schema: formState.schema, ui_schema: formState.ui_schema }}
            formData={formState.data}
            onSubmit={noop}
          />
        )}
      </Box>
    </Flex>
  )
}

export default PlaygroundPage
