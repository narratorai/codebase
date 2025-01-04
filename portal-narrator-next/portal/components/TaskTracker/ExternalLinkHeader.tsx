import { Flex, Typography } from 'components/shared/jawns'
import { IMaterialization_Type_Enum } from 'graph/generated'
import styled from 'styled-components'

export const NO_EXTERNAL_LINK_NAME = 'Uncategorized'

const StyledNoClickLink = styled(Typography)`
  &:hover {
    cursor: default;
  }
`

interface Props {
  externalLink: string
  matType: string
}

const ExternalLinkHeader = ({ externalLink, matType }: Props) => {
  // Don't try to link to a non-link
  if (externalLink === NO_EXTERNAL_LINK_NAME) {
    return (
      <StyledNoClickLink
        // don't close panel when clicking/copying link
        onClick={(e) => e.stopPropagation()}
      >
        {externalLink}
      </StyledNoClickLink>
    )
  }

  // Webhooks should show external link, but not actually link (they don't go to a website)
  if (matType === IMaterialization_Type_Enum.Webhook) {
    return (
      <StyledNoClickLink
        // don't close panel when clicking/copying link
        onClick={(e) => e.stopPropagation()}
      >
        External Link: {externalLink}
      </StyledNoClickLink>
    )
  }

  // Otherwise return the clickable link
  return (
    <Flex alignItems="center">
      <Typography mr={1}>External Link:</Typography>
      <a
        href={externalLink}
        target="_blank"
        style={{ textDecoration: 'inherit', color: 'inherit' }}
        onClick={(e) => e.stopPropagation()} // don't close panel when clicking link
        rel="noreferrer"
      >
        {externalLink}
      </a>
    </Flex>
  )
}

export default ExternalLinkHeader
