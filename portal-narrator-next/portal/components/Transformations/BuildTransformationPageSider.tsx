import { Tag } from 'antd-next'
import { GroupedIndexHeader, GroupedIndexList } from 'components/shared/GroupedIndex'
import { Box, Flex, Link, Typography } from 'components/shared/jawns'
import { FixedSider } from 'components/shared/layout/LayoutWithFixedSider'
import { ITransformation, ITransformationIndexQuery } from 'graph/generated'
import { isEmpty } from 'lodash'
import pluralize from 'pluralize'
import React, { useState } from 'react'
import { colors } from 'util/constants'
import { SCRIPT_TYPE_STREAM } from 'util/manage'

import TransformationListRenderItem from './TransformationListRenderItem'
import TransformationStats from './TransformationStats'

const GROUPING_TRANSFORMATION_KIND = 'kind'
const GROUPING_TRANSFORMATION_TABLE = 'table'
const groupConfigs = [
  {
    label: 'Table',
    group: GROUPING_TRANSFORMATION_TABLE,
    pathToValue: 'table',
  },
  {
    label: 'Type',
    group: GROUPING_TRANSFORMATION_KIND,
    pathToValue: 'kind',
  },
]

interface Props {
  currentTransformation?: ITransformation
  transformations: ITransformationIndexQuery['all_transformations']
  transformationsLoading?: boolean
  isEditMode?: boolean
}

const BuildTransformationPageSider = ({
  currentTransformation,
  transformationsLoading = false,
  transformations = [],
  isEditMode = false,
}: Props) => {
  const [selectedGroup, setSelectedGroup] = useState(GROUPING_TRANSFORMATION_TABLE)
  const [searchValue, setSearchValue] = useState('')

  const associatedActivities = currentTransformation?.activities.map((ac) => ac.activity)

  return (
    <FixedSider>
      <GroupedIndexHeader
        data-public
        isSidebar={!isEditMode}
        header={
          <Box>
            <Link to="/transformations">Index</Link>
            <Typography as="span" ml={1} fontWeight={300} color={colors.gray700}>
              /
            </Typography>
            {!isEditMode ? (
              <Typography as="span" type="title400">
                Create New
              </Typography>
            ) : (
              <Flex alignItems="center" justifyContent="space-between">
                <Typography as="span" type="title400" style={{ wordBreak: 'break-word' }}>
                  {currentTransformation?.name}
                </Typography>
                {currentTransformation?.kind === SCRIPT_TYPE_STREAM && (
                  <Box>
                    <Tag style={{ marginRight: 0 }}>{currentTransformation.table}</Tag>
                  </Box>
                )}
              </Flex>
            )}
          </Box>
        }
        title="Transformations"
        ctaTo="/transformations/new"
        ctaLabel="Create New"
        ctaSize="small"
        ctaProtected
        selectedGroup={selectedGroup}
        groupConfigs={groupConfigs}
        onRadioToggle={setSelectedGroup}
        onSearchChange={setSearchValue}
        showSearch={transformations.length > 1}
        searchProps={{ placeholder: 'Search name, SQL, table, and notes' }}
        extra={
          <Box mt={4}>
            {!isEmpty(associatedActivities) && (
              <Box p={2} bg="blue200">
                <Typography>
                  Associated {pluralize('activity', associatedActivities?.length)}:{' '}
                  {associatedActivities?.map((ac, index) => (
                    <React.Fragment key={ac.id}>
                      <Link as="span" to={`/activities/edit/${ac.id}`}>
                        <strong>{ac.name}</strong>
                      </Link>
                      {index < associatedActivities.length - 1 && <span>, </span>}
                    </React.Fragment>
                  ))}
                </Typography>
              </Box>
            )}
            {transformations.length > 0 && <TransformationStats />}
          </Box>
        }
      />

      {transformations.length > 1 && (
        <Box data-public p={3} pt={0} style={{ flexGrow: 1, overflow: 'auto' }}>
          <GroupedIndexList
            isSidebar
            items={transformations}
            loading={transformationsLoading}
            groupConfigs={groupConfigs}
            searchablePaths={['id', 'name', 'notes', 'table', 'current_query.sql']}
            searchValue={searchValue}
            selectedGroup={selectedGroup}
            renderItem={(item: ITransformation) => <TransformationListRenderItem item={item} isSidebar />}
          />
        </Box>
      )}
    </FixedSider>
  )
}

export default BuildTransformationPageSider
