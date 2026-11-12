import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Bot, User, Mic2, BookOpen, FileText, Lightbulb, RotateCcw, Target, HelpCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  mode?: 'chat' | 'mock' | 'star'
}

const QUICK_PROMPTS = [
  { icon: <Mic2 className="w-4 h-4" />, text: 'Start Mock Interview for Ambassador role' },
  { icon: <Target className="w-4 h-4" />, text: 'Explain the STAR format with a sample answer' },
  { icon: <FileText className="w-4 h-4" />, text: 'Create a 2-week preparation study plan' },
  { icon: <Lightbulb className="w-4 h-4" />, text: 'Common Google Ambassador interview questions' },
]

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am your **CampusConnect AI Assistant & Interview Coach** 🎓

I can help you prepare for upcoming interviews, generate structured STAR-format responses, create custom study schedules, and explain university ambassador program guidelines.

Choose an option below or type your question:`,
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'mock' | 'star'>('chat')
  const { userProfile } = useAuth()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string, modeOverride?: 'chat' | 'mock' | 'star') => {
    if (!text.trim() || loading) return
    const mode = modeOverride || activeTab
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
      mode
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Simulate backend /api/ai/chat call or fallback gracefully without leaking Gemini API keys
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          studentName: userProfile?.fullName,
          program: userProfile?.course || 'Campus Ambassador Program',
          mode
        })
      })

      let assistantText = ''
      if (response.ok) {
        const data = await response.json()
        assistantText = data.reply || data.content
      } else {
        // High quality simulated AI responses tailored to university ambassador interviews
        await new Promise(r => setTimeout(r, 650))
        assistantText = generateAIResponse(text, mode, userProfile?.fullName || 'Candidate')
      }

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: assistantText,
        timestamp: new Date(),
        mode
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch {
      await new Promise(r => setTimeout(r, 500))
      const fallbackMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: generateAIResponse(text, mode, userProfile?.fullName || 'Candidate'),
        timestamp: new Date(),
        mode
      }
      setMessages(prev => [...prev, fallbackMsg])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8.5rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-200 dark:shadow-none">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              CampusConnect AI Assistant
              <Badge variant="info" className="text-[10px] py-0">2.0</Badge>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Powered by Gemini AI architecture for university ambassadors</p>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={() => setMessages([])} leftIcon={<RotateCcw className="w-3.5 h-3.5" />}>
          Reset
        </Button>
      </div>

      {/* Mode Selectors */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <button
          onClick={() => setActiveTab('chat')}
          className={cn(
            'py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border',
            activeTab === 'chat'
              ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          )}
        >
          <Bot className="w-3.5 h-3.5" /> General Q&A
        </button>
        <button
          onClick={() => {
            setActiveTab('mock')
            sendMessage('Start a mock interview session for a student ambassador lead role.', 'mock')
          }}
          className={cn(
            'py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border',
            activeTab === 'mock'
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          )}
        >
          <Mic2 className="w-3.5 h-3.5" /> Mock Interview
        </button>
        <button
          onClick={() => {
            setActiveTab('star')
            sendMessage('Guide me through formulating a high-impact STAR framework response.', 'star')
          }}
          className={cn(
            'py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border',
            activeTab === 'star'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          )}
        >
          <Target className="w-3.5 h-3.5" /> STAR Coach
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
        {messages.map(msg => (
          <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className={cn(
              'max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm',
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-tr-none'
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-none'
            )}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
              <p className={cn('text-[10px] mt-2', msg.role === 'user' ? 'text-blue-200 text-right' : 'text-slate-400')}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-center text-slate-400 text-xs py-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-2 font-medium">Assistant thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Suggestions */}
      {messages.length <= 2 && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(prompt.text)}
              className="flex items-center gap-2 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-400 dark:hover:border-blue-600 text-left transition-all group"
            >
              <span className="text-blue-500 group-hover:scale-110 transition-transform">{prompt.icon}</span>
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate">{prompt.text}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={e => {
          e.preventDefault()
          sendMessage(input)
        }}
        className="flex items-center gap-2"
      >
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={
            activeTab === 'mock'
              ? 'Answer the mock question or ask for feedback...'
              : activeTab === 'star'
              ? 'Describe your project or leadership challenge...'
              : 'Ask questions about interview prep, resources, or guidelines...'
          }
          className="flex-1"
          disabled={loading}
        />
        <Button type="submit" disabled={!input.trim() || loading} leftIcon={<Send className="w-4 h-4" />}>
          Send
        </Button>
      </form>
    </div>
  )
}

function generateAIResponse(query: string, mode: string, studentName: string): string {
  const q = query.toLowerCase()

  if (mode === 'mock' || q.includes('mock') || q.includes('start mock')) {
    return `🎯 **Mock Interview Question 1 of 5**

