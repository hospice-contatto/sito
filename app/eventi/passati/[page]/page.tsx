import EventPage, {generateMetadata} from '@components/EventPage'
import {pastEventsPageCount} from '@schema/event'

type Params = Promise<{page: string}>

const Page = async ({params}: {params: Params}) => {
  const {page} = await params
  return <EventPage page={page} />
}

const generateStaticParams = async () => {
  const pages = await pastEventsPageCount()

  // We generate pages 2..n
  return Array.from(Array(pages - 1).keys(), page => ({page: `${page + 2}`}))
}

export {generateMetadata, generateStaticParams}
export default Page

