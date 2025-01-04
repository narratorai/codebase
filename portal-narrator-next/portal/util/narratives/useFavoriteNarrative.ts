import { useState, useEffect } from 'react'
import { find } from 'lodash'

import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import usePrevious from 'util/usePrevious'
import useEnsureCompanyTagForUser from 'components/shared/IndexPages/useEnsureCompanyTagForUser'
import { reportError } from 'util/errors'

import { App } from 'antd-next'

import { NarrativeType } from 'components/Narratives/Narrative/NarrativeIndexV3/interfaces'
import { DashboardType } from 'components/Narratives/Dashboards/DashboardIndex/interfaces'
import { FAVORITES } from 'components/shared/IndexPages/constants'

import {
  useCreateTagMutation,
  useDeleteNarrativeTagMutation,
  useListCompanyTagsQuery,
  ITag_Relations_Enum,
} from 'graph/generated'

interface ReturnValues {
  loading: boolean
  isFavorited: boolean
}

type NarrativeOrDashboardType = NarrativeType | DashboardType

interface Props {
  narrative: NarrativeOrDashboardType
  onToggleSuccess?: () => void
  type?: 'Narrative' | 'Dashboard'
}

const useFavoriteNarrative = ({
  narrative,
  onToggleSuccess,
  type = 'Narrative',
}: Props): [() => void, ReturnValues] => {
  const { notification } = App.useApp()
  const company = useCompany()
  const { user } = useUser()

  const { data: tagsResult, loading: tagsLoading } = useListCompanyTagsQuery({
    variables: { company_id: company?.id, user_id: user.id },
    fetchPolicy: 'cache-and-network',
  })
  const tags = tagsResult?.company_tags || []

  const narrativeFromGraphIsFavorited = !!find(narrative.tags, ['company_tag.tag', FAVORITES])
  const prevNarrativeFromGraphIsFavorited = usePrevious(narrativeFromGraphIsFavorited)

  // optimistically toggle favorite so we don't have to wait for response to show favorited state
  const [narrativeIsFavorited, setNarrativeIsFavorited] = useState<boolean>(narrativeFromGraphIsFavorited)

  // if narrative changes, reset favorite state
  // i.e. in dashboard index changing "favorited" in one card section should reflect in all card sections
  useEffect(() => {
    if (
      prevNarrativeFromGraphIsFavorited !== narrativeFromGraphIsFavorited &&
      narrativeFromGraphIsFavorited !== narrativeIsFavorited
    ) {
      setNarrativeIsFavorited(narrativeFromGraphIsFavorited)
    }
  }, [prevNarrativeFromGraphIsFavorited, narrativeFromGraphIsFavorited, narrativeIsFavorited])

  const [ensureCompanyTagForUser] = useEnsureCompanyTagForUser()

  const [createResourceTag, { loading: addFavoriteLoading }] = useCreateTagMutation({
    onError: (error) => {
      reportError(`Create ${type} Tag Error`, error)
      notification.error({ key: `create-${type}-tag-error`, message: error.message })
      // reverse optimistic favorited
      setNarrativeIsFavorited(false)
    },
    onCompleted: onToggleSuccess && onToggleSuccess,
  })

  const [deleteNarrativeTag, { loading: removeFavoriteLoading }] = useDeleteNarrativeTagMutation({
    onError: (error) => {
      reportError(`Delete ${type} Tag Error`, error)
      notification.error({ key: `delete-${type}-tag-error`, message: error.message })
      // reverse optimistic unfavorited
      setNarrativeIsFavorited(true)
    },
    onCompleted: onToggleSuccess && onToggleSuccess,
  })

  const addFavoriteNarrative = async (narrative: NarrativeOrDashboardType) => {
    // check if user already has a "favorites" tag
    let favoriteTagId = find(tags, ['tag', FAVORITES])?.id

    // if they don't, create one for them
    // this will only need to happen once for a user
    if (!favoriteTagId) {
      favoriteTagId = await ensureCompanyTagForUser({ tagName: FAVORITES })
    }

    if (narrative.id && favoriteTagId) {
      createResourceTag({
        variables: { resource_id: narrative.id, tag_id: favoriteTagId, related_to: ITag_Relations_Enum.Narrative },
      })
    } else {
      reportError(`Create Favorite ${type} Tag Error`, {} as Error, { favoriteTagId, narrative })
    }
  }

  const removeFavoriteNarrative = (narrative: NarrativeOrDashboardType) => {
    const favoriteTag = narrative.tags?.find((tag) => tag.company_tag?.tag === FAVORITES)

    if (favoriteTag?.id) {
      deleteNarrativeTag({
        variables: { narrative_tag_id: favoriteTag.id },
      })
    } else {
      reportError(`Delete Favorite ${type} Tag Error`, {} as Error, favoriteTag)
    }
  }

  const toggleFavoriteNarrative = () => {
    // if it has a favorite tag - remove it
    if (narrativeIsFavorited) {
      setNarrativeIsFavorited(false)
      removeFavoriteNarrative(narrative)
    } else {
      // otherwise add it
      setNarrativeIsFavorited(true)
      addFavoriteNarrative(narrative)
    }
  }

  const loading = tagsLoading || addFavoriteLoading || removeFavoriteLoading

  return [toggleFavoriteNarrative, { loading, isFavorited: narrativeIsFavorited }]
}

export default useFavoriteNarrative
