import { Col, Row } from 'antd-next'
import QueryOptions from 'components/QueryEditor/QueryOptions'
import ToggleRunAsAdmin from 'components/QueryEditor/ToggleRunAsAdmin'
import { Box, Typography } from 'components/shared/jawns'
import { FixedSider } from 'components/shared/layout/LayoutWithFixedSider'
import SchemaMiniMap from 'components/shared/SqlEditor/SchemaMiniMap'
import React, { useEffect, useRef } from 'react'
import { useHistory } from 'react-router'
import { colors } from 'util/constants'

import QueryService from '../shared/SqlEditor/services/QueryService'
import CreateQueryLinkButton from './CreateQueryLinkButton'

// Hook to prevent user from navigating away from page without confirmation
function useConfirmLeavePage() {
  const history = useHistory()
  const ref = useRef<any>(null)

  useEffect(() => {
    const preventClose = (e: any) => {
      e.preventDefault()
      return (e.returnValue = 'Are you sure you want to close?')
    }

    if (!ref.current) {
      ref.current = history.block(() => {
        return 'Are you sure you want to leave?'
      })

      window.addEventListener('beforeunload', preventClose)
    }

    return () => {
      // call ref to allow navigation again
      ref.current?.()
      window.removeEventListener('beforeunload', preventClose)
    }

    // listening to history.location so
    // effect runs on every location change
  }, [history, history.location])

  return ref
}

interface Props {
  valueRef: React.MutableRefObject<any>
  setRunAsAdmin: (value: boolean) => void
  queryService?: QueryService
  setShareLink: (value: string) => void
}

export default function QueryEditorSider({ valueRef, setRunAsAdmin, queryService, setShareLink }: Props) {
  const unblockRef = useConfirmLeavePage()

  return (
    <FixedSider style={{ background: colors.gray200 }}>
      <Box p={3} pb={0}>
        <Row align="middle" gutter={8} data-public>
          <Col flex={1}>
            <Typography type="title300">Query Editor</Typography>
          </Col>
          <Col>
            <ToggleRunAsAdmin onChange={setRunAsAdmin} />
          </Col>
          <Col>
            <CreateQueryLinkButton valueRef={valueRef} onCreated={setShareLink} />
          </Col>
        </Row>
      </Box>

      <Box p={3}>
        <QueryOptions sqlRef={valueRef} unblockRef={unblockRef} />
      </Box>

      {queryService && (
        <Box p={3} style={{ minHeight: 0, height: '100%' }}>
          <SchemaMiniMap getSchemas={queryService.getSchemas} />
        </Box>
      )}
    </FixedSider>
  )
}
