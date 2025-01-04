import { Popover } from 'antd-next'
import { TrainingType } from 'components/LLM/Training/interfaces'
import { Box, Typography } from 'components/shared/jawns'
import { map, take } from 'lodash'

interface Props {
  training: TrainingType
}

const UserQuestionCell = ({ training }: Props) => {
  const allUserQuestions = training.user_training_questions
  const firstTwoUserQuestions = take(training.user_training_questions, 2)
  const totalUserQuestionCount = training.user_training_questions.length

  return (
    <Box style={{ maxWidth: '320px' }}>
      {/* Only show first two questions in table cell */}
      {map(firstTwoUserQuestions, (userQuestion) => (
        <Box key={userQuestion.created_at}>
          <Typography>{userQuestion.question}</Typography>
        </Box>
      ))}

      {/* If more than 2 total questions - show all questions in popover */}
      {totalUserQuestionCount > 2 && (
        <Popover
          content={
            <Box style={{ maxWidth: '320px' }}>
              {map(allUserQuestions, (userQuestion) => (
                <Typography key={userQuestion.updated_at}>{userQuestion.question}</Typography>
              ))}
            </Box>
          }
          title="User Questions"
          trigger="hover"
        >
          (+{totalUserQuestionCount - 2} more)
        </Popover>
      )}
    </Box>
  )
}

export default UserQuestionCell
