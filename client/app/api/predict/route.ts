const PYTHON_API = process.env.PYTHON_API_URL || "http://localhost:8000"

export async function POST(req: Request) {
  const body = await req.json()

  const res = await fetch(`${PYTHON_API}/api/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    return Response.json({ error: "Prediction failed" }, { status: 500 })
  }

  const data = await res.json()
  return Response.json(data)
}
