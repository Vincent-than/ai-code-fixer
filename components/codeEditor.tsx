'use client'

import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface CodeEditorProps {
  title: string
  code: string
  onChange?: (code: string) => void
  language: string
  readOnly?: boolean
}

export function CodeEditor({ 
  title, 
  code, 
  onChange, 
  language, 
  readOnly = false
}: CodeEditorProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          {title}
          <Badge variant="outline">{language}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={code}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
          className="font-mono text-sm min-h-[300px] resize-none"
          placeholder={readOnly ? "Corrected code will appear here..." : "Paste your code here..."}
        />
      </CardContent>
    </Card>
  )
}