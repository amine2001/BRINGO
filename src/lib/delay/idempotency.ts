import type { DelayAlertLedger, DelayAlertRecord } from './types'

export interface DelayAlertKeyInput {
  companyId: string
  storeId: string
  orderId: string
  deliveryType: string
  thresholdMinutes: number
}

export function buildDelayAlertKey(input: DelayAlertKeyInput): string {
  return [
    'delay-alert',
    input.companyId.trim(),
    input.storeId.trim(),
    input.orderId.trim(),
    input.deliveryType.trim().toUpperCase(),
    String(Math.trunc(input.thresholdMinutes)),
  ].join(':')
}

export class InMemoryDelayAlertLedger implements DelayAlertLedger {
  private readonly records = new Map<string, DelayAlertRecord>()

  get(key: string): DelayAlertRecord | null {
    return this.records.get(key) ?? null
  }

  set(record: DelayAlertRecord): void {
    this.records.set(record.key, record)
  }

  delete(key: string): void {
    this.records.delete(key)
  }
}

