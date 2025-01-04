import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useFieldArray, useFormContext } from 'react-hook-form'

import { Row } from '@/components/primitives/Axis'
import { Button } from '@/components/primitives/Button'
import { DatasetSelectController } from '@/components/shared/DatasetSelect'
import DatasetTabSelectController from '@/components/shared/DatasetSelect/DatasetTabSelectController'

interface Props {
  name: string
}

export default function DatasetTabArrayField({ name }: Props) {
  const { watch } = useFormContext()
  const { fields, append, remove, update } = useFieldArray({ name })
  const emptyItem = { id: '', tab: { slug: '' } }

  return (
    <div>
      <ul>
        {fields.map((field, index) => (
          <Row gap="md" items="stretch" key={field.id}>
            <DatasetSelectController
              name={`${name}.${index}.id`}
              onChange={(value) => {
                // setValue does not seem to work for field arrays
                update(index, { id: value, tab: { slug: '' } })
              }}
              placeholder="Choose a dataset"
            />
            <div className="flex-1">
              <DatasetTabSelectController
                datasetId={watch(`${name}.${index}.id`)}
                name={`${name}.${index}.tab.slug`}
                placeholder="Choose a tab"
              />
            </div>
            <div>
              <Button onClick={() => remove(index)} plain>
                <TrashIcon />
              </Button>
            </div>
          </Row>
        ))}
      </ul>
      <div>
        <Button onClick={() => append(emptyItem, { shouldFocus: true })} outline>
          <PlusIcon />
          Add more
        </Button>
      </div>
    </div>
  )
}
