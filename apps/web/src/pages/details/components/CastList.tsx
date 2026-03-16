import type { Cast } from '@seerial/domain';
import React from 'react';
import { useTranslation } from 'react-i18next';
import HorizontalList from '@/components/lists/HorizontalList';
import CastCard from './CastCard';

interface CastListProps {
  cast: Cast[];
}

function CastList({ cast }: CastListProps) {
  const { t } = useTranslation();

  return (
    <HorizontalList title={t('cast')}>
      {cast.map((person, index) => (
        <CastCard key={person.name + index} index={person.name + index} person={person} />
      ))}
    </HorizontalList>
  );
}

export default CastList;
