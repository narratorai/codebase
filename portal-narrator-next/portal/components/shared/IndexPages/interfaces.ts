import { ICompany_Tags } from 'graph/generated'

export type ITag = Pick<ICompany_Tags, 'id' | 'tag' | 'color' | 'user_id'>
