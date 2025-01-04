import { DeleteOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Popconfirm, Radio } from 'antd-next'
import ActionablePopover from 'components/Narratives/BuildNarrative/ActionablePopover'
import { useBuildNarrativeContext } from 'components/Narratives/BuildNarrative/BuildNarrativeProvider'
import * as SharedLayout from 'components/Narratives/BuildNarrative/Sections/SharedLayout'
import TakeawayOptions from 'components/Narratives/BuildNarrative/TakeawayOptions'
import { useCompileContent } from 'components/Narratives/hooks'
import { ITakeaway, TContentObject } from 'components/Narratives/interfaces'
import InsightSummary from 'components/Narratives/shared/InsightSummary'
import TakeawayValueIcon from 'components/Narratives/shared/TakeawayValueIcon'
import { Box, Flex, ListItemCard, Typography } from 'components/shared/jawns'
import ContentLoader from 'components/shared/layout/ContentLoader'
import { head, isEmpty } from 'lodash'
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Field, useField } from 'react-final-form'
import { FieldArray } from 'react-final-form-arrays'
import { fieldValidator } from 'util/forms'
import { shouldSkipCompile } from 'util/narratives/helpers'
import sanitize from 'util/sanitize'
import usePrevious from 'util/usePrevious'

const MarkdownField = lazy(
  () => import(/* webpackChunkName: "markdown-field" */ 'components/shared/jawns/forms/MarkdownField')
)

const DEFAULT_KEYTAKEAWAY = {
  explanation: undefined,
  title: undefined,
  value: 1,
}

const IS_ACTIONABLE_FIELDNAME = 'narrative.is_actionable'
const RECOMMENDATION_TITLE_FIELDNAME = 'narrative.recommendation.title'
const RECOMMENDATION_EXPLANATION_FIELDNAME = 'narrative.recommendation.explanation'
const KEY_TAKEAWAYS_FIELDNAME = 'narrative.key_takeaways'
const QUESTION_FIELDNAME = 'narrative.question'
const GOAL_FIELDNAME = 'narrative.goal'

