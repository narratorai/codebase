import { Button, Collapse } from 'antd-next'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { ITransformation } from 'portal/stores/settings'

import TutorialModalTransformations from './TutorialModalTransformations'

interface Props {
  narrative: string | null
  companySlug: string | null
  transformations: ITransformation[]
}

const TutorialModalContent = ({ narrative, companySlug, transformations }: Props) => (
  <Box>
    <Typography type="title400" pt={2} pb={2}>
      We've added a narrative to your account to get you started.
    </Typography>
    {transformations.length > 0 && (
      <Collapse
        size="large"
        defaultActiveKey={['1']}
        items={[
          {
            key: 1,
            label: 'We will try and create the following transformations for you:',
            children: <TutorialModalTransformations transformations={transformations} />,
          },
        ]}
      />
    )}
    {narrative && companySlug && (
      <Flex justifyContent="space-around" pt={4} pb={2}>
        <a target="_blank" href={`${window.origin}/${companySlug}/narratives/a/${narrative}`} rel="noreferrer">
          <Button type="primary">Go to Tutorial Narrative</Button>
        </a>
      </Flex>
    )}
  </Box>
)

export default TutorialModalContent
