import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { useOnboardingContext } from 'components/Onboarding/OnboardingProvider'
import { useCallback, useContext, useEffect, useState } from 'react'
import analytics from 'util/analytics'
import { updateDataset } from 'util/datasets/api'
import { IDatasetFormContext, INotification } from 'util/datasets/interfaces'
import { handleFormatMavisError, MavisError } from 'util/useCallMavis'

interface IUpdateDataset {
  isCreating: boolean
  onCreateSuccess?: (slug: string) => void
  onUpdateSuccess?: () => void
  onError?: (error: MavisError) => void
  silenceUpdateSuccess?: boolean
}

interface Response {
  dataset_id: string
  dataset_slug: string
  notification?: INotification
  success: boolean
}

interface IUseUpdateDatasetReturn {
  loading: boolean
  error: MavisError | undefined
  saved: boolean
  data?: Response
}

interface ICallbackInput {
  queryDefinition: object | null
  name: string
  id?: string
  slug?: string
  description?: string | null
  status: string
  materializations?: any
  // created_by should only be set by super admin
  created_by?: string
  hide_from_index?: boolean | null
  tags?: string[]
  locked?: boolean | null
  asQuickSave?: boolean
}

export default function useUpdateDataset({
  isCreating,
  onCreateSuccess,
  onUpdateSuccess,
  onError,
  silenceUpdateSuccess = false,
}: IUpdateDataset): [(input: ICallbackInput) => void, IUseUpdateDatasetReturn] {
  const company = useCompany()
  const { getTokenSilently: getToken } = useAuth0()

  const [saved, setSaved] = useState<IUseUpdateDatasetReturn['saved']>(false)
  const [loading, setLoading] = useState<IUseUpdateDatasetReturn['loading']>(false)
  const [error, setError] = useState<IUseUpdateDatasetReturn['error']>(undefined)
  const [data, setData] = useState<IUseUpdateDatasetReturn['data']>(undefined)
  const [triggeredPostSaveFunction, setPostSaveTrigger] = useState(false)
  const { refetchOnboardingData } = useOnboardingContext()

  ////////////
  //// NOTE: machineSend is ONLY IN BuildDataset
  //// NOT in dataset index!!!
  ////////////
  const { machineSend } = useContext<IDatasetFormContext>(DatasetFormContext)

  // allow for optional post save functions:
  useEffect(() => {
    if (saved && data && !triggeredPostSaveFunction) {
      //// CREATE DATASET ////
      if (isCreating) {
        analytics.track('created_dataset', {
          dataset_slug: data?.dataset_slug,
        })

        // Only in BuildDataset
        if (machineSend) {
          machineSend('SAVE_CREATE_SUCCESS', { slug: data.dataset_slug, notification: data.notification })
        }

        if (onCreateSuccess) {
          onCreateSuccess(data.dataset_slug)
        }
      }

      //// UPDATE DATASET ////
      if (!isCreating) {
        analytics.track('updated_dataset', {
          dataset_slug: data?.dataset_slug,
        })

        // Only in BuildDataset (not dataset index)
        if (machineSend) {
          machineSend('SAVE_UPDATE_SUCCESS', {
            slug: data.dataset_slug,
            notification: data.notification,
            silenceUpdateSuccess,
          })
        }

        if (onUpdateSuccess) {
          onUpdateSuccess()
        }
      }

      setPostSaveTrigger(true)
    }
  }, [
    saved,
    data,
    triggeredPostSaveFunction,
    isCreating,
    onCreateSuccess,
    onUpdateSuccess,
    machineSend,
    silenceUpdateSuccess,
  ])

  // allow for optional function to hoist up local error:
  useEffect(() => {
    if (error && onError && !triggeredPostSaveFunction) {
      onError(error)
      setPostSaveTrigger(true)
    }
  }, [error, triggeredPostSaveFunction, onError])

  const callback = useCallback(
    async ({
      queryDefinition,
      id,
      name,
      slug,
      description,
      status,
      materializations,
      created_by,
      hide_from_index,
      tags,
      locked,
      asQuickSave,
    }: ICallbackInput) => {
      if (company?.slug) {
        try {
          setError(undefined)
          setLoading(true)
          setSaved(false)
          setPostSaveTrigger(false)

          const body = {
            getToken,
            company,
            dataset: queryDefinition,
            name,
            id,
            slug,
            description,
            status,
            materializations,
            created_by,
            hide_from_index,
            tags,
            locked,
            asQuickSave,
          }

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore body does not match the expected type
          const resp = (await updateDataset(body)) as unknown as Response

          setData(resp)
          setSaved(true)

          // we need to refetch onboarding data once a transformation
          // is deleted, just in case we need to show the onboarding steps again
          refetchOnboardingData()
        } catch (err: any) {
          setError(handleFormatMavisError(err))
        }
        setLoading(false)
      }
    },
    [getToken, company, refetchOnboardingData]
  )

  return [
    callback,
    {
      loading,
      saved,
      error,
      data,
    },
  ]
}
