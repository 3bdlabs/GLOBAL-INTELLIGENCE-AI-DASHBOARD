import { useState, useEffect } from 'preact/hooks';
import pkg from '../../package.json';
import { SITE_VARIANT } from '@/config';
import { BETA_MODE } from '@/config/beta';
import { t } from '@/services/i18n';
import { getCurrentTheme } from '@/utils';

interface HeaderProps {
    isDesktopApp: boolean;
}

export const Header = ({ isDesktopApp }: HeaderProps) => {
    const version = pkg.version;
    const [currentTheme, setCurrentTheme] = useState(getCurrentTheme());

    useEffect(() => {
        const obs = new MutationObserver(() => {
            setCurrentTheme(getCurrentTheme());
        });
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => obs.disconnect();
    }, []);

    const local = isDesktopApp || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    const vHref = (v: string, prod: string) => local || SITE_VARIANT === v ? '#' : prod;

    return (
        <div className="header-inner" style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
            <div className="header-left">
                <div className="variant-switcher">
                    <a href={vHref('full', 'https://worldmonitor.app')}
                        className={`variant-option ${SITE_VARIANT === 'full' ? 'active' : ''}`}
                        data-variant="full"
                        title={`${t('header.world')}${SITE_VARIANT === 'full' ? ` ${t('common.currentVariant')}` : ''}`}>
                        <span className="variant-icon">🌍</span>
                        <span className="variant-label">{t('header.world')}</span>
                    </a>
                    <span className="variant-divider"></span>
                    <a href={vHref('tech', 'https://tech.worldmonitor.app')}
                        className={`variant-option ${SITE_VARIANT === 'tech' ? 'active' : ''}`}
                        data-variant="tech"
                        title={`${t('header.tech')}${SITE_VARIANT === 'tech' ? ` ${t('common.currentVariant')}` : ''}`}>
                        <span className="variant-icon">💻</span>
                        <span className="variant-label">{t('header.tech')}</span>
                    </a>
                    <span className="variant-divider"></span>
                    <a href={vHref('finance', 'https://finance.worldmonitor.app')}
                        className={`variant-option ${SITE_VARIANT === 'finance' ? 'active' : ''}`}
                        data-variant="finance"
                        title={`${t('header.finance')}${SITE_VARIANT === 'finance' ? ` ${t('common.currentVariant')}` : ''}`}>
                        <span className="variant-icon">📈</span>
                        <span className="variant-label">{t('header.finance')}</span>
                    </a>
                    {SITE_VARIANT === 'happy' && (
                        <>
                            <span className="variant-divider"></span>
                            <a href={vHref('happy', 'https://happy.worldmonitor.app')}
                                className="variant-option active"
                                data-variant="happy"
                                title={`Good News ${t('common.currentVariant')}`}>
                                <span className="variant-icon">☀️</span>
                                <span className="variant-label">Good News</span>
                            </a>
                        </>
                    )}
                </div>
                <span className="logo" style={{ fontWeight: 800, letterSpacing: '0.05em', color: '#fff', textTransform: 'uppercase', marginLeft: '12px' }}>GLOBAL INTELLIGENCE</span>
                <span className="version" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginLeft: '6px' }}>v{version}</span>
                {BETA_MODE && <span className="beta-badge" style={{ fontSize: '9px', padding: '2px 4px', background: '#eb4432', color: '#fff', borderRadius: '2px', marginLeft: '8px', fontWeight: 'bold' }}>BETA</span>}
                <a href="https://github.com/koala73/worldmonitor" target="_blank" rel="noopener" className="github-link" title={t('header.viewOnGitHub')}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" /></svg>
                </a>
                <div className="status-indicator">
                    <span className="status-dot"></span>
                    <span>{t('header.live')}</span>
                </div>
                <div className="region-selector">
                    <select id="regionSelect" className="region-select">
                        <option value="global">{t('components.deckgl.views.global')}</option>
                        <option value="america">{t('components.deckgl.views.americas')}</option>
                        <option value="mena">{t('components.deckgl.views.mena')}</option>
                        <option value="eu">{t('components.deckgl.views.europe')}</option>
                        <option value="asia">{t('components.deckgl.views.asia')}</option>
                        <option value="latam">{t('components.deckgl.views.latam')}</option>
                        <option value="africa">{t('components.deckgl.views.africa')}</option>
                        <option value="oceania">{t('components.deckgl.views.oceania')}</option>
                    </select>
                </div>
            </div>
            <div className="header-right">
                {!isDesktopApp && (
                    <div className="download-wrapper" id="downloadWrapper">
                        <button className="download-btn" id="downloadBtn" title={t('header.downloadApp')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            <span id="downloadBtnLabel">{t('header.downloadApp')}</span>
                        </button>
                        <div className="download-dropdown" id="downloadDropdown"></div>
                    </div>
                )}
                <button className="search-btn" id="searchBtn"><kbd>⌘K</kbd> {t('header.search')}</button>
                {!isDesktopApp && (
                    <button className="copy-link-btn" id="copyLinkBtn">{t('header.copyLink')}</button>
                )}
                <button className="theme-toggle-btn" id="headerThemeToggle" title={t('header.toggleTheme')}>
                    {currentTheme === 'dark' ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
                    )}
                </button>
                {!isDesktopApp && (
                    <button className="fullscreen-btn" id="fullscreenBtn" title={t('header.fullscreen')}>⛶</button>
                )}
                {SITE_VARIANT === 'happy' && (
                    <button className="tv-mode-btn" id="tvModeBtn" title="TV Mode (Shift+T)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                    </button>
                )}
                <span id="unifiedSettingsMount"></span>
            </div>
        </div>
    );
};
