import { z } from 'zod';
import { publicProcedure } from '../../create-context.js';
import { users } from '../check-phone/route';

export const loginProcedure = publicProcedure
  .input(z.object({
    phone: z.string().min(1, 'Номер телефона обязателен')
  }))
  .query(({ input }) => {
    const user = users.get(input.phone);
    
    if (!user) {
      return {
        success: false,
        error: 'Пользователь не найден'
      };
    }
    
    return {
      success: true,
      user
    };
  });