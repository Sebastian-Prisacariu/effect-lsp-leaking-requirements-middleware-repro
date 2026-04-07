# Repro: `leakingRequirements` + RPC middleware–provided context

## What this shows

- `CurrentUser` is a `Context.Tag` **provided by** `AuthMiddleware` (`RpcMiddleware`), not by `DomainService.Live`.
- `DomainService` is a `Context.Tag` built with `Layer.effect`; its methods return `Effect<..., CurrentUser>` because they `yield* CurrentUser`.

That is intentional: handlers run under middleware, so `CurrentUser` exists at call time. The Effect language service may still report **`leakingRequirements`** on `DomainService`, because the service type exposes requirements the layer does not provide.

`WidgetRepository` is only there to mirror real services whose `Layer.effect` body `yield*` other tags (e.g. `DraftRepository`) while methods still need `CurrentUser`.

`greet` and `farewell` are both required: `leakingRequirements` only reports when **at least two** Effect-shaped members share a leaked `R` (`effectMembers >= 2` in the language service).

With `greet` + `farewell`, `pnpm run check` (or the command below) should report **1** `leakingRequirements` warning on `DomainService` (class name span).

## Setup

```bash
pnpm install
```

(`prepare` runs `effect-language-service patch` so TypeScript picks up Effect diagnostics.)

## How to see the diagnostic

```bash
pnpm run check
```

Or open `domain.service.ts` in the editor with `@effect/language-service` enabled and `leakingRequirements` set to `warning` in `tsconfig.json`.

`*.service.ts` plus `keyPatterns` / `extendedKeyDetection` in `tsconfig.json` mirror a typical app layout so the same service-target rules apply.

## Effect team

Primary artifact: `domain.service.ts`. **Diagnostic id:** `leakingRequirements`.
