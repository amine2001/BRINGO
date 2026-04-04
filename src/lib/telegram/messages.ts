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
  return (
    formatHeader('NEW ORDER') +
    formatOrderContext({
      storeName: input.storeName,
      deliveryType: input.deliveryType,
      orderId: input.orderId,
      statusLine: `Status: ${normalizeText(input.status).toUpperCase()}`
    })
  )
}

function formatOptionalCount(label: string, value: number | null | undefined) {
  return Number.isFinite(value) ? `${label}: ${value}` : null
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
  const reminderCount = Number.isFinite(input.reminderCount) ? input.reminderCount : 1
  const productCount = formatOptionalCount('Products', input.productCount)
  const overdueMinutes = formatOptionalCount('Overdue', input.overdueMinutes)
  const expectedPreparationMinutes = formatOptionalCount(
    'Expected Prep Time',
    input.expectedPreparationMinutes
  )

  const title =
    input.stage === 'waiting_acceptance'
      ? 'ORDER NOT ACCEPTED'
      : input.stage === 'preparation_overdue'
        ? 'PREPARATION DELAY'
        : 'DELIVERY ALERT'

  return [
    formatHeader(title).trimEnd(),
    formatOrderContext({
      storeName: input.storeName,
      deliveryType: input.deliveryType,
      orderId: input.orderId,
      statusLine:
        input.stage === 'waiting_acceptance'
          ? 'Status: WAITING ACCEPTANCE'
          : input.stage === 'preparation_overdue'
            ? 'Status: PREPARATION OVERDUE'
            : 'Status: DELIVERY ALERT'
    }),
    productCount,
    expectedPreparationMinutes,
    overdueMinutes,
    `Reminder Count: ${reminderCount}`
  ]
    .filter(Boolean)
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
