/*
    These tests are intended to be run on an fresh database
    - after migrations have been run
    - and the test_data seed is applied
*/

const { GraphQLClient } = require('graphql-request')

const { GRAPHQL_URL, TEST_COMPANY_ID, DEMO_COMPANY_ID, COMPANY_USER_ID, COMPANY_ADMIN_ID } = require('./constants')

const TEST_UPDATE_COMPANY_BRANDING_MUTATION = `
  mutation TestUpdateCompanyBranding($company_id: uuid!, $branding_color: String) {
    update_company(
      where: { id: { _eq: $company_id } }
      _set: { branding_color: $branding_color }
    ) {
      affected_rows
      returning {
        id
        branding_color
      }
    }
  }
`

describe('Update Company Branding', () => {
  describe('company user', () => {
    let client
    beforeEach(() => {
      client = new GraphQLClient(GRAPHQL_URL, {
        headers: {
          'X-Hasura-Role': 'user',
          'X-Hasura-User-Id': COMPANY_USER_ID,
          'X-Hasura-Company-Id': TEST_COMPANY_ID,
        },
      })
    })

    it('cannot update their company', async () => {
      const response = await client.request(TEST_UPDATE_COMPANY_BRANDING_MUTATION, {
        company_id: TEST_COMPANY_ID,
        branding_color: '#000000',
      })

      expect(response).toMatchInlineSnapshot(`
        {
          "update_company": {
            "affected_rows": 0,
            "returning": [],
          },
        }
      `)
    })

    it('cannot update cross company', async () => {
      const response = await client.request(TEST_UPDATE_COMPANY_BRANDING_MUTATION, {
        company_id: DEMO_COMPANY_ID,
        branding_color: '#000000',
      })

      expect(response).toMatchInlineSnapshot(`
        {
          "update_company": {
            "affected_rows": 0,
            "returning": [],
          },
        }
      `)
    })
  })

  describe('company admin', () => {
    let client
    beforeEach(() => {
      client = new GraphQLClient(GRAPHQL_URL, {
        headers: {
          'X-Hasura-Role': 'user',
          'X-Hasura-User-Id': COMPANY_ADMIN_ID,
          'X-Hasura-Company-Id': TEST_COMPANY_ID,
        },
      })
    })

    it('can update their company', async () => {
      const response = await client.request(TEST_UPDATE_COMPANY_BRANDING_MUTATION, {
        company_id: TEST_COMPANY_ID,
        branding_color: '#000000',
      })

      // Undo the change, keep test data clean
      await client.request(TEST_UPDATE_COMPANY_BRANDING_MUTATION, {
        company_id: TEST_COMPANY_ID,
        branding_color: null,
      })

      expect(response).toMatchObject({
        update_company: {
          affected_rows: 1,
          returning: [
            {
              id: TEST_COMPANY_ID,
              branding_color: '#000000',
            },
          ],
        },
      })
    })

    it('cannot update cross company', async () => {
      const response = await client.request(TEST_UPDATE_COMPANY_BRANDING_MUTATION, {
        company_id: DEMO_COMPANY_ID,
        branding_color: '#000000',
      })
      expect(response).toMatchInlineSnapshot(`
        {
          "update_company": {
            "affected_rows": 0,
            "returning": [],
          },
        }
      `)
    })
  })
})
