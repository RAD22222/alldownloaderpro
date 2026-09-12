import React from 'react';
import { Download } from 'lucide-react';
import { cn } from '@/utils/cn';
import { platforms } from '@/utils/platforms';
import styles from './PageLayout.module.css';

export interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const PageLayout = React.forwardRef<HTMLDivElement, PageLayoutProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(styles.layout, className)} {...props}>
        <header className={styles.header}>
          <div className="container">
            <div className={styles.headerContent}>
              <a href="/" className={styles.logo}>
                <span className={styles.logoIcon}>
                  <Download size={20} />
                </span>
                <span>Universal Downloader</span>
              </a>

              <nav className={styles.nav}>
                <a href="/" className={cn(styles.navLink, styles['navLink--active'])}>
                  Home
                </a>
                <a href="/batch" className={styles.navLink}>
                  Batch
                </a>
                <a href="/about" className={styles.navLink}>
                  About
                </a>
              </nav>
            </div>
          </div>
        </header>

        <main className={styles.main}>
          <div className="container">
            {children}
          </div>
        </main>

        <footer className={styles.footer}>
          <div className="container">
            <div className={styles.footerContent}>
              <p className={styles.footerText}>
                Universal Media Downloader — Retrieve authorized media from your favorite platforms
              </p>

              <div className={styles.footerPlatforms}>
                {Object.entries(platforms)
                  .filter(([key]) => key !== 'unknown')
                  .map(([key, config]) => (
                    <span key={key} className={styles.footerPlatform}>
                      {config.name}
                    </span>
                  ))}
              </div>

              <p className={styles.footerText}>
                Only for downloading media you own or have permission to save.
              </p>
            </div>
          </div>
        </footer>
      </div>
    );
  }
);

PageLayout.displayName = 'PageLayout';
