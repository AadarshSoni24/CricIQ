const PYTHON_API = process.env.PYTHON_API_URL || "http://localhost:8000"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") || ""

  const res = await fetch(`${PYTHON_API}/api/players/search?q=${encodeURIComponent(q)}`)

  if (!res.ok) {
    return Response.json({ error: "Search failed" }, { status: 500 })
  }

  const data = await res.json()
  return Response.json(data)
}
