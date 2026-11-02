import {request as graphqlRequest} from 'graphql-request'

import type {isoDate, parseDate, request, requestAll} from './datocms.d'

const ENDPOINT = 'https://graphql.datocms.com/'
const MAX_PAGE_SIZE = 100

const isoDate: isoDate = date => date.toISOString()
const parseDate: parseDate = date => new Date(date)

const requestHeaders = ({includeDrafts, excludeInvalid}) => {
  const headers = {
    authorization: `Bearer ${process.env.NEXT_DATOCMS_API_TOKEN}`
  }
  if (includeDrafts) {
    headers['X-Include-Drafts'] = 'true'
  }
  if (excludeInvalid) {
    headers['X-Exclude-Invalid'] = 'true'
  }
  return headers
}

const request: request = ({query, variables, includeDrafts, excludeInvalid}) => {
  const headers = requestHeaders({includeDrafts, excludeInvalid})
  return graphqlRequest({url: ENDPOINT, document: query, variables, requestHeaders: headers})
}

/*
DatoCMS returns 20 records by default and at most 100 per request,
so fetch successive pages until a short one comes back.
The query must accept `$first` and `$skip` variables.
*/
const requestAll: requestAll = async ({query, key, variables}) => {
  const records = []
  let skip = 0
  while (true) {
    const page = await request<Record<string, unknown[]>>({
      query,
      variables: {...variables, first: MAX_PAGE_SIZE, skip}
    })
    const batch = page[key]
    records.push(...batch)
    if (batch.length < MAX_PAGE_SIZE) {
      return records
    }
    skip += MAX_PAGE_SIZE
  }
}

const metadataFragment = `
{
  count
}
`

const recordLinkFragment = `
{
  id
  __typename
  slug
}
`

export {isoDate, metadataFragment, parseDate, recordLinkFragment, request, requestAll}
