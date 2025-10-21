import { z } from 'zod';
import { publicProcedure } from '../../create-context.js';

// Временное хранилище кодов верификации
const verificationCodes = new Map<string, {
  code: string;
  expiresAt: number;
  userType?: 'car-owner' | 'car-wash';
}>();

export const sendCodeProcedure = publicProcedure
  .input(z.object({
    phone: z.string().min(1, 'Номер телефона обязателен'),
    userType: z.enum(['car-owner', 'car-wash']).optional()
  }))
  .mutation(({ input }) => {
    // Генерируем 4-значный код
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Сохраняем код с временем истечения (5 минут)
    verificationCodes.set(input.phone, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 минут
      userType: input.userType
    });
    
    console.log(`Verification code for ${input.phone}: ${code}`);
    
    return {
      success: true,
      message: 'Код отправлен на ваш номер телефона'
    };
  });

// Экспортируем также для использования в других процедурах
export { verificationCodes };