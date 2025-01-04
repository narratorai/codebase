/*
    These tests are intended to be run on an fresh database
    - after migrations have been run
    - and the test_data seed is applied
*/

const { faker } = require('@faker-js/faker')
const { GraphQLClient } = require('graphql-request')

const { GRAPHQL_URL, TEST_COMPANY_ID, DEMO_COMPANY_ID, COMPANY_USER_ID, COMPANY_ADMIN_ID } = require('./constants')

const TEST_CREATE_COMPANY_USER_MUTATION = `
  mutation TestCreateCompanyUsers($objects: [company_user_insert_input!]!) {
    insert_company_user(objects: $objects) {
      affected_rows
      returning {
        id
        role
      }
    }
  }
`

const TEST_CLEANUP_COMPANY_USER_MUTATION = `
  mutation DeleteCompanyUser($id: uuid!) {
    delete_company_user(where: { id: { _eq: $id }}) {
      affected_rows
    }
  }
`
describe('Create Company User', () => {
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

    it('cannot create for their company', async () => {
      let response

      try {
        await client.request(TEST_CREATE_COMPANY_USER_MUTATION, {
          objects: [
            {
              company_id: TEST_COMPANY_ID,
              user: {
                data: {
                  email: faker.internet.email(),
                },
                on_conflict: { constraint: 'user_email_key', update_columns: ['updated_at'] },
              },
            },
          ],
        })
      } catch (err) {
        response = err.response
      } finally {
        expect(response.errors).toMatchInlineSnapshot(`
          [
            {
              "extensions": {
                "code": "permission-error",
                "path": "$.selectionSet.insert_company_user.args.objects[0].user.data",
              },
              "message": "check constraint of an insert/update permission has failed",
            },
          ]
        `)
      }
    })

    it('cannot create cross company', async () => {
      let response

      try {
        await client.request(TEST_CREATE_COMPANY_USER_MUTATION, {
          objects: [
            {
              company_id: DEMO_COMPANY_ID,
              user: {
                data: {
                  email: faker.internet.email(),
                },
                on_conflict: { constraint: 'user_email_key', update_columns: ['updated_at'] },
              },
            },
          ],
        })
      } catch (err) {
        response = err.response
      } finally {
        expect(response.errors).toMatchInlineSnapshot(`
          [
            {
              "extensions": {
                "code": "permission-error",
                "path": "$.selectionSet.insert_company_user.args.objects[0].user.data",
              },
              "message": "check constraint of an insert/update permission has failed",
            },
          ]
        `)
      }
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

    it('can create for their company', async () => {
      let response

      try {
        response = await client.request(TEST_CREATE_COMPANY_USER_MUTATION, {
          objects: [
            {
              company_id: TEST_COMPANY_ID,
              user: {
                data: {
                  email: faker.internet.email(),
                },
                on_conflict: { constraint: 'user_email_key', update_columns: ['updated_at'] },
              },
            },
          ],
        })

        // Cleanup the crated company user immediately
        await client.request(TEST_CLEANUP_COMPANY_USER_MUTATION, { id: response.insert_company_user.returning[0].id })
      } finally {
        expect(response).toMatchSnapshot({
          insert_company_user: {
            affected_rows: expect.any(Number),
            returning: [
              {
                id: expect.any(String),
                role: expect.any(String),
              },
            ],
          },
        })
      }
    })

    it('cannot create cross company', async () => {
      let response

      try {
        await client.request(TEST_CREATE_COMPANY_USER_MUTATION, {
          objects: [
            {
              company_id: DEMO_COMPANY_ID,
              user: {
                data: {
                  email: faker.internet.email(),
                },
                on_conflict: { constraint: 'user_email_key', update_columns: ['updated_at'] },
              },
            },
          ],
        })
      } catch (err) {
        response = err.response
      } finally {
        expect(response.errors).toMatchInlineSnapshot(`
          [
            {
              "extensions": {
                "code": "permission-error",
                "path": "$.selectionSet.insert_company_user.args.objects[0]",
              },
              "message": "check constraint of an insert/update permission has failed",
            },
          ]
        `)
      }
    })
  })
})
