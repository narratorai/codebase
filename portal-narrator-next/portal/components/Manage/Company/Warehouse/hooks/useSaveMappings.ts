import { useMutation } from '@tanstack/react-query'
import { App } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useAdminOnboarding } from 'portal/stores/settings'
import { IMappings } from 'portal/stores/settings'
import { useShallow } from 'zustand/react/shallow'

interface IHookReturn {
  savingMappings: boolean
  saveMappingsError: Error | null
  saveMappings: (value: IMappings) => Promise<void>
}

const useSaveMappings = (onSave?: () => void): IHookReturn => {
  const company = useCompany()
  const { notification } = App.useApp()

  const [postMappings] = useAdminOnboarding(
    useShallow((state) => [state.postMappings, state.data_sources, state.schemas, state.mappings])
  )

  const mutationFn = async (mappings: IMappings) => {
    const success = await postMappings(mappings, company.datacenter_region)
    if (success) {
      notification.success({ message: 'Mappings saved' })
    }

    onSave?.()
  }

  const {
    isPending: savingMappings,
    error: saveMappingsError,
    mutateAsync: saveMappings,
  } = useMutation({
    mutationFn,
  })

  return {
    savingMappings,
    saveMappingsError,
    saveMappings,
  }
}

export default useSaveMappings
