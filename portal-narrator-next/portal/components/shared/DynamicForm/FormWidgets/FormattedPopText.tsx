import { Box, Typography } from 'components/shared/jawns'
import { map, split } from 'lodash'

interface FormattedPopText {
  text: string
}

const FormattedPopText = ({ text }: FormattedPopText) => {
  // check for \n and manually break into new lines
  const lines = split(text, '\n')

  return (
    <Box style={{ maxWidth: '504px' }}>
      {map(lines, (line) => (
        <Typography>{line}</Typography>
      ))}
    </Box>
  )
}

export default FormattedPopText
