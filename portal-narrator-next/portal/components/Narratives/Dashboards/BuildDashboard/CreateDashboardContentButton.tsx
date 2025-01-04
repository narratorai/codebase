import {
  AreaChartOutlined,
  DiffOutlined,
  FileMarkdownOutlined,
  NumberOutlined,
  PlusOutlined,
  TableOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { Button, Dropdown } from 'antd-next'
import { useBuildNarrativeContext } from 'components/Narratives/BuildNarrative/BuildNarrativeProvider'
import { IContent } from 'components/Narratives/interfaces'
import { Typography } from 'components/shared/jawns'
import { compact, findIndex, includes, isEmpty, isString } from 'lodash'
import queryString from 'query-string'
import { useMemo, useState } from 'react'
import { useField, useForm } from 'react-final-form'
import { useLocation } from 'react-router'
import {
  CONTENT_TYPE_MARKDOWN,
  CONTENT_TYPE_MEDIA_UPLOAD,
  CONTENT_TYPE_METRIC_V2,
  CONTENT_TYPE_PLOT_V2,
  CONTENT_TYPE_TABLE_V2,
} from 'util/narratives/constants'
import {
  COPIED_METRIC_CONTENT_TYPE,
  COPIED_PLOT_CONTENT_TYPE,
  COPIED_TABLE_CONTENT_TYPE,
} from 'util/shared_content/constants'
import { getCopiedContentToLocalStorage } from 'util/shared_content/helpers'
import { makeShortid } from 'util/shortid'

import { AllContentTypes } from './interfaces'
import { getDefaultGridLayout, getLastYPosition } from './UpdateDashboardContentModal'

const CreateDashboardContentButton = () => {
  const location = useLocation()
  const { handleToggleDashboardContentOpen, setContentPasted } = useBuildNarrativeContext()

  const [copiedSectionContent, setCopiedSectionContent] = useState<IContent | undefined>()

  const { change } = useForm()
  const {
    input: { value: sectionsValues },
  } = useField('narrative.sections', { subscription: { value: true } })

  const selectedTabIndex = useMemo(() => {
    const queryParams = queryString.parse(location?.search)
    const selectedTabId = queryParams?.tab

    return findIndex(sectionsValues, ['id', selectedTabId])
  }, [location.search, sectionsValues])

  const selectedSectionValues = useMemo(() => {
    if (selectedTabIndex !== -1) {
      return sectionsValues[selectedTabIndex]
    }

    return undefined
  }, [sectionsValues, selectedTabIndex])

  const handleAddCopiedContent = () => {
    if (!isEmpty(copiedSectionContent) && selectedTabIndex !== -1) {
      // ensure unique id to allow for multiple pastes
      const gridLayout = getDefaultGridLayout(copiedSectionContent.type)
      // push it to the bottom of the page
      const lastYPosition = getLastYPosition(selectedSectionValues?.content)
      gridLayout.y = lastYPosition + 1

      const uniqueCopiedSectionContent = {
        ...copiedSectionContent,
        id: makeShortid(),
        grid_layout: gridLayout,
      }

      const updatedSelectedSectionValue = [...selectedSectionValues.content, uniqueCopiedSectionContent]
      // add content to form state
      change(`narrative.sections[${selectedTabIndex}].content`, updatedSelectedSectionValue)

      // set content pasted for animation
      setContentPasted(uniqueCopiedSectionContent)

      // scroll to the new content
      const scrollToNewElement = () => {
        if (uniqueCopiedSectionContent.id) {
          const newElement = document.getElementById(uniqueCopiedSectionContent.id)
          newElement?.scrollIntoView({ behavior: 'smooth' })
        }
      }

      // wait for the new content to be added to the DOM
      // before scrolling to it
      setTimeout(scrollToNewElement, 300)
    }
  }

  const handleOpenModal = (type: AllContentTypes) => {
    handleToggleDashboardContentOpen({ type })
  }

  // make sure we have the most up-to-date copied content
  // from localStorage (maybe they copied content from another browser tab)
  const handleOpenDropdown = (open: boolean) => {
    if (open) {
      const contentToCopy: IContent = getCopiedContentToLocalStorage()

      // if there is no content to copy
      // set as undefined and skip formatting
      if (!contentToCopy) {
        return setCopiedSectionContent(undefined)
      }

      // PLOTS
      if (contentToCopy?.type === COPIED_PLOT_CONTENT_TYPE) {
        // convert plot type to narrative plot type
        contentToCopy.type = CONTENT_TYPE_PLOT_V2

        // make sure the plot_slug is saved as 'group_slug.plot_slug'
        const groupSlug = contentToCopy?.data?.group_slug
        const plotSlug = contentToCopy?.data?.plot_slug

        if (contentToCopy?.data?.plot_slug && isString(plotSlug) && !includes(plotSlug, groupSlug)) {
          contentToCopy.data.plot_slug = `${groupSlug}.${plotSlug}`
        }

        setCopiedSectionContent(contentToCopy)
      }

      // METRICS
      if (contentToCopy?.type === COPIED_METRIC_CONTENT_TYPE) {
        const updatedCopyContent = {
          ...contentToCopy,
          type: CONTENT_TYPE_METRIC_V2, // update metric to match allowed dashboard content
        }
        setCopiedSectionContent(updatedCopyContent)
      }

      // TABLES
      if (contentToCopy?.type === COPIED_TABLE_CONTENT_TYPE) {
        const updatedCopyContent = {
          ...contentToCopy,
          type: CONTENT_TYPE_TABLE_V2, // update metric to match allowed dashboard content
        }
        setCopiedSectionContent(updatedCopyContent)
      }

      // TODO: support pasting more content than just plots/metrics/tables
    }
  }

  const menuItems = compact([
    copiedSectionContent && selectedSectionValues
      ? {
          key: 'copiedContent',
          onClick: handleAddCopiedContent,
          icon: <DiffOutlined />,
          label: <Typography as="span">Paste Content</Typography>,
        }
      : null,

    copiedSectionContent ? { type: 'divider' } : null,
    {
      key: CONTENT_TYPE_MARKDOWN,
      onClick: () => {
        handleOpenModal(CONTENT_TYPE_MARKDOWN)
      },
      icon: <FileMarkdownOutlined />,
      label: 'Markdown',
    },
    {
      key: CONTENT_TYPE_PLOT_V2,
      onClick: () => {
        handleOpenModal(CONTENT_TYPE_PLOT_V2)
      },
      icon: <AreaChartOutlined />,
      label: 'Plot',
    },
    {
      key: CONTENT_TYPE_TABLE_V2,
      onClick: () => {
        handleOpenModal(CONTENT_TYPE_TABLE_V2)
      },
      icon: <TableOutlined />,
      label: 'Table',
    },
    {
      key: CONTENT_TYPE_METRIC_V2,
      onClick: () => {
        handleOpenModal(CONTENT_TYPE_METRIC_V2)
      },
      icon: <NumberOutlined />,
      label: 'Metric',
    },
    {
      key: CONTENT_TYPE_MEDIA_UPLOAD,
      onClick: () => {
        handleOpenModal(CONTENT_TYPE_MEDIA_UPLOAD)
      },
      icon: <UploadOutlined />,
      label: 'Media',
    },
  ])

  return (
    <Dropdown
      trigger={['hover']}
      onOpenChange={handleOpenDropdown}
      menu={{
        // @ts-ignore: not accepting divider (thinks it's a submenu item)
        items: menuItems,
      }}
    >
      <Button size="small" icon={<PlusOutlined />}>
        Add Content
      </Button>
    </Dropdown>
  )
}

export default CreateDashboardContentButton
