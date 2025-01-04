import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useFieldArray, useFormContext } from 'react-hook-form'

import { Row } from '@/components/primitives/Axis'
import { Button } from '@/components/primitives/Button'
import { Input } from '@/components/primitives/Input'

import DatasetColumnSelect from './DatasetColumnSelect'

interface Props {
  name: string
  reportId: string
}

export default function DecisionAppliedOnArrayField({ name, reportId }: Props) {
  const { watch, setValue } = useFormContext()
  const { fields, append, remove, update } = useFieldArray({ name })
  const emptyItem = { id: '', tab: { slug: '' } }

  return (
    <div>
      <ul>
        {fields.map((field, index) => (
          <Row gap="md" items="stretch" key={field.id}>
            <DatasetColumnSelect
              onChange={(value) => {
                // setValue does not seem to work for field arrays
                update(index, value)
              }}
              placeholder="Choose a dataset"
              reportId={reportId}
              value={watch(`${name}.${index}.id`)}
            />
            <Input
              onChange={(value) => setValue(`${name}.${index}.replaceContent`, value.target.value)}
              placeholder="Replace content"
              value={watch(`${name}.${index}.replaceContent`)}
            />
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
