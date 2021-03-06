import { Context, RateLimiterFlexible, Status } from "../deps.ts"
import type { RateLimiter } from "../types/rate-limiting.ts"

const rateLimiter = new (RateLimiterFlexible as RateLimiter).RateLimiterMemory({
  points: 5,
  duration: 1
})

const rateLimit = async (ctx: Context, next: () => Promise<unknown>) => {
  try {
    if (!Deno.env.get("RATE_LIMITING_DISABLED")) {
      await rateLimiter.consume(ctx.request.ip, 1)
    }
    await next()
  } catch (rejection) {
    if (rejection?._msBeforeNext) {
      ctx.response.status = Status.TooManyRequests
      const secondsBeforeNext = rejection._msBeforeNext / 1000
      ctx.response.body = `<html><body><h1>429 - Too many Request</h1><p>Please wait ${secondsBeforeNext} second${
        secondsBeforeNext === 1 ? "" : "s"
      }  and try again.</p></body></html>`
    }
  }
}

export { rateLimit }
