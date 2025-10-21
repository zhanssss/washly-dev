import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PhoneRegistration from '@/components/Registration/PhoneRegistration/PhoneRegistration';
import {CarOwnerDashboard} from '@/components/Dashboards/CarOwnerDashboard/CarOwnerDashboard';

export default function CarOwnerScreen() {
  const { user } = useAuth();

  // Always call hooks in the same order - render conditionally based on state
  const shouldShowDashboard = user && user.type === 'car-owner';

  return shouldShowDashboard ? <CarOwnerDashboard /> : <PhoneRegistration userType="car-owner" />;
}