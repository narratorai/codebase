import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Alert, App, Button, Tooltip } from 'antd-next'
import { useBuildNarrativeContext } from 'components/Narratives/BuildNarrative/BuildNarrativeProvider'
import PaperFold from 'components/Narratives/BuildNarrative/PaperFold'
import Content from 'components/Narratives/BuildNarrative/Sections/Content'
import SectionOptions from 'components/Narratives/BuildNarrative/Sections/SectionOptions'
import * as SharedLayout from 'components/Narratives/BuildNarrative/Sections/SharedLayout'
import { useCompileContent } from 'components/Narratives/hooks'
import SectionHeader from 'components/Narratives/shared/SectionHeader'
import SectionTakeaway from 'components/Narratives/shared/SectionTakeaway'
import { Box, Flex, ListItemCard, Typography } from 'components/shared/jawns'
import ContentLoader from 'components/shared/layout/ContentLoader'
import { each, head, includes, isEmpty, keys, toString } from 'lodash'
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Field, useField } from 'react-final-form'
import { FieldArrayRenderProps } from 'react-final-form-arrays'
import { COPY_MAXWIDTH } from 'util/analyses/constants'
import { colors } from 'util/constants'
import { fieldValidator } from 'util/forms'
import { assembledSectionContentIsVisible } from 'util/narratives'
import { shouldSkipCompile } from 'util/narratives/helpers'
import usePrevious from 'util/usePrevious'
import useToggle from 'util/useToggle'

import CopyAndAddSection from './CopyAndAddSection'
import ExpandCollapsePill from './ExpandCollapsePill'

const MarkdownField = lazy(
  () => import(/* webpackChunkName: "markdown-field" */ 'components/shared/jawns/forms/MarkdownField')
)

interface Props {
  fieldNames: FieldArrayRenderProps<any, any>['fields']
  fieldName: string
  index: number
}

