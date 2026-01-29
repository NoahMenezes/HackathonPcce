# Gemini AI Report Generation - Implementation Guide

## 🎯 Overview

This guide explains how to implement AI-powered report generation using Google's Gemini API for admin responses to citizen issue reports.

---

## 🚀 Feature Description

### What It Does:
When an admin clicks **"Generate Report"** in the Quick Actions section:
1. Opens a modal/dialog (no navbar visible)
2. Shows issue selection interface
3. Admin selects an issue to respond to
4. Gemini AI generates a professional response
5. Admin can review, edit, and post the response

---

## 📋 Prerequisites

### 1. Gemini API Key
```bash
# Add to your .env.local file
GOOGLE_GEMINI_API_KEY=your_api_key_here
```

Get your API key from: https://makersuite.google.com/app/apikey

### 2. Install Dependencies
```bash
npm install @google/generative-ai
```

---

## 🏗️ Implementation Steps

### Step 1: Create Gemini API Route

**File**: `app/api/admin/generate-response/route.ts`

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/api-client";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { issueTitle, issueDescription, issueCategory, issueStatus } = body;

    if (!issueTitle || !issueDescription) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Create detailed prompt for professional admin response
    const prompt = `You are a municipal administrator responding to a citizen's civic issue report. Generate a professional, empathetic, and actionable response.

Issue Details:
- Title: ${issueTitle}
- Category: ${issueCategory || "General"}
- Description: ${issueDescription}
- Current Status: ${issueStatus || "Under Review"}

Generate a response that:
1. Acknowledges the citizen's concern with empathy
2. Explains the current status and next steps
3. Provides realistic timeline for resolution
4. Thanks them for being an active citizen
5. Includes any relevant information or resources
6. Maintains professional and friendly tone
7. Is concise (150-250 words)

Response:`;

    // Generate content using Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();

    // Parse and structure the response
    return NextResponse.json({
      success: true,
      data: {
        response: generatedText,
        metadata: {
          model: "gemini-pro",
          timestamp: new Date().toISOString(),
          tokensUsed: response.usageMetadata?.totalTokenCount || 0,
        },
      },
    });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate response",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
```

---

### Step 2: Create Report Generation Modal Component

**File**: `components/admin/generate-report-modal.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Copy, Send, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  userName: string;
  createdAt: string;
}

interface GenerateReportModalProps {
  open: boolean;
  onClose: () => void;
}

