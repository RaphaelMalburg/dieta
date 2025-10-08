import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import pdf from 'pdf-parse'

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

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'Please upload a PDF file' },
        { status: 400 }
      )
    }

    // Convert file to buffer for pdf-parse
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse PDF and extract text
    const pdfData = await pdf(buffer)
    const extractedText = pdfData.text

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'No text could be extracted from the PDF' },
        { status: 400 }
      )
    }

    // Save the diet plan to database
    try {
      await prisma.dietPlan.upsert({
        where: { username },
        update: { content: extractedText },
        create: { username, content: extractedText }
      })
    } catch (dbError) {
      console.error('Database error:', dbError)
      // Continue even if database save fails, return the extracted text
    }

    return NextResponse.json({
      success: true,
      text: extractedText,
      message: 'PDF processed successfully!'
    })
  } catch (error) {
    console.error('PDF upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process PDF' },
      { status: 500 }
    )
  }
}