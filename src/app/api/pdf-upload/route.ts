import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const username = formData.get('username') as string

    if (!file || !username) {
      return NextResponse.json(
        { success: false, error: 'File and username are required' },
        { status: 400 }
      )
    }

    // TODO: Implement PDF parsing functionality
    // For now, return a message indicating the feature is under development
    return NextResponse.json(
      { 
        success: false, 
        error: 'PDF upload functionality is currently under development. Please enter your diet plan manually.' 
      },
      { status: 501 }
    )
  } catch (error) {
    console.error('PDF upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process PDF' },
      { status: 500 }
    )
  }
}