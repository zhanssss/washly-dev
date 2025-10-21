import { publicProcedure } from '../../../create-context';
import { z } from 'zod';

// Тестовые аккаунты владельцев автомоек
const testCarWashOwners = [
  {
    id: 'owner-1',
    phone: '+77771234567',
    name: 'Алексей Петров',
    carWashId: '1', // WASH PREMIUM
    email: 'owner1@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'owner-2', 
    phone: '+77771234568',
    name: 'Марина Иванова',
    carWashId: '2', // AUTO SPA DELUXE
    email: 'owner2@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'owner-3',
    phone: '+77771234569', 
    name: 'Дмитрий Сидоров',
    carWashId: '3', // CLEAN MASTER
    email: 'owner3@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'owner-4',
    phone: '+77771234570',
    name: 'Анна Козлова', 
    carWashId: '4', // AQUA WASH
    email: 'owner4@example.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'owner-5',
    phone: '+77771234571',
    name: 'Сергей Волков',
    carWashId: '5', // SHINE CAR
    email: 'owner5@example.com', 
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'owner-6',
    phone: '+77771234572',
    name: 'Елена Морозова',
    carWashId: '6', // CRYSTAL WASH
    email: 'owner6@example.com',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
  }
];

// Временное хранилище пользователей (в реальном приложении это была бы база данных)
let users: any[] = [];
let bookings: any[] = [];

export const createTestAccountsProcedure = publicProcedure
  .mutation(async () => {
    try {
      // Создаем тестовые аккаунты владельцев автомоек
      const createdOwners = testCarWashOwners.map(owner => ({
        ...owner,
        userType: 'car-wash',
        isVerified: true,
        createdAt: new Date().toISOString()
      }));

      // Добавляем в временное хранилище
      users.push(...createdOwners);

      console.log('✅ Созданы тестовые аккаунты владельцев автомоек:', createdOwners.length);
      
      return {
        success: true,
        message: `Созданы ${createdOwners.length} тестовых аккаунтов владельцев автомоек`,
        owners: createdOwners
      };
    } catch (error) {
      console.error('❌ Ошибка создания тестовых аккаунтов:', error);
      throw new Error('Не удалось создать тестовые аккаунты');
    }
  });

export const getCarWashOwnerProcedure = publicProcedure
  .input(z.object({
    carWashId: z.string()
  }))
  .query(async ({ input }: { input: { carWashId: string } }) => {
    const owner = users.find(user => 
      user.userType === 'car-wash' && user.carWashId === input.carWashId
    );
    
    return owner || null;
  });

export const getAllTestUsersProcedure = publicProcedure
  .query(async () => {
    return {
      users,
      bookings,
      totalUsers: users.length,
      totalBookings: bookings.length
    };
  });

// Экспортируем хранилище для использования в других маршрутах
export { users, bookings };