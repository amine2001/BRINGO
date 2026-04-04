import 'server-only'

import { z } from 'zod'
import type {
  TelegramBatchSendInput,
  TelegramBatchSendResult,
  TelegramClientConfig,
  TelegramMessageResult,
  TelegramSendTextInput,
  TelegramServiceErrorShape
} from './types'

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1, 'TELEGRAM_BOT_TOKEN is required'),
  TELEGRAM_API_BASE_URL: z.string().url().optional(),
  TELEGRAM_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().optional(),
  TELEGRAM_RETRY_ATTEMPTS: z.coerce.number().int().min(0).optional(),
  TELEGRAM_RETRY_DELAY_MS: z.coerce.number().int().positive().optional()
})

let cachedConfig: TelegramClientConfig | null = null

function getConfig(): TelegramClientConfig {
  if (cachedConfig) return cachedConfig

  const parsed = envSchema.parse(process.env)
  cachedConfig = {
    botToken: parsed.TELEGRAM_BOT_TOKEN,
    apiBaseUrl: parsed.TELEGRAM_API_BASE_URL ?? 'https://api.telegram.org',
    requestTimeoutMs: parsed.TELEGRAM_REQUEST_TIMEOUT_MS ?? 10_000,
    retryAttempts: parsed.TELEGRAM_RETRY_ATTEMPTS ?? 2,
    retryDelayMs: parsed.TELEGRAM_RETRY_DELAY_MS ?? 750
  }

  return cachedConfig
}

export class TelegramServiceError extends Error {
  code: string
  statusCode?: number
  retryable: boolean

  constructor(message: string, options: TelegramServiceErrorShape) {
    super(message)
    this.name = 'TelegramServiceError'
    this.code = options.code
    this.statusCode = options.statusCode
    this.retryable = options.retryable ?? false
    if (options.cause) {
      this.cause = new Error(options.cause)
    }
  }
}

export interface TelegramClient {
  config: TelegramClientConfig
  sendText(input: TelegramSendTextInput): Promise<TelegramMessageResult>
  sendTextToMany(input: TelegramBatchSendInput): Promise<TelegramBatchSendResult>
}

let client: TelegramClient | null = null

function toTelegramServiceError(
  error: unknown,
  fallback: Pick<TelegramServiceErrorShape, 'code' | 'message'>
): TelegramServiceError {
  if (error instanceof TelegramServiceError) return error

  const message = error instanceof Error ? error.message : fallback.message
  return new TelegramServiceError(message, {
    code: fallback.code,
    message,
    cause: error instanceof Error ? error.name : String(error),
    retryable: true
  })
}

function isRetryableStatus(statusCode: number) {
  return statusCode === 408 || statusCode === 425 || statusCode === 429 || statusCode >= 500
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, signal?: AbortSignal) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(new Error('Request timed out')), timeoutMs)

  if (signal) {
    if (signal.aborted) controller.abort(signal.reason)
    else signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true })
  }

  try {
    return await promiseWithSignal(promise, controller.signal)
  } finally {
    clearTimeout(timeout)
  }
}

async function promiseWithSignal<T>(promise: Promise<T>, signal: AbortSignal) {
  if (signal.aborted) {
    throw signal.reason ?? new Error('Request aborted')
  }

  return await new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(signal.reason ?? new Error('Request aborted'))
    signal.addEventListener('abort', onAbort, { once: true })

    promise
      .then((value) => {
        signal.removeEventListener('abort', onAbort)
        resolve(value)
      })
      .catch((error) => {
        signal.removeEventListener('abort', onAbort)
        reject(error)
      })
  })
}

