import { CloseOutlined } from '@ant-design/icons'
import { Space } from 'antd-next'
import clsx from 'clsx'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { ACTION_TYPE_COUNT, ACTION_TYPE_QUERY } from 'components/Datasets/BuildDataset/datasetReducer'
import RunningTimer from 'components/Datasets/BuildDataset/RunningTimer'
import { Typography } from 'components/shared/jawns'
import { get, omit } from 'lodash'
import { useContext, useEffect, useState } from 'react'
import styled from 'styled-components'
import { colors, semiBoldWeight } from 'util/constants'
import { RAW_DATASET_KEY } from 'util/datasets'
import { IDatasetFormContext, IRequestApiData } from 'util/datasets/interfaces'
import usePrevious from 'util/usePrevious'

// overrides on message component so it sits at the bottom of the viewport:
// https://github.com/ant-design/ant-design/blob/master/components/message/style/index.less#L6
const LoadingTimerWrapper = styled.div`
  bottom: 24px;
  top: auto;

  /* Add 3s delay to existing antd message animation: */
  animation-delay: 3s;
`

const CloseWrapper = styled.div`
  position: absolute;
  top: 0;
  right: 0;
`

interface Props {
  onCancelRunDataset(): void
  onCancelRunCount(): void
}

const QueryLoadingTimer = ({ onCancelRunDataset, onCancelRunCount }: Props) => {
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null)
  const [loadedSlug, setLoadedSlug] = useState<string | null>(null)

  const { groupSlug, selectedApiData } = useContext<IDatasetFormContext>(DatasetFormContext)
  const tabSlug = groupSlug || RAW_DATASET_KEY
  const prevTabSlug = usePrevious(tabSlug)

  const queryData = get(selectedApiData, ACTION_TYPE_QUERY, {}) as IRequestApiData
  const countData = get(selectedApiData, ACTION_TYPE_COUNT, {}) as IRequestApiData

  const needstoFetchCount = !!selectedApiData.is_approx

  const {
    loading: queryDataLoading,
    loaded: queryDataLoaded,
    canceled: queryDataCanceled,
    error: queryError,
  } = queryData
  const {
    loading: countDataLoading,
    loaded: countDataLoaded,
    canceled: countDataCanceled,
    error: countError,
  } = countData

  const loadingCountComplete = needstoFetchCount ? countDataLoaded : true

  const loadingData = queryDataLoading || (needstoFetchCount && countDataLoading)
  const loadedData =
    (queryDataLoaded && loadingCountComplete && !queryError && !countError) || queryDataCanceled || countDataCanceled

  // Set loadingSlug state to match the current tabSlug if you're loading
  useEffect(() => {
    if (loadingSlug !== tabSlug && loadingData) {
      setLoadingSlug(tabSlug)
      setLoadedSlug(null)
    }
  }, [tabSlug, loadingData, loadingSlug])

  useEffect(() => {
    // if you're changing tabs and you're not loading anything
    if (prevTabSlug !== tabSlug && !loadingData) {
      // Show the notification if there was an error:
      if (queryError || countError) {
        setLoadingSlug(tabSlug)
        setLoadedSlug(tabSlug)
        // Reset both loading and loaded states if there wasn't an error:
      } else {
        setLoadingSlug(null)
        setLoadedSlug(null)
      }
    } else {
      // Set loadedSlug state to match the current tabSlug if necessary
      // NOTE: ONLY allow transition from loading --> loaded if loadingSlug matches the current tabSlug
      // If we didn't have this check it would show the timer when switching tabs to an already completed dataset tab
      if (loadedSlug !== tabSlug && loadingSlug === tabSlug && loadedData && !loadingData) {
        setLoadingSlug(null)
        setLoadedSlug(tabSlug)
      }
    }
  }, [prevTabSlug, tabSlug, loadingData, loadingSlug, loadedData, loadedSlug, queryError, countError])

  const loadingCurrentTab = loadingSlug === tabSlug
  const loadedCurrentTab = loadedSlug === tabSlug

  const onClose = () => {
    setLoadingSlug(null)
    setLoadedSlug(null)
  }

  if (loadingCurrentTab || loadedCurrentTab) {
    return (
      <LoadingTimerWrapper
        className={clsx('ant-message ant-message-notice', {
          // Animates the antd message out of the viewport (when done loading):
          'move-up-leave move-up-leave-active': !loadingCurrentTab && loadedCurrentTab,
        })}
      >
        <div className="ant-message-notice-content" style={{ position: 'relative', maxWidth: 600 }}>
          {queryError && (
            <Typography fontWeight={semiBoldWeight} color="red500" style={{ wordBreak: 'break-word' }}>
              Error running query: {queryError.message}
            </Typography>
          )}
          {countError && (
            <Typography fontWeight={semiBoldWeight} color="red500" style={{ wordBreak: 'break-word' }}>
              Error loading count: {countError.message}
            </Typography>
          )}
          {(countError || queryError) && (
            <CloseWrapper>
              <CloseOutlined style={{ color: colors.gray500, fontSize: 12 }} onClick={onClose} />
            </CloseWrapper>
          )}

          <Space>
            <RunningTimer label="query" onCancel={onCancelRunDataset} {...queryData} />
            {queryDataLoaded && !queryError && needstoFetchCount && (
              <>
                <span>|</span>
                <RunningTimer
                  label="count"
                  onCancel={onCancelRunCount}
                  loading={!queryDataLoading && countDataLoading}
                  {...omit(countData, ['loading'])}
                />
              </>
            )}
          </Space>
        </div>
      </LoadingTimerWrapper>
    )
  }

  return null
}

export default QueryLoadingTimer
