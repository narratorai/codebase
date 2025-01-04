/* eslint-disable react/jsx-max-depth */
import { Flex, Modal, Spin } from 'antd-next'
import { IMapping, IMappings } from 'portal/stores/settings'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'

import AddButton from './AddButton'
import Footer from './Footer'
import Mapping from './Mapping'

type SelectionOptions = { label: string; value: string }[]
interface Props {
  isOpen: boolean
  isLoading: boolean
  initialMappings: IMapping[]
  sourceOptions: SelectionOptions
  schemaOptions: SelectionOptions
  onOpen: () => void
  onCancelClick: () => void
  onSubmit: (data: IMappings) => Promise<void>
}

const MappingsModal = ({
  isOpen,
  isLoading,
  initialMappings,
  sourceOptions,
  schemaOptions,
  onOpen,
  onCancelClick,
  onSubmit,
}: Props) => {
  const methods = useForm<IMappings>({
    values: { mappings: initialMappings },
    mode: 'all',
  })

  const { handleSubmit, control } = methods

  const { fields: mappings, append, update, remove } = useFieldArray({ control, name: 'mappings' })

  const handleAddClick = () => {
    append({ data_source: null, schema_name: null })
  }

  return (
    <FormProvider {...methods}>
      <form>
        <Modal
          open={isOpen}
          title="Select Event Data"
          afterOpenChange={(open) => open && onOpen()}
          onCancel={onCancelClick}
          footer={<Footer disabled={isLoading} onRunClick={handleSubmit(onSubmit)} onCancelClick={onCancelClick} />}
        >
          <Spin spinning={isLoading}>
            <Flex
              gap={16}
              vertical
              justify="space-between"
              style={{ maxHeight: '360px', padding: '16px 0', overflowY: 'auto' }}
            >
              {mappings.map((mapping: IMapping & { id: string }, index: number) => (
                <Mapping
                  key={mapping.id}
                  mapping={mapping}
                  sourceOptions={sourceOptions}
                  schemaOptions={schemaOptions}
                  updateMapping={(value) => update(index, value)}
                  deleteMapping={() => remove(index)}
                />
              ))}
              <AddButton onClick={handleAddClick} />
            </Flex>
          </Spin>
        </Modal>
      </form>
    </FormProvider>
  )
}

export default MappingsModal
