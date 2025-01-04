import { Button, Spin } from 'antd-next'
import { useUser } from 'components/context/user/hooks'
import { useEffect } from 'react'
import { useLazyCallMavis } from 'util/useCallMavis'

const ViewStripeButton = () => {
  const { isCompanyAdmin } = useUser()

  const [getStripeBillingSession, { response, loading }] = useLazyCallMavis<any>({
    method: 'GET',
    path: '/admin/v1/billing/session',
  })

  const handleGetStripeBillingSessions = () => {
    return getStripeBillingSession({})
  }

  // go to the stripe billing page if response is successful
  useEffect(() => {
    if (response?.url) {
      window.location.href = response.url
    }
  }, [response])

  if (isCompanyAdmin) {
    return (
      <Spin spinning={loading}>
        <Button type="primary" onClick={handleGetStripeBillingSessions}>
          View Billing Information
        </Button>
      </Spin>
    )
  }

  return null
}

export default ViewStripeButton
