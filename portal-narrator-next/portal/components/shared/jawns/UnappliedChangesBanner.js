import { Box, Flex, Icon, Link, Typography } from 'components/shared/jawns'
import PropTypes from 'prop-types'
import React from 'react'
import ImportantSvg from 'static/svg/Important.svg'
import styled from 'styled-components'
import { semiBoldWeight } from 'util/constants'

const UnappliedChangesBanner = ({ banner, onClick, ctaText, top }) => {
  const UnappliedBannerWrapper = styled(Box)`
    width: 100%;
    padding: 2px 8px;
    background-color: ${(props) => props.theme.colors.blue500};
    position: absolute;
    top: ${top || '-24px'};
  `

  return (
    <UnappliedBannerWrapper>
      <Flex alignItems="center">
        <Box mr="4px">
          <Icon svg={ImportantSvg} color="white" />
        </Box>
        <Box mr="8px">
          <Typography type="body200" color="white" fontWeight={semiBoldWeight}>
            {banner.text}
          </Typography>
        </Box>
        {onClick && ctaText && (
          <Link type="body200" color="white" onClick={onClick}>
            {ctaText}
          </Link>
        )}
      </Flex>
    </UnappliedBannerWrapper>
  )
}

UnappliedChangesBanner.propTypes = {
  groupIctaTextndex: PropTypes.string,
  onClick: PropTypes.func,
  banner: PropTypes.shape({
    text: PropTypes.string.isRequired,
    override: PropTypes.bool,
  }),
  top: PropTypes.string,
}

export default UnappliedChangesBanner
