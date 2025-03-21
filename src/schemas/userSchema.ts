import {z} from "npm:zod";

export const userRegistrationSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3).max(148),
    password: z.string().min(8),
    firstName: z.string().regex(/^[a-zA-Z]+$/).optional(),
    lastName: z.string().regex(/^[a-zA-Z]+$/).optional(),
});

export const userActivationSchema = z.object({
    email: z.string().email(),
    code: z.string().length(6),
});