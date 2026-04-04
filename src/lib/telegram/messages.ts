import type {
  DelayAlertMessageInput,
  NewOrderMessageInput,
  ReminderMessageInput,
  StatusChangeMessageInput,
  WorkflowReminderMessageInput,
} from './types'

function normalizeText(value: string | number | undefined | null) {
  return String(value ?? '-').trim() || '-'
}

function formatHeader(title: string) {
  return `${title}\n`
}

function formatOrderContext(input: {
  storeName: string
  deliveryType: string
  orderId: string | number
  statusLine: string
}) {
  return [
    `Store: ${normalizeText(input.storeName)}`,
    `Delivery Type: ${normalizeText(input.deliveryType)}`,
    `Order ID: ${normalizeText(input.orderId)}`,
    input.statusLine
  ].join('\n')
}

export function formatNewOrderMessage(input: NewOrderMessageInput) {
  const amountText = normalizeText(input.amountMad)
  const customerText = normalizeText(input.customerName)

  return [
    '🚨 NOUVELLE COMMANDE',
    `🏪 Magasin: ${normalizeText(input.storeName)}`,
    `🆔 Commande: ${normalizeText(input.orderId)}`,
    `👤 Client: ${customerText}`,
    `💰 Valeur: ${amountText} MAD`
  ].join('\n')
}

export function formatStatusChangeMessage(input: StatusChangeMessageInput) {
  return (
    formatHeader('STATUS UPDATE') +
    formatOrderContext({
      storeName: input.storeName,
      deliveryType: input.deliveryType,
      orderId: input.orderId,
      statusLine: `Status: ${normalizeText(input.previousStatus).toUpperCase()} -> ${normalizeText(input.nextStatus).toUpperCase()}`
    })
  )
}

export function formatRepeatedReminderMessage(input: ReminderMessageInput) {
  const reminderCount = Number.isFinite(input.reminderCount)
    ? input.reminderCount
    : 1
  const nextReminderInMinutes = Number.isFinite(input.nextReminderInMinutes)
    ? input.nextReminderInMinutes
    : undefined

  return [
    formatHeader('ORDER REMINDER').trimEnd(),
    formatOrderContext({
      storeName: input.storeName,
      deliveryType: input.deliveryType,
      orderId: input.orderId,
      statusLine: `Status: ${normalizeText(input.status).toUpperCase()}`
    }),
    `Reminder Count: ${reminderCount}`,
    nextReminderInMinutes === undefined ? null : `Next Reminder In: ${nextReminderInMinutes} min`
  ]
    .filter(Boolean)
    .join('\n')
}

export function formatWorkflowReminderMessage(input: WorkflowReminderMessageInput) {
  if (
    input.stage === 'waiting_acceptance' ||
    input.stage === 'preparation_overdue'
  ) {
    const skuCount = Number.isFinite(input.productCount)
      ? Math.max(0, Math.trunc(Number(input.productCount)))
      : '-'

    return [
      '⏰ RETARD COMMANDE',
      `🏪 Magasin: ${normalizeText(input.storeName)}`,
      `🆔 Commande: ${normalizeText(input.orderId)}`,
      `⏰ Retard: +${Math.max(0, Number(input.overdueMinutes ?? 0))} min`,
      `🧺 SKUs: ${skuCount}`
    ].join('\n')
  }

  return [
    '🚚 RETARD LIVRAISON',
    `🏪 Magasin: ${normalizeText(input.storeName)}`,
    `🆔 Commande: ${normalizeText(input.orderId)}`,
    `⏰ Retard: +${Math.max(0, Number(input.overdueMinutes ?? 0))} min`
  ]
    .join('\n')
}

export function formatDelayAlertMessage(input: DelayAlertMessageInput) {
  return [
    formatHeader('DELAY ALERT').trimEnd(),
    formatOrderContext({
      storeName: input.storeName,
      deliveryType: input.deliveryType,
      orderId: input.orderId,
      statusLine: `Delay: ${Math.max(0, input.delayMinutes)} min`
    }),
    `Threshold: ${Math.max(0, input.thresholdMinutes)} min`
  ].join('\n')
}
