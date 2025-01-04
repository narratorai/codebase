export interface GroupResponse {
  slug: string
  name: string
  is_parent: boolean
  plots: {
    name: string
    slug: string
    with_group_label: string
  }[]
}
