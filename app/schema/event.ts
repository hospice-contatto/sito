import {isoDate, metadataFragment, request} from '@lib/datocms'
import {bodyFragment} from '@lib/body'
import {type EventsMetadataQuery} from '@schema/event.d'
import {responsiveImageFragment} from '@lib/responsiveImage'

const PAGE_SIZE = 10

const pastEventsFilter = '(filter: {date: {lt: $now}})'

const PAST_EVENTS_METADATA_QUERY = `
query PastEventsMetadata($now: Date!) {
  _allEventsMeta${pastEventsFilter} ${metadataFragment}
}
`

const entryCountToPageCount = (entries: number): number =>
  Math.floor((entries - 1) / PAGE_SIZE) + 1

const pastEventsPageCount = async () => {
  const now = isoDate(new Date())
  const query = await request<EventsMetadataQuery>({
    query: PAST_EVENTS_METADATA_QUERY,
    variables: {now}
  })
  return extractPageCount(query)
}

const extractPageCount = (query: EventsMetadataQuery) => {
  const entries = query._allEventsMeta.count
  return entryCountToPageCount(entries)
}

const eventRecordLinkFragment = `
{
  id
  __typename
  slug
  date
}
`

const eventListFragment = `
{
  id
  __typename
  date
  slug
  title
  image {
    ${responsiveImageFragment({width: 200})}
  }
}
`

const eventFragment = `
{
  id
  date
  title
  image {
    ${responsiveImageFragment({width: 600})}
  }
  body ${bodyFragment}
}
`

export {
  extractPageCount,
  eventRecordLinkFragment,
  eventFragment,
  eventListFragment,
  pastEventsFilter,
  pastEventsPageCount,
  PAGE_SIZE
}
