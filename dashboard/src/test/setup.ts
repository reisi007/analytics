import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon !== 'function') {
  Object.defineProperty(navigator, 'sendBeacon', {
    value: vi.fn(() => true),
    configurable: true,
  })
}
