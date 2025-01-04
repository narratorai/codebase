import { Button, Input } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import { Box, Flex, Link, Typography } from 'components/shared/jawns'
import React, { useState } from 'react'

interface Props {
  datasetName?: string
  onOk: (name: string) => void
  loading: boolean
  createdDatasetSlug?: string
}

const SaveDatasetPopoverContent = ({ datasetName, onOk, loading, createdDatasetSlug }: Props) => {
  const [name, setName] = useState<string | undefined>(datasetName ? `${datasetName} NEW` : '')

  const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    setName(value)
  }

  const handleOk = () => {
    if (name) {
      onOk(name)
    }
  }

  return (
    <Box style={{ width: '500px' }}>
      <FormItem label="New Dataset Name" layout="vertical" required>
        <Input onChange={handleOnChange} value={name} />
      </FormItem>

      {createdDatasetSlug && (
        <Flex>
          <Typography mb={3} mr="4px" type="title400">
            Visit your new
          </Typography>
          <Link target="_blank" to={`/datasets/edit/${createdDatasetSlug}`}>
            <Typography type="title400">Dataset</Typography>
          </Link>
        </Flex>
      )}

      <Box>
        <Button onClick={handleOk} disabled={!name} type="primary" loading={loading}>
          Create
        </Button>
      </Box>
    </Box>
  )
}

export default SaveDatasetPopoverContent
