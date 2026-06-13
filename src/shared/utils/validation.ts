export const validate = {
  email: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  minLen: (v: string, n: number) => v.length >= n,
  maxLen: (v: string, n: number) => v.length <= n,
  url: (v: string) => {
    try { new URL(v); return true } catch { return false }
  },
}
