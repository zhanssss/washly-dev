import React from 'react';
import {useAuth} from '@/contexts/AuthContext';
import CarWashDashboard from '@/components/Dashboards/CarWashDashboard/CarWashDashboard';

export default function CarWashScreen() {
  const {needsCarWashDetails } = useAuth();

  return <CarWashDashboard />
}