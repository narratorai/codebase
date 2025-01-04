import React from 'react'
import PropTypes from 'prop-types'
import { Field } from 'react-final-form'
import _ from 'lodash'

import { Label } from 'components/shared/forms'
import { Box, Flex } from 'components/shared/jawns'
import { useCompany } from 'components/context/company/hooks'

const CustomerTableContextSelect = ({ fieldName }) => {
  const company = useCompany()

  // Ignore choosing context if there's only v_customers
  if (_.isEmpty(company.customer_tables) || company.customer_tables.length === 1) {
    return null
  }

  return (
    <Flex>
      {_.map(company.customer_tables, (table) => (
        <Box key={table.name} mr="20px">
          <Flex alignItems="center">
            <Box mr="5px">
              <Field id={table.name} name={fieldName} type="radio" component="input" value={table.name} />
            </Box>
            <Label htmlFor={table.name} text={table.label} inline />
          </Flex>
        </Box>
      ))}
    </Flex>
  )
}

CustomerTableContextSelect.propTypes = {
  fieldName: PropTypes.string.isRequired,
}

export default CustomerTableContextSelect
