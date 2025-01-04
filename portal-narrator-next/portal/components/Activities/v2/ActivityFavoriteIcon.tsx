import { App, Tooltip } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import FavoriteIcon from 'components/shared/FavoriteIcon'
import { FAVORITES } from 'components/shared/IndexPages/constants'
import useEnsureCompanyTagForUser from 'components/shared/IndexPages/useEnsureCompanyTagForUser'
import {
  ITag_Relations_Enum,
  useCreateTagMutation,
  useDeleteActivityTagMutation,
  useListCompanyTagsQuery,
} from 'graph/generated'
import { find } from 'lodash'
import { useState } from 'react'
import { reportError } from 'util/errors'

import { Activity } from './interfaces'

interface Props {
  activity: Activity
}

const isActivityFavorited = (activity: Activity) => !!find(activity.tags, ['company_tag.tag', FAVORITES])

const ActivityFavoriteIcon = ({ activity }: Props) => {
  const { notification } = App.useApp()
  const company = useCompany()
  const { user } = useUser()

  const { data: tagsResult } = useListCompanyTagsQuery({
    variables: { company_id: company?.id, user_id: user.id },
    fetchPolicy: 'cache-and-network',
  })
  const tags = tagsResult?.company_tags || []

  // optimistically toggle favorite so we don't re-render on every like/unlike
  const [isFavorited, setIsFavorited] = useState(isActivityFavorited(activity))

  const [ensureCompanyTagForUser] = useEnsureCompanyTagForUser()

  const [createResourceTag] = useCreateTagMutation({
    onError: (error) => {
      reportError('Create Activity Tag Error', error)
      notification.error({ key: 'create-activity-tag-error', message: error.message })
      // reverse optimistic favorited
      setIsFavorited(false)
    },
  })

  const [deleteActivityTag] = useDeleteActivityTagMutation({
    onError: (error) => {
      reportError('Delete Activity Tag Error', error)
      notification.error({ key: 'delete-activity-tag-error', message: error.message })
      // reverse optimistic unfavorited
      setIsFavorited(true)
    },
  })

  const addFavoriteActivity = async (activity: Activity) => {
    // check if user already has a "favorites" tag
    let favoriteTagId = find(tags, ['tag', FAVORITES])?.id
    // if they don't, create one for them
    // this will only need to happen once for a user
    if (!favoriteTagId) {
      favoriteTagId = await ensureCompanyTagForUser({ tagName: FAVORITES })
    }

    if (activity.id && favoriteTagId) {
      await createResourceTag({
        variables: { resource_id: activity.id, tag_id: favoriteTagId, related_to: ITag_Relations_Enum.Activity },
        // only refetch on favorites tab
        refetchQueries: ['ActivityIndexV2'],
      })
    } else {
      reportError('Create Favorite Activity Tag Error', {} as Error, { favoriteTagId, activity })
    }
  }

  const removeFavoriteActivity = async (activity: Activity) => {
    const favoriteTag = activity.tags?.find((tag) => tag.company_tag?.tag === FAVORITES)

    if (favoriteTag?.id) {
      await deleteActivityTag({
        variables: { activity_tag_id: favoriteTag.id },
        // only refetch on favorites tab
        refetchQueries: ['ActivityIndexV2'],
      })
    } else {
      reportError('Delete Favorite Activity Tag Error', {} as Error, favoriteTag)
    }
  }

  const toggleFavoriteActivity = () => {
    // if it has a favorite tag - remove it
    if (isFavorited) {
      setIsFavorited(false)
      removeFavoriteActivity(activity)
    } else {
      // otherwise add it
      setIsFavorited(true)
      addFavoriteActivity(activity)
    }
  }

  // icon to be rendered
  return (
    <Tooltip title={isFavorited ? 'Unfavorite this Activity' : 'Favorite this Activity'} placement="left">
      <div data-test={`activity-favorite-icon-${isFavorited ? 'favorited' : 'not-favorited'}`}>
        <FavoriteIcon isFavorite={isFavorited} onClick={toggleFavoriteActivity} />
      </div>
    </Tooltip>
  )
}

export default ActivityFavoriteIcon
