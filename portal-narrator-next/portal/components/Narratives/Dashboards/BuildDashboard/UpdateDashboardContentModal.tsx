import { Modal } from 'antd-next'
import { useBuildNarrativeContext } from 'components/Narratives/BuildNarrative/BuildNarrativeProvider'
import {
  DEFAULT_GRID_LAYOUT,
  DEFAULT_GRID_LAYOUT_MARKDOWN_MIN_HEIGHT,
  DEFAULT_PLOT_GRID_LAYOUT,
} from 'components/Narratives/Dashboards/BuildDashboard/constants'
import { IContent } from 'components/Narratives/interfaces'
import { isEmpty, map, max } from 'lodash'
import { useCallback, useMemo, useRef } from 'react'
import { Form } from 'react-final-form'
import { arrayMutators } from 'util/forms'
import { CONTENT_TYPE_MARKDOWN, CONTENT_TYPE_PLOT_V2 } from 'util/narratives/constants'
import { makeShortid } from 'util/shortid'

import ModalContent from './ModalContent'

export const getLastYPosition = (contents: IContent[]): number => {
  const allYPositions = map(contents, (content) => content.grid_layout?.y || 0)
  return max(allYPositions) || 0
}

export const getDefaultGridLayout = (type?: string) => {
  const defaultGridLayout = type === CONTENT_TYPE_PLOT_V2 ? DEFAULT_PLOT_GRID_LAYOUT : DEFAULT_GRID_LAYOUT

  // check if it's markdown and make the minH smaller
  if (type === CONTENT_TYPE_MARKDOWN) {
    defaultGridLayout.minH = DEFAULT_GRID_LAYOUT_MARKDOWN_MIN_HEIGHT
  }

  return defaultGridLayout
}

interface Props {
  onUpdate: (value: Partial<IContent>, isNew: boolean) => void
  initialValues: Partial<IContent>
  selectedSectionContents?: IContent[]
}

const UpdateDashboardContentModal = ({ onUpdate, initialValues, selectedSectionContents }: Props) => {
  // IMPORTANT: useMemo so initialValues are not reset in <Form /> below
  const formattedInitialValues = useMemo(() => {
    return {
      ...initialValues,
      data: {
        data: initialValues.data,
        text: initialValues.text,
      },
    }
  }, [initialValues])

  const compileContentRef = useRef<() => void>()
  const refreshInputOptionsRef = useRef<() => void>()

  const { handleToggleDashboardContentOpen } = useBuildNarrativeContext()

  const handleClose = useCallback(() => {
    handleToggleDashboardContentOpen(undefined)
  }, [handleToggleDashboardContentOpen])

  const isNew = isEmpty(initialValues?.id)

  const onApply = useCallback(
    (formValues: any) => {
      const defaultGridLayout = getDefaultGridLayout(formValues.type)

      // if it's a new content, add it to the end of the list
      if (isNew) {
        const lastYPosition = getLastYPosition(selectedSectionContents || [])
        defaultGridLayout.y = lastYPosition + 1
      }

      const updatedValues = {
        // keep id/grid_layout above ...initialValues
        // (want it to be over-written if there were values)
        id: makeShortid(),
        grid_layout: defaultGridLayout,
        ...initialValues,
        data: {
          ...(formValues?.data?.data || {}), // for non-markdown
        },
        text: formValues?.data?.text, // for markdown
      }

      onUpdate(updatedValues, isNew)
      handleClose()
    },
    [onUpdate, isNew, initialValues, handleClose]
  )

  return (
    <Form
      initialValues={formattedInitialValues}
      onSubmit={onApply}
      mutators={arrayMutators}
      render={({ handleSubmit, invalid }) => (
        <Modal
          onCancel={handleClose}
          title={isNew ? 'Add Content' : 'Update Content'}
          okButtonProps={{ disabled: invalid }}
          onOk={handleSubmit}
          width="90vw"
          open
        >
          <ModalContent compileContentRef={compileContentRef} refreshInputOptionsRef={refreshInputOptionsRef} />
        </Modal>
      )}
    />
  )
}

export default UpdateDashboardContentModal
