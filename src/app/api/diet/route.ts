import { NextRequest, NextResponse } from 'next/server'
import { saveDietPlan, getDietPlan, getUserByUsername } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { username, content } = await request.json()

    if (!username || !content) {
      return NextResponse.json(
        { error: 'Username and content are required' },
        { status: 400 }
      )
    }

    const user = getUserByUsername(username)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const result = saveDietPlan(user.id, content)

    return NextResponse.json({
      success: true,
      message: 'Diet plan saved successfully'
    })
  } catch (error) {
    console.error('Diet save error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    const user = getUserByUsername(username)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const dietPlan = getDietPlan(user.id)

    return NextResponse.json({
      success: true,
      dietPlan: dietPlan?.content || ''
    })
  } catch (error) {
    console.error('Diet get error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}