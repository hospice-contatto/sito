const SITE_URL = 'https://www.hospice-contatto.it'

const NEXT_SSG_FILES = [
  '/*.json$',
  '/*_buildManifest.js$',
  '/*_middlewareManifest.js$',
  '/*_ssgManifest.js$',
  '/*.js$'
]

const config = {
  siteUrl: SITE_URL,
  // Write into the static export, not public/, which is copied before this runs
  outDir: 'out',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        disallow: NEXT_SSG_FILES
      }
    ]
  }
}

module.exports = config
