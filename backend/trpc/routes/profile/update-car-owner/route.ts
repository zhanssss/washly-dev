import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

export const updateCarOwnerProcedure = publicProcedure
  .input(
    z.object({
      userId: z.string(),
      name: z.string().min(1).optional(),
      carDetails: z
        .object({
          ownerName: z.string(),
          licensePlate: z.string(),
          brand: z.string(),
          model: z.string(),
          bodyType: z.string(),
        })
        .partial()
        .optional(),
      phone: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    // In a real app, persist to DB. Here we just echo back the fields as updated.
    return {
      success: true as const,
      updated: {
        id: input.userId,
        name: input.name ?? undefined,
        carDetails: input.carDetails ?? undefined,
        phone: input.phone ?? undefined,
      },
    };
  });

export default updateCarOwnerProcedure;
