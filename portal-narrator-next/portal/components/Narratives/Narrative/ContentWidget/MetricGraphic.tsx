import { useCompany } from 'components/context/company/hooks'
import CopyContentIcon from 'components/shared/CopyContentIcon'
import DynamicPlot, { Props as DynamicPlotProps } from 'components/shared/DynamicPlot'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { isEmpty, isNil } from 'lodash'
import queryString from 'query-string'
import styled from 'styled-components'
import { colors, lightWeight, semiBoldWeight } from 'util/constants'
import { CopiedMetricContent } from 'util/shared_content/interfaces'

import Description from './Description'
import Title from './Title'
import Value from './Value'

const GraphicWrapper = styled(Box)<{ showPlot: boolean; fullWidth?: boolean }>`
  position: relative;
  width: ${({ fullWidth }) => (fullWidth ? '100%' : '170px')};
  margin-right: ${({ fullWidth }) => (fullWidth ? '0px' : '24px')};
  text-align: left;
  color: ${colors.black};
  overflow-x: hidden;

  .copy-content-icon {
    position: absolute;
    opacity: 0;
    transition: opacity 150ms ease-in-out;
    top: 0;
    right: 0;
  }

  a {
    opacity: 0;
    transition: opacity 150ms ease-in-out;
    margin-left: 4px;
  }

  :hover {
    a {
      opacity: 1;
    }

    .copy-content-icon {
      opacity: 1;
    }
  }

  .title {
    min-height: 3rem;
  }

  .value {
    line-height: 0.9;
    font-weight: ${semiBoldWeight};
    max-height: 112px;
    overflow-y: hidden;
    word-wrap: break-word;

    @media print {
      font-size: 40px;
    }
  }

  .header {
    color: ${colors.gray700};
  }

  .truncated {
    overflow: hidden;
    display: -webkit-box; /* stylelint-disable-line */
    -webkit-box-orient: vertical;
    white-space: pre-wrap;

    &.line-clamp-1 {
      -webkit-line-clamp: 1;
    }

    &.line-clamp-2 {
      -webkit-line-clamp: 2;
    }
  }
`

const useDatasetLink = (datasetSlug?: string, groupSlug?: string, narrative_slug?: string, upload_key?: string) => {
  const company = useCompany()
  const datasetLinkSearchParams = queryString.stringify({ group: groupSlug, narrative_slug, upload_key })

  return datasetSlug && groupSlug
    ? `/${company.slug}/datasets/edit/${datasetSlug}?${datasetLinkSearchParams}`
    : undefined
}

// TODO: Use CSS container queries
const getValueFontSize = ({ value, hasPlot }: { value: string; hasPlot: boolean }) => {
  // short length values
  if (value.length <= 8) {
    if (!hasPlot) return '38px'
    return '36px'
  }

  // medium length values
  if (value.length <= 15) {
    if (!hasPlot) return '34px'
    return '30px'
  }

  // large length values
  if (value.length <= 18) {
    if (!hasPlot) return '30px'
    return '26px'
  }

  // extra large length values (over 19)
  if (!hasPlot) return '24px'
  return '20px'
}

function Header({ text }: { text?: string }) {
  return (
    <Typography
      className="header truncated line-clamp-1"
      type="body200"
      title={text && text.length > 20 ? text : undefined}
      fontWeight={lightWeight}
      my={1}
    >
      {text ?? <wbr />}
    </Typography>
  )
}

interface Props {
  header?: string
  title?: string
  value?: string | number
  description?: string
  dataset_slug?: string
  group_slug?: string
  narrative_slug?: string
  upload_key?: string
  tiny_plot?: DynamicPlotProps
  fullWidth?: boolean
  copyContentValues?: CopiedMetricContent
}

/**
 * Simpler version of DatasetMetricGraphic
 */
const MetricGraphic = ({
  header,
  title,
  value,
  description,
  fullWidth,
  copyContentValues,
  dataset_slug: datasetSlug,
  group_slug: groupSlug,
  narrative_slug,
  upload_key,
  tiny_plot: tinyPlot,
  ...rest
}: Props) => {
  const hasPlot = !isEmpty(tinyPlot)

  const stringValue = isNil(value) ? '' : String(value)
  const valueSize = getValueFontSize({ value: stringValue, hasPlot })
  const datasetLink = useDatasetLink(datasetSlug, groupSlug, narrative_slug, upload_key)

  return (
    <Flex alignItems="center" data-test="metric-graphic">
      <GraphicWrapper className="metric-graphic" showPlot={hasPlot} fullWidth={fullWidth} {...rest}>
        {copyContentValues && (
          <div className="copy-content-icon">
            <CopyContentIcon content={copyContentValues} />
          </div>
        )}

        <Title text={title} textType="title400" />
        <Flex flexDirection="column" justifyContent="center">
          <Header text={description} />
          <Value text={stringValue} fontSize={valueSize} datasetLink={datasetLink} />
          <Description text={header} />
        </Flex>

        {hasPlot && <DynamicPlot {...tinyPlot} />}
      </GraphicWrapper>
    </Flex>
  )
}

export default MetricGraphic
