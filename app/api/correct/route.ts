import { NextRequest, NextResponse } from 'next/server'
import { groq, DEFAULT_MODEL } from '@/lib/groq'

interface CorrectionRequest {
  code: string
  language: string
  description?: string
}

interface CorrectionResponse {
  correctedCode: string
  explanation: string
  issues: string[]
}

export async function POST(request: NextRequest) {
  try {
    // Check if API key exists
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Groq API key not configured. Please add GROQ_API_KEY to your environment variables.' },
        { status: 500 }
      )
    }

    const { code, language, description }: CorrectionRequest = await request.json()

    // Validate input
    if (!code || !code.trim()) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      )
    }

    // Create prompt for Groq
    const prompt = `You are an expert ${language} developer and code reviewer. Analyze and fix this code. Respond with ONLY valid JSON in this exact format:

{
  "correctedCode": "the complete fixed code here",
  "explanation": "detailed explanation of what was wrong and what you changed",
  "issues": ["specific issue 1 that was found and fixed", "specific issue 2", "specific issue 3"]
}

${description ? `Context: ${description}` : ''}

Code to analyze and fix:
\`\`\`${language}
${code}
\`\`\`

Focus on:
1. Syntax errors and bugs
2. Logic errors and potential runtime issues
3. Best practices and code quality improvements
4. Performance optimizations
5. Security vulnerabilities

Provide the corrected code even if no major issues are found - you can still improve formatting, add comments, or optimize the code.

IMPORTANT: Return ONLY the JSON object, no other text, no markdown formatting, no explanations outside the JSON.`

    // Call Groq API
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      model: DEFAULT_MODEL,
      temperature: 0.1,
      max_tokens: 4000,
      top_p: 1,
      stream: false
    })

    const responseText = chatCompletion.choices[0]?.message?.content || ''
    
    // Log the raw response for debugging (first 300 chars)
    console.log('Groq raw response:', responseText.substring(0, 300) + '...')

    // Clean up the response text
    let jsonString = responseText.trim()
    
    // Remove any markdown code blocks if present
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }
    
    // Remove any leading/trailing text that might not be JSON
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonString = jsonMatch[0]
    }

    // Parse the JSON response from Groq
    let parsedResponse: CorrectionResponse
    try {
      parsedResponse = JSON.parse(jsonString)
    } catch (parseError) {
      console.error('Failed to parse Groq response:', jsonString.substring(0, 500))
      console.error('Parse error:', parseError)
      
      // Fallback: create a structured response from the raw text
      return NextResponse.json({
        correctedCode: `// Groq response (parsing failed):\n// ${responseText.replace(/\n/g, '\n// ')}\n\n// Original code:\n${code}`,
        explanation: "Groq provided feedback but in an unexpected format. The raw response is shown as comments in the corrected code section above your original code.",
        issues: [
          "JSON parsing failed - Groq returned non-JSON format", 
          "Check the raw response in the corrected code section",
          "Try submitting the code again for a properly formatted response"
        ]
      })
    }

    // Validate the response has required fields
    if (!parsedResponse.correctedCode) {
      console.error('Groq response missing correctedCode field:', parsedResponse)
      return NextResponse.json({
        correctedCode: code, // Return original code as fallback
        explanation: "Groq response was missing the corrected code. Please try again.",
        issues: ["Invalid API response format", "Missing corrected code field"]
      })
    }

    // Ensure all required fields exist with defaults
    const validatedResponse: CorrectionResponse = {
      correctedCode: parsedResponse.correctedCode,
      explanation: parsedResponse.explanation || "Code has been analyzed and corrections have been applied.",
      issues: Array.isArray(parsedResponse.issues) ? parsedResponse.issues : ["Code analysis completed"]
    }

    return NextResponse.json(validatedResponse)

  } catch (error) {
    console.error('Groq API Error:', error)
    
    // Handle specific Groq API errors
    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('authentication') || error.message.includes('unauthorized')) {
        return NextResponse.json(
          { error: 'Invalid Groq API key. Please check your GROQ_API_KEY in environment variables.' },
          { status: 401 }
        )
      }
      
      if (error.message.includes('rate limit') || error.message.includes('quota') || error.message.includes('limit exceeded')) {
        return NextResponse.json(
          { error: 'Groq API rate limit exceeded. Please try again in a moment.' },
          { status: 429 }
        )
      }
      
      if (error.message.includes('timeout') || error.message.includes('network')) {
        return NextResponse.json(
          { error: 'Network timeout. Please check your connection and try again.' },
          { status: 504 }
        )
      }
      
      if (error.message.includes('JSON') || error.message.includes('parse')) {
        return NextResponse.json(
          { error: 'Groq returned an invalid response format. Please try again.' },
          { status: 500 }
        )
      }
    }
    
    // Generic error fallback
    return NextResponse.json(
      { 
        error: 'Failed to analyze code with Groq API. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}