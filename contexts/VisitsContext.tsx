import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';

export interface Visit {
  id: string;
  userId: string;
  carWashId: string;
  carWashName: string;
  customerName: string;
  customerPhone: string;
  service: string;
  timestamp: number;
  type: 'subscription' | 'regular';
  amount: number;
}

export interface CarWashStats {
  todayVisits: number;
  monthlyRevenue: number;
  activeSubscribers: number;
  totalVisits: number;
  averageRating: number;
}

export interface UserStats {
  totalVisits: number;
  subscriptionVisits: number;
  regularVisits: number;
  favoriteCarWash: string;
  monthlyVisits: number;
}

export interface Booking {
  id: string;
  carWashId: string;
  customerName: string;
  customerPhone: string;
  service: string;
  scheduledTime: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: number;
}

export interface HourlyData {
  hour: number;
  bookings: number;
}

export const [VisitsProvider, useVisits] = createContextHook(() => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadVisits = useCallback(async () => {
    try {
      const storedVisits = await AsyncStorage.getItem('visits');
      if (storedVisits) {
        setVisits(JSON.parse(storedVisits));
      }
    } catch (error) {
      console.log('Error loading visits:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);



  const loadBookings = useCallback(async () => {
    try {
      const storedBookings = await AsyncStorage.getItem('bookings');
      if (storedBookings) {
        setBookings(JSON.parse(storedBookings));
      }
    } catch (error) {
      console.log('Error loading bookings:', error);
    }
  }, []);

  const saveVisits = useCallback(async (newVisits: Visit[]) => {
    try {
      await AsyncStorage.setItem('visits', JSON.stringify(newVisits));
      setVisits(newVisits);
    } catch (error) {
      console.log('Error saving visits:', error);
    }
  }, []);

  useEffect(() => {
    loadVisits();
    loadBookings();
  }, [loadVisits, loadBookings]);

  const addVisit = useCallback(async (visit: Omit<Visit, 'id' | 'timestamp'>) => {
    const newVisit: Visit = {
      ...visit,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    
    const updatedVisits = [...visits, newVisit];
    await saveVisits(updatedVisits);
  }, [visits, saveVisits]);

  const getCarWashStats = useCallback((carWashId: string): CarWashStats => {
    const carWashVisits = visits.filter(visit => visit.carWashId === carWashId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayVisits = carWashVisits.filter(visit => 
      new Date(visit.timestamp) >= today
    ).length;
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const monthlyVisits = carWashVisits.filter(visit => 
      new Date(visit.timestamp) >= thisMonth
    );
    
    const monthlyRevenue = monthlyVisits.reduce((sum, visit) => sum + visit.amount, 0);
    const activeSubscribers = new Set(
      carWashVisits
        .filter(visit => visit.type === 'subscription')
        .map(visit => visit.userId)
    ).size;
    
    return {
      todayVisits,
      monthlyRevenue,
      activeSubscribers,
      totalVisits: carWashVisits.length,
      averageRating: 4.7, // Mock rating
    };
  }, [visits]);

  const getUserStats = useCallback((userId: string): UserStats => {
    const userVisits = visits.filter(visit => visit.userId === userId);
    const subscriptionVisits = userVisits.filter(visit => visit.type === 'subscription').length;
    const regularVisits = userVisits.filter(visit => visit.type === 'regular').length;
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const monthlyVisits = userVisits.filter(visit => 
      new Date(visit.timestamp) >= thisMonth
    ).length;
    
    // Find most visited car wash
    const carWashCounts = userVisits.reduce((acc, visit) => {
      acc[visit.carWashName] = (acc[visit.carWashName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const favoriteCarWash = Object.entries(carWashCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Нет данных';
    
    return {
      totalVisits: userVisits.length,
      subscriptionVisits,
      regularVisits,
      favoriteCarWash,
      monthlyVisits,
    };
  }, [visits]);

  const getRecentVisits = useCallback((carWashId?: string, limit: number = 10) => {
    let filteredVisits = visits;
    if (carWashId) {
      filteredVisits = visits.filter(visit => visit.carWashId === carWashId);
    }
    
    return filteredVisits
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }, [visits]);

  const getBookingsByDate = useCallback((carWashId: string, date: Date, filter: string): Booking[] => {
    let filteredBookings = bookings.filter(booking => booking.carWashId === carWashId);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (filter) {
      case 'today':
        filteredBookings = filteredBookings.filter(booking => {
          const bookingDate = new Date(booking.scheduledTime);
          bookingDate.setHours(0, 0, 0, 0);
          return bookingDate.getTime() === today.getTime();
        });
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        filteredBookings = filteredBookings.filter(booking => {
          const bookingDate = new Date(booking.scheduledTime);
          return bookingDate >= weekStart && bookingDate <= weekEnd;
        });
        break;
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        filteredBookings = filteredBookings.filter(booking => {
          const bookingDate = new Date(booking.scheduledTime);
          return bookingDate >= monthStart && bookingDate <= monthEnd;
        });
        break;
      default:
        // 'all' - no additional filtering
        break;
    }
    
    return filteredBookings.sort((a, b) => a.scheduledTime - b.scheduledTime);
  }, [bookings]);

  const getHourlyBookings = useCallback((carWashId: string, date: Date): HourlyData[] => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);
    
    const dayBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.scheduledTime);
      return booking.carWashId === carWashId && 
             bookingDate >= targetDate && 
             bookingDate < nextDay;
    });
    
    const hourlyData: HourlyData[] = [];
    
    // Generate data for all 24 hours
    for (let hour = 0; hour < 24; hour++) {
      const hourBookings = dayBookings.filter(booking => {
        const bookingHour = new Date(booking.scheduledTime).getHours();
        return bookingHour === hour;
      });
      
      hourlyData.push({
        hour,
        bookings: hourBookings.length
      });
    }
    
    return hourlyData;
  }, [bookings]);

  return useMemo(() => ({
    visits,
    bookings,
    isLoading,
    addVisit,
    getCarWashStats,
    getUserStats,
    getRecentVisits,
    getBookingsByDate,
    getHourlyBookings,
  }), [visits, bookings, isLoading, addVisit, getCarWashStats, getUserStats, getRecentVisits, getBookingsByDate, getHourlyBookings]);
});

