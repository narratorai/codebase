import { App } from 'antd-next'
import { useOnboardingContext } from 'components/Onboarding/OnboardingProvider'
import { Box, Flex } from 'components/shared/jawns'
import { compact, includes, isEmpty, isFunction, map } from 'lodash'
import React, { lazy, Suspense, useCallback, useState } from 'react'
import { BlockContent, FormData, IBlockState, ProcessedResult, SubmitResult } from 'util/blocks/interfaces'
import { showChatMessage } from 'util/chat'

import BlockForm from './BlockForm'
import DynamicContent from './DynamicContent'

const Confetti = lazy(() => import(/* webpackChunkName: "react-confetti" */ 'react-confetti'))

interface GenericBlockProps {
  slug: string
  version?: number
  initialFormData?: FormData
  fields?: Record<string, unknown>[]
  initialBlockState?: IBlockState // load a specific block state (i.e. for edit instead of create new)
  submitCallback?(args: SubmitResult): void
  previewTypes?: string[]
  padded?: boolean
  bg?: string
  onNavigateRequest?(path: string): void
  onDirtyChange?(dirty: boolean): void
  asAdmin?: boolean
}

/**
 * A dynamic UI driven by a backend service. Displays a fully configurable form and
 * calls to its given service to update and submit
 */
const GenericBlock: React.FC<GenericBlockProps> = ({
  slug,
  version = 1,
  initialBlockState,
  submitCallback,
  previewTypes,
  padded = true,
  initialFormData,
  fields,
  onNavigateRequest,
  bg = 'white',
  onDirtyChange,
  asAdmin = false,
}) => {
  const { notification } = App.useApp()
  const [results, setResults] = useState<BlockContent[]>([])
  const [hideOutput, setHideOutput] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const { refetchOnboardingData } = useOnboardingContext()

  const handleSubmit = (result: SubmitResult, hideOutput: boolean) => {
    setHideOutput(hideOutput)
    setResults(result.content)

    if (isFunction(submitCallback)) submitCallback(result)
  }

  const handleProcessed = useCallback(
    (processedData: ProcessedResult) => {
      if (processedData) {
        // Show a UI notification (main use case - saved!)
        if (processedData.notification) {
          const type = processedData.notification.type
          notification[type]({ ...processedData.notification })
        }

        if (processedData.show_beacon_id) {
          showChatMessage(processedData.show_beacon_id)
        }

        if (processedData.confetti) {
          setShowConfetti(true)
        }
      }

      // we need to refetch onboarding data once a transformation
      // is created and pushed production, just in case we need to
      // show the onboarding steps again
      refetchOnboardingData()
    },
    [showChatMessage, refetchOnboardingData]
  )

  return (
    <Flex flexDirection="column">
      <Box p={padded ? 3 : 0} bg={bg} relative>
        <BlockForm
          initialFormData={initialFormData}
          fields={fields}
          onSubmit={handleSubmit}
          version={version}
          slug={slug}
          stateOverride={initialBlockState}
          onNavigateRequest={onNavigateRequest}
          onDirtyChange={onDirtyChange}
          onProcessed={handleProcessed}
          asAdmin={asAdmin}
        />
      </Box>
      {showConfetti && (
        <Suspense fallback={null}>
          <Confetti
            onConfettiComplete={() => setShowConfetti(false)}
            height={window.innerHeight}
            recycle={false}
            gravity={0.3}
            style={{ position: 'fixed' }}
          />
        </Suspense>
      )}

      {!hideOutput && results.length > 0 && (
        <Box>
          {compact(
            map(results, (result) => {
              if (!isEmpty(previewTypes)) {
                if (includes(previewTypes, result.type)) {
                  return <DynamicContent key={result.type} content={result} />
                }
                return null
              } else {
                return <DynamicContent key={result.type} content={result} />
              }
            })
          )}
        </Box>
      )}
    </Flex>
  )
}

export default GenericBlock
