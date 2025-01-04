import { Modal, Spin } from 'antd-next'
import { FormItem, SearchSelect } from 'components/antd/staged'
import { DatePicker } from 'components/antd/TimeComponents'
import { useCompany } from 'components/context/company/hooks'
import AnalysisContext from 'components/Narratives/Narrative/AnalysisContext'
import { Box } from 'components/shared/jawns'
import { useListNarrativeRunsQuery } from 'graph/generated'
import { isEmpty } from 'lodash'
import type { Moment } from 'moment'
import { RangeValue } from 'rc-picker/lib/interface'
import { useContext, useState } from 'react'
import { getVisibleFileOptions, makeFileOptions, makeFiles } from 'util/narratives'

const { RangePicker } = DatePicker

const SnapshotDateRangeModal = () => {
  const { narrative, selectedFile, toggleShowDateRange, onSelectSnapshot } = useContext(AnalysisContext)
  const narrativeSlug = narrative?.slug

  const company = useCompany()
  const [fromTime, setFromTime] = useState<string>()
  const [toTime, setToTime] = useState<string>()
  const [selectedFileName, setSelectFileName] = useState<string>()

  // set the to and from dates
  const handleConfirmDateRange = (dates: RangeValue<Moment>, _formatString: [string, string]) => {
    if (dates && dates[0] && dates[1]) {
      setFromTime(dates[0].startOf('day').toISOString())
      setToTime(dates[1].endOf('day').toISOString())
    }
  }

  const { data: runsData, loading: loadingNarrativeRuns } = useListNarrativeRunsQuery({
    variables: { narrative_slug: narrativeSlug as string, company_id: company?.id },
  })

  const narrativeRuns = runsData?.narrative_runs

  const files = makeFiles(narrativeRuns)
  const fileOptions = makeFileOptions(files, company.timezone)
  const visibleFileOptions = getVisibleFileOptions({ fromTime, toTime, fileOptions })

  // set file when selecting snapshot dropdown
  const handleSelectFile = (file: string) => {
    setSelectFileName(file)
  }

  return (
    <Modal
      data-test="snapshot-date-range-modal"
      onCancel={toggleShowDateRange}
      open
      title="Select a Snapshot"
      onOk={() => {
        if (selectedFileName) {
          // selectFile handles query params
          // and setting selectedFile in parent (Narrative.tsx)
          onSelectSnapshot(selectedFileName, files)
        }
        toggleShowDateRange()
      }}
      okButtonProps={{ disabled: isEmpty(selectedFileName) ? true : false }}
    >
      <Box>
        <Spin spinning={loadingNarrativeRuns}>
          <FormItem label="Date Range" layout="vertical">
            <RangePicker onChange={handleConfirmDateRange} />
          </FormItem>

          {!isEmpty(visibleFileOptions) && (
            <FormItem label={!fromTime || !toTime ? 'Recent Snapshots' : 'Snapshots in Range'} layout="vertical">
              <SearchSelect
                data-test="snapshot-selector"
                optionLabelProp="label"
                defaultValue={selectedFile?.name}
                onChange={handleSelectFile}
                getPopupContainer={(trigger) => trigger.parentNode}
                options={visibleFileOptions}
              />
            </FormItem>
          )}
        </Spin>
      </Box>
    </Modal>
  )
}

export default SnapshotDateRangeModal
