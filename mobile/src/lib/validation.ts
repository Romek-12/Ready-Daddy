import { z } from 'zod';

export const emailSchema = z
  .string()
  .min(1, 'Podaj adres email')
  .email('Podaj prawidłowy adres email');

export const passwordSchema = z
  .string()
  .min(6, 'Hasło musi mieć co najmniej 6 znaków')
  .max(128, 'Hasło jest zbyt długie (max 128 znaków)');

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  conceptionDate: z.string().min(1, 'Podaj datę poczęcia'),
  partnerName: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Podaj kod resetowania'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Potwierdź hasło'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Hasła muszą być identyczne',
  path: ['confirmPassword'],
});

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
