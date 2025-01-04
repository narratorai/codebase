export const makeSingleDocumentQuery = ({ slug, kind }) => ({
  query: {
    bool: {
      must: [
        {
          match: {
            slug,
          },
        },
        {
          match: {
            kind,
          },
        },
      ],
    },
  },
})
