import { EditOutlined } from '@ant-design/icons'
import { Button, Input, Popconfirm, Tooltip } from 'antd-next'
import { Box, Typography } from 'components/shared/jawns'
import { isEmpty } from 'lodash'
import { useEffect, useState } from 'react'

interface Props {
  selectedKpi?: {
    label: string
    value: string
  }
  updateKpiLabel: ({ label, value }: { label: string; value: string }) => void
}

const RenameKpi = ({ selectedKpi, updateKpiLabel }: Props) => {
  const [kpiLabel, setKpiLabel] = useState<string>()

  // set initial kpi label to selectedKpi label
  useEffect(() => {
    if (selectedKpi && selectedKpi?.label) {
      setKpiLabel(selectedKpi.label)
    }
  }, [selectedKpi, setKpiLabel])

  const handleChangeLabel = (e: any) => {
    setKpiLabel(e?.target?.value)
  }

  const handleConfirm = () => {
    if (selectedKpi?.value && !isEmpty(kpiLabel) && kpiLabel) {
      updateKpiLabel({ label: kpiLabel, value: selectedKpi.value })
    }
  }

  return (
    <Popconfirm
      title={
        <Box style={{ minWidth: '300px' }}>
          <Typography type="title300" mb={2}>
            Rename this KPI
          </Typography>
          <Input value={kpiLabel} onChange={handleChangeLabel} style={{ width: '100%' }} />
        </Box>
      }
      onConfirm={handleConfirm}
      okButtonProps={{ disabled: isEmpty(kpiLabel) }}
      okText="Rename"
      icon={null}
    >
      <Tooltip title="Rename Selected KPI" placement="right">
        <div>
          <Button icon={<EditOutlined />} />
        </div>
      </Tooltip>
    </Popconfirm>
  )
}

export default RenameKpi
