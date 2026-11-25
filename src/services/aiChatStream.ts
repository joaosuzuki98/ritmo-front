import { AiChatError } from './aiChatError'

type StreamOptions = {
    url: string
    token: string
    body: unknown
    signal?: AbortSignal
}

export const requestAiChatStream = ({
    url,
    token,
    body,
    signal,
}: StreamOptions): Promise<unknown> =>
    new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        let buffer = ''
        let offset = 0
        let hasResult = false
        let result: unknown
        let settled = false

        const finish = (error?: AiChatError) => {
            if (settled) return
            settled = true
            signal?.removeEventListener('abort', abort)
            if (error) reject(error)
            else resolve(result)
        }
        const abort = () => {
            xhr.abort()
            finish(new AiChatError({ stage: 'http' }))
        }
        const consume = () => {
            buffer += xhr.responseText.slice(offset)
            offset = xhr.responseText.length
            if (buffer.length > 1_000_000)
                throw new AiChatError({ stage: 'response' })

            let boundary = /\r?\n\r?\n/.exec(buffer)
            while (boundary?.index !== undefined) {
                const frame = buffer.slice(0, boundary.index)
                buffer = buffer.slice(boundary.index + boundary[0].length)
                let event = 'message'
                const data: string[] = []
                frame.split(/\r?\n/).forEach(line => {
                    if (line.startsWith('event:'))
                        event = line.slice(6).trimStart()
                    if (line.startsWith('data:'))
                        data.push(line.slice(5).replace(/^ /, ''))
                })
                if (event === 'error') throw new AiChatError({ stage: 'http' })
                if (event === 'result') {
                    if (hasResult) throw new AiChatError({ stage: 'response' })
                    try {
                        result = JSON.parse(data.join('\n'))
                    } catch {
                        throw new AiChatError({ stage: 'response' })
                    }
                    hasResult = true
                }
                boundary = /\r?\n\r?\n/.exec(buffer)
            }
        }

        if (signal?.aborted) {
            finish(new AiChatError({ stage: 'http' }))
            return
        }
        signal?.addEventListener('abort', abort, { once: true })
        xhr.open('POST', url)
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.setRequestHeader('Accept', 'text/event-stream')
        xhr.timeout = 210_000
        xhr.onprogress = () => {
            if (xhr.status !== 200) return
            try {
                consume()
            } catch (error) {
                finish(
                    error instanceof AiChatError
                        ? error
                        : new AiChatError({ stage: 'response' }),
                )
                xhr.abort()
            }
        }
        xhr.onload = () => {
            if (xhr.status !== 200) {
                finish(new AiChatError({ stage: 'http', status: xhr.status }))
                return
            }
            if (
                !xhr
                    .getResponseHeader('Content-Type')
                    ?.toLowerCase()
                    .startsWith('text/event-stream')
            ) {
                finish(new AiChatError({ stage: 'response' }))
                return
            }
            try {
                consume()
                if (!hasResult) throw new AiChatError({ stage: 'response' })
                finish()
            } catch (error) {
                finish(
                    error instanceof AiChatError
                        ? error
                        : new AiChatError({ stage: 'response' }),
                )
            }
        }
        xhr.onerror = () => finish(new AiChatError({ stage: 'http' }))
        xhr.ontimeout = () => finish(new AiChatError({ stage: 'http' }))
        xhr.onabort = () => finish(new AiChatError({ stage: 'http' }))
        xhr.send(JSON.stringify(body))
    })
