import { z } from 'zod';

export const tripStatusSchema = z.enum(['draft', 'upcoming', 'ongoing', 'past', 'archived']);
export type TripStatus = z.infer<typeof tripStatusSchema>;

export const tripSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().nullable(),
  status: tripStatusSchema,
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  defaultCurrency: z.string().length(3),
  coverImageUrl: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});
export type Trip = z.infer<typeof tripSchema>;

export const newTripInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  defaultCurrency: z.string().length(3).default('EUR'),
});
export type NewTripInput = z.infer<typeof newTripInputSchema>;

export const tripParticipantSchema = z.object({
  id: z.string(),
  tripId: z.string(),
  displayName: z.string().min(1),
  createdAt: z.string(),
});
export type TripParticipant = z.infer<typeof tripParticipantSchema>;
