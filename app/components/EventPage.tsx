import EventList from '@components/EventList'
import type {EventListItem} from '@schema/event.d'
import Main from '@components/Main'
import Pagination from '@components/Pagination'
import type {LinkBuilder} from '@components/Pagination.d'
import Title from '@components/Title'
import {isoDate, metadataFragment, request} from '@lib/datocms'
import {type RecordsMeta} from '@lib/datocms.d'
import {toOpenGraphImage} from '@lib/responsiveImage'
import {createMetadata} from '@lib/info'
import {eventListFragment, extractPageCount, pastEventsFilter, PAGE_SIZE} from '@schema/event'

type PastEventsQuery = {
  allEvents: EventListItem[],
  _allEventsMeta: RecordsMeta
}

const QUERY = `
query PastEvents($now: Date!, $skip: IntType!, $first: IntType!) {
  allEvents(filter: {date: {lt: $now}}, orderBy: date_DESC, skip: $skip, first: $first) ${eventListFragment}
  _allEventsMeta${pastEventsFilter} ${metadataFragment}
}
`

const getData = async ({page}) => {
  const date = new Date()
  const now = isoDate(date)
  const skip = (page - 1) * PAGE_SIZE
  return await request<PastEventsQuery>({
    query: QUERY,
    variables: {now, skip, first: PAGE_SIZE}
  })
}

const pageToPath: LinkBuilder = page => (page === 1 ? '/eventi/passati' : `/eventi/passati/${page}`)

const EventPage = async ({page}) => {
  const currentPage: number = parseInt(page)
  const query = await getData({page})
  const count = extractPageCount(query)

  return (
    <Main>
      <Title title='Eventi passati' />
      <EventList events={query.allEvents} />
      <Pagination currentPage={currentPage} pageCount={count} linkBuilder={pageToPath} perPage={PAGE_SIZE} />
    </Main>
  )
}


const generateMetadata = createMetadata(async ({props}) => {
  const params = await props.params
  const page = parseInt(params.page || '1')
  const query = await getData({page})
  const images = query.allEvents.map(e =>
    toOpenGraphImage(e.image.responsiveImage)
  )

  return {
    images,
    title: `Eventi passati - Pagina ${page}`
  }
})


export default EventPage
export {generateMetadata}