export function GenerateReportModal({ open, onClose }: GenerateReportModalProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<string>("");
  const [generatedResponse, setGeneratedResponse] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [loadingIssues, setLoadingIssues] = useState(true);

  // Fetch pending issues
  useEffect(() => {
    if (open) {
      fetchPendingIssues();
    }
  }, [open]);

  const fetchPendingIssues = async () => {
    try {
      setLoadingIssues(true);
      const token = localStorage.getItem("citypulse_auth_token");
      const response = await fetch("/api/issues?status=open&limit=20", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setIssues(data.data.issues);
      }
    } catch (error) {
      console.error("Error fetching issues:", error);
      toast.error("Failed to load issues");
    } finally {
      setLoadingIssues(false);
    }
  };

  const generateResponse = async () => {
    if (!selectedIssue) {
      toast.error("Please select an issue first");
      return;
    }

    const issue = issues.find((i) => i.id === selectedIssue);
    if (!issue) return;

    try {
      setIsGenerating(true);
      const token = localStorage.getItem("citypulse_auth_token");

      const response = await fetch("/api/admin/generate-response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          issueTitle: issue.title,
          issueDescription: issue.description,
          issueCategory: issue.category,
          issueStatus: issue.status,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedResponse(data.data.response);
        toast.success("Response generated successfully!");
      } else {
        toast.error(data.error || "Failed to generate response");
      }
    } catch (error) {
      console.error("Error generating response:", error);
      toast.error("Failed to generate response");
    } finally {
      setIsGenerating(false);
    }
  };

  const postResponse = async () => {
    if (!generatedResponse || !selectedIssue) {
      toast.error("No response to post");
      return;
    }

    try {
      setIsPosting(true);
      const token = localStorage.getItem("citypulse_auth_token");

      const response = await fetch(`/api/issues/${selectedIssue}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: generatedResponse,
          isAdminResponse: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Response posted successfully!");
        setGeneratedResponse("");
        setSelectedIssue("");
        onClose();
      } else {
        toast.error(data.error || "Failed to post response");
      }
    } catch (error) {
      console.error("Error posting response:", error);
      toast.error("Failed to post response");
    } finally {
      setIsPosting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedResponse);
    toast.success("Response copied to clipboard!");
  };

  const currentIssue = issues.find((i) => i.id === selectedIssue);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI-Powered Response Generator
          </DialogTitle>
          <DialogDescription>
            Select an issue and let Gemini AI generate a professional response for you
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Issue Selection */}
          <div className="space-y-2">
            <Label htmlFor="issue-select">Select Issue</Label>
            {loadingIssues ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading issues...
              </div>
            ) : (
              <Select value={selectedIssue} onValueChange={setSelectedIssue}>
                <SelectTrigger id="issue-select">
                  <SelectValue placeholder="Choose an issue to respond to" />
                </SelectTrigger>
                <SelectContent>
                  {issues.map((issue) => (
                    <SelectItem key={issue.id} value={issue.id}>
                      {issue.title} - {issue.userName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Selected Issue Details */}
          {currentIssue && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{currentIssue.title}</CardTitle>
                    <CardDescription>
                      Reported by {currentIssue.userName} on{" "}
                      {new Date(currentIssue.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge>{currentIssue.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{currentIssue.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Generate Button */}
          <Button
            onClick={generateResponse}
            disabled={!selectedIssue || isGenerating}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating with Gemini AI...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Response
              </>
            )}
          </Button>

          {/* Generated Response */}
          {generatedResponse && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="generated-response">Generated Response</Label>
                <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
              <Textarea
                id="generated-response"
                value={generatedResponse}
                onChange={(e) => setGeneratedResponse(e.target.value)}
                rows={10}
                className="font-sans"
                placeholder="Generated response will appear here..."
              />
              <p className="text-xs text-muted-foreground">
                You can edit the response before posting
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {generatedResponse && (
            <Button
              onClick={generateResponse}
              variant="outline"
              disabled={isGenerating}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate
            </Button>
          )}
          {generatedResponse && (
            <Button onClick={postResponse} disabled={isPosting}>
              {isPosting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Post Response
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Step 3: Update Admin Dashboard

**File**: `app/admin/page.tsx` (Update the Generate Report button)

```typescript
// Add state for modal
const [showReportModal, setShowReportModal] = useState(false);

// Update the Generate Report button in Quick Actions
<Button variant="outline" onClick={() => setShowReportModal(true)}>
  <BarChart3 className="mr-2 h-4 w-4" />
  Generate Report
</Button>

// Add the modal component before closing div
<GenerateReportModal 
  open={showReportModal} 
  onClose={() => setShowReportModal(false)} 
/>
```

---

## 🎨 UI/UX Flow

### Step-by-Step User Experience:

1. **Admin clicks "Generate Report"**
   - Modal opens (full screen, no navbar)
   - Shows loading state while fetching issues

2. **Issue Selection**
   - Dropdown shows pending issues
   - Each item shows: Title - Reporter Name
   - Selected issue details displayed in card

3. **Generate Response**
   - Click "Generate Response" button
   - Shows loading animation with "Generating with Gemini AI..."
   - Response appears in editable textarea (8-10 seconds)

4. **Review & Edit**
   - Admin can review AI-generated response
   - Edit if needed
   - Copy to clipboard option available
   - Regenerate if not satisfied

5. **Post Response**
   - Click "Post Response" button
   - Success toast notification
   - Modal closes automatically
   - Response posted as admin comment on issue

---

## 🤖 Gemini Prompt Engineering

### Prompt Structure:
```
Role Definition → Context → Requirements → Output Format
```

### Best Practices:

1. **Be Specific**: Include all issue details
2. **Set Tone**: Professional, empathetic, friendly
3. **Define Length**: 150-250 words optimal
4. **Structure Output**: Clear sections/paragraphs
5. **Include Guidelines**: Acknowledge → Explain → Timeline → Thank

### Example Prompts:

**For Road Issue:**
```
Generate response for pothole report on Main Street.
Include: acknowledgment, safety concern, 3-5 day timeline,
temporary measures, contact for emergencies.
```

**For Garbage Issue:**
```
Generate response for garbage collection complaint.
Include: apology for inconvenience, schedule explanation,
next pickup date, alternative contact, appreciation.
```

---

## 📊 Response Quality Metrics

### AI Response Should Include:

✅ **Acknowledgment** - "Thank you for reporting..."
✅ **Empathy** - Understanding of inconvenience
✅ **Status** - Current progress/stage
✅ **Timeline** - Realistic completion estimate
✅ **Next Steps** - What will happen next
✅ **Contact Info** - How to follow up
✅ **Gratitude** - Thanks for civic participation

### Quality Checklist:
- [ ] Professional tone maintained
- [ ] Grammar and spelling correct
- [ ] Relevant to specific issue
- [ ] Actionable information included
- [ ] Realistic timeline provided
- [ ] Contact details mentioned
- [ ] Encourages continued engagement

---

## 🔒 Security Considerations

### API Key Protection:
```typescript
// ✅ CORRECT - Server-side only
// In API route (app/api/...)
const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

// ❌ WRONG - Never expose in client
// const apiKey = "your-api-key"; // NO!
```

### Authentication:
- Verify admin role before allowing access
- Check authorization token on API routes
- Rate limit API calls (prevent abuse)

### Data Privacy:
- Don't include personal info in prompts
- Log API usage for auditing
- Sanitize user input before sending to Gemini

---

## 💰 Cost Optimization

### Gemini API Pricing:
- Free tier: 60 requests/minute
- Pro tier: Higher limits available

### Cost Saving Tips:
1. **Cache common responses** for similar issues
2. **Use shorter prompts** when possible
3. **Limit response length** (150-250 words)
4. **Rate limit per admin** (e.g., 10/hour)
5. **Batch similar requests** if possible

---

## 🧪 Testing

### Test Cases:

1. **Happy Path**
   - Select issue → Generate → Review → Post
   - Expected: Success toast, modal closes

2. **Edge Cases**
   - No issues available
   - API timeout
   - Invalid response format
   - Network error

3. **Error Handling**
   - Missing API key
   - Invalid credentials
   - Rate limit exceeded
   - Malformed request

### Manual Testing:
```bash
# Test API endpoint directly
curl -X POST http://localhost:3000/api/admin/generate-response \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "issueTitle": "Pothole on Main Street",
    "issueDescription": "Large pothole causing traffic issues",
    "issueCategory": "road",
    "issueStatus": "open"
  }'
```

---

## 📈 Analytics & Monitoring

### Track These Metrics:
- Number of AI-generated responses
- Response generation time
- Edit rate (how often admins edit)
- Post rate (how often responses are used)
- User satisfaction with responses

### Implementation:
```typescript
// Add to API route
await logAnalytics({
  event: "ai_response_generated",
  adminId: userId,
  issueId: issueId,
  generationTime: endTime - startTime,
  tokensUsed: response.usageMetadata?.totalTokenCount,
});
```

---

## 🚨 Error Handling

### Common Errors & Solutions:

**1. API Key Invalid**
```typescript
Error: "API key not valid"
Solution: Check .env.local for correct key
```

**2. Rate Limit Exceeded**
```typescript
Error: "Resource exhausted"
Solution: Implement rate limiting, show cooldown timer
```

**3. Network Timeout**
```typescript
Error: "Request timeout"
Solution: Add retry logic with exponential backoff
```

**4. Invalid Response Format**
```typescript
Error: "Unexpected response structure"
Solution: Add response validation and fallback
```

---

## 🎯 Future Enhancements

### Planned Features:
1. **Multi-language support** - Generate in Hindi, Marathi, Konkani
2. **Response templates** - Pre-defined templates for common issues
3. **Sentiment analysis** - Adjust tone based on issue urgency
4. **Automated posting** - Option to auto-post for routine issues
5. **Response history** - Track all AI-generated responses
6. **A/B testing** - Compare AI vs manual response effectiveness

---

## 📚 Additional Resources

### Documentation:
- [Gemini API Docs](https://ai.google.dev/docs)
- [Prompt Engineering Guide](https://ai.google.dev/docs/prompt_best_practices)
- [React Hook Form](https://react-hook-form.com/)
- [Shadcn/ui Dialog](https://ui.shadcn.com/docs/components/dialog)

### Support:
- Gemini API Support: https://ai.google.dev/support
- Community Forum: https://discuss.ai.google.dev/

---

## ✅ Implementation Checklist

- [ ] Get Gemini API key
- [ ] Add key to .env.local
- [ ] Install @google/generative-ai
- [ ] Create API route for response generation
- [ ] Create modal component
- [ ] Update admin dashboard
- [ ] Add error handling
- [ ] Test with sample issues
- [ ] Add rate limiting
- [ ] Implement analytics tracking
- [ ] Deploy to production
- [ ] Monitor API usage
- [ ] Collect feedback from admins

---

## 🎉 Success Criteria

### The feature is successful when:
✅ Admins can generate responses in under 10 seconds
✅ 80%+ of generated responses are used without major edits
✅ Admin response time reduced by 50%
✅ Citizens report satisfaction with admin responses
✅ No API errors or downtime
✅ Cost stays within budget

---

**Version**: 1.0
**Status**: Ready for Implementation
**Estimated Time**: 4-6 hours