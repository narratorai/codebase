import _ from 'lodash'
import { ITag } from './interfaces'
import { NON_SHARED_TAGS } from './constants'
import {
  IListCompanyTagsQuery,
  ICreateCompanyTagMutationVariables,
  IMetric_Tags,
  IDataset_Tags,
  INarrative_Tags,
} from 'graph/generated'
import { reportError } from 'util/errors'

// We store each user's favorited and recently viewed items (Dataset, Kpi ...) in graph as tags.
// Each CompanyTag is specific to a company and to a user (every user in every company has its own 'favorite' tag)
// If it's the first time we associate a tag to an item (Dataset, Kpi ...) - instantiate the company tag
interface EnsureCompanyTagForUserProps {
  tagName: string // i.e. "favorite" or "recently_viewed"
  tags: ITag[]
  companyId: string
  userId: string
  createCompanyTag: ({ variables }: { variables: ICreateCompanyTagMutationVariables }) => void
}

export const ensureCompanyTagForUser = async ({
  tagName,
  tags,
  companyId,
  userId,
  createCompanyTag,
}: EnsureCompanyTagForUserProps) => {
  const foundTag = _.find(tags, (tag) => tag.tag == tagName)
  if (!foundTag) {
    try {
      const response = await createCompanyTag({
        variables: { tag: tagName, company_id: companyId, user_id: userId },
      })
      const tagId = _.get(response, 'data.insert_company_tags_one.id')
      return tagId
    } catch (e) {
      // nothing for user to be notified about so just report it
      return reportError('Failed to create a new company tag', e as Error)
    }
  }

  return foundTag.id
}

export const getSharedCompanyTags = (companyTags?: IListCompanyTagsQuery['company_tags']) =>
  _.filter(companyTags, (tag) => !_.includes(NON_SHARED_TAGS, tag.tag))

export const isSharedTag = (tag: IMetric_Tags | IDataset_Tags | INarrative_Tags) => {
  // make sure there is a tag to check against
  if (_.isEmpty(tag?.company_tag?.tag)) {
    return false
  }

  return !_.includes(NON_SHARED_TAGS, tag?.company_tag?.tag)
}

export const hasSharedTags = (tags: IMetric_Tags[] | IDataset_Tags[] | INarrative_Tags[] | undefined) =>
  !_.isEmpty(_.filter(tags || [], (tag) => isSharedTag(tag as IMetric_Tags | IDataset_Tags)))
