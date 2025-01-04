import {
  AreaChartOutlined,
  CalculatorOutlined,
  DiffOutlined,
  FileMarkdownOutlined,
  InsertRowAboveOutlined,
  NumberOutlined,
  PlusOutlined,
  QuestionOutlined,
  TableOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { Button, Dropdown } from 'antd-next'
import { IContent } from 'components/Narratives/interfaces'
import AddButton from 'components/shared/AddButton'
import { Box, Typography } from 'components/shared/jawns'
import { compact, filter, includes, isEmpty, isString } from 'lodash'
import { useState } from 'react'
import DatasetIconSVG from 'static/svg/Narrator/Dataset.svg'
import NarrativeIconSVG from 'static/svg/Narrator/Narrative.svg'
import {
  CONTENT_TYPE_IMAGE_UPLOAD,
  CONTENT_TYPE_MEDIA_UPLOAD,
  CONTENT_TYPE_METRIC_V2,
  CONTENT_TYPE_PLOT_V2,
  CONTENT_TYPE_TABLE_V2,
} from 'util/narratives/constants'
import { BlockType } from 'util/narratives/interfaces'
import {
  COPIED_METRIC_CONTENT_TYPE,
  COPIED_PLOT_CONTENT_TYPE,
  COPIED_TABLE_CONTENT_TYPE,
} from 'util/shared_content/constants'
import { getCopiedContentToLocalStorage } from 'util/shared_content/helpers'

interface Props {
  options: {
    label: string
    value: BlockType
    advanced: boolean
  }[]
  clickCallback: (value: any) => void
  asEditor?: boolean
}

const AddMenu = ({ options, clickCallback, asEditor = false }: Props) => {
  const [copiedSectionContent, setCopiedSectionContent] = useState<IContent | undefined>(
    getCopiedContentToLocalStorage()
  )

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
      }

      // METRICS
      if (contentToCopy?.type === COPIED_METRIC_CONTENT_TYPE) {
        contentToCopy.type = CONTENT_TYPE_METRIC_V2
      }

      // TABLES
      if (contentToCopy?.type === COPIED_TABLE_CONTENT_TYPE) {
        contentToCopy.type = CONTENT_TYPE_TABLE_V2
      }

      setCopiedSectionContent(contentToCopy)
    }
  }

  const basicOptions = filter(options, (opt) => !opt.advanced)
  const advancedOptions = filter(options, (opt) => !!opt.advanced)

  const renderMenuIcon = (type: BlockType) => {
    switch (type) {
      case 'markdown':
        return <FileMarkdownOutlined />
      case CONTENT_TYPE_METRIC_V2:
        return <NumberOutlined />
      case CONTENT_TYPE_PLOT_V2:
        return <AreaChartOutlined />
      case CONTENT_TYPE_TABLE_V2:
        return <TableOutlined />
      case CONTENT_TYPE_IMAGE_UPLOAD:
        return <UploadOutlined />
      case CONTENT_TYPE_MEDIA_UPLOAD:
        return <UploadOutlined />
      case 'simple_plot':
        return <AreaChartOutlined />
      case 'narrative_plotter':
        return <AreaChartOutlined />
      case 'dataset_table':
        return <DatasetIconSVG style={{ fontSize: '11px', marginRight: '8px' }} />
      case 'impact_calculator':
        return <CalculatorOutlined />
      case 'simple_metric':
        return <NumberOutlined />
      case 'raw_metric':
        return <NumberOutlined />
      case 'raw_table':
        return <TableOutlined />
      case 'csv_table':
        return <InsertRowAboveOutlined />
      case 'analyze_simulator':
        return <NarrativeIconSVG style={{ fontSize: '11px', marginRight: '8px' }} />
      default:
        return <QuestionOutlined />
    }
  }

  const menuItems = compact([
    copiedSectionContent
      ? {
          key: 'copiedContent',
          onClick: () => {
            clickCallback(copiedSectionContent)
          },
          icon: <DiffOutlined />,
          label: <Typography as="span">Paste Content</Typography>,
        }
      : null,

    copiedSectionContent ? { type: 'divider' } : null,

    ...basicOptions.map((op) => ({
      key: op.value,
      onClick: () => clickCallback({ type: op.value }),
      icon: renderMenuIcon(op.value),
      label: (
        <Typography as="span" color="gray700" data-test="add-menu-item">
          {op.label}
        </Typography>
      ),
    })),

    !isEmpty(advancedOptions)
      ? {
          key: 'advanced',
          label: 'Advanced',
          children: advancedOptions.map((op) => ({
            key: op.value,
            onClick: () => clickCallback({ type: op.value }),
            icon: renderMenuIcon(op.value),
            label: (
              <Typography as="span" color="gray700" data-test="add-menu-item">
                {op.label}
              </Typography>
            ),
          })),
        }
      : null,
  ])

  return (
    <Box relative>
      <AddButton asEditor={asEditor}>
        <Dropdown
          onOpenChange={handleOpenDropdown}
          menu={{
            // @ts-ignore: not accepting divider (thinks it's a submenu item)
            items: menuItems,
          }}
        >
          <Button shape="circle" size="small" className="button" data-test="add-menu-cta">
            <PlusOutlined />
          </Button>
        </Dropdown>
      </AddButton>
    </Box>
  )
}

export default AddMenu
