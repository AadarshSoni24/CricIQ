const PYTHON_API = process.env.PYTHON_API_URL || "http://localhost:8000"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const res = await fetch(`${PYTHON_API}/api/players/${id}`)

  if (!res.ok) {
    return Response.json({ error: "Player not found" }, { status: 404 })
  }

  const data = await res.json()
  return Response.json(data)
}
