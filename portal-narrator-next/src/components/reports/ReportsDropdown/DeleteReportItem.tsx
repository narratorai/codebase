'use client'

import { TrashIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { useToggle } from 'react-use'

import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/primitives/Alert'
import { Button } from '@/components/primitives/Button'
import { DropdownItem } from '@/components/primitives/Dropdown'
import { useCompanySlugParam } from '@/hooks'
import { useReport } from '@/stores/reports'

import { useDeleteReportMutation } from './hooks'

export default function DeleteReportItem() {
  const router = useRouter()
  const companySlug = useCompanySlugParam()
  const id = useReport((state) => state.id)
  const mutation = useDeleteReportMutation(id as string)

  const [isOpen, toggleConfirmationDialog] = useToggle(false)

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault() // The dropdown should not close when the delete button is clicked as it contains the confirmation dialog
    toggleConfirmationDialog()
  }

  const handleDeleteClick = async () => {
    toggleConfirmationDialog()

    await mutation.mutateAsync()
    router.push(`/v2/${companySlug}/reports`)
  }

  return (
    <>
      <DropdownItem onClick={handleClick}>
        <TrashIcon />
        <p>Delete</p>
      </DropdownItem>
      <Alert onClose={() => toggleConfirmationDialog(false)} open={isOpen}>
        <AlertTitle>Are you sure you want to delete this report?</AlertTitle>
        <AlertDescription>
          This action cannot be undone. This will permanently delete the report and all of its data.
        </AlertDescription>
        <AlertActions>
          <Button onClick={toggleConfirmationDialog} plain>
            Cancel
          </Button>
          <Button onClick={handleDeleteClick}>Delete</Button>
        </AlertActions>
      </Alert>
    </>
  )
}
