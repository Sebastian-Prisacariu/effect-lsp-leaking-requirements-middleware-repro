import { RpcMiddleware } from '@effect/rpc'
import { Context, Effect, Layer, Schema } from 'effect'

export class CurrentUser extends Context.Tag('repro/CurrentUser')<
	CurrentUser,
	{ readonly userId: string }
>() {}

export class UnauthorizedError extends Schema.TaggedError<UnauthorizedError>()(
	'UnauthorizedError',
	{ procedure: Schema.String }
) {}

export class AuthMiddleware extends RpcMiddleware.Tag<AuthMiddleware>()(
	'AuthMiddleware',
	{
		provides: CurrentUser,
		failure: UnauthorizedError,
	}
) {}

export const AuthMiddlewareLive = Layer.succeed(
	AuthMiddleware,
	AuthMiddleware.of(({ rpc }) =>
		Effect.succeed({
			userId: `fake-user-for-${rpc._tag}`,
		})
	)
)

export class WidgetRepository extends Context.Tag('repro/WidgetRepository')<
	WidgetRepository,
	{ readonly getLabel: () => Effect.Effect<string> }
>() {
	static readonly Live = Layer.succeed(WidgetRepository, {
		getLabel: () => Effect.succeed('widget'),
	})
}

export class DomainService extends Context.Tag('repro/DomainService')<
	DomainService,
	{
		readonly greet: () => Effect.Effect<string, never, CurrentUser>
		readonly farewell: () => Effect.Effect<string, never, CurrentUser>
	}
>() {
	static readonly Live = Layer.effect(
		DomainService,
		Effect.gen(function* () {
			const widgets = yield* WidgetRepository

			const greet = (): Effect.Effect<string, never, CurrentUser> =>
				Effect.gen(function* () {
					const u = yield* CurrentUser
					const label = yield* widgets.getLabel()
					return `hello ${u.userId} (${label})`
				})

			const farewell = (): Effect.Effect<string, never, CurrentUser> =>
				Effect.gen(function* () {
					const u = yield* CurrentUser
					return `bye ${u.userId}`
				})

			return { greet, farewell }
		})
	).pipe(Layer.provide(WidgetRepository.Live))
}
