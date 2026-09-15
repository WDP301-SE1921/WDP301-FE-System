export const DEBOUNCE = {
  SEARCH: 300,
  FILTER: 300,
} as const

export const TOAST_DURATION = {
  SUCCESS: 3000,
  INFO: 3000,
  WARNING: 5000,
  ERROR: Infinity,
} as const

export const PAGINATION_DEFAULTS = {
  PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const
