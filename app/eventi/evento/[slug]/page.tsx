import Image from 'next/image'

import Body from '@components/Body'
import Main from '@components/Main'
import Title from '@components/Title'
import {parseDate, request} from '@lib/datocms'
import {datedSlug, datedSlugToSlug} from '@lib/event'
import {eventRecordLinkFragment, eventFragment} from '@schema/event'
import {type Event, type EventRecordLink} from '@schema/event.d'
import {date as formatDate} from '@lib/format'
import {buildTitle, createMetadata} from '@lib/info'
import {type MetadataFetcher} from '@schema/info.d'
import {toOpenGraphImage} from '@lib/responsiveImage'
import styles from './page.module.sass'

type EventsQuery = {allEvents: EventRecordLink[]}

const EVENTS_QUERY = `query { allEvents ${eventRecordLinkFragment} }`

type EventQuery = {event: Event}

const QUERY = `
query Event($slug: String!) {
  event(filter: {slug: {eq: $slug}}) ${eventFragment}
}
`

const getData = async (slug: string): Promise<EventQuery> => {
  return await request<EventQuery>({
    query: QUERY,
    variables: {slug}
  })
}

type Params = Promise<{
  slug: string
}>

const Page = async ({params}: {params: Params}) => {
  const {slug} = await params
  const eventSlug = datedSlugToSlug(slug)
  const page = await getData(eventSlug)
  const date = parseDate(page.event.date)

  return (
    <Main>
      <Title title={page.event.title} />
      <p className={styles.date}>{formatDate(date)}</p>
      <Body data={page.event.body} />
      <div className={styles['image-wrap']}>
        <Image
          alt={page.event.image.responsiveImage.alt}
          {...page.event.image.responsiveImage}
        />
      </div>
    </Main>
  )
}

const overrides: MetadataFetcher = async ({defaults, props}) => {
  const {slug} = await props.params
  const datedSlug = datedSlugToSlug(slug)
  const page = await getData(datedSlug)
  const image = toOpenGraphImage(page.event.image.responsiveImage)

  return {
    images: [image],
    title: buildTitle({defaults, title: page.event.title})
  }
}

const generateMetadata = createMetadata(overrides)

export async function generateStaticParams() {
  const events = await request<EventsQuery>({
    query: EVENTS_QUERY
  })

  return events.allEvents.map(e => {
    const path = datedSlug(e)
    return {slug: path}
  })
}

export {generateMetadata}
export default Page
