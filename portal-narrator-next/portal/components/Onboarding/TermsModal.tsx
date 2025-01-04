import { Button, Modal, Tabs, Typography } from 'antd-next'
import MarkdownRenderer from 'components/shared/MarkdownRenderer'
import { useGetDocumentsQuery } from 'graph/generated'
import { useField } from 'react-final-form'
import styled from 'styled-components'

interface Props {
  isOpen: boolean
  onAccept: () => void
}

const LetterOrderedLists = styled.div`
  ol {
    list-style-type: upper-alpha;
  }
`

const TermsModal = ({ isOpen, onAccept }: Props) => {
  // Gets all the currently live document_revisions (most up to date terms, dpa, privacy)
  const { data } = useGetDocumentsQuery()

  const termsMarkdown = data?.terms?.[0]?.markdown
  const dpaMarkdown = data?.dpa?.[0]?.markdown
  const privacyMarkdown = data?.privacy?.[0]?.markdown

  const handleAccept = () => {
    onChange(true)
    onAccept()
  }

  const {
    input: { onChange },
  } = useField('ok_terms')

  return (
    <Modal
      closable={false}
      open={isOpen}
      title={
        <Typography.Title level={3}>
          Accept Terms of Use, Data Processing Agreement, and Privacy Policy
        </Typography.Title>
      }
      width="80%"
      style={{ top: 50, maxWidth: 1000 }}
      forceRender
      onOk={handleAccept}
      footer={[
        <Typography key="message" style={{ display: 'inline', marginRight: 24 }}>
          I accept Narrator's{' '}
          <a href="https://www.narrator.ai/terms/" target="_blank" rel="noopener noreferrer">
            Terms of Use
          </a>
          {', '}
          <a
            href="https://www.narratordata.com/legal/data-processing-agreement/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Data Processing Agreement
          </a>
          {', and '}
          <a href="https://www.narrator.ai/privacy-policy/" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
        </Typography>,
        <Button key="submit" type="primary" onClick={handleAccept} data-test="agree-to-terms-in-modal-button">
          Agree
        </Button>,
      ]}
    >
      <Tabs
        defaultActiveKey="terms"
        items={[
          {
            key: 'terms',
            label: 'Terms of Use',
            children: (
              <LetterOrderedLists
                // User must scroll to the bottom of the terms to be able to accept!
                style={{
                  height: '70vh',
                  overflow: 'auto',
                }}
              >
                <MarkdownRenderer source={termsMarkdown} />
              </LetterOrderedLists>
            ),
          },

          {
            key: 'dpa',
            label: 'Data Processing Agreement',
            children: (
              <div
                style={{
                  height: '70vh',
                  overflow: 'auto',
                }}
              >
                <MarkdownRenderer source={dpaMarkdown} />
              </div>
            ),
          },

          {
            key: 'privacy',
            label: 'Privacy Policy',
            children: (
              <div
                style={{
                  height: '70vh',
                  overflow: 'auto',
                }}
              >
                <MarkdownRenderer source={privacyMarkdown} />
              </div>
            ),
          },
        ]}
      />
    </Modal>
  )
}

export default TermsModal