const SectionContent = ({ fieldNames, fieldName, index }: Props) => {
  const { notification } = App.useApp()
  const {
    autocomplete,
    updatedFields,
    setCopiedSection,
    compileErrors: compileErrorsFromContext,
  } = useBuildNarrativeContext()

  const {
    input: { value: sectionValue },
  } = useField(fieldName, {
    subscription: { value: true },
  })

  const {
    input: { onChange: onChangeTakeawayTitle },
  } = useField(`${fieldName}.takeaway.title`, {
    subscription: { value: true },
  })

  const totalSectionCompileErrors = useMemo(() => {
    let count = 0

    const errorFieldNames = keys(compileErrorsFromContext)
    each(errorFieldNames, (errorFieldName) => {
      if (includes(errorFieldName, fieldName)) {
        count += 1
      }
    })

    return count
  }, [compileErrorsFromContext, fieldName])

  const title = sectionValue?.title
  const prevTitle = usePrevious(title)

  const takeawayTitle = sectionValue?.takeaway?.title
  const prevTakeawayTitle = usePrevious(takeawayTitle)

  const conditioned_on = sectionValue?.conditioned_on
  const contents = sectionValue?.content || []

  const [compiledCondition, setCompiledCondition] = useState(conditioned_on)

  // show/expand content block for first (index === 0) section, or
  // if we have less than 2 content sections (ie, new section)
  const [showContent, toggleShowContent, setShowContent] = useToggle(index === 0 || contents.length < 2)

  const [showCondition, setShowCondition] = useState(false)

  const [showTakeaway, setShowTakeaway] = useState(!isEmpty(takeawayTitle))
  const handleShowTakeaway = useCallback(() => {
    setShowTakeaway(true)
  }, [])

  const handleDeleteTakeaway = useCallback(() => {
    // hide takeaway
    setShowTakeaway(false)

    // remove title field
    onChangeTakeawayTitle(undefined)
  }, [onChangeTakeawayTitle])

  const {
    loading: loadingTitle,
    error: errorTitle,
    response: compiledTitle,
  } = useCompileContent({
    contents: [
      {
        text: title,
      },
    ],
    skip: shouldSkipCompile({ value: title, prevValue: prevTitle, updatedFields }),
  })

  const {
    loading: loadingTakeaway,
    error: errorTakeaway,
    response: compiledTakeaway,
  } = useCompileContent({
    contents: [
      {
        text: takeawayTitle,
      },
    ],
    skip: shouldSkipCompile({ value: takeawayTitle, prevValue: prevTakeawayTitle, updatedFields }),
  })

  const { response: compiledResponse } = useCompileContent({
    contents: [
      {
        condition: compiledCondition,
      },
    ],
  })

  const compiledConditionResponse = head(compiledResponse)?.condition

  const sectionVisibleInAssembled = assembledSectionContentIsVisible({
    input: conditioned_on,
    compiled: compiledConditionResponse,
  })

  const handleToggleShowCondition = useCallback(() => {
    if (!conditioned_on) {
      setShowCondition((prevCondition) => !prevCondition)
    }
  }, [conditioned_on])

  const handleCopySection = useCallback(() => {
    setCopiedSection(sectionValue)
    notification.success({
      message: 'Section copied',
      placement: 'topRight',
      duration: 2,
    })
  }, [sectionValue])

  const handleDeleteSection = useCallback(() => {
    fieldNames.remove(index)
  }, [fieldNames, index])

  useEffect(() => {
    if (index === 0 || contents.length < 2) {
      setShowContent(true)
    }
  }, [index, contents.length])

  useEffect(() => {
    setShowCondition(conditioned_on && sectionVisibleInAssembled)
  }, [conditioned_on, sectionVisibleInAssembled])

  return (
    <ListItemCard
      data-test="narrative-section-content"
      bg="white"
      p={0}
      mb={0}
      removable={false}
      style={{
        opacity: !sectionVisibleInAssembled ? 0.5 : 1,
        paddingBottom: '30px',
        borderBottom: `2px solid ${colors.gray600}`,
        paddingTop: index !== 0 ? '30px' : '0px',
      }}
    >
      <ExpandCollapsePill
        contentsLength={contents.length}
        toggleShowContent={toggleShowContent}
        showContent={showContent}
        totalSectionCompileErrors={totalSectionCompileErrors}
      />

      {(showCondition || !isEmpty(conditioned_on)) && (
        <Flex>
          <SharedLayout.EditorBox>
            <Box>
              <Alert
                type="warning"
                message={
                  <>
                    <Typography mb={1}>
                      If the condition evaluates to false, this section will not be shown in the assembled narrative.
                    </Typography>

                    <Typography mb={1}>
                      Compiled field below is: <strong>{toString(compiledConditionResponse).toUpperCase()}</strong>
                    </Typography>

                    <Field
                      name={`${fieldName}.conditioned_on`}
                      render={({ input, meta }) => {
                        setCompiledCondition(input.value)
                        return (
                          <Suspense fallback={null}>
                            <MarkdownField
                              {...input}
                              meta={meta}
                              options={{
                                default_height: 48,
                                autocomplete,
                              }}
                            />
                          </Suspense>
                        )
                      }}
                    />
                  </>
                }
              />
            </Box>
          </SharedLayout.EditorBox>
          <SharedLayout.PreviewBox>
            <Box mt={3}>
              <Alert
                type="warning"
                message={
                  <Typography>
                    This section will {!sectionVisibleInAssembled && <strong>NOT</strong>} be shown.
                  </Typography>
                }
              />
            </Box>
          </SharedLayout.PreviewBox>
        </Flex>
      )}

      <Flex>
        <SharedLayout.EditorBox>
          <Flex justifyContent="flex-end" data-test="section-options-container">
            <SectionOptions
              sectionVisibleInAssembled={sectionVisibleInAssembled}
              handleToggleShowCondition={handleToggleShowCondition}
              handleCopySection={handleCopySection}
              handleDeleteSection={handleDeleteSection}
              disableDeleteOption={(fieldNames.length as number) <= 1}
              showCondition={showCondition}
            />
          </Flex>
          <Field
            name={`${fieldName}.title`}
            key={`${fieldName}.title.${errorTitle}`}
            validate={fieldValidator(errorTitle)}
            render={({ input, meta }) => (
              <Box pb={2}>
                <Typography type="body100" mb={1} data-public>
                  Title
                </Typography>
                <div data-test="narrative-section-title">
                  <Suspense fallback={null}>
                    <MarkdownField
                      {...input}
                      meta={meta}
                      options={{
                        autocomplete,
                      }}
                    />
                  </Suspense>
                </div>
              </Box>
            )}
          />
        </SharedLayout.EditorBox>
        <SharedLayout.PreviewBox relative>
          <Box bg="white" mt="74px" px={4} style={{ height: showContent ? '100%' : 'initial' }}>
            <ContentLoader loading={loadingTitle}>
              <Box maxWidth={COPY_MAXWIDTH}>
                <SectionHeader title={head(compiledTitle)?.text as string} />
              </Box>
            </ContentLoader>
          </Box>

          {!showContent && !isEmpty(contents) && <PaperFold style={{ marginTop: '0' }} />}
        </SharedLayout.PreviewBox>
      </Flex>

      {showContent && <Content sectionFieldName={fieldName} sectionHiddenInAssembled={!sectionVisibleInAssembled} />}

      {!showTakeaway && (
        <SharedLayout.EditorBox>
          <Flex justifyContent="flex-end" pb={1}>
            <Button
              type="dashed"
              size="small"
              onClick={handleShowTakeaway}
              icon={<PlusOutlined />}
              data-test="add-section-conclusion-button"
            >
              Add Section Conclusion
            </Button>
          </Flex>

          <CopyAndAddSection fieldNames={fieldNames} index={index} />
        </SharedLayout.EditorBox>
      )}
      {showTakeaway && (
        <Flex>
          <SharedLayout.EditorBox>
            <Field
              name={`${fieldName}.takeaway.title`}
              key={`${fieldName}.takeaway.title.${errorTakeaway}`}
              validate={fieldValidator(errorTakeaway)}
              render={({ input, meta }) => (
                <Box pb={3}>
                  <Flex justifyContent="space-between">
                    <Typography type="body100" mb={1} data-public>
                      Section Conclusion
                    </Typography>

                    <Tooltip title="Delete Section Conclusion">
                      <div>
                        <Button
                          size="small"
                          onClick={handleDeleteTakeaway}
                          icon={<DeleteOutlined />}
                          data-test="delete-section-conclusion-button"
                        />
                      </div>
                    </Tooltip>
                  </Flex>
                  <div data-test="narrative-section-takeaway">
                    <Suspense fallback={null}>
                      <MarkdownField
                        {...input}
                        meta={meta}
                        options={{
                          default_height: 68,
                          autocomplete,
                        }}
                      />
                    </Suspense>
                  </div>
                </Box>
              )}
            />

            <CopyAndAddSection fieldNames={fieldNames} index={index} />
          </SharedLayout.EditorBox>
          <SharedLayout.PreviewBox relative>
            <Box bg="white" pb={4} pl={'72px'} pr={3} style={{ height: '100%' }}>
              <ContentLoader loading={loadingTakeaway}>
                <Box maxWidth={COPY_MAXWIDTH}>
                  {!isEmpty(head(compiledTakeaway)?.text) && (
                    <SectionTakeaway takeaway={{ title: head(compiledTakeaway)?.text as string }} />
                  )}
                </Box>
              </ContentLoader>
            </Box>
          </SharedLayout.PreviewBox>
        </Flex>
      )}
    </ListItemCard>
  )
}

export default SectionContent
