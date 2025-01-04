import { CompressOutlined } from '@ant-design/icons'
import { Button, Drawer, Empty, Tooltip } from 'antd-next'
import AddContentDropdown from 'components/Datasets/Modals/DatasetStory/Content/AddContentDropdown'
import StoryContent from 'components/Datasets/Modals/DatasetStory/Content/StoryContent'
import DatasetStoryContext from 'components/Datasets/Modals/DatasetStory/DatasetStoryContext'
import { AllPlotConfig } from 'components/Datasets/Modals/DatasetStory/interfaces'
import EditViewInput from 'components/shared/EditViewInput'
import { Box, Flex, Link, Typography } from 'components/shared/jawns'
import { isEmpty, isEqual, map, noop } from 'lodash'
import { useEffect, useState } from 'react'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import { useDebouncedCallback } from 'use-debounce'
import { IDatasetQueryDefinition, IStory } from 'util/datasets/interfaces'

const DEFAULT_TITLE = 'Analysis Notes for Dataset'

interface Props {
  datasetSlug: string
  onClose: ({ story }: { story: IStory }) => void
  queryDefinition: IDatasetQueryDefinition
  isEditDataset?: boolean // if you come from the BuildDataset page
  onFormChange?: ({ story }: { story: IStory }) => void // keep machine's story up-to-date in case of quick save while open
}

const DatasetStoryDrawer = ({
  datasetSlug,
  onClose,
  queryDefinition,
  isEditDataset = false,
  onFormChange = noop,
}: Props) => {
  // sets the plot config once per plot
  // so don't have to refetch on move up/down
  const [allPlotConfig, setAllPlotConfig] = useState<AllPlotConfig>({})

  const story = queryDefinition?.query?.story
  const initialStoryValues = isEmpty(story)
    ? { title: DEFAULT_TITLE }
    : {
        ...story,
        title: story?.title || DEFAULT_TITLE,
      }

  const methods = useForm<{ story: IStory }>({
    defaultValues: { story: initialStoryValues },
    mode: 'all',
  })

  const { handleSubmit, watch, control } = methods
  const formValues = watch()

  // Update dataset machine's story when form is updated
  // This allows us to quick save while the story is open
  // and still maintain the changes
  const debouncedOnFormChange = useDebouncedCallback(onFormChange, 500)
  useEffect(() => {
    if (!isEmpty(formValues?.story) && !isEqual(formValues?.story, story)) {
      debouncedOnFormChange({ story: formValues.story })
    }
  }, [story, formValues, debouncedOnFormChange])

  const handleClose = handleSubmit((formValue) => {
    onClose({ story: formValue.story })
  })

  const { move, remove, insert } = useFieldArray({
    control,
    name: 'story.content',
  })

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleClose} style={{ height: '100%' }}>
        <Drawer
          open
          onClose={handleClose}
          width="90vw"
          closable={false}
          footer={null}
          title={
            <Flex justifyContent="space-between" alignItems="center">
              <EditViewInput fieldName="story.title" viewTooltip="Click to Edit Name" />

              <Flex>
                <Tooltip placement="bottomLeft" title="Exit Story Mode">
                  <Button danger icon={<CompressOutlined />} size="small" onClick={handleClose}>
                    Exit
                  </Button>
                </Tooltip>
              </Flex>
            </Flex>
          }
        >
          <DatasetStoryContext.Provider
            value={{
              datasetSlug,
              queryDefinition,
              allPlotConfig,
              setAllPlotConfig,
            }}
          >
            <Box pb={2}>
              <Box>
                {map(formValues?.story?.content, (content, index) => {
                  return (
                    <StoryContent
                      content={content}
                      index={index}
                      move={move}
                      remove={remove}
                      insert={insert}
                      key={`${content?.type}_${index}`}
                      datasetSlug={datasetSlug}
                    />
                  )
                })}
              </Box>

              {/* No content info */}
              {isEmpty(formValues?.story?.content) && (
                <Box>
                  <Flex flexDirection="column" justifyContent="space-around">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <Box>
                          <Typography>Get started on the Dataset Story.</Typography>
                          <Typography>Create plots in this dataset to see them in this story</Typography>
                        </Box>
                      }
                    >
                      {!isEditDataset && (
                        <Link unstyled to={`/datasets/edit/${datasetSlug}`}>
                          <Button type="primary">Go to Dataset</Button>
                        </Link>
                      )}
                    </Empty>
                  </Flex>

                  <AddContentDropdown index={0} insert={insert} datasetSlug={datasetSlug} />
                </Box>
              )}
            </Box>
          </DatasetStoryContext.Provider>
        </Drawer>
      </form>
    </FormProvider>
  )
}

export default DatasetStoryDrawer
