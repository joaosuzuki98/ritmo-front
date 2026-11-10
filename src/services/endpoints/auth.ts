import { z } from 'zod'

import { API_BASE_URL } from '../../constants/api'
import { createApi } from '../api'

const authApi = createApi({ baseUrl: API_BASE_URL })

const authUserSchema = z.object({
    id: z.string(),
    name: z.string(),
    mascotName: z.string().nullable(),
    email: z.string().email(),
    totalPoints: z.number(),
    level: z.number(),
    createdAt: z.number(),
    updatedAt: z.number(),
})

export const authResponseSchema = z.object({
    user: authUserSchema,
    accessToken: z.string(),
    refreshToken: z.string(),
    accessTokenExpiresAt: z.number(),
    refreshTokenIdleExpiresAt: z.number(),
})

const messageResponseSchema = z.object({ message: z.string() })

export type AuthUserResponse = z.infer<typeof authUserSchema>
export type AuthResponse = z.infer<typeof authResponseSchema>

export const authEndpoints = {
    register: async (input: {
        name: string
        mascotName: string
        email: string
        password: string
    }) =>
        authResponseSchema.parse(
            (await authApi.post('/auth/register', input)).data,
        ),
    login: async (input: { email: string; password: string }) =>
        authResponseSchema.parse(
            (await authApi.post('/auth/login', input)).data,
        ),
    refresh: async (refreshToken: string) =>
        authResponseSchema.parse(
            (await authApi.post('/auth/refresh', { refreshToken })).data,
        ),
    logout: async (refreshToken: string) =>
        authApi.post('/auth/logout', { refreshToken }),
    requestPasswordReset: async (email: string) =>
        messageResponseSchema.parse(
            (await authApi.post('/auth/password-reset/request', { email }))
                .data,
        ),
    completePasswordReset: async (input: {
        email: string
        code: string
        password: string
    }) =>
        messageResponseSchema.parse(
            (await authApi.post('/auth/password-reset/complete', input)).data,
        ),
}
