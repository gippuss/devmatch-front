import { Link } from 'react-router-dom'
import { useLocale } from '@/shared/i18n/LocaleContext'
import styles from './LandingPage.module.css'

const roles = [
  'Frontend Developer', 'Backend Developer', 'Full Stack', 'iOS Developer',
  'Android Developer', 'UI/UX Designer', 'DevOps Engineer', 'Data Scientist',
  'ML Engineer', 'Product Manager', 'QA Engineer', 'Security Engineer',
  'Blockchain Developer', 'Game Developer', 'Technical Writer',
]

export function LandingPage() {
  const { t, locale, setLocale } = useLocale()

  return (
    <div className={styles.page}>

      {/* Ambient background glow */}
      <div className={styles.bgGlow} aria-hidden="true" />
      <div className={styles.bgGlow2} aria-hidden="true" />

      {/* Header */}
      <header className={styles.header}>
        <Link to="/" className={styles.brand}>
          <span className={styles.brandIcon} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
          </span>
          DevMatch
        </Link>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnLocale}
            onClick={() => setLocale(locale === 'en' ? 'ru' : 'en')}
            aria-label="Switch language"
          >
            {locale === 'en' ? 'RU' : 'EN'}
          </button>
          <Link to="/projects" className={styles.btnGhost}>{t('landing.browseProjects')}</Link>
          <Link to="/login" className={styles.btnGhost}>{t('nav.signIn')}</Link>
          <Link to="/register" className={styles.btnPrimary}>{t('landing.getStarted')}</Link>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          {t('landing.badgeText')}
        </div>

        <h1 className={styles.heroTitle}>
          {t('landing.heroTitle1')}<br />
          {t('landing.heroTitle2')} <span className={styles.heroAccent}>{t('landing.heroAccent')}</span>
        </h1>

        <p className={styles.heroSub}>
          {t('landing.heroSub')}
        </p>

        <div className={styles.heroActions}>
          <Link to="/projects" className={styles.btnHeroPrimary}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            {t('landing.heroBrowse')}
          </Link>
          <Link to="/register" className={styles.btnHeroSecondary}>
            {t('landing.heroPost')}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </Link>
        </div>

        <div className={styles.heroMeta}>
          <span className={styles.heroMetaItem}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
            {t('landing.metaFree')}
          </span>
          <span className={styles.heroMetaDot} />
          <span className={styles.heroMetaItem}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
            {t('landing.metaNoFees')}
          </span>
          <span className={styles.heroMetaDot} />
          <span className={styles.heroMetaItem}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
            {t('landing.metaRealProjects')}
          </span>
        </div>

        {/* Decorative code block */}
        <div className={styles.heroCode} aria-hidden="true">
          <div className={styles.heroCodeBar}>
            <span className={styles.heroCodeDot} style={{ background: '#EF4444' }} />
            <span className={styles.heroCodeDot} style={{ background: '#F59E0B' }} />
            <span className={styles.heroCodeDot} style={{ background: '#22C55E' }} />
            <span className={styles.heroCodeFile}>devmatch.tsx</span>
          </div>
          <div className={styles.heroCodeBody}>
            <div className={styles.codeLine}><span className={styles.codeKeyword}>const</span> <span className={styles.codeVar}>team</span> <span className={styles.codePunct}>=</span> <span className={styles.codeKeyword}>await</span> <span className={styles.codeFn}>findDevelopers</span><span className={styles.codePunct}>(&#123;</span></div>
            <div className={styles.codeLine}>{'  '}<span className={styles.codeProp}>role</span><span className={styles.codePunct}>:</span> <span className={styles.codeStr}>'Full Stack'</span><span className={styles.codePunct}>,</span></div>
            <div className={styles.codeLine}>{'  '}<span className={styles.codeProp}>skills</span><span className={styles.codePunct}>:</span> <span className={styles.codePunct}>[</span><span className={styles.codeStr}>'React'</span><span className={styles.codePunct}>,</span> <span className={styles.codeStr}>'Go'</span><span className={styles.codePunct}>],</span></div>
            <div className={styles.codeLine}>{'  '}<span className={styles.codeProp}>grade</span><span className={styles.codePunct}>:</span> <span className={styles.codeStr}>'Senior'</span></div>
            <div className={styles.codeLine}><span className={styles.codePunct}>&#125;)</span></div>
            <div className={`${styles.codeLine} ${styles.codeComment}`}>{'// '}✓ 3 matches found</div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>{t('landing.howItWorksLabel')}</div>
        <h2 className={styles.sectionTitle}>{t('landing.howItWorksTitle')}</h2>
        <p className={styles.sectionSub}>
          {t('landing.howItWorksSub')}
        </p>

        <div className={styles.steps}>
          <div className={styles.stepCard}>
            <div className={styles.stepIconWrap}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <div className={styles.stepNumber}>01</div>
            <div className={styles.stepTitle}>{t('landing.step1Title')}</div>
            <p className={styles.stepDesc}>
              {t('landing.step1Desc')}
            </p>
            <div className={styles.stepConnector} aria-hidden="true" />
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepIconWrap}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div className={styles.stepNumber}>02</div>
            <div className={styles.stepTitle}>{t('landing.step2Title')}</div>
            <p className={styles.stepDesc}>
              {t('landing.step2Desc')}
            </p>
            <div className={styles.stepConnector} aria-hidden="true" />
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepIconWrap}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
              </svg>
            </div>
            <div className={styles.stepNumber}>03</div>
            <div className={styles.stepTitle}>{t('landing.step3Title')}</div>
            <p className={styles.stepDesc}>
              {t('landing.step3Desc')}
            </p>
          </div>
        </div>
      </section>

      <div className={styles.divider} />

      {/* Features */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>{t('landing.featuresLabel')}</div>
        <h2 className={styles.sectionTitle}>{t('landing.featuresTitle')}</h2>
        <p className={styles.sectionSub}>
          {t('landing.featuresSub')}
        </p>

        <div className={styles.features}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className={styles.featureBody}>
              <div className={styles.featureTitle}>{t('landing.feature1Title')}</div>
              <p className={styles.featureDesc}>{t('landing.feature1Desc')}</p>
            </div>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            </div>
            <div className={styles.featureBody}>
              <div className={styles.featureTitle}>{t('landing.feature2Title')}</div>
              <p className={styles.featureDesc}>{t('landing.feature2Desc')}</p>
            </div>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <div className={styles.featureBody}>
              <div className={styles.featureTitle}>{t('landing.feature3Title')}</div>
              <p className={styles.featureDesc}>{t('landing.feature3Desc')}</p>
            </div>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className={styles.featureBody}>
              <div className={styles.featureTitle}>{t('landing.feature4Title')}</div>
              <p className={styles.featureDesc}>{t('landing.feature4Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.divider} />

      {/* Roles */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>{t('landing.specializationsLabel')}</div>
        <h2 className={styles.sectionTitle}>{t('landing.specializationsTitle')}</h2>
        <p className={styles.sectionSub}>
          {t('landing.specializationsSub')}
        </p>
        <div className={styles.rolesGrid}>
          {roles.map(role => (
            <span key={role} className={styles.roleChip}>
              <span className={styles.roleChipDot} aria-hidden="true" />
              {role}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className={styles.ctaSection}>
        <div className={styles.ctaGlow} aria-hidden="true" />
        <div className={styles.ctaEarlyBadge}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          {t('landing.ctaBadge')}
        </div>
        <h2 className={styles.ctaTitle}>{t('landing.ctaTitle')}</h2>
        <p className={styles.ctaSub}>
          {t('landing.ctaSub')}
        </p>
        <div className={styles.ctaActions}>
          <Link to="/register" className={styles.btnHeroPrimary}>
            {t('landing.ctaCreate')}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </Link>
          <Link to="/projects" className={styles.btnHeroSecondary}>
            {t('landing.ctaBrowse')}
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <span className={styles.footerBrandIcon} aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
          </span>
          DevMatch
        </div>
        <div className={styles.footerMeta}>{t('landing.footerMeta')}</div>
      </footer>
    </div>
  )
}
