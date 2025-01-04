import EmptyState from '@/components/primitives/EmptyState'
import { Searchbox, SearchboxItems } from '@/components/primitives/Searchbox'
import { useScrollEvents } from '@/hooks'
import { IRemoteCollectionDataset } from '@/stores/datasets'

import { useSearchQuery } from './hooks'
import SearchItemTemplate from './SearchItemTemplate'
import SearchTotalCount from './SearchTotalCount'

interface Props {
  name: string
  onChange: (dataset: IRemoteCollectionDataset) => void
  open: boolean
  setOpen: (value: boolean) => void
  value: IRemoteCollectionDataset
}

const DatasetsSearchDialog = ({ open, setOpen, onChange, value, name }: Props) => {
  const { isFetching, setSearch, fetchNextPage, isFetchingNextPage, data } = useSearchQuery()

  const { data: options, totalCount } = data
  const isEmpty = options.length === 0

  const handleScrollEnd = () => {
    if (!isFetchingNextPage) fetchNextPage()
  }

  const handleScroll = useScrollEvents(handleScrollEnd)

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value)
  }

  const handleClose = () => {
    setSearch('')
    setOpen(false)
  }

  return (
    <Searchbox<IRemoteCollectionDataset>
      searchboxDialogProps={{
        onClose: handleClose,
        open,
      }}
      searchboxInputProps={{
        autoFocus: true,
        onBlur: handleClose,
        onChange: handleSearch,
        placeholder: 'Search datasets...',
      }}
      searchboxProps={{
        onChange: onChange,
        virtual: { options },
        value,
        name,
      }}
    >
      {isEmpty ? (
        <EmptyState
          description="No datasets were found for the searched term. Please try again."
          title="No datasets found"
        />
      ) : (
        <SearchboxItems
          isLoading={isFetching || isFetchingNextPage}
          onScroll={handleScroll}
          OptionTemplate={SearchItemTemplate}
        />
      )}
      <SearchTotalCount isFetching={isFetching} totalCount={totalCount} />
    </Searchbox>
  )
}

export default DatasetsSearchDialog
