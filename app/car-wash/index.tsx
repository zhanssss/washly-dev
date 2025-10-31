import React from 'react';
import {useAuth} from '@/contexts/AuthContext';
import CarWashDashboard from '@/components/Dashboards/CarWashDashboard/CarWashDashboard';
// import CarWashRegistration from '@/components/Registration/CarWashRegistration/CarWashRegistration';

export default function CarWashScreen() {
  const {needsCarWashDetails } = useAuth();

  // Always call hooks in the same order - render conditionally based on state
  //   if (needsCarWashDetails) {
  //   return <CarWashRegistration />;
  // }
  return <CarWashDashboard />
}