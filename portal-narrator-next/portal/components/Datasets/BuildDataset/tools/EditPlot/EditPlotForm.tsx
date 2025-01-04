import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import GenericBlock from 'components/shared/Blocks/GenericBlock'
import { get } from 'lodash'
import { useContext } from 'react'
import { BlockContent } from 'util/blocks/interfaces'

const BLOCK_SLUG = 'dataset_plotter'
const BLOCK_VERSION = 1

const EditPlotForm = () => {
  const { groupSlug, machineCurrent, machineSend } = useContext(DatasetFormContext)
  const { _plotter_context: plotterContext } = machineCurrent.context
  const activePlotSlug = machineCurrent.context._plot_slug
  const isEdit = plotterContext?.is_edit

  const submitCallback = ({ content }: { content: BlockContent[] }) => {
    // Block response returns an array, first object will be kind: 'json' with the plotConfig:
    const plotConfig = get(content, '[0].value')
    if (!plotConfig) return null

    // Only pass plotSlug if you're editing!
    machineSend('SUBMIT_PLOT_SUCCESS', { plotConfig, groupSlug, plotSlug: isEdit && activePlotSlug })
  }

  // NOTE - we're not using StandaloneBlock, because the machine loads the
  // block initial form state:
  if (plotterContext.form_state) {
    return (
      <GenericBlock
        initialFormData={plotterContext.form_state.data}
        slug={BLOCK_SLUG}
        version={BLOCK_VERSION}
        submitCallback={submitCallback}
        bg="white"
        padded={false}
      />
    )
  }

  return null
}

export default EditPlotForm
