import GenericBlock from 'components/shared/Blocks/GenericBlock'
import { Flex } from 'components/shared/jawns'
import { LAYOUT_CONTENT_PADDING, LayoutContent } from 'components/shared/layout/LayoutWithFixedSider'
import Page from 'components/shared/Page'
import { omit, truncate } from 'lodash'
import { useMemo } from 'react'
import { generatePath, RouteComponentProps } from 'react-router'
import { IBlockState } from 'util/blocks/interfaces'
import useNavigate from 'util/useNavigate'
import usePreventBack from 'util/usePreventBack'

import BuildTransformationPageSider from './BuildTransformationPageSider'
import { useAllTransformations, useTransformation } from './helpers'

const BLOCK_VERSION = 1
const BLOCK_SLUG_V2 = 'transformation_context_v2'

type Props = RouteComponentProps<{ id?: string; tab?: string }>

const BuildTransformationPage = ({ match }: Props) => {
  const handleNavigate = useNavigate()

  const transformationId = match.params.id
  const currentTransformation = useTransformation(transformationId)

  // FIXME: transformations are never dirty until we can fix the sql editor to update dirty properly
  // don't prevent back when only tab has changed
  const skipPreventBackPathPrefix = generatePath(match.path, omit(match.params, 'tab'))
  const handleDirtyChange = usePreventBack(skipPreventBackPathPrefix)

  const { data: allTransformations, loading: transformationsLoading } = useAllTransformations()

  // Memoize blockState -- otherwise rerenders of this page will cause the GenericBlock
  // to fully reload. With useTransformationIndexSubscription this page rerenders when a
  // block is saved.
  const blockState = useMemo(() => {
    if (transformationId) {
      return {
        resourceType: 'transformation',
        id: transformationId,
      } as IBlockState
    }

    return undefined
  }, [transformationId])

  return (
    <Page
      hideChat
      bg="white"
      title={`${currentTransformation?.name || 'Edit Transformation'} | Narrator`}
      breadcrumbs={[
        { url: '/transformations', text: 'Transformations' },
        {
          text: truncate(currentTransformation?.name || currentTransformation?.id || '', { length: 27 }),
        },
      ]}
    >
      <BuildTransformationPageSider
        currentTransformation={currentTransformation}
        transformations={allTransformations}
        transformationsLoading={transformationsLoading}
        isEditMode={!!transformationId}
      />
      <LayoutContent style={{ padding: LAYOUT_CONTENT_PADDING }}>
        <Flex flexDirection="column" style={{ height: '100%', overflow: 'initial' }}>
          <GenericBlock
            // key off of transformationId to make sure the block re-mounts when switching between transformations or transitions to /new
            key={transformationId}
            bg="transparent"
            padded={false}
            slug={BLOCK_SLUG_V2}
            version={BLOCK_VERSION}
            initialBlockState={blockState}
            onNavigateRequest={handleNavigate}
            onDirtyChange={handleDirtyChange}
            asAdmin
          />
        </Flex>
      </LayoutContent>
    </Page>
  )
}

export default BuildTransformationPage
