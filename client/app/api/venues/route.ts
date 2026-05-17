const PYTHON_API = process.env.PYTHON_API_URL || "http://localhost:8000"

export async function GET() {
  const res = await fetch(`${PYTHON_API}/api/venues`)

  if (!res.ok) {
    return Response.json({ error: "Failed to fetch venues" }, { status: 500 })
  }

  const data = await res.json()
  return Response.json(data)
}