"Hello ${studentName}! Thank you for joining us today.

**Question:** As a Student Ambassador, you will need to engage students from diverse departments who may not initially feel interested in technology or our campus workshops.

*Can you share a specific initiative you would organize on campus to bridge that gap and encourage non-technical students to attend?*

---
💡 **Coach Tip:** Take 30 seconds to structure your answer using:
1. Identifying the core student need
2. The event concept & marketing angle
3. How you measure success (attendance, feedback)

Reply with your answer whenever you're ready, and I will grade it with constructive feedback!`
  }

  if (mode === 'star' || q.includes('star')) {
    return `🌟 **STAR Framework Master Guide**

When answering behavioral interview questions (e.g., *"Tell me about a time you handled a conflict in your team"*), use this exact 4-part structure:

### 1. **S - Situation** (15% of your answer)
Set the scene briefly.
> *"Last semester during our university hackathon committee planning..."*

### 2. **T - Task** (15% of your answer)
What was your explicit objective or duty?
> *"As outreach coordinator, my target was securing 200 student registrations across 4 campuses with only 2 weeks remaining."*

### 3. **A - Action** (50% of your answer - Most Important!)
What *you* specifically did, using proactive verbs.
> *"I designed a peer-referral raffle, partnered with 6 campus departmental club leads, and hosted three 15-minute 'AMA info drops' in large lecture halls."*

### 4. **R - Result** (20% of your answer)
Quantifiable outcomes and learnings.
> *"We exceeded our goal by 28%, reaching 256 verified signups, and 94% of attendees rated the event 5 stars."*

Would you like to practice a specific STAR story together right now? Give me a brief outline of a project you worked on!`
  }

  if (q.includes('question') || q.includes('interview')) {
    return `📋 **Top 5 Interview Questions for Student Ambassadors:**

1. **Why do you want to represent our community on your campus?**
   *Focus on:* Mentorship passion, community building, and personal growth.

2. **Tell me about a time an event didn't go according to plan.**
   *Focus on:* Quick adaptability, staying calm under pressure, and lessons learned.

3. **How do you manage deadlines between your academic workload and ambassador responsibilities?**
   *Focus on:* Time-blocking, calendar discipline, and prioritizing deliverables.

4. **How would you promote an upcoming developer workshop with zero budget?**
   *Focus on:* Social media takeovers, Discord/WhatsApp student channels, and peer networks.

5. **Do you have any questions for us?**
   *Always ask 2-3 prepared questions, such as:* "What does top success look like for an ambassador in the first 90 days?"`
  }

  if (q.includes('plan') || q.includes('study')) {
    return `📅 **2-Week High-Impact Ambassador Prep Plan:**

### Week 1: Knowledge & Positioning
- **Days 1-2:** Memorize program mission, values, and guidelines from the Resources tab.
- **Days 3-4:** Draft 3 distinct STAR stories (Leadership, Failure, Innovation).
- **Days 5-7:** Practice 2-minute elevator pitch with a timer.

### Week 2: Mock Execution & Polish
- **Days 8-10:** Do 2 full mock interviews in our **Mock Interview** tab.
- **Days 11-12:** Test webcam, microphone, lighting, and background setting.
- **Day 13:** Prepare 4 thoughtful questions for the interviewer.
- **Day 14:** Rest and review your key talking points!`
  }

  return `Great question! Here are key recommendations:

• **Be Authentic & Enthusiastic:** Ambassador programs evaluate passion, communication, and commitment above raw resume length.
• **Show Metric-Driven Impact:** Whenever discussing your projects, include numbers (e.g., *"increased workshop turnout by 40%"*).
• **Leverage CampusConnect Resources:** Check out the **Resources** section for downloadable PDF playbooks and presentation rubrics.

Can I help you refine an answer or prepare for a specific interview topic?`
}
