export type DeliveryType = 'EXPRESS' | 'MARKET' | 'HYPER'
export type WorkflowReminderStage = 'waiting_acceptance' | 'preparation_overdue' | 'delivery_alert'

export type OrderStatus = 'new' | 'accepted' | 'prepared' | 'delivered' | string

export type TelegramChatId = string | number

export interface TelegramMessageBase {
  storeName: string
  deliveryType: DeliveryType
  orderId: string | number
}

export interface NewOrderMessageInput extends TelegramMessageBase {
  status: OrderStatus
  customerName?: string
  amountMad?: number | string | null
}

export interface StatusChangeMessageInput extends TelegramMessageBase {
  previousStatus: OrderStatus
  nextStatus: OrderStatus
}

export interface ReminderMessageInput extends TelegramMessageBase {
  status: OrderStatus
  reminderCount?: number
  nextReminderInMinutes?: number
}

export interface WorkflowReminderMessageInput extends TelegramMessageBase {
  stage: WorkflowReminderStage
  reminderCount?: number
  overdueMinutes?: number | null
  productCount?: number | null
  expectedPreparationMinutes?: number | null
}

export interface DelayAlertMessageInput extends TelegramMessageBase {
  delayMinutes: number
  thresholdMinutes: number
}

export interface TelegramSendTextInput {
  chatId: TelegramChatId
  text: string
  parseMode?: 'MarkdownV2' | 'HTML' | 'Markdown'
  disableWebPagePreview?: boolean
  disableNotification?: boolean
  replyToMessageId?: number
}

export interface TelegramBatchSendInput {
  chatIds: TelegramChatId[]
  text: string
  parseMode?: TelegramSendTextInput['parseMode']
  disableWebPagePreview?: boolean
  disableNotification?: boolean
  replyToMessageId?: number
}

export interface TelegramMessageResult {
  chatId: TelegramChatId
  ok: boolean
  statusCode: number
  messageId?: number
  description?: string
  error?: TelegramServiceErrorShape
}

export interface TelegramServiceErrorShape {
  code: string
  message: string
  statusCode?: number
  cause?: string
  retryable?: boolean
}

export interface TelegramBatchSendResult {
  ok: boolean
  sent: TelegramMessageResult[]
  failed: TelegramMessageResult[]
}

export interface TelegramClientConfig {
  botToken: string
  apiBaseUrl: string
  requestTimeoutMs: number
  retryAttempts: number
  retryDelayMs: number
}
