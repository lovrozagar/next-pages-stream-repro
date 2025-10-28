import type { NextApiRequest, NextApiResponse } from "next"
import { getServerSession, type Session } from "next-auth"
import { getAuthOptions } from "~/pages/api/auth/[...nextauth].api"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	let sseStarted = false
	let heartbeat: NodeJS.Timeout | undefined

	const emit = (message: { step: string; message: string; data?: unknown }) => {
		if (!sseStarted) {
			console.warn("[TEST AUTH] SSE not started, skipping emit")
			return
		}

		try {
			const payload = JSON.stringify(message)
			const written = res.write(`data: ${payload}\n\n`)

			// Try flush methods like application-create-stream
			// biome-ignore lint/suspicious/noExplicitAny: flush may exist
			if (typeof (res as any).flush === "function") {
				// biome-ignore lint/suspicious/noExplicitAny: flush may exist
				;(res as any).flush()
			}

			if (res.socket && !res.socket.destroyed) {
				// biome-ignore lint/suspicious/noExplicitAny: uncork may exist
				if (typeof (res.socket as any).uncork === "function") {
					// biome-ignore lint/suspicious/noExplicitAny: uncork may exist
					;(res.socket as any).uncork()
				}
			}

			console.log(`[TEST AUTH] Emitted: ${message.step}, written: ${written}`)
		} catch (error) {
			console.error(`[TEST AUTH] Emit failed:`, error)
		}
	}

	try {
		console.log("[TEST AUTH] Starting...")

		// Check auth like application-create-stream does
		// biome-ignore lint/suspicious/noExplicitAny: auth options type
		const session = (await getServerSession(req, res, getAuthOptions(req) as any)) as Session | null

		if (!session?.user?.email) {
			console.error("[TEST AUTH] No session")
			res.status(401).json({ error: "Unauthorized" })
			return
		}

		console.log("[TEST AUTH] Auth OK, user:", session.user.email)

		// Set headers using writeHead like application-create-stream
		res.writeHead(200, {
			"Content-Type": "text/event-stream; charset=utf-8",
			"Cache-Control": "no-cache, no-store, no-transform, must-revalidate",
			Connection: "keep-alive",
			"Transfer-Encoding": "chunked",
			"X-Accel-Buffering": "no",
			"Content-Encoding": "identity",
		})

		// Socket manipulation like application-create-stream
		if (res.socket && !res.socket.destroyed) {
			res.socket.setNoDelay(true)
			res.socket.setTimeout(0)
		}

		if (typeof res.flushHeaders === "function") {
			res.flushHeaders()
		}

		// Initial comment
		res.write(": stream-start\n\n")
		sseStarted = true

		// Heartbeat like application-create-stream
		heartbeat = setInterval(() => {
			try {
				res.write(": heartbeat\n\n")
				// biome-ignore lint/suspicious/noExplicitAny: flush may exist
				if (typeof (res as any).flush === "function") {
					// biome-ignore lint/suspicious/noExplicitAny: flush may exist
					;(res as any).flush()
				}
			} catch (_error) {
				clearInterval(heartbeat)
			}
		}, 15000)

		console.log("[TEST AUTH] SSE initialized, starting events...")

		// Generate large data like real build
		const generateComplexData = (step: number) => ({
			database: {
				url: `postgresql://user:pass@localhost:5432/db_${step}`,
				schema: "public",
				tables: Array.from({ length: 10 }, (_, i) => ({
					name: `table_${i}`,
					columns: Array.from({ length: 8 }, (_, j) => ({
						name: `col_${j}`,
						type: "varchar(255)",
					})),
				})),
			},
			backend: {
				entities: Array.from({ length: 30 }, (_, i) => ({
					id: `entity_${i}`,
					name: `Entity${i}`,
					fields: Array.from({ length: 12 }, (_, j) => ({
						name: `field_${j}`,
						type: "string",
					})),
				})),
			},
			frontend: {
				pages: Array.from({ length: 8 }, (_, i) => ({
					name: `Page${i}`,
					route: `/page-${i}`,
					components: Array.from({ length: 5 }, (_, j) => ({
						type: "component",
						name: `Component${j}`,
					})),
				})),
			},
		})

		// Send 5 events with random delays (0-30s)
		for (let i = 1; i <= 5; i++) {
			const randomDelay = Math.floor(Math.random() * 30000)
			const complexData = generateComplexData(i)

			emit({
				step: `step_${i}`,
				message: `Processing step ${i} (delay: ${randomDelay}ms)`,
				data: complexData,
			})

			await new Promise((resolve) => setTimeout(resolve, randomDelay))
		}

		emit({
			step: "complete",
			message: "Build complete!",
		})

		console.log("[TEST AUTH] Complete")
		clearInterval(heartbeat)
		res.end()
	} catch (error) {
		console.error("[TEST AUTH] Error:", error)

		if (heartbeat) {
			clearInterval(heartbeat)
		}

		emit({
			step: "error",
			message: error instanceof Error ? error.message : "Unknown error",
		})

		res.end()
	}

	req.on("close", () => {
		if (heartbeat) {
			clearInterval(heartbeat)
		}
		console.log("[TEST AUTH] Client disconnected")
	})
}
