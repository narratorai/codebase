import { Button, Result } from 'antd-next'
import { Flex, Link } from 'components/shared/jawns'

// TODO: Merge 404.tsx with this component
const NotFoundPage = () => (
  <Flex justifyContent="center" width={1}>
    <Result
      status="404"
      title="404"
      subTitle="Sorry, the page you visited does not exist."
      extra={
        <Link unstyled to="/datasets">
          <Button type="primary">Go To Datasets</Button>
        </Link>
      }
    />
  </Flex>
)

export default NotFoundPage
