import { z } from 'zod';

// Sanitizer for plain text inputs to prevent XSS
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '') // strip HTML brackets
    .trim();
}

// Regex matching Bangladeshi phone numbers or international E.164 formats
export const phoneRegex = /^(?:\+?880|0)?1[3-9]\d{8}$|^\+?[1-9]\d{6,14}$/;

export const appointmentBookingSchema = z.object({
  patientName: z
    .string()
    .min(2, 'নাম কমপক্ষে ২ অক্ষরের হতে হবে।')
    .max(80, 'নাম সর্বোচ্চ ৮০ অক্ষরের হতে পারে।')
    .transform(sanitizeInput),
  phone: z
    .string()
    .regex(phoneRegex, 'সঠিক বাংলাদেশী (যেমন: 017XXXXXXXX) বা আন্তর্জাতিক ফোন নম্বর দিন।')
    .transform(sanitizeInput),
  email: z
    .string()
    .min(1, 'সঠিক ইমেইল ঠিকানা আবশ্যক, যাতে আমরা কনফার্মেশন ও সময়সূচী পাঠাতে পারি।')
    .email('সঠিক ইমেইল ঠিকানা দিন (যেমন: patient@example.com)')
    .transform((val) => sanitizeInput(val).toLowerCase()),
  chamberMode: z.enum(['offline', 'online']),
  appointmentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'সঠিক তারিখ ফরম্যাট (YYYY-MM-DD) নির্বাচন করুন।'),
  slotId: z
    .string()
    .regex(/^slot_\d+_\d+$/, 'সঠিক স্লট নির্বাচন করুন।'),
  complaints: z
    .string()
    .max(1000, 'সমস্যার বিবরণ সর্বোচ্চ ১,০০০ অক্ষরের হতে পারে।')
    .optional()
    .transform((val) => sanitizeInput(val || ''))
});

export type AppointmentBookingInput = z.infer<typeof appointmentBookingSchema>;

export const adminLoginSchema = z.object({
  password: z
    .string()
    .min(1, 'অ্যাডমিন পাসওয়ার্ড আবশ্যক।')
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
