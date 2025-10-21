import { z } from 'zod';
import { publicProcedure } from '../../create-context';

// Временное хранилище пользователей (в реальном приложении используйте базу данных)
const users = new Map<string, {
  id: string;
  phone: string;
  type: 'car-owner' | 'car-wash';
  isVerified: boolean;
  carDetails?: {
    ownerName: string;
    licensePlate: string;
    brand: string;
    model: string;
    bodyType: string;
  };
  carWashDetails?: {
    name: string;
    address: string;
    phone: string;
    latitude: number;
    longitude: number;
    washBays: number;
  };
}>();

export const checkPhoneProcedure = publicProcedure
  .input(z.object({
    phone: z.string().min(1, 'Номер телефона обязателен')
  }))
  .query(({ input }) => {
    const user = users.get(input.phone);
    
    return {
      exists: !!user,
      user: user || null
    };
  });

// Экспортируем users для использования в других процедурах
export { users };