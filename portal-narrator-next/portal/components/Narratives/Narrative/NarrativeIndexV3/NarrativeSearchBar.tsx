import { useCompany } from 'components/context/company/hooks'
import ResourceSearchSelect from 'components/shared/IndexPages/ResourceSearchSelect'
import { Box } from 'components/shared/jawns'
import { find, isEmpty, map } from 'lodash'
import { useContext, useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import styled from 'styled-components'

import { NarrativesType } from './interfaces'
import NarrativeIndexContext from './NarrativeIndexContext'

const SearchContainer = styled(Box)`
  width: 560px;

  @media only screen and (width <= 1100px) {
    width: 400px;
  }
`

const makeOptions = (narratives?: NarrativesType) =>
  map(narratives, (narrative) => ({
    key: narrative.id,
    label: narrative.name,
    value: narrative.slug,
    resource: narrative,
  }))

const NarrativeSearchBar = () => {
  const history = useHistory()
  const company = useCompany()
  const { narratives } = useContext(NarrativeIndexContext)

  const handleSelect = (narrativeSlug: string) => {
    const selectedNarrative = find(narratives, ['slug', narrativeSlug])

    // if the narrative has been assembled, send to assembled
    const hasAssembled = !isEmpty(selectedNarrative?.narrative_runs)

    // navigate to the edit dashboard page
    history.push(`/${company.slug}/narratives/${hasAssembled ? 'a' : 'edit'}/${narrativeSlug}`)
  }

  const options = useMemo(() => makeOptions(narratives), [narratives])

  return (
    <SearchContainer>
      <ResourceSearchSelect
        options={options}
        onSelect={handleSelect}
        placeholderText="Search Analyses"
        type="narrative"
      />
    </SearchContainer>
  )
}

export default NarrativeSearchBar
