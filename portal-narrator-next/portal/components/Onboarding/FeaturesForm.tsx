import { Checkbox, Divider, Radio, Typography } from 'antd-next'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

interface Props {
  onSubmit: (data: Record<string, unknown>) => void
}

export default function FeaturesForm({ onSubmit }: Props) {
  const { watch, setValue } = useForm({
    defaultValues: { apiAccess: false, sso: false, integrations: false, dataTeamRequests: null },
  })
  const values = watch()

  useEffect(() => {
    onSubmit(values)
  }, [JSON.stringify(values), onSubmit])

  return (
    <>
      <section>
        <Typography style={{ color: 'white', margin: 0, textTransform: 'uppercase', opacity: 0.75 }}>
          Request enterprise features
        </Typography>
        <div style={{ marginTop: 12 }}>
          <Checkbox
            style={{ color: 'white', width: '100%', marginBottom: 6 }}
            onChange={(event) => setValue('apiAccess', event.target.checked)}
            defaultChecked={values.apiAccess}
          >
            API Access
          </Checkbox>
          <Checkbox
            style={{ color: 'white', width: '100%', marginBottom: 6 }}
            onChange={(event) => setValue('sso', event.target.checked)}
            defaultChecked={values.sso}
          >
            SSO (Single Sign-On)
          </Checkbox>
          <Checkbox
            style={{ color: 'white', width: '100%', marginBottom: 6 }}
            onChange={(event) => setValue('integrations', event.target.checked)}
            defaultChecked={values.integrations}
          >
            Integrations
          </Checkbox>
        </div>
      </section>
      <Divider style={{ borderColor: 'white', opacity: 0.5 }} />
      <section>
        <Typography style={{ color: 'white', margin: 0, textTransform: 'uppercase', opacity: 0.75 }}>
          Need a data team?
        </Typography>
        <div style={{ marginTop: 12 }}>
          <Radio.Group onChange={(event) => setValue('dataTeamRequests', event.target.value)}>
            <Radio value={5} style={{ color: 'white', width: '100%', marginBottom: 6, alignItems: 'start' }}>
              5 Requests
            </Radio>
            <Radio value={40} style={{ color: 'white', width: '100%', marginBottom: 6 }}>
              40 Requests
            </Radio>
            <Radio value={100} style={{ color: 'white', width: '100%', marginBottom: 6 }}>
              100 Requests
            </Radio>
          </Radio.Group>
        </div>
      </section>
    </>
  )
}
