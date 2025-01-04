/*
    These tests are intended to be run on an fresh database
    - after migrations have been run
    - and the test_data seed is applied
*/

const { GraphQLClient } = require('graphql-request')

const {
  GRAPHQL_URL,
  NULL_COMPANY_ID,
  TEST_COMPANY_ID,
  DEMO_COMPANY_ID,
  COMPANY_USER_ID,
  COMPANY_ADMIN_ID,
} = require('./constants')

const TEST_SEED_QUERY = `
  query TestSeedQuery {
    company(order_by: { id: desc }) {
        id
        name
        company_users(order_by: { id: desc }) {
            id
            role
            first_name
            last_name
            user {
                id
                role
                email
            }
        }
    }
    user(where: {company_users: {}}) {
        id
        role
        email
        company_users(order_by: { id: desc }) {
            id
            role
            first_name
            last_name
            company {
                id
                name
            }
        }
    }
  }
`
describe('Basic Access Controls', () => {
  describe('Admin role', () => {
    let client
    beforeEach(() => {
      client = new GraphQLClient(GRAPHQL_URL, {
        headers: {
          'X-Hasura-Role': 'admin',
        },
      })
    })

    it('matches test query', async () => {
      const res = await client.request(TEST_SEED_QUERY)
      expect(res).toMatchSnapshot()
    })
  })

  describe('User role', () => {
    describe('With null company-id header', () => {
      describe('Company Admin', () => {
        let client
        beforeEach(() => {
          client = new GraphQLClient(GRAPHQL_URL, {
            headers: {
              'X-Hasura-Role': 'user',
              'X-Hasura-User-Id': COMPANY_ADMIN_ID,
              'X-Hasura-Company-Id': NULL_COMPANY_ID,
            },
          })
        })

        it('matches test query', async () => {
          const res = await client.request(TEST_SEED_QUERY)
          expect(res).toMatchSnapshot()
        })
      })

      describe('Company User', () => {
        let client
        beforeEach(() => {
          client = new GraphQLClient(GRAPHQL_URL, {
            headers: {
              'X-Hasura-Role': 'user',
              'X-Hasura-User-Id': COMPANY_USER_ID,
              'X-Hasura-Company-Id': NULL_COMPANY_ID,
            },
          })
        })

        it('matches test query', async () => {
          const res = await client.request(TEST_SEED_QUERY)
          expect(res).toMatchSnapshot()
        })
      })
    })

    describe('With company-id header', () => {
      describe('Company Admin', () => {
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

        it('matches test query', async () => {
          const res = await client.request(TEST_SEED_QUERY)
          expect(res).toMatchSnapshot()
        })
      })

      describe('Company User', () => {
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

        it('matches test query', async () => {
          const res = await client.request(TEST_SEED_QUERY)
          expect(res).toMatchSnapshot()
        })
      })

      describe('Company User on Demo Company', () => {
        let client
        beforeEach(() => {
          client = new GraphQLClient(GRAPHQL_URL, {
            headers: {
              'X-Hasura-Role': 'user',
              'X-Hasura-User-Id': COMPANY_USER_ID,
              'X-Hasura-Company-Id': DEMO_COMPANY_ID,
            },
          })
        })

        it('matches test query', async () => {
          const res = await client.request(TEST_SEED_QUERY)
          expect(res).toMatchSnapshot()
        })
      })
    })
  })
})
