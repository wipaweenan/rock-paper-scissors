import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { match_id, player_id, move } = body

    // Validate required fields
    if (!match_id || !player_id || !move) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate move
    const validMoves = ["rock", "paper", "scissors"]
    if (!validMoves.includes(move)) {
      return NextResponse.json({ error: "Invalid move. Must be rock, paper, or scissors" }, { status: 400 })
    }

    // Update player's move
    const { error: moveError } = await supabase
      .from("match_players")
      .update({ move })
      .eq("match_id", match_id)
      .eq("player_id", player_id)

    if (moveError) {
      console.error("Move update error:", moveError)
      return NextResponse.json({ error: "Failed to record move" }, { status: 500 })
    }

    // Check if both players have moved
    const { data: matchPlayers, error: playersError } = await supabase
      .from("match_players")
      .select("*")
      .eq("match_id", match_id)

    if (playersError) {
      console.error("Players fetch error:", playersError)
      return NextResponse.json({ error: "Failed to check match status" }, { status: 500 })
    }

    // If both players have moved, determine results
    if (matchPlayers.length === 2 && matchPlayers.every((p) => p.move)) {
      const [player1, player2] = matchPlayers
      const p1Choice = player1.move
      const p2Choice = player2.move

      let p1Result = "draw"
      let p2Result = "draw"

      if (p1Choice !== p2Choice) {
        const winConditions = {
          rock: "scissors",
          paper: "rock",
          scissors: "paper",
        }

        if (winConditions[p1Choice as keyof typeof winConditions] === p2Choice) {
          p1Result = "win"
          p2Result = "lose"
        } else {
          p1Result = "lose"
          p2Result = "win"
        }
      }

      // Update results
      await supabase.from("match_players").update({ result: p1Result }).eq("id", player1.id)

      await supabase.from("match_players").update({ result: p2Result }).eq("id", player2.id)

      // Complete the match
      await supabase
        .from("matches")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", match_id)

      return NextResponse.json({
        success: true,
        game_complete: true,
        results: {
          [player1.player_id]: p1Result,
          [player2.player_id]: p2Result,
        },
      })
    }

    return NextResponse.json({ success: true, game_complete: false })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
