import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { Button, Popconfirm, Result } from 'antd-next'
import { useCompileContent } from 'components/Narratives/hooks'
import QuestionAndGoalWidget from 'components/Narratives/shared/QuestionAndGoalWidget'
import { Box, Flex, Typography } from 'components/shared/jawns'
import ContentLoader from 'components/shared/layout/ContentLoader'
import { head, isEmpty } from 'lodash'
import React, { lazy, Suspense } from 'react'
import { Field, useField } from 'react-final-form'
import { fieldValidator } from 'util/forms'
import { shouldSkipCompile } from 'util/narratives/helpers'
import usePrevious from 'util/usePrevious'

import { useBuildNarrativeContext } from './BuildNarrativeProvider'
import { EditorBox, PreviewBox } from './Sections/SharedLayout'

const MarkdownField = lazy(
  () => import(/* webpackChunkName: "markdown-field" */ 'components/shared/jawns/forms/MarkdownField')
)

const QuestionAndGoal = () => {
  const { autocomplete, updatedFields, handleToggleQuestionGoalKeyTakeaways } = useBuildNarrativeContext()

  const {
    input: { value: question, onChange: questionOnChange },
  } = useField('narrative.question', { subscription: { value: true } })
  const prevQuestion = usePrevious(question)

  const {
    input: { value: goal, onChange: goalOnChange },
  } = useField('narrative.goal', { subscription: { value: true } })
  const prevGoal = usePrevious(goal)

  const {
    input: { value: recommendations },
  } = useField('narrative.recommendation', { subscription: { value: true } })
  const {
    input: { value: takeaways },
  } = useField('narrative.key_takeaways', { subscription: { value: true } })

  const handleClearQuestionAndGoal = () => {
    questionOnChange(undefined)
    goalOnChange(undefined)

    // if there are no recommendations or takeaways
    // hide whole top section (question, goal, rec, takeaway)
    if (isEmpty(recommendations) && isEmpty(takeaways)) {
      handleToggleQuestionGoalKeyTakeaways()
    }
  }

  const {
    loading: loadingQuestion,
    error: errorQuestion,
    response: compiledQuestion,
  } = useCompileContent({
    contents: [
      {
        text: question,
      },
    ],
    skip: shouldSkipCompile({ value: question, prevValue: prevQuestion, updatedFields }),
  })

  const {
    loading: loadingGoal,
    error: errorGoal,
    response: compiledGoal,
  } = useCompileContent({
    contents: [
      {
        text: goal,
      },
    ],
    skip: shouldSkipCompile({ value: goal, prevValue: prevGoal, updatedFields }),
  })

  const loading = loadingQuestion || loadingGoal

  const questionText = head(compiledQuestion)?.text || question
  const goalText = head(compiledGoal)?.text || goal

  const questionAndGoalEmpty = isEmpty(questionText) && isEmpty(goalText)

  return (
    <Flex>
      <EditorBox>
        <Box>
          <Flex mb={2} alignItems="baseline" justifyContent="space-between">
            <Typography as="div" type="title300">
              Question &amp; Goal
            </Typography>

            <Popconfirm
              title="Are you sure you want to remove the Question and Goal?"
              onConfirm={handleClearQuestionAndGoal}
            >
              <Button size="small" icon={<DeleteOutlined />} data-test="delete-question-goal-button" />
            </Popconfirm>
          </Flex>

          <>
            <Box mb={1} data-test="narrative-section-question">
              <Field
                name="narrative.question"
                key={`narrative.question.${errorQuestion}`}
                validate={fieldValidator(errorQuestion)}
                render={({ input, meta }) => (
                  <>
                    <Typography type="body100" mb={1} data-public>
                      What is the question this Narrative will answer?
                    </Typography>
                    <Suspense fallback={null}>
                      <MarkdownField
                        {...input}
                        value={input.value}
                        meta={meta}
                        options={{ autocomplete, default_height: 48 }}
                      />
                    </Suspense>
                  </>
                )}
              />
            </Box>

            <Box data-test="narrative-section-goal">
              <Field
                name="narrative.goal"
                key={`narrative.goal.${errorGoal}`}
                validate={fieldValidator(errorGoal)}
                render={({ input, meta }) => (
                  <>
                    <Typography type="body100" mb={1} data-public>
                      What is the goal of the narrative?
                    </Typography>
                    <Suspense fallback={null}>
                      <MarkdownField
                        {...input}
                        value={input.value}
                        meta={meta}
                        options={{ autocomplete, default_height: 64 }}
                      />
                    </Suspense>
                  </>
                )}
              />
            </Box>
          </>
        </Box>
      </EditorBox>

      {/* overriding the `mt` and `mb` values here because the
          the Question and Goal section sits above the other content
          blocks and doesn't need to be adjusted to stitch together
          with the rest of the sections  */}
      <PreviewBox pt={3}>
        <ContentLoader loading={loading}>
          {questionAndGoalEmpty ? (
            <div data-test="narrative-no-question-goal">
              <Result icon={<EditOutlined />} title="Start by giving your Narrative a Question and a Goal" />
            </div>
          ) : (
            <QuestionAndGoalWidget question={questionText} goal={goalText} />
          )}
        </ContentLoader>
      </PreviewBox>
    </Flex>
  )
}

export default React.memo(QuestionAndGoal)
