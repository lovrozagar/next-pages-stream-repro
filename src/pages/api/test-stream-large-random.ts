import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	// Set SSE headers
	res.setHeader("Content-Type", "text/event-stream")
	res.setHeader("Cache-Control", "no-cache, no-transform")
	res.setHeader("Connection", "keep-alive")
	res.setHeader("X-Accel-Buffering", "no")

	console.log("[TEST LARGE RANDOM] Starting...")

	// Generate large fake data similar to backend responses
	const generateLargeData = (step: number) => {
		return {
			step,
			timestamp: new Date().toISOString(),
			// Simulate backend entities (large array)
			entities: Array.from({ length: 50 }, (_, i) => ({
				id: `entity_${step}_${i}`,
				name: `Entity ${i}`,
				fields: Array.from({ length: 10 }, (_, j) => ({
					name: `field_${j}`,
					type: ["string", "number", "boolean", "date"][j % 4],
					required: j % 2 === 0,
					validation: {
						minLength: j * 5,
						maxLength: j * 50,
						pattern: `^[a-zA-Z0-9]{${j},${j * 10}}$`,
					},
				})),
				metadata: {
					created: new Date().toISOString(),
					updated: new Date().toISOString(),
					version: "1.0.0",
					author: "system",
					tags: ["auto-generated", "test", `step-${step}`],
				},
			})),
			// Simulate chart data
			charts: Array.from({ length: 20 }, (_, i) => ({
				id: `chart_${step}_${i}`,
				type: ["line", "bar", "pie", "scatter"][i % 4],
				config: {
					title: `Chart ${i}`,
					xAxis: { label: "X Axis", scale: "linear" },
					yAxis: { label: "Y Axis", scale: "linear" },
					colors: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
					dataPoints: Array.from({ length: 100 }, (_, j) => ({
						x: j,
						y: Math.random() * 100,
						label: `Point ${j}`,
					})),
				},
			})),
			// Simulate functions
			functions: Array.from({ length: 15 }, (_, i) => ({
				id: `func_${step}_${i}`,
				name: `processData${i}`,
				code: `function processData${i}(input) {\n  const result = input.map(x => x * 2);\n  return result.filter(x => x > 10).reduce((a, b) => a + b, 0);\n}`,
				params: ["input"],
				returns: "number",
				description: `Process data function ${i} with complex logic`,
			})),
		}
	}

	// Send 5 events with random delays (0-30s) and large payloads
	for (let i = 1; i <= 5; i++) {
		const randomDelay = Math.floor(Math.random() * 30000) // 0-30 seconds
		const largeData = generateLargeData(i)
		const message = {
			step: i,
			message: `Large event ${i} (delay: ${randomDelay}ms)`,
			data: largeData,
		}

		res.write(`data: ${JSON.stringify(message)}\n\n`)
		console.log(`[TEST LARGE RANDOM] Sent event ${i}, next delay: ${randomDelay}ms`)

		await new Promise((resolve) => setTimeout(resolve, randomDelay))
	}

	res.write(`data: ${JSON.stringify({ step: "complete", message: "Done!" })}\n\n`)
	console.log("[TEST LARGE RANDOM] Complete")
	res.end()
}
