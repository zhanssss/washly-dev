import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

export const updateCarWashProcedure = publicProcedure
  .input(
    z.object({
      userId: z.string(),
      name: z.string().min(1).optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      washBays: z.number().int().positive().optional(),
      workingHours: z
        .object({ start: z.string(), end: z.string(), is24Hours: z.boolean() })
        .optional(),
    })
  )
  .mutation(async ({ input }) => {
    return {
      success: true as const,
      updated: { ...input },
    };
  });

export default updateCarWashProcedure;
