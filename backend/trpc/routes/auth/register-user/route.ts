import { z } from 'zod';
import { publicProcedure } from '../../create-context.js';
import { users } from '../check-phone/route';

const carDetailsSchema = z.object({
  ownerName: z.string().min(1, 'Имя владельца обязательно'),
  licensePlate: z.string().min(1, 'Госномер обязателен'),
  brand: z.string().min(1, 'Марка автомобиля обязательна'),
  model: z.string().min(1, 'Модель автомобиля обязательна'),
  bodyType: z.string().min(1, 'Тип кузова обязателен')
});

const carWashDetailsSchema = z.object({
  name: z.string().min(1, 'Название автомойки обязательно'),
  address: z.string().min(1, 'Адрес обязателен'),
  phone: z.string().min(1, 'Телефон обязателен'),
  latitude: z.number(),
  longitude: z.number(),
  washBays: z.number().min(1, 'Количество боксов должно быть больше 0')
});

export const registerUserProcedure = publicProcedure
  .input(z.object({
    phone: z.string().min(1, 'Номер телефона обязателен'),
    type: z.enum(['car-owner', 'car-wash']),
    carDetails: carDetailsSchema.optional(),
    carWashDetails: carWashDetailsSchema.optional()
  }))
  .mutation(({ input }) => {
    // Проверяем, что пользователь с таким номером не существует
    if (users.has(input.phone)) {
      return {
        success: false,
        error: 'Пользователь с таким номером уже существует'
      };
    }
    
    // Проверяем, что переданы нужные данные в зависимости от типа
    if (input.type === 'car-owner' && !input.carDetails) {
      return {
        success: false,
        error: 'Данные об автомобиле обязательны для владельца авто'
      };
    }
    
    if (input.type === 'car-wash' && !input.carWashDetails) {
      return {
        success: false,
        error: 'Данные об автомойке обязательны для владельца автомойки'
      };
    }
    
    const newUser = {
      id: Date.now().toString(),
      phone: input.phone,
      type: input.type,
      isVerified: true,
      carDetails: input.carDetails,
      carWashDetails: input.carWashDetails
    };
    
    users.set(input.phone, newUser);
    
    return {
      success: true,
      user: newUser
    };
  });