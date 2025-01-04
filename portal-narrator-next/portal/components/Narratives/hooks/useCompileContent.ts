import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { useBuildNarrativeContext } from 'components/Narratives/BuildNarrative/BuildNarrativeProvider'
import { IContent, TContentObject } from 'components/Narratives/interfaces'
import { head, includes, isArray, isNull, isString } from 'lodash'
import { useCallback, useEffect, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { reportError } from 'util/errors'
import { MavisApiError } from 'util/mavis-api'
import { compileBlock, compileContent } from 'util/narratives'
import { ALL_BASIC_CONTENT_TYPES, CONTENT_TYPE_BLOCK } from 'util/narratives/constants'
import { FIELDS_TOKEN_REGEXP, NEWLINE_REGEXP } from 'util/narratives/helpers'

const DEFAULT_DEBOUNCE_WAIT = 1500

interface Props {
  contents?: TContentObject[]
  skip?: boolean
  fieldName?: string // fieldName is used to track compile errors
}

export default function useCompileContent({ contents, skip = false, fieldName }: Props): {
  loading: boolean
  error: string | null
  response: TContentObject[] | undefined
  callback: ({
    contents,
    fields,
  }: {
    contents: TContentObject[] | undefined
    fields: TContentObject | undefined
  }) => Promise<void>
} {
  const company = useCompany()
  const { getTokenSilently: getToken } = useAuth0()

  const { assembledFieldsResponse, handleSetCompileErrors } = useBuildNarrativeContext()
  const fields = assembledFieldsResponse?.fields

  const isBlockType = isArray(contents) && contents?.some((content) => content?.type === CONTENT_TYPE_BLOCK)
  const isConditionType = isArray(contents) && contents?.some((content) => content?.condition)

  const isV2Type = isArray(contents) && contents?.some((content) => includes(ALL_BASIC_CONTENT_TYPES, content?.type))

  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const [response, setResponse] = useState<TContentObject[] | undefined>()

  // get stringified contents and fields to be used in
  // the useEffect hook below.
  // Do a null check so we don't stringify "null"
  const stringifiedContents = isNull(contents) ? contents : JSON.stringify(contents)
  const stringifiedFields = isNull(fields) ? fields : JSON.stringify(fields)

  const callback = useCallback(
    async ({ contents, fields }: { contents: TContentObject[] | undefined; fields: TContentObject | undefined }) => {
      setError(null)

      // No need to compile if `condition` is `{True}` or `{False}`
      if (isConditionType) {
        // since contents are always passed in as an array, let's
        // grab the first (head) entry
        const condition = `${head(contents as IContent[])?.condition}`.trim()

        if (condition === '{True}') {
          setResponse([{ condition: true }])
          return
        }

        if (condition === '{False}') {
          setResponse([{ condition: false }])
          return
        }
      }

      // if dealing with Blocks and there's no `data` (empty/initial input),
      // just return
      if (isBlockType && !(contents as IContent[])?.some((content) => content?.data)) {
        return
      }

      try {
        let resp
        setLoading(true)

        // The existing compileContent API doesn't seem to handle passing an array of
        // content for Blocks, so we have this split in logic here.
        // TODO: look into consolidating this into a single API
        if (isBlockType) {
          resp = await compileBlock({
            getToken,
            company,
            content: head(contents),
            fields,
          })
        } else {
          resp = await compileContent({
            getToken,
            company,
            contents,
            fields,
          })
        }

        setResponse(resp.compiled_content)
      } catch (error: any) {
        if (error instanceof MavisApiError && error.status === 400 && error.response?.reason) {
          setError(error.response?.reason)
        } else {
          const message = error.response?.message || error.message
          const description = error.response?.description || error.description
          const formattedDescription = description ? `${description}: ` : ''
          const formattedErrorMessage = `${formattedDescription}${message}`
          setError(formattedErrorMessage)
          reportError(error as Error)
        }
      } finally {
        setLoading(false)
      }
    },
    [getToken, company, isBlockType, isConditionType]
  )

  // for Block types, we don't need to debounce, since user is
  // not actually typing into an input field (using a modal UI instead)
  // so we just set the `wait` value to 0 to trigger compile right away
  const debounceWait = isBlockType ? 0 : DEFAULT_DEBOUNCE_WAIT
  const debouncedCallback = useDebouncedCallback(callback, debounceWait)

  useEffect(() => {
    async function doAsync(contents: TContentObject[], fields: TContentObject | undefined) {
      await debouncedCallback({
        contents,
        fields,
      })
    }

    try {
      const contents = (
        isString(stringifiedContents) ? JSON.parse(stringifiedContents) : stringifiedContents
      ) as TContentObject[]
      const fields = isString(stringifiedFields) ? JSON.parse(stringifiedFields) : stringifiedFields

      const containsFields =
        fields &&
        contents.some((content) =>
          // iterate through all the content values and see if
          // it contains any fields (based on regex) or
          // multiple newlines (to replace with <br>)
          Object.values(content).some((val) => `${val}`.match(FIELDS_TOKEN_REGEXP) || `${val}`.match(NEWLINE_REGEXP))
        )

      // if its NOT a block type (plot, raw metric etc) AND
      // does not contain any fields, then just set the response
      // and return
      if (!isBlockType && !containsFields && !isV2Type) {
        setResponse(contents)
        return
      }

      // if contains fields OR is block type (plot, raw metric etc)
      // and NOT skipping, then process
      if ((containsFields || isBlockType || isV2Type) && !skip) {
        doAsync(contents, fields)
      }
    } catch (err) {
      setError((err as Error).message)
    }

    // we pass in the JSON.strigify'ed versions of `content` and `fields`
    // into this hook to avoid unnecessary re-renders. Since both of these params
    // are objects, if we passed in as-is, it would cause a re-render
  }, [debouncedCallback, stringifiedContents, stringifiedFields, skip, isBlockType, isV2Type])

  // fieldName is passed when you want to keep track of compile errors
  useEffect(() => {
    if (fieldName) {
      handleSetCompileErrors({ fieldName, error })
    }
  }, [fieldName, error, handleSetCompileErrors])

  return {
    loading,
    error,
    response,
    callback,
  }
}
