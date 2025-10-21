//backend/trpc/app-router.ts
import {createTRPCRouter} from "./create-context";
import hiRoute from "./routes/example/hi/route";
import {checkPhoneProcedure} from "./routes/auth/check-phone/route";
import {sendCodeProcedure} from "./routes/auth/send-code/route";
import {verifyCodeProcedure} from "./routes/auth/verify-code/route";
import {registerUserProcedure} from "./routes/auth/register-user/route";
import {loginProcedure} from "./routes/auth/login/route";
import {updateCarOwnerProcedure} from "./routes/profile/update-car-owner/route";
import {updateCarWashProcedure} from "./routes/profile/update-car-wash/route";
import {uploadPhotoProcedure} from "./routes/profile/upload-photo/route";
import {
    createTestAccountsProcedure,
    getCarWashOwnerProcedure,
    getAllTestUsersProcedure
} from "./routes/auth/create-test-accounts/route";
import {
    getAvailableSlotsProcedure,
    createBookingProcedure,
    getUserBookingsProcedure,
    getCarWashBookingsProcedure,
    confirmBookingProcedure
} from "./routes/booking/create-booking/route";
export const appRouter = createTRPCRouter({
    example: createTRPCRouter({
        hi: hiRoute,
    }),
    auth: createTRPCRouter({
        checkPhone: checkPhoneProcedure,
        sendCode: sendCodeProcedure,
        verifyCode: verifyCodeProcedure,
        registerUser: registerUserProcedure,
        login: loginProcedure,
        createTestAccounts: createTestAccountsProcedure,
        getCarWashOwner: getCarWashOwnerProcedure,
        getAllTestUsers: getAllTestUsersProcedure,
    }),
    profile: createTRPCRouter({
        updateCarOwner: updateCarOwnerProcedure,
        updateCarWash: updateCarWashProcedure,
        uploadPhoto: uploadPhotoProcedure,
    }),
    booking: createTRPCRouter({
        getAvailableSlots: getAvailableSlotsProcedure,
        createBooking: createBookingProcedure,
        getUserBookings: getUserBookingsProcedure,
        getCarWashBookings: getCarWashBookingsProcedure,
        confirmBooking: confirmBookingProcedure, // ← добавили
    }),
});

export type AppRouter = typeof appRouter;