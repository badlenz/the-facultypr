import React from 'react';
import Hero, { HeroProps } from './Hero';

export interface CinematicPortalHeroProps extends HeroProps {
  onEnterStudio?: () => void;
  brandName?: string;
}

export const CinematicPortalHero: React.FC<CinematicPortalHeroProps> = ({
  onEnterStudio,
  onBookSession,
  onExploreServices,
  brandName = 'La Facultad Studio',
  logoSrc = '/logo faculty .png'
}) => {
  return (
    <Hero
      brandName={brandName}
      logoSrc={logoSrc}
      onBookSession={onBookSession || onEnterStudio}
      onExploreServices={onExploreServices}
    />
  );
};

export default CinematicPortalHero;
