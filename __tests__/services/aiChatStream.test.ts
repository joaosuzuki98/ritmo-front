import { requestAiChatStream } from '../../src/services/aiChatStream'

class MockRequest {
    static current: MockRequest
    status = 200
    responseText = ''
    timeout = 0
    onprogress?: () => void
    onload?: () => void
    onerror?: () => void
    ontimeout?: () => void
    onabort?: () => void
    open = jest.fn()
    setRequestHeader = jest.fn()
    getResponseHeader = jest.fn(() => 'text/event-stream; charset=utf-8')
    send = jest.fn()
    abort = jest.fn(() => this.onabort?.())

    constructor() {
        MockRequest.current = this
    }

    append = (chunk: string) => {
        this.responseText += chunk
        this.onprogress?.()
    }
}

describe('requestAiChatStream', () => {
    const originalRequest = globalThis.XMLHttpRequest
    const options = {
        url: 'https://example.test/api/v1/ai/chat/stream',
        token: 'secret',
        body: { message: 'Olá' },
    }

    beforeEach(() => {
        globalThis.XMLHttpRequest =
            MockRequest as unknown as typeof XMLHttpRequest
    })

    afterEach(() => {
        globalThis.XMLHttpRequest = originalRequest
    })

    it('parses split SSE frames and sends the bearer token in a header', async () => {
        const pending = requestAiChatStream(options)
        const xhr = MockRequest.current
        xhr.append('event: status\r\ndata: {"status":"started"}\r\n\r')
        xhr.append('\n: keep-alive\n\nevent: result\ndata: {"reply":"Ol')
        xhr.append('á","proposal":null}\n\n')
        xhr.onload?.()

        await expect(pending).resolves.toEqual({
            reply: 'Olá',
            proposal: null,
        })
        expect(xhr.open).toHaveBeenCalledWith('POST', options.url)
        expect(xhr.setRequestHeader).toHaveBeenCalledWith(
            'Authorization',
            'Bearer secret',
        )
        expect(xhr.send).toHaveBeenCalledWith('{"message":"Olá"}')
    })

    it('rejects streams with an error event or an incomplete result', async () => {
        const failed = requestAiChatStream(options)
        MockRequest.current.append(
            'event: error\ndata: {"message":"server error"}\n\n',
        )
        await expect(failed).rejects.toMatchObject({
            details: { stage: 'http' },
        })

        const incomplete = requestAiChatStream(options)
        MockRequest.current.append('event: result\ndata: {"reply":"unfinished"')
        MockRequest.current.onload?.()
        await expect(incomplete).rejects.toMatchObject({
            details: { stage: 'response' },
        })
    })

    it('reports HTTP failures and rejects non-SSE responses', async () => {
        const unauthorized = requestAiChatStream(options)
        MockRequest.current.status = 401
        MockRequest.current.onload?.()
        await expect(unauthorized).rejects.toMatchObject({
            details: { stage: 'http', status: 401 },
        })

        const wrongType = requestAiChatStream(options)
        MockRequest.current.getResponseHeader.mockReturnValue(
            'application/json',
        )
        MockRequest.current.onload?.()
        await expect(wrongType).rejects.toMatchObject({
            details: { stage: 'response' },
        })
    })

    it('aborts the request when the caller disconnects', async () => {
        const controller = new AbortController()
        const pending = requestAiChatStream({
            ...options,
            signal: controller.signal,
        })
        const xhr = MockRequest.current
        controller.abort()
        await expect(pending).rejects.toMatchObject({
            details: { stage: 'http' },
        })
        expect(xhr.abort).toHaveBeenCalledTimes(1)
    })
})
