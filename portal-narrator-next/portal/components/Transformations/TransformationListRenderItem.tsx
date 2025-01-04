import { CodeOutlined, DeleteOutlined } from '@ant-design/icons'
import { List, Tag, Tooltip } from 'antd-next'
import MaintenanceIcon from 'components/Activities/MaintenanceIcon'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { isItemNew } from 'components/shared/GroupedIndex'
import { Box, Flex, Link, Typography } from 'components/shared/jawns'
import { ITransformation } from 'graph/generated'
import { isEmpty } from 'lodash'
import React from 'react'
import { useParams } from 'react-router-dom'
import { colors, semiBoldWeight } from 'util/constants'
import { commaify, timeFromNow } from 'util/helpers'
import { SCRIPT_TYPE_CUSTOMER_ATTRIBUTE, SCRIPT_TYPE_STREAM } from 'util/manage'

interface Props {
  item: ITransformation
  isSidebar?: boolean
  setTransformationItem?: (item: ITransformation) => void
  handleOpenDeleteModal?: (item: ITransformation) => void
}

const TransformationListRenderItem = ({ item, isSidebar, setTransformationItem, handleOpenDeleteModal }: Props) => {
  const { isCompanyAdmin } = useUser()
  const company = useCompany()

  const isNew = isItemNew({ item, tz: company?.timezone })
  const lastProcessedQuery = item?.query_updates?.[0]
  const lastPublishedQuery = item.production_queries[0]

  // under maintenance if maintenance has started and there is no end time (or the end time is before the start time)
  const isUnderMaintenance = !isEmpty(item.transformation_maintenances)

  // Because an index can be a sidebar on a show page, find and highlight it (only for sidebar)
  const { id: possibleId } = useParams<{ id: string }>()

  // Mobile view just contains the title and link to edit
  if (isSidebar) {
    return (
      <List.Item data-test="transformation-sidebar-list-item">
        <List.Item.Meta
          title={
            <Box mr={2}>
              <Link unstyled to={`/transformations/edit/${item.id}`}>
                <Typography type="body100" fontWeight={possibleId === item.id ? 'bold' : 'normal'}>
                  {item.name}
                </Typography>
              </Link>
            </Box>
          }
        />
      </List.Item>
    )
  }

  return (
    <List.Item
      data-test="transformation-list-item"
      key={item.id}
      actions={[
        <CodeOutlined key="edit" onClick={() => setTransformationItem && setTransformationItem(item)} />,
        isCompanyAdmin ? (
          <DeleteOutlined
            data-test="delete-transformation-icon"
            style={{ color: colors.red500 }}
            onClick={() => {
              handleOpenDeleteModal && handleOpenDeleteModal(item)
            }}
          />
        ) : (
          <Tooltip title="Only admins can delete transformations">
            <DeleteOutlined data-test="delete-transformation-icon" style={{ color: colors.gray500 }} />
          </Tooltip>
        ),
      ]}
    >
      <List.Item.Meta
        title={
          <>
            <Flex>
              {isUnderMaintenance && (
                <Box mr={1}>
                  <MaintenanceIcon maintenance={item.transformation_maintenances[0]} />
                </Box>
              )}
              <Box mr={2}>
                <Link unstyled to={`/transformations/edit/${item.id}`}>
                  <Typography type="title400">{item.name}</Typography>
                </Link>
              </Box>
              <Box>
                {isNew && (
                  <Tag color="blue" data-test="transformation-status-new">
                    New
                  </Tag>
                )}
                {!lastPublishedQuery && (
                  <Tag data-test="transformation-status-pending" color="orange">
                    Pending
                  </Tag>
                )}
              </Box>
            </Flex>
            {lastPublishedQuery && (
              <Typography type="body50" data-private>
                Last published by {lastPublishedQuery.updated_by} {timeFromNow(lastPublishedQuery.updated_at)}
              </Typography>
            )}
          </>
        }
        description={`${commaify(lastProcessedQuery?.rows_inserted)} rows inserted ${
          lastProcessedQuery ? timeFromNow(lastProcessedQuery.processed_at) : 'N/A'
        }`}
      />
      {item.kind === SCRIPT_TYPE_STREAM && (
        <Box mx={2} width="200px">
          <Typography type="body50" fontWeight={semiBoldWeight}>
            Activities
          </Typography>
          {isEmpty(item.activities) ? (
            <Typography color="gray500">None</Typography>
          ) : (
            item.activities.map((ac, index) => (
              <React.Fragment key={ac.activity.id}>
                {!isEmpty(ac.activity?.activity_maintenances) && (
                  <>
                    <MaintenanceIcon maintenance={ac.activity?.activity_maintenances[0]} />{' '}
                  </>
                )}
                <Link to={`/activities/edit/${ac.activity.id}`}>{ac.activity.name}</Link>
                {index < item.activities.length - 1 && <span>, </span>}
              </React.Fragment>
            ))
          )}
        </Box>
      )}

      {item.kind === SCRIPT_TYPE_CUSTOMER_ATTRIBUTE && (
        <Box width="300px">
          <Typography type="body50" fontWeight={semiBoldWeight}>
            Creates
          </Typography>
          <Typography>
            {company.production_schema}.{item.table} table
          </Typography>
        </Box>
      )}
    </List.Item>
  )
}

export default TransformationListRenderItem
