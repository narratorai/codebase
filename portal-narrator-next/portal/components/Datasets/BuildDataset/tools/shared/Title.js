import React from 'react'

import { Typography } from 'components/shared/jawns'
import { semiBoldWeight } from 'util/constants'

const Title = (props) => <Typography type="body50" fontWeight={semiBoldWeight} mb={1} {...props} />

export default Title
