const fs = require('fs')
const path = require('path')
const { icons } = require('feather-icons')
const Handlebars = require('handlebars')
const micromark = require('micromark')
const striptags = require('striptags')
const postcss = require('postcss')
const inlineBase64 = require('postcss-inline-base64')

const extname = '.hbs'
const partialsDir = path.join(__dirname, 'partials')

fs.readdirSync(partialsDir)
  .filter(filename => path.extname(filename) === extname)
  .map(filename => [
    filename,
    fs.readFileSync(path.join(partialsDir, filename), 'utf8')
  ])
  .forEach(([filename, template]) =>
    Handlebars.registerPartial(path.basename(filename, extname), template)
  )

Handlebars.registerHelper('formatCountry', countryCode =>
  Intl.DisplayNames
    ? new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode)
    : countryCode
)

Handlebars.registerHelper('formatDate', dateString =>
  new Date(dateString).toLocaleDateString('en', {
    month: 'short',
    year: 'numeric'
  })
)

Handlebars.registerHelper('formatPhone', phone =>
  phone.replace(/[^\d|+]+/g, '')
)

Handlebars.registerHelper('formatURL', url =>
  url.replace(/^(https?:|)\/\//, '').replace(/\/$/, '')
)

Handlebars.registerHelper('icon', (name, fallback) =>
  (icons[name.toLowerCase()] || icons[fallback.toLowerCase()]).toSvg({
    width: 16,
    height: 16
  })
)

Handlebars.registerHelper('join', (arr, separator) =>
  arr.join(typeof separator === 'string' ? separator : ', ')
)

Handlebars.registerHelper('markdown', doc => micromark(doc))

Handlebars.registerHelper('stripTags', html => striptags(html))

module.exports.pdfRenderOptions = { mediaType: 'print' }

module.exports.render = async (resume) => {
  const template = fs.readFileSync(path.join(__dirname, 'resume.hbs'), 'utf-8')
  let css = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf-8')

  css = await postcss([inlineBase64({ baseDir: __dirname })]).process(css)

  return Handlebars.compile(template)({ css, resume })
}