const RecommendationAndKeyTakeaways = () => {
  const { autocomplete, updatedFields, handleToggleQuestionGoalKeyTakeaways } = useBuildNarrativeContext()

  const [editing, setEditing] = useState(false)

  const {
    input: { value: title, onChange: titleOnChange },
  } = useField<string>(RECOMMENDATION_TITLE_FIELDNAME, { subscription: { value: true } })
  const prevTitle = usePrevious(title)

  const {
    input: { value: explanation, onChange: explanationOnChange },
  } = useField<string>(RECOMMENDATION_EXPLANATION_FIELDNAME, { subscription: { value: true } })
  const prevExplanation = usePrevious(explanation)

  const {
    input: { value: isActionable },
  } = useField<string>(IS_ACTIONABLE_FIELDNAME, { subscription: { value: true } })
  const prevIsActionable = usePrevious(isActionable)

  const {
    input: { value: keyTakeaways, onChange: keyTakeawaysOnChange },
  } = useField<ITakeaway[]>(KEY_TAKEAWAYS_FIELDNAME, { subscription: { value: true } })

  const {
    input: { value: question },
  } = useField(QUESTION_FIELDNAME, { subscription: { value: true } })

  const {
    input: { value: goal },
  } = useField(GOAL_FIELDNAME, { subscription: { value: true } })

  const handleClearRecommentationAndTakeaways = useCallback(() => {
    titleOnChange(undefined)
    explanationOnChange(undefined)
    keyTakeawaysOnChange([])

    // if there are also no question and goals
    // hide whole top section of narrative (question, goal, rec, takeaway)
    if (isEmpty(question) && isEmpty(goal)) {
      handleToggleQuestionGoalKeyTakeaways()
    }
  }, [titleOnChange, explanationOnChange, keyTakeawaysOnChange, question, goal, handleToggleQuestionGoalKeyTakeaways])

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
    loading: loadingExplanation,
    error: errorExplanation,
    response: compiledExplanation,
  } = useCompileContent({
    contents: [
      {
        text: explanation,
      },
    ],
    skip: shouldSkipCompile({ value: explanation, prevValue: prevExplanation, updatedFields }),
  })

  const compiledRecommendation = {
    title: (head(compiledTitle)?.text || title) as string,
    explanation: (head(compiledExplanation)?.text || explanation) as string,
  }

  const { response: compiledIsActionable } = useCompileContent({
    contents: [
      {
        text: isActionable,
      },
    ],
    skip: shouldSkipCompile({ value: isActionable, prevValue: prevIsActionable, updatedFields }),
  })
  const compiledIsActionableValue = compiledIsActionable?.[0]?.text

  const nonEmptyKeyTakeaways = (keyTakeaways || []).filter((takeaway) => takeaway.title || takeaway.explanation)
  const {
    loading: loadingKeyTakeaways,
    error: errorKeyTakeaways,
    response: compiledKeyTakeaways,
  } = useCompileContent({
    contents: nonEmptyKeyTakeaways as unknown as TContentObject[],
    // TODO: implement `skip` logic for key takeaways
  })

  const loading = loadingTitle || loadingExplanation || loadingKeyTakeaways
  const titleAndExplanationEmpty = !loading && isEmpty(title) && isEmpty(explanation)

  useEffect(() => {
    setEditing(true)
  }, [titleAndExplanationEmpty])

  return (
    <Flex>
      <SharedLayout.EditorBox>
        <Box>
          <Flex mb={2} alignItems="baseline" justifyContent="space-between">
            <Typography as="div" type="title300">
              Recommendation &amp; Key Takeaways
            </Typography>

            <Flex>
              <Button
                style={{ marginRight: '4px' }}
                size="small"
                onClick={() => setEditing(!editing)}
                icon={editing ? <MinusOutlined /> : <PlusOutlined />}
              />

              <Popconfirm
                title="Are you sure you want to remove all recommendations and key takeaways?"
                onConfirm={handleClearRecommentationAndTakeaways}
                okButtonProps={{ 'data-test': 'confirm-delete-recommendation-takeaway-button' }}
              >
                <Button size="small" icon={<DeleteOutlined />} data-test="delete-recommendation-takeaway-button" />
              </Popconfirm>
            </Flex>
          </Flex>
          <Box pb={3}>
            {editing && (
              <>
                <Field
                  name={RECOMMENDATION_TITLE_FIELDNAME}
                  key={`${RECOMMENDATION_TITLE_FIELDNAME}.${errorTitle}`}
                  validate={fieldValidator(errorTitle)}
                  render={({ input, meta }) => (
                    <Box>
                      <Flex justifyContent="space-between">
                        <Typography type="body100" mb={1} data-public>
                          The "Why" of recommendation
                        </Typography>
                        <ActionablePopover fieldName={IS_ACTIONABLE_FIELDNAME} />
                      </Flex>
                      <div data-test="narrative-recommendation-title">
                        <Suspense fallback={null}>
                          <MarkdownField {...input} meta={meta} options={{ autocomplete, default_height: 48 }} />
                        </Suspense>
                      </div>
                    </Box>
                  )}
                />
                <Field
                  name={RECOMMENDATION_EXPLANATION_FIELDNAME}
                  key={`${RECOMMENDATION_EXPLANATION_FIELDNAME}.${errorExplanation}`}
                  validate={fieldValidator(errorExplanation)}
                  render={({ input, meta }) => (
                    <div data-test="narrative-recommendation-explanation">
                      <Suspense fallback={null}>
                        <MarkdownField {...input} meta={meta} options={{ autocomplete, default_height: 48 }} />
                      </Suspense>
                    </div>
                  )}
                />
              </>
            )}
          </Box>
        </Box>

        <Box data-test="narrative-key-takeaways">
          {editing && (
            <FieldArray name={KEY_TAKEAWAYS_FIELDNAME} subscription={{ length: true }}>
              {({ fields }) => {
                return (
                  <Box>
                    {fields.map((fieldName, index) => (
                      <ListItemCard bg="white" key={fieldName} removable={false}>
                        <Typography type="body100" mb="16px" fontWeight="bold">
                          Takeaway {index + 1}
                        </Typography>

                        <Field
                          name={`${fieldName}.title`}
                          render={({ input, meta }) => (
                            <Box>
                              <Flex justifyContent="space-between">
                                <Typography type="body100" mb={1} data-public>
                                  Title &amp; Explanation
                                </Typography>

                                <TakeawayOptions
                                  fieldName={fieldName}
                                  index={index}
                                  handleDelete={() => fields.remove(index)}
                                  moveUp={() => fields.move(index, index - 1)}
                                  moveDown={() => fields.move(index, index + 1)}
                                  isLast={!!(fields.length && index === fields.length - 1)}
                                />
                              </Flex>
                              <div data-test="key-takeaway-title">
                                <Suspense fallback={null}>
                                  <MarkdownField {...input} meta={meta} options={{ autocomplete }} />
                                </Suspense>
                              </div>
                            </Box>
                          )}
                        />
                        <Field
                          name={`${fieldName}.explanation`}
                          render={({ input, meta }) => (
                            <Box mb={1}>
                              <div data-test="key-takeaway-explanation">
                                <Suspense fallback={null}>
                                  <MarkdownField
                                    {...input}
                                    meta={meta}
                                    options={{ autocomplete, default_height: 48 }}
                                  />
                                </Suspense>
                              </div>
                            </Box>
                          )}
                        />
                        <Field
                          name={`${fieldName}.value`}
                          render={({ input }) => {
                            return (
                              <Radio.Group
                                {...input}
                                size="small"
                                optionType="button"
                                defaultValue={'1'}
                                buttonStyle="solid"
                                value={`${input.value}`}
                              >
                                <Radio.Button value={'1'}>
                                  <TakeawayValueIcon value={'1'} withColor={false} />
                                </Radio.Button>
                                <Radio.Button value={'0'}>
                                  <TakeawayValueIcon value={'0'} withColor={false} />
                                </Radio.Button>
                                <Radio.Button value={'-1'}>
                                  <TakeawayValueIcon value={'-1'} withColor={false} />
                                </Radio.Button>
                              </Radio.Group>
                            )
                          }}
                        />
                      </ListItemCard>
                    ))}

                    {errorKeyTakeaways && (
                      <Box
                        key={errorKeyTakeaways}
                        my={1}
                        // nosemgrep: typescript.react.security.audit.react-dangerouslysetinnerhtml.react-dangerouslysetinnerhtml
                        dangerouslySetInnerHTML={{ __html: sanitize(errorKeyTakeaways) }}
                      />
                    )}

                    <Box my={1} data-test="narrative-add-key-takeaway-cta">
                      <Button size="small" onClick={() => fields.push(DEFAULT_KEYTAKEAWAY)} icon={<PlusOutlined />}>
                        Add Key Takeaway
                      </Button>
                    </Box>
                  </Box>
                )
              }}
            </FieldArray>
          )}
        </Box>
      </SharedLayout.EditorBox>
      <SharedLayout.PreviewBox>
        <ContentLoader loading={loading}>
          <InsightSummary
            keyTakeaways={(compiledKeyTakeaways || keyTakeaways) as ITakeaway[]}
            recommendation={compiledRecommendation}
            isActionable={compiledIsActionableValue}
          />
        </ContentLoader>
      </SharedLayout.PreviewBox>
    </Flex>
  )
}

export default RecommendationAndKeyTakeaways
