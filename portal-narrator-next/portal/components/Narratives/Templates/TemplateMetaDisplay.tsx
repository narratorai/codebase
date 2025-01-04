import { Button, Space } from 'antd-next'
import TemplateContext from 'components/Narratives/Templates/TemplateContext'
import { Box, Flex, Typography, UserIcon } from 'components/shared/jawns'
import { useContext } from 'react'
import { semiBoldWeight } from 'util/constants'
import { userDisplayName } from 'util/helpers'

interface Props {
  selectedTemplate: any
  preview?: boolean
}

const TemplateMetaDisplay = ({ selectedTemplate, preview = false }: Props) => {
  const { machineSend } = useContext(TemplateContext)

  const createdByUser = selectedTemplate.user?.company_users[0]
  const userIdentifier = userDisplayName(
    createdByUser?.first_name,
    createdByUser?.last_name,
    selectedTemplate?.user?.email
  )
  const profilePicture = createdByUser?.preferences?.profile_picture || undefined

  const headerColor = preview ? 'gray500' : 'blue600'

  const handleCustomize = () => {
    machineSend('CUSTOMIZE_TEMPLATE')
  }

  const handleCancel = () => {
    machineSend('CANCEL')
  }

  return (
    <Flex>
      <Box flexGrow={1}>
        <Typography color={headerColor}>{preview ? 'Previewing Narrative' : 'Customizing Narrative'}</Typography>
        <Typography type="title300" fontWeight={semiBoldWeight}>
          {selectedTemplate.question}
        </Typography>
        <Typography type="body50">{selectedTemplate.description}</Typography>
        <Box mt={2}>
          <Space>
            {preview ? (
              <Button type="primary" size="large" onClick={handleCustomize}>
                Select &amp; Customize
              </Button>
            ) : (
              <Button onClick={handleCancel}>Start Over</Button>
            )}
          </Space>
        </Box>
      </Box>
      <Flex flexDirection="column" justifyContent="center" ml={3}>
        <Flex alignItems="center" mb={2}>
          <UserIcon userIdentifier={userIdentifier} profilePicture={profilePicture} size="small" />
          <Typography ml={'4px'} data-private>
            {userIdentifier}
          </Typography>
        </Flex>
        <Box>
          <Typography type="body200" color={headerColor}>
            Used by
          </Typography>
          <Typography>{selectedTemplate?.display_companies_using} companies</Typography>
        </Box>
      </Flex>
    </Flex>
  )
}

export default TemplateMetaDisplay
