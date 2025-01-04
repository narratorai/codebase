import React from 'react'

import { Row } from '@/components/primitives/Axis'
import { SearchboxItemContents, SearchboxItemTitle } from '@/components/primitives/Searchbox'
import { IRemoteCollectionDataset } from '@/stores/datasets'

import DatasetCollectionItemDescription from './DatasetCollectionItemDescription'
import DatasetCollectionItemFavorited from './DatasetCollectionItemFavorited'
import DatasetCollectionItemLastViewed from './DatasetCollectionItemLastViewed'
import DatasetCollectionItemTags from './DatasetCollectionItemTags'
import DatasetCollectionItemTeams from './DatasetCollectionItemTeams'
import DatasetCollectionItemUserAvatar from './DatasetCollectionItemUserAvatar'

type Props = {
  value: IRemoteCollectionDataset
  children?: React.ReactNode
}

const DatasetCollectionItemView = ({ value, children }: Props) => {
  const { name, description, favorited, lastViewedAt, createdBy, tagIds, teamIds, sharedWithEveryone } = value

  return (
    <SearchboxItemContents>
      <DatasetCollectionItemUserAvatar createdBy={createdBy} />
      <SearchboxItemTitle data-slot="md-title">{name}</SearchboxItemTitle>
      <Row data-slot="sm-details" gap="lg" items="center" x="end">
        <DatasetCollectionItemTags tagIds={tagIds} />
        <DatasetCollectionItemTeams sharedWithEveryone={sharedWithEveryone} teamIds={teamIds} />
        <DatasetCollectionItemFavorited favorited={favorited} />
      </Row>

      <Row data-slot="lg-subtitle" gap="lg" items="center" x="between">
        <DatasetCollectionItemDescription description={description} />
        <DatasetCollectionItemLastViewed lastViewedAt={lastViewedAt} />
      </Row>
      {children}
    </SearchboxItemContents>
  )
}

export default DatasetCollectionItemView
