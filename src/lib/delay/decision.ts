import { buildDelayAlertKey } from './idempotency'
import type {
  DelayAlertDecision,
  DelayAlertLedger,
  DelayAlertRuntimeOptions,
  DelayAlertSettings,
  DelayAlertSourceOrder,
  DelayAlertStatus,
} from './types'

const TERMINAL_STATUSES = new Set<DelayAlertStatus>(['delivered', 'cancelled'])

function toPositiveNumber(value: number | string | null | undefined): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function toIsoString(value: Date): string {
  return value.toISOString()
}

function addMs(date: Date, ms: number): Date {
  return new Date(date.getTime() + ms)
}

export function normalizeDelayMinutes(value: number | string | null | undefined): number {
  return toPositiveNumber(value)
}

export function shouldEvaluateDelayAlert(order: DelayAlertSourceOrder, settings: DelayAlertSettings): boolean {
  return settings.enabled && !TERMINAL_STATUSES.has(order.status)
}

export async function evaluateDelayAlert(
  order: DelayAlertSourceOrder,
  settings: DelayAlertSettings,
  ledger?: DelayAlertLedger,
  runtime: DelayAlertRuntimeOptions = {},
): Promise<DelayAlertDecision> {
  const now = runtime.now ?? new Date()
  const delayMinutes = normalizeDelayMinutes(order.delayMinutes)
  const thresholdMinutes = toPositiveNumber(settings.delayThresholdMinutes)
  const alertKey = buildDelayAlertKey({
    companyId: order.companyId,
    storeId: order.storeId,
    orderId: order.orderId,
    deliveryType: order.deliveryType,
    thresholdMinutes,
  })

  if (!settings.enabled) {
    return {
      shouldSend: false,
      reason: 'disabled',
      alertKey,
      delayMinutes,
      thresholdMinutes,
      status: order.status,
      companyId: order.companyId,
      storeId: order.storeId,
      orderId: order.orderId,
      storeName: order.storeName,
      deliveryType: order.deliveryType,
      dedupeUntil: null,
    }
  }

  if (TERMINAL_STATUSES.has(order.status)) {
    ledger?.delete(alertKey)
    return {
      shouldSend: false,
      reason: 'terminal-status',
      alertKey,
      delayMinutes,
      thresholdMinutes,
      status: order.status,
      companyId: order.companyId,
      storeId: order.storeId,
      orderId: order.orderId,
      storeName: order.storeName,
      deliveryType: order.deliveryType,
      dedupeUntil: null,
    }
  }

  if (thresholdMinutes <= 0 || delayMinutes <= 0) {
    return {
      shouldSend: false,
      reason: 'missing-delay',
      alertKey,
      delayMinutes,
      thresholdMinutes,
      status: order.status,
      companyId: order.companyId,
      storeId: order.storeId,
      orderId: order.orderId,
      storeName: order.storeName,
      deliveryType: order.deliveryType,
      dedupeUntil: null,
    }
  }

  if (delayMinutes < thresholdMinutes) {
    return {
      shouldSend: false,
      reason: 'below-threshold',
      alertKey,
      delayMinutes,
      thresholdMinutes,
      status: order.status,
      companyId: order.companyId,
      storeId: order.storeId,
      orderId: order.orderId,
      storeName: order.storeName,
      deliveryType: order.deliveryType,
      dedupeUntil: null,
    }
  }

  const existingRecord = ledger ? await ledger.get(alertKey) : null
  const dedupeWindowMs = runtime.repeatAfterMs ?? null

  if (existingRecord && !runtime.forceReemit) {
    if (!dedupeWindowMs) {
      return {
        shouldSend: false,
        reason: 'deduped',
        alertKey,
        delayMinutes,
        thresholdMinutes,
        status: order.status,
        companyId: order.companyId,
        storeId: order.storeId,
        orderId: order.orderId,
        storeName: order.storeName,
        deliveryType: order.deliveryType,
        dedupeUntil: existingRecord.emittedAt,
      }
    }

    const dedupeUntil = addMs(new Date(existingRecord.emittedAt), dedupeWindowMs)
    if (now.getTime() < dedupeUntil.getTime()) {
      return {
        shouldSend: false,
        reason: 'deduped',
        alertKey,
        delayMinutes,
        thresholdMinutes,
        status: order.status,
        companyId: order.companyId,
        storeId: order.storeId,
        orderId: order.orderId,
        storeName: order.storeName,
        deliveryType: order.deliveryType,
        dedupeUntil: toIsoString(dedupeUntil),
      }
    }
  }

  return {
    shouldSend: true,
    reason: 'send',
    alertKey,
    delayMinutes,
    thresholdMinutes,
    status: order.status,
    companyId: order.companyId,
    storeId: order.storeId,
    orderId: order.orderId,
    storeName: order.storeName,
    deliveryType: order.deliveryType,
    dedupeUntil: null,
  }
}

export async function registerDelayAlertEmission(
  decision: DelayAlertDecision,
  ledger?: DelayAlertLedger,
  now: Date = new Date(),
): Promise<void> {
  if (!decision.shouldSend || !ledger) return

  await ledger.set({
    key: decision.alertKey,
    emittedAt: now.toISOString(),
    delayMinutes: decision.delayMinutes,
    thresholdMinutes: decision.thresholdMinutes,
  })
}

export async function clearDelayAlertEmission(
  decision: Pick<DelayAlertDecision, 'alertKey'>,
  ledger?: DelayAlertLedger,
): Promise<void> {
  if (!ledger) return

  await ledger.delete(decision.alertKey)
}
