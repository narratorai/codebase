import { Alert, Button } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import TemplateContext from 'components/Narratives/Templates/TemplateContext'
import { Box, Flex, Link, Typography } from 'components/shared/jawns'
import { map } from 'lodash'
import { useContext } from 'react'
import { Form } from 'react-final-form'
import { arrayMutators } from 'util/forms'

import FormButtons from './FormButtons'

interface Props {
  title: string
  initialValues?: object
  onSubmit(values: object): void
  children: React.ReactNode
}

const TemplateFormContent = ({ title, initialValues, onSubmit, children }: Props) => {
  const { machineCurrent, machineSend } = useContext(TemplateContext)
  const company = useCompany()

  const previewData = machineCurrent.context._preview_narrative

  return (
    <Form
      mutators={arrayMutators}
      initialValues={initialValues}
      onSubmit={onSubmit}
      render={({ handleSubmit, values }) => {
        const onPreview = () => machineSend('PREVIEW_NARRATIVE', values)

        return (
          <>
            <Flex justifyContent="space-between">
              <Typography type="title400" mb={2}>
                {title}
              </Typography>
              <Button size="small" onClick={onPreview}>
                {previewData ? 'Refresh Preview' : 'Preview'}
              </Button>
            </Flex>

            {previewData && (
              <Box mb={2}>
                <Alert
                  type="info"
                  message=""
                  description={
                    <Box>
                      <Typography mb={2}>
                        Preview Narrative:
                        <Link href={`/${company.slug}/narratives/edit/${previewData.narrative_slug}`} target="_blank">
                          {previewData.narrative_slug}
                        </Link>
                      </Typography>
                      {map(previewData.dataset_slugs, (datasetSlug) => (
                        <Typography key={datasetSlug}>
                          Dataset:
                          <Link href={`/${company.slug}/datasets/edit/${datasetSlug}`} target="_blank">
                            {datasetSlug}
                          </Link>
                        </Typography>
                      ))}
                    </Box>
                  }
                />
              </Box>
            )}

            <Box>{children}</Box>

            <Box mb={6}>
              <FormButtons onNext={handleSubmit} />
            </Box>
          </>
        )
      }}
    />
  )
}

export default TemplateFormContent
