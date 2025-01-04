import { Flex } from 'antd-next'
import { map } from 'lodash'
import styled from 'styled-components'
import { colors } from 'util/constants'
import isURL from 'validator/es/lib/isURL'

import { TimelineEvent } from './interfaces'

const Attribute = styled.div`
  margin-right: 24px;
  font-size: 14px;
  line-height: 19.5px;
  color: ${colors.mavis_dark_gray} !important;
`

interface Props {
  attributes: TimelineEvent['attributes']
}

const EventAttributes = ({ attributes }: Props) => {
  return (
    <Flex wrap="wrap" style={{ paddingBottom: 12 }}>
      {map(attributes, (attribute) => {
        const valueIsUrl = attribute.value ? isURL(attribute.value) : false

        if (valueIsUrl) {
          // if the link starts with "www." we need to add a prefix
          // so we don't link to portal
          const urlNeedsPrefix = !attribute.value.startsWith('http')
          // https://stackoverflow.com/a/43803872/7949930
          const href = `${urlNeedsPrefix ? '//' : ''}${attribute.value}`

          return (
            <Attribute key={attribute.name}>
              {attribute.name}:{' '}
              <a href={href} target="_blank" rel="noreferrer">
                {attribute.value}
              </a>
            </Attribute>
          )
        }

        return (
          <Attribute key={attribute.name}>
            {attribute.name}: {attribute.value || 'null'}
          </Attribute>
        )
      })}
    </Flex>
  )
}

export default EventAttributes
