import { z } from 'zod';
import { publicProcedure } from '../../create-context.js';
import { verificationCodes } from '../send-code/route';

export const verifyCodeProcedure = publicProcedure
  .input(z.object({
    phone: z.string().min(1, 'Номер телефона обязателен'),
    code: z.string().min(4, 'Код должен содержать 4 цифры')
  }))
  .mutation(({ input }) => {
    const storedData = verificationCodes.get(input.phone);
    
    if (!storedData) {
      return {
        success: false,
        error: 'Код не найден. Запросите новый код.'
      };
    }
    
    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(input.phone);
      return {
        success: false,
        error: 'Код истек. Запросите новый код.'
      };
    }
    
    if (storedData.code !== input.code) {
      return {
        success: false,
        error: 'Неверный код'
      };
    }
    
    // Код верный, удаляем его
    verificationCodes.delete(input.phone);
    
    return {
      success: true,
      userType: storedData.userType
    };
  });