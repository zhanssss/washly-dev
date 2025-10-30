// src/payments/freedompay.ts
import axios from "axios";

export async function startPayment(orderId: string, amount: number) {
    const { data } = await axios.post("/api/payments/create", { orderId, amount });
    window.location.href = data.redirectUrl;
}
