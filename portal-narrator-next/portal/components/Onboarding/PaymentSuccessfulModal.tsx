import { Button, Divider, Flex, Typography } from 'antd-next'
import Modal from 'antd-next/es/modal/Modal'
import { FiCheckCircle, FiCloud } from 'react-icons/fi'
import { useHistory, useParams } from 'react-router'

interface Props {
  open: boolean
}

export default function PaymentSuccessfulModal({ open }: Props) {
  const { company_slug } = useParams<{ company_slug: string }>()
  const history = useHistory()

  const openWarehouseSettings = () => {
    history.push(`/${company_slug}/manage/warehouse`, { replace: true })
  }

  return (
    <Modal
      open={open}
      closable={false}
      footer={null}
      style={{ borderRadius: 16, overflow: 'hidden' }}
      styles={{ content: { padding: 0, borderRadius: 16 } }}
    >
      <div style={{ padding: 24 }}>
        <Flex justify="center" align="center" style={{ minHeight: 300 }}>
          <FiCloud
            style={{ height: 250, width: 'auto', color: '#099F69', opacity: 0.05, position: 'absolute' }}
            fill={'#099F69'}
          />
          <FiCheckCircle style={{ height: 100, width: 'auto', color: '#099F69' }} />
        </Flex>
        <Typography.Title level={3} style={{ textAlign: 'center' }}>
          Thanks for joining Mavis!
        </Typography.Title>
        <Typography.Title level={5} style={{ textAlign: 'center', color: '#5A595C', margin: 0 }}>
          Our sales team will get in touch with you soon.
        </Typography.Title>
      </div>
      <Divider style={{ margin: 0 }} />
      <div style={{ padding: 24 }}>
        <Button
          type="primary"
          style={{ width: '100%', background: '#6331B3', color: 'white' }}
          size="large"
          onClick={openWarehouseSettings}
        >
          Get started
        </Button>
      </div>
    </Modal>
  )
}
