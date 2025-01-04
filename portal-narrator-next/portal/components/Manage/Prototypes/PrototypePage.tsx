import { Alert, Breadcrumb, Button, Empty, Spin, Switch } from 'antd-next'
import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { useOnboardingContext } from 'components/Onboarding/OnboardingProvider'
import GenericBlock from 'components/shared/Blocks/GenericBlock'
import { Box, Flex, Link, Typography } from 'components/shared/jawns'
import Page from 'components/shared/Page'
import { compact, find, isEmpty, map } from 'lodash'
import { useCallback, useEffect, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import styled from 'styled-components'
import GenericBlockService from 'util/blocks/GenericBlockService'
import { BlockService, GenericBlockOption, IBlockOptions } from 'util/blocks/interfaces'
import { openChat } from 'util/chat'
import { breakpoints } from 'util/constants'
import useNavigate from 'util/useNavigate'
import usePreventBack from 'util/usePreventBack'

import PlaygroundPage from './PlaygroundPage'

/**
 * Main layout for the Prototype/Playground Page
 */
const Layout = styled(Box)`
  height: 100vh;
  background-color: white;
  padding: 24px;
  width: 100%;
  overflow-y: hidden;

  @media only screen and (min-width: ${breakpoints.lg}) {
    padding-left: 40px;
  }

  .prototype-page-inner-content {
    max-width: 1400px;
    height: 100%;
    overflow-y: auto;
  }
`

const PrototypePage = () => {
  const company = useCompany()
  const history = useHistory()
  const navigate = useNavigate()
  const { isSuperAdmin } = useUser()
  const { getTokenSilently: getToken } = useAuth0()
  const { slug } = useParams<{ slug: string }>()
  const { hasConnectedWarehouse } = useOnboardingContext()
  const handleDirtyChange = usePreventBack()

  const [playground, setPlayground] = useState(false)
  const [blockOptions, setBlockOptions] = useState<IBlockOptions>()
  const [selectedBlock, setSelectedBlock] = useState<GenericBlockOption>()

  const [loading, setLoading] = useState(false)
  const [service, setService] = useState<BlockService>()

  const getBlockOptions = async (svc: BlockService) => {
    setLoading(true)
    const blockOptions = await svc.loadSchemas({ asAdmin: true })
    setBlockOptions(blockOptions)
    setLoading(false)
  }

  const onFormPicked = useCallback(
    (formSlug: string | undefined) => {
      const block = find(blockOptions?.blocks, ['slug', formSlug])

      if (block) {
        setSelectedBlock(block as GenericBlockOption)
      }
    },
    [blockOptions]
  )

  // Instantiate GenericBlockService on page load
  useEffect(() => {
    if (company) {
      const svc = new GenericBlockService({ getToken, company })
      setService(svc)
    }
  }, [getToken, company])

  // Load block options on initial page load
  useEffect(() => {
    if (service) {
      getBlockOptions(service)
    }
  }, [service])

  useEffect(() => {
    if (slug) {
      // Load selected form when slug provided
      onFormPicked(slug)
    } else {
      // Clear out selcted form when no slug
      // This can happen when goint straight to /manage/dynamic, or when going from a form back to the index
      setSelectedBlock(undefined)
    }
  }, [onFormPicked, setSelectedBlock, slug])

  const breadcrumbItems = compact([
    { title: <Link to="/manage/dynamic">Index</Link> },
    slug && {
      title: (
        <Typography as="span" type="title400">
          {slug}
        </Typography>
      ),
    },
  ])

  return (
    <Page title="Prototypes | Narrator" breadcrumbs={[{ text: 'Prototypes' }]}>
      <Layout>
        <Box className="prototype-page-inner-content">
          {/* Top breadcrumbs and Playground Toggle */}
          <Box>
            <Flex>
              <Breadcrumb items={breadcrumbItems} />

              {isSuperAdmin && (
                <Box pl={3} pb={2}>
                  <Switch
                    defaultChecked={playground}
                    checkedChildren="Playground"
                    unCheckedChildren="Prototypes"
                    onChange={setPlayground}
                  />
                </Box>
              )}
            </Flex>
            <Typography type="title300">Prototypes</Typography>
            <Typography color="gray700" style={{ width: '320px' }} mb={3}>
              Prototypes allow you access to specialized functionality. Please contact support to get access.
            </Typography>

            {/* We let admins access this prototype page even if their warehouse isn't connected. 
              This may cause issues, so let's warn them. */}
            {!hasConnectedWarehouse && (
              <Box mt={1}>
                <Alert
                  type="warning"
                  message="Your warehouse is not connected. Some prototypes may not work as expected."
                />
              </Box>
            )}
          </Box>

          {playground && <PlaygroundPage />}

          {!playground && (
            <Box>
              {/* Show blocks as index if none have been selected */}
              <Spin spinning={loading}>
                <Box>
                  {!isEmpty(blockOptions?.blocks) &&
                    !selectedBlock &&
                    map(blockOptions?.blocks as GenericBlockOption[], (block) => (
                      <Box mb={2} key={`${block.title}_${block?.description}`}>
                        <Button
                          style={{ padding: 0 }}
                          type="link"
                          onClick={() => history.push(`/${company.slug}/manage/dynamic/${block.slug}`)}
                        >
                          <Typography type="title300">{block.title}</Typography>
                        </Button>
                        <Typography>{block.description}</Typography>
                      </Box>
                    ))}

                  {/* Show empty state if there is no selected block and no available blocks */}
                  {!selectedBlock && isEmpty(blockOptions?.blocks) && !loading && (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="It doesn't look like you are signed up for any prototypes. Please contact support to get access."
                    >
                      <Button type="primary" onClick={() => openChat()}>
                        Contact Support
                      </Button>
                    </Empty>
                  )}
                </Box>
              </Spin>

              {/* The selected Block (if it has been selected) */}
              <Box mt="16px">
                {selectedBlock && (
                  <GenericBlock
                    key={`${selectedBlock.slug}_${selectedBlock.version}`}
                    slug={selectedBlock.slug}
                    version={selectedBlock.version}
                    onDirtyChange={handleDirtyChange}
                    asAdmin
                    onNavigateRequest={navigate}
                  />
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Layout>
    </Page>
  )
}

export default PrototypePage
