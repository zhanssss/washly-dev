import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

export const uploadPhotoProcedure = publicProcedure
  .input(
    z.object({
      userId: z.string(),
      photoUri: z.string().url().or(z.string().min(1)),
      type: z.enum(["car-owner", "car-wash"]).optional(),
    })
  )
  .mutation(async ({ input }) => {
    // Here we could upload to storage. For demo, echo back uri.
    return {
      success: true as const,
      photoUrl: input.photoUri,
    };
  });

export default uploadPhotoProcedure;
