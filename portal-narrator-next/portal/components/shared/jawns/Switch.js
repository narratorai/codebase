import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import _ from 'lodash'

import { Flex, Box, Typography } from 'components/shared/jawns'

const themeOverrides = {
  base: {
    background: 'blue800',
    light: 'blue100',
    oppositeBackground: 'gray300',
  },
  teal: {
    background: 'teal600',
    light: 'teal100',
    oppositeBackground: 'teal100',
  },
  negativeBase: {
    background: 'white',
    light: 'blue800',
    oppositeBackground: 'gray300',
  },
}

const StyledSwitch = styled(Flex)`
  width: 96px;
  border-radius: 4px;
  transition: none;
  border: 1px solid
    ${(props) =>
      props.disabled ? props.theme.colors.gray500 : props.theme.colors[themeOverrides[props.themeOverride].background]};
`

const Tab = styled(({ disabled, ...rest }) => <Box {...rest} />)`
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50%;

  /* make 30px min-height to match 32px height button! */
  min-height: 30px;
  transition-property: transform, background-color;
  transition-duration: 0.1s;
  transition-timing-function: ease-out;
  background-color: ${(props) =>
    props.active
      ? props.disabled
        ? props.theme.colors.gray400
        : props.theme.colors[themeOverrides[props.themeOverride].background]
      : props.theme.colors[themeOverrides[props.themeOverride].oppositeBackground]};
  color: ${(props) =>
    props.active
      ? props.disabled
        ? props.theme.colors.gray500
        : props.theme.colors[themeOverrides[props.themeOverride].light]
      : props.theme.colors.gray500};

  p {
    font-weight: ${(props) => (props.active ? props.theme.fontWeights.semiBold : props.theme.fontWeights.normal)};
  }
`

const Switch = ({ themeOverride, disabled, falseText, onChange, renderFalseIcon, renderTrueIcon, trueText, value }) => {
  // Cast value as boolean:
  const checked = !!value

  return (
    <StyledSwitch
      themeOverride={themeOverride}
      bg={themeOverrides[themeOverride].background}
      disabled={disabled}
      onClick={() => (disabled ? _.noop() : onChange(!checked))}
    >
      <Tab
        themeOverride={themeOverride}
        active={checked}
        disabled={disabled}
        css={{ borderTopLeftRadius: '4px', borderBottomLeftRadius: '4px' }}
      >
        {renderTrueIcon &&
          renderTrueIcon({
            color: checked ? themeOverrides[themeOverride].light : 'gray500',
            style: { width: 12, height: 12 },
          })}
        {trueText && (
          <Typography py="8px" type="body300">
            {trueText}
          </Typography>
        )}
      </Tab>
      <Tab
        themeOverride={themeOverride}
        active={!checked}
        disabled={disabled}
        css={{ borderTopRightRadius: '4px', borderBottomRightRadius: '4px' }}
      >
        {renderFalseIcon &&
          renderFalseIcon({
            color: !checked ? themeOverrides[themeOverride].light : 'gray500',
            style: { width: 12, height: 12 },
          })}
        {falseText && (
          <Typography py="8px" type="body300">
            {falseText}
          </Typography>
        )}
      </Tab>
    </StyledSwitch>
  )
}

Switch.propTypes = {
  disabled: PropTypes.bool.isRequired,
  falseText: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  renderFalseIcon: PropTypes.func,
  renderTrueIcon: PropTypes.func,
  themeOverride: PropTypes.string.isRequired,
  trueText: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
}

Switch.defaultProps = {
  themeOverride: 'base',
  disabled: false,
  value: true,
}

export default Switch
