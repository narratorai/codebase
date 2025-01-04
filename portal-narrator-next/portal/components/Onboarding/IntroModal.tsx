import { Button, Modal, Result } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { Typography } from 'components/shared/jawns'
import { useLayoutContext } from 'components/shared/layout/LayoutProvider'
import Image from 'next/image'
import { useState } from 'react'
import logoBlkSrc from 'static/img/logo-black.png'

const IntroModal = () => {
  const { introMode, setIntroMode } = useLayoutContext()
  const company = useCompany()
  const demoCompany = company?.demo_company || false

  const [visible, setVisible] = useState(!!introMode && demoCompany)

  const handleClose = () => {
    setVisible(false)
    setIntroMode(false)
  }

  return (
    <Modal open={visible} footer={null} onCancel={handleClose}>
      <Result
        icon={<Image src={logoBlkSrc} alt="" width={75} height={75} />}
        title={`Welcome to the ${company?.name} account!`}
        subTitle="Note: You won't be able to create or modify the activity definitions, but you can use them in datasets."
        extra={
          <>
            <Typography type="title400" mb={2}>
              Use activities created from fake data to understand the possibilities of Narrator.
            </Typography>

            <Typography mb={3}>
              As a demo user, you can:
              <br />
              <a target="_blank" rel="noopener noreferrer" href="https://docs.narrator.ai/docs/narratives">
                <strong>View Narratives</strong>
              </a>
              ,{' '}
              <a target="_blank" rel="noopener noreferrer" href="https://docs.narrator.ai/docs/customer-journey">
                <strong>Explore Customer Journeys</strong>
              </a>
              ,{' '}
              <a target="_blank" rel="noopener noreferrer" href="https://docs.narrator.ai/docs/activities">
                <strong>View and Use Activities</strong>
              </a>
              ,{' '}
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://docs.narrator.ai/docs/defining-a-dataset-grammar"
              >
                <strong>Assemble Datasets</strong>
              </a>
              , and more ...
            </Typography>

            <Button type="primary" key="ok" onClick={handleClose}>
              Start Exploring
            </Button>
          </>
        }
      />
    </Modal>
  )
}

export default IntroModal
