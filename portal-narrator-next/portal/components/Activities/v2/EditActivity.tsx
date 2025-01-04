import { Spin } from 'antd-next'
import GenericBlock from 'components/shared/Blocks/GenericBlock'
import { Typography } from 'components/shared/jawns'
import { useGetActivityByIdQuery } from 'graph/generated'
import { omit } from 'lodash'
import { useMemo } from 'react'
import { generatePath, RouteChildrenProps } from 'react-router'
import { IBlockState } from 'util/blocks/interfaces'
import useNavigate from 'util/useNavigate'
import usePreventBack from 'util/usePreventBack'

import { Activity } from './interfaces'

const BLOCK_VERSION = 1
const BLOCK_SLUG_V2 = 'activity_context_v2'

type RouterProps = RouteChildrenProps<{ id?: string; tab?: string }>

interface Props extends RouterProps {
  activity?: Activity
}

const EditActivity = ({ match }: Props) => {
  const activityId = match?.params?.id
  const navigate = useNavigate()

  // Memoize blockState -- otherwise rerenders of this page will cause the GenericBlock
  // to fully reload. With useActivityIndexSubscription this page rerenders when a
  // block is saved.
  const blockState = useMemo(() => {
    if (activityId) {
      return {
        resourceType: 'activities',
        id: activityId,
      } as IBlockState
    }

    return undefined
  }, [activityId])

  // we don't want to prevent back if only the tab changed
  const handleDirtyChange = usePreventBack(generatePath(match!.path, omit(match?.params, 'tab')))

  const { data, loading } = useGetActivityByIdQuery({
    variables: {
      id: activityId,
    },
    skip: !activityId,
  })

  const activityName = data?.activity?.[0]?.name

  return (
    <Spin spinning={loading}>
      <Typography type="title300">{`Edit Activity Details: ${activityName || ''}`}</Typography>
      <GenericBlock
        bg="transparent"
        padded={false}
        slug={BLOCK_SLUG_V2}
        version={BLOCK_VERSION}
        initialBlockState={blockState}
        onDirtyChange={handleDirtyChange}
        onNavigateRequest={navigate}
      />
    </Spin>
  )
}

export default EditActivity
