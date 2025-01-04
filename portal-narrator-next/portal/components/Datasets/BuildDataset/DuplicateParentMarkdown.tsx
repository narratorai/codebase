import { Box } from 'components/shared/jawns'
import MarkdownEditor, { ResetValueFunction } from 'components/shared/MarkdownEditor'
import { find, isEqual } from 'lodash'
import { useContext, useEffect, useRef } from 'react'
import usePrevious from 'util/usePrevious'

import DatasetFormContext from './DatasetFormContext'

const DEFAULT_MARKDOWN_TEXT = 'Enter notes here'

const DuplicateParentMarkdown = () => {
  const { machineCurrent, machineSend } = useContext(DatasetFormContext)
  const { _is_parent_duplicate: isDuplicateParentGroup, _group_slug: groupSlug } = machineCurrent.context
  const prevGroupSlug = usePrevious(groupSlug)
  const group = find(machineCurrent.context.all_groups, ['slug', groupSlug])

  const resetValueRef = useRef<ResetValueFunction | undefined>()

  useEffect(() => {
    if (groupSlug && !isEqual(prevGroupSlug, groupSlug) && resetValueRef?.current) {
      const reset = resetValueRef.current
      reset(group?.duplicate_parent_markdown || DEFAULT_MARKDOWN_TEXT)
    }
  }, [prevGroupSlug, groupSlug, group, resetValueRef])

  const handleOnBlur = (value: string) => {
    machineSend('EDIT_DUPLICATE_PARENT_MARKDOWN', { groupSlug, markdown: value })
  }

  // Guard: don't show if not a duplicate parent group
  if (!isDuplicateParentGroup) {
    return null
  }

  return (
    <Box py={2} flexGrow={1} style={{ position: 'relative', minHeight: 0 }}>
      <MarkdownEditor
        initialValue={group?.duplicate_parent_markdown}
        resetValueRef={resetValueRef}
        onBlur={handleOnBlur}
      />
    </Box>
  )
}

export default DuplicateParentMarkdown
