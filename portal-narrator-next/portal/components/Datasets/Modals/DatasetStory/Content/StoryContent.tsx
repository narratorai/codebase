import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined } from '@ant-design/icons'
import { Radio } from 'antd-next'
import AddContentDropdown from 'components/Datasets/Modals/DatasetStory/Content/AddContentDropdown'
import MarkdownContent from 'components/Datasets/Modals/DatasetStory/Content/MarkdownContent'
import PlotContent from 'components/Datasets/Modals/DatasetStory/Content/PlotContent'
import { Box, Flex } from 'components/shared/jawns'
import { useMemo } from 'react'
import { UseFieldArrayInsert, UseFieldArrayMove, UseFieldArrayRemove, useFormContext } from 'react-hook-form'
import { colors } from 'util/constants'
import { IStory, IStoryContent } from 'util/datasets/interfaces'

interface Props {
  content: IStoryContent
  index: number
  datasetSlug: string
  move: UseFieldArrayMove
  remove: UseFieldArrayRemove
  insert: UseFieldArrayInsert<
    {
      story: IStory
    },
    'story.content'
  >
}

const StoryContent = ({ content, index, move, remove, insert, datasetSlug }: Props) => {
  const { watch } = useFormContext()
  const allContent = watch('story.content')

  const moveContentUp = () => {
    move(index, index - 1)
  }

  const moveContentDown = () => {
    move(index, index + 1)
  }

  const handleRemoveContent = () => {
    remove(index)
  }

  const isLast = useMemo(() => {
    if (allContent?.length === 0) {
      return true
    }

    if (allContent?.length && index === allContent.length - 1) {
      return true
    }

    return false
  }, [allContent?.length, index])

  return (
    <Box pb={3}>
      {/* high-jacking Radio.Group since Button.Group has been deprecated
            give Radio.Group a fake value so all the buttons aren't blue
            (let the buttons handle up/down/delete events)
        */}
      <Flex justifyContent="flex-end">
        <Radio.Group value="not-a-real-value" size="small" buttonStyle="solid">
          <Radio.Button onClick={moveContentDown} disabled={isLast}>
            <ArrowDownOutlined />
          </Radio.Button>

          <Radio.Button onClick={moveContentUp} disabled={index === 0}>
            <ArrowUpOutlined />
          </Radio.Button>

          <Radio.Button onClick={handleRemoveContent}>
            <DeleteOutlined style={{ color: colors.red500 }} />
          </Radio.Button>
        </Radio.Group>
      </Flex>

      <Box>
        {content?.type === 'plot' && <PlotContent content={content} index={index} />}

        {content?.type === 'markdown' && <MarkdownContent index={index} />}
      </Box>

      <AddContentDropdown insert={insert} index={index} datasetSlug={datasetSlug} />
    </Box>
  )
}

export default StoryContent
