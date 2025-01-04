import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { Typography } from 'components/shared/jawns'
import { makeQueryDefinitionFromContext } from 'machines/datasets'
import { lazy, Suspense, useContext, useEffect, useRef, useState } from 'react'
import { fetchDatasetSql } from 'util/datasets/api'
import { IDatasetFormContext } from 'util/datasets/interfaces'
import { reportError } from 'util/errors'

import DatasetFormContext from './DatasetFormContext'

const SQLText = lazy(() => import(/* webpackChunkName: "sql-text" */ 'components/shared/SQLText'))

const SQLView = () => {
  const { getTokenSilently } = useAuth0()
  const company = useCompany()
  const { machineCurrent, groupSlug } = useContext<IDatasetFormContext>(DatasetFormContext)
  const [translateData, setTranslateData] = useState<{ query?: string }>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const queryDefinition = makeQueryDefinitionFromContext(machineCurrent.context)

  // Give ref a bogus default so if you land on a parent dataset (when group slug is empty)
  // the comparison that triggers translateQuery() in the useRef will fire on mount
  const groupSlugRef = useRef<string | null | undefined>('BOGUS_START_STATE')

  useEffect(() => {
    const translateQuery = async () => {
      setTranslateData({})
      setLoading(true)
      setError(null)

      try {
        const translateData = await fetchDatasetSql({
          getToken: getTokenSilently,
          company,
          groupSlug,
          queryDefinition,
        })
        setTranslateData(translateData)
        setLoading(false)
      } catch (error) {
        reportError('Failed to Fetch Run Dataset Translate', error as Error, { queryDefinition })
        setError(error as Error)
        setLoading(false)
      }
    }

    if (groupSlugRef.current !== groupSlug) {
      translateQuery()
      // Keep track of translated dataset tab so we don't cause multiple API requests!
      groupSlugRef.current = groupSlug
    }
  }, [getTokenSilently, company.slug, groupSlug, queryDefinition])

  if (error) {
    return (
      <Typography type="text2" mb="10px" color="red500">
        Invalid Form, Cannot Generate SQL: {error.message}.
      </Typography>
    )
  }

  if (!loading && !translateData.query) {
    return <Typography>Could not generate SQL</Typography>
  }

  return (
    <Suspense fallback={null}>
      <SQLText value={translateData?.query || 'loading...'} fontSize={12} />
    </Suspense>
  )
}

export default SQLView
