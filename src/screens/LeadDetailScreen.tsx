import React from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';
import { ScreenContainer } from '../components/ScreenContainer';
import { LeadDetailContent } from '../components/LeadDetailContent';
import type { LeadsStackParamList } from '../navigation/types';

export default function LeadDetailScreen() {
  const route = useRoute<RouteProp<LeadsStackParamList, 'LeadDetail'>>();
  return (
    <ScreenContainer>
      <LeadDetailContent leadId={route.params.leadId} />
    </ScreenContainer>
  );
}
