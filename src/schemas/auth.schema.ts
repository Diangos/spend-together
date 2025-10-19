import {z} from "npm:zod@3.24.2";

export const loginSchema = z.object({
    username: z.string().min(3).max(148),
    password: z.string().min(8),
});