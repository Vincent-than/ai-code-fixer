'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { CodeEditor } from "@/components/codeEditor"
import { LanguageSelector } from "@/components/languageSelector"
import { toast } from "sonner"
import { Wand2, Sparkles, Code, Zap, RotateCcw } from "lucide-react"

interface CorrectionResult {
  correctedCode: string
  explanation: string
  issues: string[]
}

export default function HomePage() {
  const [originalCode, setOriginalCode] = useState('')
  const [language, setLanguage] = useState('typescript')
  const [description, setDescription] = useState('')
  const [result, setResult] = useState<CorrectionResult | null>(null)
  const [loading, setLoading] = useState(false)

  const correctCode = async () => {
    // Validation
    if (!originalCode.trim()) {
      toast.error('Please enter some code to correct')
      return
    }

    setLoading(true)
    
    // Show loading toast
    const loadingToast = toast.loading('Groq is analyzing your code...', {
      description: 'This may take a few seconds'
    })

    try {
      const response = await fetch('/api/correct', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: originalCode,
          language,
          description: description.trim() || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to correct code`)
      }

      // Validate response data
      if (!data.correctedCode) {
        throw new Error('Invalid response: Missing corrected code')
      }

      setResult(data)
      
      // Success toast
      toast.success('Code corrected successfully!', {
        description: `Found and fixed ${data.issues?.length || 0} issues`,
        duration: 3000
      })

    } catch (error) {
      console.error('Code correction error:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      toast.error('Failed to correct code', {
        description: errorMessage,
        duration: 5000
      })
    } finally {
      setLoading(false)
      toast.dismiss(loadingToast)
    }
  }

  const resetAll = () => {
    setOriginalCode('')
    setResult(null)
    setDescription('')
    toast.success('Reset complete', {
      description: 'Ready for new code analysis'
    })
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Code copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy code')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Wand2 className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Claude Code Corrector
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Paste your buggy code and let Groq AI fix it! Get detailed explanations, 
            error corrections, and code improvements powered by advanced AI.
          </p>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  Programming Language
                </label>
                <LanguageSelector value={language} onChange={setLanguage} />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  Context (Optional)
                </label>
                <Textarea
                  placeholder="Describe what this code should do..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-10 resize-none"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={correctCode} 
                disabled={loading || !originalCode.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {loading ? 'Analyzing...' : 'Fix My Code'}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={resetAll}
                disabled={loading}
                size="lg"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Code Input/Output */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <CodeEditor
            title="Your Code (Input)"
            code={originalCode}
            onChange={setOriginalCode}
            language={language}
          />
          
          <div className="relative">
            <CodeEditor
              title="Groq Corrected Code"
              code={result?.correctedCode || ''}
              language={language}
              readOnly
            />
            {result?.correctedCode && (
              <Button
                variant="outline"
                size="sm"
                className="absolute top-4 right-4 z-10"
                onClick={() => copyToClipboard(result.correctedCode)}
              >
                Copy Code
              </Button>
            )}
          </div>
        </div>

        {/* Results Analysis */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Groq's Analysis & Explanation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Explanation */}
              <div>
                <h4 className="text-lg font-semibold mb-3 text-gray-800">
                  What Groq Fixed:
                </h4>
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <p className="text-gray-700 leading-relaxed">
                    {result.explanation}
                  </p>
                </div>
              </div>
              
              {/* Issues Found */}
              {result.issues && result.issues.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-3 text-gray-800">
                    Issues Found & Fixed ({result.issues.length}):
                  </h4>
                  <div className="space-y-2">
                    {result.issues.map((issue, index) => (
                      <div 
                        key={index} 
                        className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
                      >
                        <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                          {index + 1}
                        </div>
                        <p className="text-gray-700 flex-1">{issue}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p className="text-sm">
            Built with Next.js, TypeScript, Groq AI, and Tailwind CSS
          </p>
          <p className="text-xs mt-1">
            Perfect for debugging, learning, and improving your code quality
          </p>
        </div>
      </div>
    </div>
  )
}