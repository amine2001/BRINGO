import type { DelayAlertDecision, DelayAlertTelegramPayload } from './types'

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function buildAdminDelayAlertMessage(decision: DelayAlertDecision): string {
  return [
    '⚠️ <b>DELAY ALERT</b>',
    `Store: ${escapeHtml(decision.storeName)}`,
    `Order: ${escapeHtml(decision.orderId)}`,
    `Delivery Type: ${escapeHtml(decision.deliveryType)}`,
    `Delay: ${decision.delayMinutes} min`,
    `Threshold: ${decision.thresholdMinutes} min`,
  ].join('\n')
}

export function buildAdminDelayAlertTelegramPayload(
  decision: DelayAlertDecision,
  telegramAdminChatId: string,
): DelayAlertTelegramPayload {
  return {
    chat_id: telegramAdminChatId,
    text: buildAdminDelayAlertMessage(decision),
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  }
}

