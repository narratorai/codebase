import { Button } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { DatasetIcon } from 'components/Navbar/NavIcons'
import { useEffect } from 'react'
import { NotificationOptProps, useLazyCallMavis } from 'util/useCallMavis'
interface Props {
  dataset?: Record<string, unknown>
  groupSlug?: string
  plotSlug?: string
  errorNotificationProps?: NotificationOptProps
  asIcon?: boolean
}

const GoToDatasetButton = ({ dataset, groupSlug, plotSlug, errorNotificationProps, asIcon = false }: Props) => {
  const company = useCompany()

  const [createDataset, { response: datasetData, loading: loadingDataset }] = useLazyCallMavis<{
    dataset_slug: string
  }>({
    method: 'POST',
    path: '/v1/dataset/snapshot',
    errorNotificationProps,
  })

  const handleCreateDataset = () => {
    createDataset({
      body: { plot_slug: plotSlug, group_slug: groupSlug, dataset },
    })
  }

  // open new window tab if dataset data is available
  // (they succesfully click the go to dataset button)
  useEffect(() => {
    if (datasetData?.dataset_slug)
      window.open(
        `${window.location.origin}/${company.slug}/datasets/edit/${datasetData.dataset_slug}?group=${groupSlug}&plot=${plotSlug}&view=plot`,
        '_blank'
      )
  }, [company?.slug, datasetData?.dataset_slug, groupSlug, plotSlug])

  if (asIcon) {
    return (
      <Button
        size="small"
        type="text"
        icon={<DatasetIcon />}
        onClick={handleCreateDataset}
        loading={loadingDataset}
        disabled={loadingDataset || !dataset}
      />
    )
  }

  return (
    <Button onClick={handleCreateDataset} loading={loadingDataset} disabled={loadingDataset || !dataset}>
      Go to dataset
    </Button>
  )
}

export default GoToDatasetButton
