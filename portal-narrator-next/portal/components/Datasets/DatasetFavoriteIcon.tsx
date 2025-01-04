import { App, Tooltip } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import DatasetIndexContext from 'components/Datasets/DatasetIndexContext'
import { isDatasetFavorited } from 'components/Datasets/helpers'
import { DatasetFromQuery } from 'components/Datasets/interfaces'
import FavoriteIcon from 'components/shared/FavoriteIcon'
import { FAVORITES } from 'components/shared/IndexPages/constants'
import useEnsureCompanyTagForUser from 'components/shared/IndexPages/useEnsureCompanyTagForUser'
import { ITag_Relations_Enum, useCreateTagMutation, useDeleteDatasetTagMutation } from 'graph/generated'
import { find } from 'lodash'
import React, { useCallback, useContext, useMemo, useState } from 'react'
import { reportError } from 'util/errors'

interface Props {
  dataset: DatasetFromQuery
}

const DatasetFavoriteIcon = ({ dataset }: Props) => {
  const { notification } = App.useApp()
  const company = useCompany()
  const { user } = useUser()
  const { tags = [], selectedFilter } = useContext(DatasetIndexContext)

  const isFavoritedTab = useMemo(() => selectedFilter === FAVORITES, [selectedFilter])

  // optimistically toggle favorite so we don't re-render on every like/unlike
  const [datasetIsFavorited, setDatasetIsFavorited] = useState(isDatasetFavorited(dataset))

  const [ensureCompanyTagForUser] = useEnsureCompanyTagForUser()

  const [createResourceTag] = useCreateTagMutation({
    onError: (error) => {
      reportError('Create Dataset Tag Error', error)
      notification.error({ key: 'create-dataset-tag-error', message: error.message })
      // reverse optimistic favorited
      setDatasetIsFavorited(false)
    },
  })
  const [deleteDatasetTag] = useDeleteDatasetTagMutation({
    onError: (error) => {
      reportError('Delete Dataset Tag Error', error)
      notification.error({ key: 'delete-dataset-tag-error', message: error.message })
      // reverse optimistic unfavorited
      setDatasetIsFavorited(true)
    },
  })

  const addFavoriteDataset = useCallback(
    async (dataset: DatasetFromQuery) => {
      // check if user already has a "favorites" tag
      let favoriteTagId = find(tags, ['tag', FAVORITES])?.id
      // if they don't, create one for them
      // this will only need to happen once for a user
      if (!favoriteTagId) {
        favoriteTagId = await ensureCompanyTagForUser({ tagName: FAVORITES })
      }

      if (dataset.id && favoriteTagId) {
        await createResourceTag({
          variables: { resource_id: dataset.id, tag_id: favoriteTagId, related_to: ITag_Relations_Enum.Dataset },
          // only refetch on favorites tab
          refetchQueries: isFavoritedTab ? ['ListDatasets'] : undefined, // name of the graphql query we want to refetch (see list_datasets.graphql)
        })
      } else {
        reportError('Create Favorite Dataset Tag Error', {} as Error, { favoriteTagId, dataset })
      }
    },
    [createResourceTag, company.id, user.id, tags, isFavoritedTab]
  )

  const removeFavoriteDataset = useCallback(
    async (dataset: DatasetFromQuery) => {
      const favoriteTag = dataset.tags?.find((tag) => tag.company_tag?.tag === FAVORITES)

      if (favoriteTag?.id) {
        await deleteDatasetTag({
          variables: { dataset_tag_id: favoriteTag.id },
          // only refetch on favorites tab
          refetchQueries: isFavoritedTab ? ['ListDatasets'] : undefined,
        })
      } else {
        reportError('Delete Favorite Dataset Tag Error', {} as Error, favoriteTag)
      }
    },
    [tags, isFavoritedTab]
  )

  const toggleFavoriteDataset = useCallback(async () => {
    // if it has a favorite tag - remove it
    if (datasetIsFavorited) {
      setDatasetIsFavorited(false)
      removeFavoriteDataset(dataset)
    } else {
      // otherwise add it
      setDatasetIsFavorited(true)
      addFavoriteDataset(dataset)
    }
  }, [addFavoriteDataset, removeFavoriteDataset, dataset, datasetIsFavorited])

  // icon to be rendered
  return (
    <Tooltip title={datasetIsFavorited ? 'Unfavorite this Dataset' : 'Favorite this Dataset'} placement="left">
      <div data-test={`dataset-favorite-icon-${datasetIsFavorited ? 'favorited' : 'not-favorited'}`}>
        <FavoriteIcon isFavorite={datasetIsFavorited} onClick={toggleFavoriteDataset} />
      </div>
    </Tooltip>
  )
}

export default DatasetFavoriteIcon
