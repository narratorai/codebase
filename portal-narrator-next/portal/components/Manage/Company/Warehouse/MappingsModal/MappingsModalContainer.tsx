import { useGetMappings, useSaveMappings } from '../hooks'
import MappingsModal from './MappingsModal'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const MappingsModalContainer = ({ isOpen, onClose }: Props) => {
  const { dataSources, schemas, mappings, gettingMappings, getMappings } = useGetMappings()
  const { savingMappings, saveMappings } = useSaveMappings(onClose)

  const sourceOptions = dataSources.map((source) => ({ label: source, value: source }))
  const schemaOptions = schemas.map((schema) => ({ label: schema, value: schema }))
  const isLoading = gettingMappings || savingMappings

  return (
    <MappingsModal
      isOpen={isOpen}
      isLoading={isLoading}
      initialMappings={mappings}
      sourceOptions={sourceOptions}
      schemaOptions={schemaOptions}
      onOpen={getMappings}
      onCancelClick={onClose}
      onSubmit={saveMappings}
    />
  )
}

export default MappingsModalContainer
