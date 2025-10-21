//backend/trpc/routes/booking/create-booking/route.ts
import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { bookings } from '../../auth/create-test-accounts/route';

// Генерация временных слотов для автомойки
const generateTimeSlots = (carWashId: string, date: string) => {
  const slots = [];
  const startHour = 8;
  const endHour = 20;
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const slotId = `${carWashId}-${date}-${timeString}`;
      
      // Проверяем, занят ли слот
      const isBooked = bookings.some((booking: any) => 
        booking.carWashId === carWashId && 
        booking.date === date && 
        booking.time === timeString
      );
      
      slots.push({
        id: slotId,
        time: timeString,
        available: !isBooked,
        carWashId,
        date
      });
    }
  }
  
  return slots;
};

export const getAvailableSlotsProcedure = publicProcedure
  .input(z.object({
    carWashId: z.string(),
    date: z.string() // YYYY-MM-DD format
  }))
  .query(async ({ input }: { input: { carWashId: string; date: string } }) => {
    try {
      const slots = generateTimeSlots(input.carWashId, input.date);
      
      console.log(`📅 Получены слоты для автомойки ${input.carWashId} на ${input.date}:`, slots.length);
      
      return {
        success: true,
        slots,
        availableCount: slots.filter(slot => slot.available).length,
        totalCount: slots.length
      };
    } catch (error) {
      console.error('❌ Ошибка получения слотов:', error);
      throw new Error('Не удалось получить доступные слоты');
    }
  });

export const createBookingProcedure = publicProcedure
  .input(z.object({
    carWashId: z.string(),
    userId: z.string(),
    date: z.string(),
    time: z.string(),
    services: z.array(z.string()),
    totalPrice: z.number(),
    customerPhone: z.string(),
    customerName: z.string(),
    carInfo: z.object({
      brand: z.string(),
      model: z.string(),
      plateNumber: z.string(),
      bodyType: z.string()
    })
  }))
  .mutation(async ({ input }: { 
    input: {
      carWashId: string;
      userId: string;
      date: string;
      time: string;
      services: string[];
      totalPrice: number;
      customerPhone: string;
      customerName: string;
      carInfo: {
        brand: string;
        model: string;
        plateNumber: string;
        bodyType: string;
      };
    }
  }) => {
    try {
      // Проверяем, доступен ли слот
      const existingBooking = bookings.find((booking: any) => 
        booking.carWashId === input.carWashId && 
        booking.date === input.date && 
        booking.time === input.time
      );
      
      if (existingBooking) {
        throw new Error('Этот временной слот уже занят');
      }
      
      // Создаем новое бронирование
      const newBooking = {
        id: `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...input,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      bookings.push(newBooking);
      
      console.log('✅ Создано новое бронирование:', newBooking.id);
      
      return {
        success: true,
        booking: newBooking,
        message: 'Бронирование успешно создано'
      };
    } catch (error) {
      console.error('❌ Ошибка создания бронирования:', error);
      throw new Error(error instanceof Error ? error.message : 'Не удалось создать бронирование');
    }
  });

export const getUserBookingsProcedure = publicProcedure
  .input(z.object({
    userId: z.string()
  }))
  .query(async ({ input }: { input: { userId: string } }) => {
    try {
      const userBookings = bookings.filter((booking: any) => booking.userId === input.userId);
      
      console.log(`📋 Найдено бронирований для пользователя ${input.userId}:`, userBookings.length);
      
      return {
        success: true,
        bookings: userBookings
      };
    } catch (error) {
      console.error('❌ Ошибка получения бронирований:', error);
      throw new Error('Не удалось получить бронирования');
    }
  });

export const getCarWashBookingsProcedure = publicProcedure
  .input(z.object({
    carWashId: z.string()
  }))
  .query(async ({ input }: { input: { carWashId: string } }) => {
    try {
      const carWashBookings = bookings.filter((booking: any) => booking.carWashId === input.carWashId);
      
      console.log(`🏪 Найдено бронирований для автомойки ${input.carWashId}:`, carWashBookings.length);
      
      return {
        success: true,
        bookings: carWashBookings
      };
    } catch (error) {
      console.error('❌ Ошибка получения бронирований автомойки:', error);
      throw new Error('Не удалось получить бронирования автомойки');
    }
  });

export const confirmBookingProcedure = publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
        const idx = bookings.findIndex((b: any) => b.id === input.id);
        if (idx === -1) throw new Error("Бронирование не найдено");
        bookings[idx].status = "confirmed";
        bookings[idx].updatedAt = new Date().toISOString();
        return { success: true, booking: bookings[idx] };
    });
