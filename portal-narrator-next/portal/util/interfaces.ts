// TODO switch uses of these to graph/generated types!

export type GetToken = () => Promise<string | undefined>
export interface IGraphActivity {
  id: string
  name: string
  slug: string
}

export interface IActivity {
  _id: string
  _last_modified_at: string
  name: string
  slug: string | string[]
  table: string
  script_slugs: string[]
  // TODO - make these not any:
  features: any[]
  meta: any
}

// the MAVIS owned company config file that lives in a company's S3 bucket:
export interface ICompanyConfig {
  production_schema: string
  tables: IConfigStreamTable[]
  timezone: string
  spend_table: string
}

// An instance of a stream table and it's meta fields:
export interface IConfigStreamTable {
  activity_stream: string
  customer_label: string
  customer_table: string
  identifier: string
}

export interface INarrative {
  id: string
  name: string
  slug: string
  company: string
  created_at: string
  description: string
  state: 'in_progress' | 'live' | 'on_stream_update' | 'cron'
  template_global_slug: string
  update_cron: string
  update_kind: string
}
