import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	// Set SSE headers
	res.setHeader("Content-Type", "text/event-stream")
	res.setHeader("Cache-Control", "no-cache, no-transform")
	res.setHeader("Connection", "keep-alive")
	res.setHeader("X-Accel-Buffering", "no")

	console.log("[TEST STREAM RES.WRITE] Starting...")

	// Send 5 events with delays
	for (let i = 1; i <= 5; i++) {
		const message = { step: i, message: `Event ${i} at ${new Date().toISOString()}` }
		res.write(`data: ${JSON.stringify(message)}\n\n`)
		console.log(`[TEST STREAM RES.WRITE] Sent event ${i}`)

		// Sleep 1 second between events
		await new Promise((resolve) => setTimeout(resolve, 1000))
	}

	res.write(`data: ${JSON.stringify({ step: "complete", message: "Done!" })}\n\n`)
	console.log("[TEST STREAM RES.WRITE] Complete")
	res.end()
}
