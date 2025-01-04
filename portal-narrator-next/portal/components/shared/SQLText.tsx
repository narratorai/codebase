import { BasicEditor } from '@narratorai/the-sequel'
import CopyToClipboard from 'components/shared/CopyToClipboard'
import { ButtonSecondary } from 'components/shared/jawns'
import styled from 'styled-components'

const ButtonWrapper = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
`

interface Props {
  value: string
  fontSize?: number
  copyButton?: boolean
  defaultHeight?: number | string
}

const SQLText = ({ value, fontSize, copyButton = true, defaultHeight = '100%' }: Props) => {
  return (
    <>
      <BasicEditor
        language="redshift"
        value={value}
        height={defaultHeight}
        width="100%"
        options={{ wordWrap: 'on', fontSize }}
        disabled
      />

      {copyButton && (
        <ButtonWrapper data-test="copy-sql-to-clipboard-cta">
          <CopyToClipboard text={value}>
            <ButtonSecondary mb="10px">Copy to Clipboard</ButtonSecondary>
          </CopyToClipboard>
        </ButtonWrapper>
      )}
    </>
  )
}

export default SQLText
