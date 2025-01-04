import GenericBlock from 'components/shared/Blocks/GenericBlock'
import React from 'react'
import useNavigate from 'util/useNavigate'

const EditCompany = () => (
  // add extra padding so helpscout doesn't cover delete company button
  <div style={{ paddingBottom: '64px' }}>
    <GenericBlock slug="company_edit" onNavigateRequest={useNavigate()} bg="white" padded={false} asAdmin />
  </div>
)

export default EditCompany
