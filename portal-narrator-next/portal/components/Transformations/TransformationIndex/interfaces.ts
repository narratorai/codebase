import { ITransformationIndexV2Query } from 'graph/generated'

export type TransformationsFromQuery = ITransformationIndexV2Query['all_transformations']
export type TransformationFromQuery = TransformationsFromQuery[number]
