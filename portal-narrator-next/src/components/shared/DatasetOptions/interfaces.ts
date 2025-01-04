import zod from 'zod'

const GsheetUrlSchema = zod.string().url()

export const schema = zod.object({ gsheetUrl: GsheetUrlSchema }).required()

export type ISendToGSheetFormData = zod.TypeOf<typeof schema>

export interface ISendToGSheetFormSubmitData {
  sheetKey: string
}
