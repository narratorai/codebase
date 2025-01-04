import { Box, Flex, Typography, UserIcon } from 'components/shared/jawns'
import { INarrative_Template } from 'graph/generated'
import styled from 'styled-components'
import { colors, semiBoldWeight } from 'util/constants'
import { userDisplayName } from 'util/helpers'

const StyledOption = styled(Flex)`
  cursor: pointer;

  &:hover {
    background-color: ${colors.blue100};
  }
`

interface Props {
  onClick(): void
  template: INarrative_Template
}

const TemplateOption = ({ onClick, template }: Props) => {
  const createdByUser = template.user?.company_users[0]
  const userIdentifier = userDisplayName(createdByUser?.first_name, createdByUser?.last_name, template.user?.email)
  const profilePicture = createdByUser?.preferences?.profile_picture || undefined

  return (
    <StyledOption p={3} onClick={onClick}>
      <Box flexGrow={1}>
        <Typography type="title300" fontWeight={semiBoldWeight} data-public>
          {template.question}
        </Typography>
        {template.description && (
          <Typography color="gray600" type="body50" data-public>
            {template.description}
          </Typography>
        )}
        {createdByUser && (
          <Flex mt={1} alignItems="center">
            <UserIcon userIdentifier={userIdentifier} profilePicture={profilePicture} size="small" />
            <Typography ml={'4px'} color="gray600" type="body200" data-private>
              {userIdentifier}
            </Typography>
          </Flex>
        )}
      </Box>
      <Box ml={3}>
        <Typography type="body200" color="gray600">
          Used by
        </Typography>
        <Typography>{template?.display_companies_using}&nbsp;companies</Typography>
      </Box>
    </StyledOption>
  )
}

export default TemplateOption
