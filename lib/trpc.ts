//lib/trpc.ts
import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
    if (process.env.EXPO_PUBLIC_API_BASE_URL) {
        return process.env.EXPO_PUBLIC_API_BASE_URL;
    }
    throw new Error("No base url found, please set EXPO_PUBLIC_API_BASE_URL");
};

import { httpBatchLink } from "@trpc/client";

export const trpcClient = trpc.createClient({
    links: [
        httpBatchLink({
            url: `${getBaseUrl()}/api/trpc`,
            transformer: superjson,
        }),
    ],
});
