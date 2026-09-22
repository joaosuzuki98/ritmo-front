import axios from 'axios'

export type ApiOptions = {
    baseUrl: string
}

export const createApi = ({ baseUrl }: ApiOptions) =>
    axios.create({
        baseURL: baseUrl,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
    })
