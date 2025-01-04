import { Alert, Space } from 'antd-next'
import { Typography } from 'components/shared/jawns'
import { colors } from 'util/constants'

const TrainAIQuestion = ({ question }: { question?: string | null }) => {
  const success = (
    <Space size={8}>
      <Typography fontWeight="700" style={{ color: colors.green700 }}>
        Training the AI how to answer this question:
      </Typography>
      <Typography style={{ color: colors.green700 }}>{question}</Typography>
    </Space>
  )

  const alert = (
    <Typography fontWeight="700" style={{ color: colors.yellow700 }}>
      Answer is NOT training the AI. Update the plot via dataset with the question to enable the AI to answer similar
      questions in the future
    </Typography>
  )

  return <Alert message={question ? success : alert} type={question ? 'success' : 'warning'} />
}

export default TrainAIQuestion
