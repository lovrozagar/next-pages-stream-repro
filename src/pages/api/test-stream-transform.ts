import type { NextApiRequest, NextApiResponse } from "next"
import { Readable } from "stream"

// biome-ignore lint/suspicious/useAwait: <explanation>
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	// Set SSE headers
	res.setHeader("Content-Type", "text/event-stream")
	res.setHeader("Cache-Control", "no-cache, no-transform")
	res.setHeader("Connection", "keep-alive")
	res.setHeader("X-Accel-Buffering", "no")

	console.log("[TEST STREAM TRANSFORM] Starting...")

	// Create async generator for events
	async function* generateEvents() {
		for (let i = 1; i <= 5; i++) {
			const message = { step: i, message: `Event ${i} at ${new Date().toISOString()}` }
			yield `data: ${JSON.stringify(message)}\n\n`
			console.log(`[TEST STREAM TRANSFORM] Sent event ${i}`)

			// Sleep 1 second between events
			await new Promise((resolve) => setTimeout(resolve, 1000))
		}

		yield `data: ${JSON.stringify({ step: "complete", message: "Done!" })}\n\n`
		console.log("[TEST STREAM TRANSFORM] Complete")
	}

	// Convert async generator to readable stream
	const stream = Readable.from(generateEvents())
	stream.pipe(res)
}
