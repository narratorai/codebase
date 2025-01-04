import { Flex, Skeleton, Space, Spin } from 'antd-next'
import { SearchSelect } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { DEFAULT_ALLOWED_STATUSES } from 'components/Datasets/DatasetIndex'
import { createDatasetSearchOptions } from 'components/Datasets/DatasetSearchBar'
import { PlotData } from 'components/Datasets/Modals/DatasetStory/interfaces'
import { GroupResponse } from 'components/Narratives/BuildNarrative/Sections/BasicContent/interfaces'
import DynamicPlot, { Props as DynamicPlotProps } from 'components/shared/DynamicPlot'
import ResourceSearchSelect from 'components/shared/IndexPages/ResourceSearchSelect'
import TrainAIQuestion from 'components/shared/TrainAIQuestion'
import { useListDatasetsQuery } from 'graph/generated'
import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { useLazyCallMavis } from 'util/useCallMavis'

interface Props {
  disabled?: boolean
}

// "get_dataset_groups" returns plot.slug as groupSlug.plotSlug
// so strip groupSlug to get plotSlug
const formatPlotSlug = (groupAndPlotSlugs: string) => {
  const slugs = groupAndPlotSlugs?.split('.')
  return slugs[1]
}

// eslint-disable-next-line max-lines-per-function
const DatasetSelects = ({ disabled }: Props) => {
  const { setValue, watch } = useFormContext()
  const company = useCompany()
  const { user } = useUser()

  const datasetId = watch('dataset_id')
  const groupSlug = watch('group_slug')
  const plotSlug = watch('plot_slug')

  const { data: datasetData, loading: datasetLoading } = useListDatasetsQuery({
    variables: { company_id: company?.id, statuses: DEFAULT_ALLOWED_STATUSES, user_id: user?.id },
  })

  const [getGroups, { response: groups, loading: groupsLoading }] = useLazyCallMavis<GroupResponse[]>({
    method: 'GET',
    path: `/v1/narrative/content/get_dataset_groups`,
  })

  // if a plot has been choosen - get the plot data
  const [getPlotData, { response: plotData, loading: loadingPlotData, error: getPlotDataError }] =
    useLazyCallMavis<PlotData>({
      method: 'POST',
      path: '/v1/dataset/plot/run',
    })

  const datasetOptions = createDatasetSearchOptions(datasetData?.dataset, true) || []
  const selectedDataset = datasetData?.dataset.find((dataset) => dataset.id === datasetId)
  const datasetSlug = selectedDataset?.slug

  // TODO: should we limit the groups available to the ones that have plots?
  const groupOptions =
    groups?.map((group) => ({
      key: group.slug,
      label: group.name,
      value: group.slug,
    })) || []

  const selectedGroup = groups?.find((group) => group.slug === groupSlug)

  const plotOptions =
    selectedGroup?.plots.map((plot) => ({
      key: plot.slug,
      label: plot.name,
      value: formatPlotSlug(plot.slug),
    })) || []

  const handleDatasetSelect = (value: string) => {
    // update the dataset_id
    setValue('dataset_id', value, { shouldValidate: true })

    // and clear out the old group/plot slugs
    // (no longer relevant to newly selected dataset)
    setValue('group_slug', undefined, { shouldValidate: true })
    setValue('plot_slug', undefined, { shouldValidate: true })

    // load new groups for the selected dataset
    const dataset = datasetData?.dataset.find((dataset) => dataset.id === value)
    const slug = dataset?.slug
    if (slug) getGroups({ params: { slug } })
  }

  const handleGroupSelect = (value: string) => {
    setValue('group_slug', value, { shouldValidate: true })
    // clear out the old plot slug
    // (no longer relevant to newly selected group)
    setValue('plot_slug', undefined, { shouldValidate: true })
  }

  const handlePlotSelect = (value: string) => {
    // add plot to form state
    setValue('plot_slug', value, { shouldValidate: true })

    getPlotData({
      body: { plot_slug: value, group_slug: groupSlug, dataset_slug: datasetSlug },
    })
  }

  // This assumes there's a possibility of form data being set before the component is mounted
  // TODO: We have to test this with the actual form data
  useEffect(() => {
    if (datasetSlug && groupSlug && plotSlug) {
      getPlotData({
        body: { plot_slug: plotSlug, group_slug: groupSlug, dataset_slug: datasetSlug },
      })
    }
  }, [datasetData])

  const resourceSearchSelectStyle = {
    style: {
      minWidth: '400px',
      maxWidth: '600px',
      width: '100%',
    },
    disabled: disabled,
  }

  const { config } = (plotData as DynamicPlotProps) || {}

  return (
    <Space direction="vertical" size={16}>
      {/* Dataset Select */}
      <Spin spinning={datasetLoading}>
        {/* <Flex style={{ minWidth: '400px', maxWidth: '640px', width: '100%' }}> */}
        <ResourceSearchSelect
          onSelect={handleDatasetSelect}
          options={datasetOptions}
          placeholderText="Search Datasets"
          shouldGetPopupContainer
          extraProps={resourceSearchSelectStyle}
        />
        {/* </Flex> */}
      </Spin>
      <Flex align="center" style={{ maxWidth: '100%', flexWrap: 'wrap' }} gap={8}>
        {/* Group Select */}

        <Spin spinning={groupsLoading}>
          <SearchSelect
            options={groupOptions}
            onSelect={handleGroupSelect}
            value={groupSlug}
            placeholder="Group by"
            disabled={disabled}
            popupMatchSelectWidth={false}
          />
        </Spin>

        {/* Plot Select */}

        <Spin spinning={groupsLoading}>
          <SearchSelect
            options={plotOptions}
            placeholder="Plot"
            onSelect={handlePlotSelect}
            value={plotSlug}
            disabled={disabled}
            popupMatchSelectWidth={false}
          />
        </Spin>
      </Flex>

      {!disabled && loadingPlotData && <Skeleton active paragraph={{ rows: 8 }} />}
      {!disabled && !loadingPlotData && !getPlotDataError && plotData && plotSlug && (
        <>
          <TrainAIQuestion question={config?.question} />
          <DynamicPlot {...(plotData as DynamicPlotProps)} />
        </>
      )}
    </Space>
  )
}

export default DatasetSelects
