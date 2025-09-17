import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { player1_name, player2_name, player1_choice, player2_choice, winner } = body

    // Validate required fields
    if (!player1_name || !player2_name || !player1_choice || !player2_choice) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate choices
    const validChoices = ["rock", "paper", "scissors"]
    if (!validChoices.includes(player1_choice) || !validChoices.includes(player2_choice)) {
      return NextResponse.json({ error: "Invalid choice. Must be rock, paper, or scissors" }, { status: 400 })
    }

    // Validate winner
    const validWinners = ["player1", "player2", "tie"]
    if (winner && !validWinners.includes(winner)) {
      return NextResponse.json({ error: "Invalid winner value" }, { status: 400 })
    }

    // Insert game into database
    const { data, error } = await supabase
      .from("games")
      .insert({
        player1_name: player1_name.trim(),
        player2_name: player2_name.trim(),
        player1_choice,
        player2_choice,
        winner,
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to save game" }, { status: 500 })
    }

    return NextResponse.json({ success: true, game: data }, { status: 201 })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const player = searchParams.get("player")

    let query = supabase.from("games").select("*").order("created_at", { ascending: false })

    // Filter by player if specified
    if (player) {
      query = query.or(`player1_name.ilike.%${player}%,player2_name.ilike.%${player}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 })
    }

    return NextResponse.json({ games: data || [] })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
