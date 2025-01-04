import { AreaChartOutlined, DiffOutlined, FileMarkdownOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Dropdown } from 'antd-next'
import { IContent } from 'components/Narratives/interfaces'
import AddButton from 'components/shared/AddButton'
import { Typography } from 'components/shared/jawns'
import { compact } from 'lodash'
import { useCallback, useState } from 'react'
import { UseFieldArrayInsert } from 'react-hook-form'
import { IStory, IStoryContent } from 'util/datasets/interfaces'
import { COPIED_PLOT_CONTENT_TYPE } from 'util/shared_content/constants'
import { getCopiedContentToLocalStorage } from 'util/shared_content/helpers'

const COPIED_CONTENT_TYPE = 'copied-content-type'

interface Props {
  index: number
  datasetSlug: string
  insert: UseFieldArrayInsert<
    {
      story: IStory
    },
    'story.content'
  >
}

const AddContentDropdown = ({ index, insert, datasetSlug }: Props) => {
  const [copiedSectionContent, setCopiedSectionContent] = useState<IStoryContent | undefined>()

  // make sure we have the most up-to-date copied content
  // from localStorage (maybe they copied content from another browser tab)
  const handleOpenDropdown = (open: boolean) => {
    if (open) {
      const contentFromStorage: IContent = getCopiedContentToLocalStorage()

      // if there is no content to copy
      // set as undefined and skip formatting
      if (!contentFromStorage) {
        return setCopiedSectionContent(undefined)
      }

      // format plots from elsewhere in portal to DatasetStory's format
      // (NOTE: only allow plots from the same dataset)
      if (
        contentFromStorage?.type === COPIED_PLOT_CONTENT_TYPE &&
        contentFromStorage?.data?.dataset_slug === datasetSlug
      ) {
        const groupSlug = contentFromStorage?.data?.group_slug
        const plotSlug = contentFromStorage?.data?.plot_slug

        // if groupSlug and plotSlug are found
        // add copy to content option
        if (groupSlug && plotSlug) {
          const contentToCopy = {
            type: 'plot',
            plot: {
              group_slug: groupSlug,
              slug: plotSlug,
            },
          } as IStoryContent

          setCopiedSectionContent(contentToCopy)
        }
      }

      // TODO: support markdown
    }
  }

  const handleInsertContent = useCallback(
    (type: IStoryContent['type'] | typeof COPIED_CONTENT_TYPE) => {
      if (type === 'markdown') {
        insert(index + 1, { type: 'markdown', markdown: '' })
      }

      if (type === 'plot') {
        // @ts-ignore: TS not able to identify type as plot
        insert(index + 1, { type: 'plot' })
      }

      if (type === COPIED_CONTENT_TYPE && copiedSectionContent) {
        insert(index + 1, copiedSectionContent)
      }
    },
    [insert, index, copiedSectionContent]
  )

  const menuItems = compact([
    copiedSectionContent
      ? {
          key: 'copiedContent',
          onClick: () => {
            handleInsertContent(COPIED_CONTENT_TYPE)
          },
          icon: <DiffOutlined />,
          label: <Typography as="span">Paste Content</Typography>,
        }
      : null,

    copiedSectionContent ? { type: 'divider' } : null,
    {
      key: 'add-markdown',
      onClick: () => {
        handleInsertContent('markdown')
      },
      icon: <FileMarkdownOutlined />,
      label: 'Markdown',
    },
    {
      key: 'add-plot',
      onClick: () => {
        handleInsertContent('plot')
      },
      icon: <AreaChartOutlined />,
      label: 'Plot',
    },
  ])

  return (
    <AddButton style={{ position: 'relative' }}>
      <Dropdown
        onOpenChange={handleOpenDropdown}
        menu={{
          // @ts-ignore: not accepting divider (thinks it's a submenu item)
          items: menuItems,
        }}
      >
        <Button shape="circle" size="small" className="button">
          <PlusOutlined />
        </Button>
      </Dropdown>
    </AddButton>
  )
}

export default AddContentDropdown
