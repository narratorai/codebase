import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { RECENTLY_VIEWED } from 'components/shared/IndexPages/constants'
import useEnsureCompanyTagForUser from 'components/shared/IndexPages/useEnsureCompanyTagForUser'
import { ITag_Relations_Enum, useCreateTagMutation, useListCompanyTagsQuery } from 'graph/generated'
import { isEmpty } from 'lodash'
import { useCallback, useEffect, useState } from 'react'

/**
 * Update the narrative's RECENTLY_VIEWED tag
 *
 * @param narrativeId - The narrative ID
 */
export default function useRecentlyViewed(narrativeId?: string) {
  const company = useCompany()
  const { user } = useUser()
  const [hasSetLastViewed, setHasSetLastViewed] = useState<boolean>(false)

  const [upsertNarrativeTag] = useCreateTagMutation()
  const [ensureCompanyTagForUser] = useEnsureCompanyTagForUser()

  const { data: tagsResult } = useListCompanyTagsQuery({
    variables: { company_id: company.id, user_id: user.id },
    fetchPolicy: 'cache-and-network',
  })

  const updateRecentlyViewedTag = useCallback(
    () => async () => {
      // Create a "Recently Viewed" tag for the user if it doesn't exist
      const newTagId = await ensureCompanyTagForUser({ tagName: RECENTLY_VIEWED })

      const tags = tagsResult?.company_tags || []
      const existingTagId = tags.find((tag) => tag.tag === RECENTLY_VIEWED)?.id
      const tagId = existingTagId || newTagId

      if (tagId) {
        await upsertNarrativeTag({
          variables: {
            resource_id: narrativeId,
            tag_id: tagId,
            related_to: ITag_Relations_Enum.Narrative,
          },
        })
      }

      setHasSetLastViewed(true)
    },
    [narrativeId, tagsResult, ensureCompanyTagForUser, upsertNarrativeTag]
  )

  useEffect(() => {
    if (!hasSetLastViewed && !isEmpty(narrativeId)) {
      updateRecentlyViewedTag()
    }
  }, [hasSetLastViewed, narrativeId, updateRecentlyViewedTag])
}