async function postTelegramMessage(
  config: TelegramClientConfig,
  input: TelegramSendTextInput
): Promise<TelegramMessageResult> {
  const url = `${config.apiBaseUrl}/bot${config.botToken}/sendMessage`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(config.requestTimeoutMs),
    body: JSON.stringify({
      chat_id: input.chatId,
      text: input.text,
      parse_mode: input.parseMode,
      disable_web_page_preview: input.disableWebPagePreview ?? true,
      disable_notification: input.disableNotification ?? false,
      reply_to_message_id: input.replyToMessageId
    })
  })

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  const telegramOk = Boolean((payload as { ok?: boolean } | null)?.ok)
  const result = (payload as { result?: { message_id?: number }; description?: string } | null)?.result
  const description = (payload as { description?: string } | null)?.description

  if (!response.ok || !telegramOk) {
    const error = new TelegramServiceError(description ?? 'Telegram API request failed', {
      code: 'telegram_api_error',
      message: description ?? 'Telegram API request failed',
      statusCode: response.status,
      retryable: isRetryableStatus(response.status)
    })

    return {
      chatId: input.chatId,
      ok: false,
      statusCode: response.status,
      description,
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        retryable: error.retryable
      }
    }
  }

  return {
    chatId: input.chatId,
    ok: true,
    statusCode: response.status,
    messageId: result?.message_id,
    description
  }
}

async function sendWithRetry(
  config: TelegramClientConfig,
  input: TelegramSendTextInput
): Promise<TelegramMessageResult> {
  let lastError: TelegramServiceError | null = null

  for (let attempt = 0; attempt <= config.retryAttempts; attempt += 1) {
    try {
      const result = await withTimeout(postTelegramMessage(config, input), config.requestTimeoutMs)
      if (result.ok) return result

      lastError = new TelegramServiceError(result.description ?? 'Telegram API request failed', {
        code: result.error?.code ?? 'telegram_api_error',
        message: result.description ?? 'Telegram API request failed',
        statusCode: result.statusCode,
        retryable: result.error?.retryable ?? false
      })

      if (!lastError.retryable || attempt >= config.retryAttempts) {
        return result
      }
    } catch (error) {
      lastError = toTelegramServiceError(error, {
        code: 'telegram_request_failed',
        message: 'Telegram request failed'
      })

      if (!lastError.retryable || attempt >= config.retryAttempts) {
        return {
          chatId: input.chatId,
          ok: false,
          statusCode: lastError.statusCode ?? 0,
          error: {
            code: lastError.code,
            message: lastError.message,
            statusCode: lastError.statusCode,
            cause: lastError.cause instanceof Error ? lastError.cause.message : undefined,
            retryable: lastError.retryable
          }
        }
      }
    }

    await sleep(config.retryDelayMs * (attempt + 1))
  }

  return {
    chatId: input.chatId,
    ok: false,
    statusCode: lastError?.statusCode ?? 0,
    error: {
      code: lastError?.code ?? 'telegram_request_failed',
      message: lastError?.message ?? 'Telegram request failed',
      statusCode: lastError?.statusCode,
      cause: lastError?.cause instanceof Error ? lastError.cause.message : undefined,
      retryable: lastError?.retryable ?? false
    }
  }
}

export function getTelegramClient(): TelegramClient {
  if (client) return client

  const config = getConfig()
  client = {
    config,
    async sendText(input) {
      return await sendWithRetry(config, input)
    },
    async sendTextToMany(input) {
      const normalizedChatIds = Array.from(
        new Set(input.chatIds.filter((chatId) => chatId !== null && chatId !== undefined).map(String))
      )

      const settled = await Promise.all(
        normalizedChatIds.map(async (chatId) => {
          const result = await sendWithRetry(config, {
            chatId,
            text: input.text,
            parseMode: input.parseMode,
            disableWebPagePreview: input.disableWebPagePreview,
            disableNotification: input.disableNotification,
            replyToMessageId: input.replyToMessageId
          })

          return result
        })
      )

      const sent = settled.filter((item) => item.ok)
      const failed = settled.filter((item) => !item.ok)

      return {
        ok: failed.length === 0,
        sent,
        failed
      }
    }
  }

  return client
}

export async function sendTelegramText(input: TelegramSendTextInput) {
  return await getTelegramClient().sendText(input)
}

export async function sendTelegramTextToMany(input: TelegramBatchSendInput) {
  return await getTelegramClient().sendTextToMany(input)
}

