import localFont from 'next/font/local'

import './globals.sass'
import Footer from '@components/Footer'
import Nav from '@components/Nav'
import {createMetadata} from '@lib/info'
import styles from './layout.module.sass'

//const ubuntuFont = localFont({src: './fonts/Ubuntu-Regular.ttf'})

const RootLayout = ({children}) => (
  <html lang='it' className={`${styles.html}`}>
    <body className={styles.body}>
      <Nav />
      {children}
      <Footer />
    </body>
  </html>
)

const generateMetadata = createMetadata()

export {generateMetadata}
export default RootLayout
