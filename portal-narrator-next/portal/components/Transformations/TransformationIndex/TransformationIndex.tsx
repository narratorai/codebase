import { Drawer } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { Box } from 'components/shared/jawns'
import { LayoutContent } from 'components/shared/layout/LayoutWithFixedSider'
import Page from 'components/shared/Page'
import SQLText from 'components/shared/SQLText'
import DeleteTransformationModal from 'components/Transformations/DeleteTransformationModal'
import { useListTransformationsNeedsUpdateSubscription, useTransformationIndexV2Query } from 'graph/generated'
import { isEmpty } from 'lodash'
import { useState } from 'react'

import { TRANSFORMATION_CONTENT_Z_INDEX, TRANSFORMATION_HEADER_HEIGHT } from './constants'
import IndexHeader from './IndexHeader'
import IndexTable from './IndexTable'
import { TransformationFromQuery } from './interfaces'

const TransformationIndex = () => {
  const company = useCompany()
  const { isCompanyAdmin } = useUser()
  const [transformationItem, setTransformationItem] = useState<TransformationFromQuery | undefined>(undefined)
  const [deleteTransformation, setDeleteTransformation] = useState<TransformationFromQuery | undefined>(undefined)

  const { data: transformationData, refetch: refetchTransformations } = useTransformationIndexV2Query({
    variables: { company_id: company.id },
  })

  const transformations = transformationData?.all_transformations

  const handleRefetchTransformation = () => {
    // only refetch if the query has run at least once
    // (don't want to fire on initial return of useListTransformationsNeedsUpdateSubscription)
    if (!isEmpty(transformationData)) {
      refetchTransformations()
    }
  }

  useListTransformationsNeedsUpdateSubscription({
    variables: { company_slug: company.slug },
    onData: handleRefetchTransformation,
  })

  const handleCloseDeleteModal = () => {
    setDeleteTransformation(undefined)
  }

  return (
    <Page
      title="Transformations | Narrator"
      breadcrumbs={[{ text: 'Transformations' }]}
      bg="white"
      hasSider={false}
      style={{ maxHeight: '100vh', overflowY: 'auto' }}
    >
      <LayoutContent
        siderWidth={0}
        style={{
          width: '100%',
          marginLeft: 0,
          height: '100%',
          overflowY: 'hidden',
          padding: '32px',
          paddingTop: '16px',
        }}
      >
        <IndexHeader transformations={transformations} />

        <Box
          style={{
            position: 'sticky',
            top: TRANSFORMATION_HEADER_HEIGHT,
            height: `calc(100vh - ${TRANSFORMATION_HEADER_HEIGHT}px)`,
            overflowY: 'auto',
            zIndex: TRANSFORMATION_CONTENT_Z_INDEX,
            paddingBottom: '120px', // extra padding to escape the help scout
          }}
        >
          <IndexTable
            transformations={transformations}
            setTransformationItem={setTransformationItem}
            setDeleteTransformation={setDeleteTransformation}
          />
        </Box>

        {deleteTransformation && isCompanyAdmin && (
          <DeleteTransformationModal onClose={handleCloseDeleteModal} transformation={deleteTransformation} />
        )}

        <Drawer
          width={640}
          title="View SQL"
          placement="right"
          onClose={() => setTransformationItem(undefined)}
          open={!!transformationItem}
          drawerStyle={{
            height: '100%',
          }}
        >
          <Box relative style={{ height: '100%' }}>
            <SQLText value={transformationItem?.current_query?.sql || ''} fontSize={12} copyButton={false} />
          </Box>
        </Drawer>
      </LayoutContent>
    </Page>
  )
}

export default TransformationIndex
