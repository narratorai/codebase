import { CloseOutlined } from '@ant-design/icons'
import { Button, Input, Switch } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import { Box, Flex } from 'components/shared/jawns'
import { map } from 'lodash'
import { Controller, useFieldArray, useFormContext } from 'react-hook-form'
import styled from 'styled-components'
import { makeShortid } from 'util/shortid'

const { TextArea } = Input

const CLOSE_ICON_WIDTH = 24

const HoverBox = styled(Box)`
  width: ${CLOSE_ICON_WIDTH}px;
  margin-left: 8px;
  margin-top: 4px;

  &:hover {
    cursor: pointer;
  }
`

const StyledAddButton = styled(Button)`
  width: calc(100% - ${CLOSE_ICON_WIDTH + 7}px);
`

const DataQuestionTextArea = styled(TextArea)`
  width: calc(100% - ${CLOSE_ICON_WIDTH + 7}px);
`

interface Props {
  showInProductionToggle?: boolean
}

const EditTrainingFormFields = ({ showInProductionToggle = true }: Props) => {
  const { control, setValue } = useFormContext()

  const handleToggleInProduction = (inProd: boolean) => {
    setValue('in_production', inProd, { shouldValidate: true })
  }

  return (
    <Box>
      <Controller
        name="question"
        control={control}
        render={({ field, fieldState: { isTouched: touched, error } }) => (
          <FormItem label="Data Question" layout="vertical" meta={{ touched, error: error?.message }}>
            <DataQuestionTextArea autoSize placeholder="Enter data question" {...field} />
          </FormItem>
        )}
      />

      <UserQuestions />

      {showInProductionToggle && (
        <Box mt={3}>
          <Controller
            name="in_production"
            control={control}
            render={({ field, fieldState: { isTouched: touched, error } }) => (
              <FormItem label="In Production" layout="vertical" meta={{ touched, error: error?.message }}>
                <Switch
                  checked={field.value}
                  checkedChildren="In Production"
                  unCheckedChildren="Staged"
                  {...field}
                  onChange={handleToggleInProduction}
                />
              </FormItem>
            )}
          />
        </Box>
      )}
    </Box>
  )
}

const UserQuestions = () => {
  const { watch, control } = useFormContext()

  const { append: addUserQuestion, remove: removeUserQuestion } = useFieldArray({
    control,
    name: 'user_questions',
  })

  const userQuestions = watch('user_questions')

  const handleAddQuestion = () => {
    addUserQuestion({ id: makeShortid(), question: '' })
  }

  return (
    <Box>
      {userQuestions?.length > 0 && (
        <FormItem label="User Questions" layout="vertical" compact>
          {map(userQuestions, (userQuestion, index: number) => (
            <Flex alignItems="flex-start" mb={2} key={userQuestion.id}>
              <Controller
                name={`user_questions.${index}.question`}
                control={control}
                render={({ field }) => <TextArea autoSize placeholder="Enter user question" {...field} />}
              />

              <HoverBox onClick={() => removeUserQuestion(index)}>
                <CloseOutlined />
              </HoverBox>
            </Flex>
          ))}
        </FormItem>
      )}

      <StyledAddButton type="dashed" onClick={handleAddQuestion}>
        Add User Question
      </StyledAddButton>
    </Box>
  )
}

export default EditTrainingFormFields
