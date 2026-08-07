import type { PiniaColadaOptions } from '@pinia/colada'

// Without ssrCatchError, a query that legitimately errors (e.g. a 404 for
// "no tailored resume generated yet") rejects unhandled inside Vue's
// onServerPrefetch during SSR, which crashes the whole page render instead
// of letting the component show its own error/empty state.
export default {
  queryOptions: {
    ssrCatchError: true
  }
} satisfies PiniaColadaOptions
