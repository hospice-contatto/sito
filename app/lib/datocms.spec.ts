import {HttpResponse, http} from 'msw'
import {setupServer} from 'msw/node'
import {afterAll, afterEach, beforeAll, describe, expect, it} from 'vitest'
import {requestAll} from './datocms'

describe('datocms', {}, () => {
  const records = Array.from(Array(150).keys(), id => ({id}))
  const requests = []

  const handlers = [
    http.post('https://graphql.datocms.com/', async ({request}) => {
      const {variables} = await request.json() as {variables: {first: number, skip: number}}
      requests.push(variables)
      const page = records.slice(variables.skip, variables.skip + variables.first)
      return HttpResponse.json({data: {allThings: page}})
    })
  ]

  const server = setupServer(...handlers)

  beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
  afterEach(() => {
    server.resetHandlers()
    requests.length = 0
  })
  afterAll(() => server.close())

  describe('requestAll', {}, () => {
    const query = 'query ($first: IntType!, $skip: IntType!) { allThings(first: $first, skip: $skip) { id } }'

    it('fetches all pages of records', async () => {
      const result = await requestAll({query, key: 'allThings'})

      expect(result).toEqual(records)
    })

    it('requests pages of 100 until a short page is returned', async () => {
      await requestAll({query, key: 'allThings'})

      expect(requests).toEqual([
        {first: 100, skip: 0},
        {first: 100, skip: 100}
      ])
    })
  })
})
