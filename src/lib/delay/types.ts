export type DeliveryType = 'EXPRESS' | 'MARKET' | 'HYPER' | (string & {})

export type DelayAlertStatus = 'new' | 'accepted' | 'prepared' | 'delivered' | 'cancelled' | (string & {})

export interface DelayAlertSourceOrder {
  companyId: string
  orderId: string
  storeId: string
  storeName: string
  deliveryType: DeliveryType
  status: DelayAlertStatus
  delayMinutes?: number | null
  createdAt?: string | Date | null
  updatedAt?: string | Date | null
}

export interface DelayAlertSettings {
  delayThresholdMinutes: number
  telegramAdminChatId: string
  enabled: boolean
}

export interface DelayAlertRuntimeOptions {
  now?: Date
  forceReemit?: boolean
  repeatAfterMs?: number
}

export interface DelayAlertDecision {
  shouldSend: boolean
  reason:
    | 'disabled'
    | 'missing-delay'
    | 'below-threshold'
    | 'terminal-status'
    | 'deduped'
    | 'send'
  alertKey: string
  delayMinutes: number
  thresholdMinutes: number
  status: DelayAlertStatus
  companyId: string
  storeId: string
  orderId: string
  storeName: string
  deliveryType: DeliveryType
  dedupeUntil?: string | null
}

export interface DelayAlertTelegramPayload {
  chat_id: string
  text: string
  parse_mode: 'HTML'
  disable_web_page_preview: true
}

export interface DelayAlertRecord {
  key: string
  emittedAt: string
  delayMinutes: number
  thresholdMinutes: number
}

export interface DelayAlertLedger {
  get(key: string): DelayAlertRecord | null | Promise<DelayAlertRecord | null>
  set(record: DelayAlertRecord): void | Promise<void>
  delete(key: string): void | Promise<void>
}

