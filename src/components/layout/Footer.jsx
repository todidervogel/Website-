import { Link } from 'react-router-dom'
import { t } from '../../design/i18n'

const columns = [
  { title: 'footer.colBrand', links: [['footer.about', '/'], ['footer.press', '/'], ['footer.careers', '/']] },
  { title: 'footer.colDiscover', links: [['footer.feed', '/feed'], ['footer.map', '/karte'], ['footer.cities', '/suche']] },
  { title: 'footer.colGastro', links: [['footer.addBusiness', '/gastro/eintragen'], ['footer.pricing', '/fuer-gastronomen'], ['footer.gastroHelp', '/fuer-gastronomen']] },
  {
    title: 'footer.colLegal',
    links: [
      ['footer.imprint', '/impressum'], ['footer.privacy', '/datenschutz'], ['footer.terms', '/agb'],
      ['footer.cookies', '/cookies'], ['footer.guidelines', '/richtlinien'],
    ],
  },
]

/** TEIL B.4, Fußzeile Web, vier Spalten. */
export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-cols">
          {columns.map((col) => (
            <div className="footer-col" key={col.title}>
              <h3 className="t-h3">{t(col.title)}</h3>
              {col.links.map(([key, to]) => (
                <Link key={key} to={to}>{t(key)}</Link>
              ))}
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span className="t-small c-secondary">{t('footer.copyright')}</span>
          <span className="t-small c-secondary">{t('footer.mapData')}</span>
          <span className="spacer" />
          <select className="select" style={{ width: 'auto', minHeight: 36 }} aria-label={t('common.language')} defaultValue="de">
            <option value="de">{t('common.german')}</option>
            <option value="en">{t('common.english')}</option>
          </select>
        </div>
      </div>
    </footer>
  )
}
