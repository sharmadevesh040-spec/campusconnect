import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Textarea } from '@/components/ui/Textarea'
import {
  Sparkles, Bot, Mic2, Send, Lightbulb, CheckCircle2,
  HelpCircle, RefreshCw, Star, Trophy, ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'
import { apiRequest } from '@/services/api'

export default function InterviewPrepPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'mock' | 'star'>('mock')

  const questions = [
    'Tell me about a time you organized a campus event or student initiative. What challenges did you face and how did you resolve them?',
    'How would you engage students on campus who are hesitant or intimidated to learn new technologies?',
    'Describe a situation where a team member did not complete their assigned task. How did you handle the collaboration?',
    'Why do you want to represent your university as a student ambassador, and what unique value will you bring to the cohort?',
    'If selected, what is the first major workshop or campaign you would launch at your campus?'
  ]

  const currentQuestion = questions[currentQuestionIndex]

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      toast.error('Please type your answer before requesting AI feedback')
      return
    }

    setLoading(true)
    try {
      const res = await apiRequest<{ feedback: string; nextQuestion: string }>('/api/ai/mock-interview', {
        method: 'POST',
        body: JSON.stringify({
          questionIndex: currentQuestionIndex,
          userAnswer: answer
        })
      })

      setFeedback(res.feedback || 'Good response! Focus on quantifying your final result.')
      toast.success('AI feedback generated! ✨')
    } catch {
      // Local fallback feedback
      const words = answer.trim().split(/\s+/).length
      if (words < 25) {
        setFeedback('💡 **Feedback**: Your answer is concise. Consider expanding on the specific Actions you personally took and quantify the final Result.')
      } else {
        setFeedback('👏 **Feedback**: Great structure! You effectively outlined the challenge and resolution. Highlight metrics (turnout %, project count) for maximum impact in your interview.')
      }
      toast.info('Feedback ready')
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    setCurrentQuestionIndex((prev) => (prev + 1) % questions.length)
    setAnswer('')
    setFeedback(null)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-500" />
            AI Interview Prep & Mock Coach
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Practice ambassador interview questions and master the STAR behavioral framework.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <Button
            size="sm"
            variant={activeTab === 'mock' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('mock')}
            className="text-xs"
          >
            Mock Simulator
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'star' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('star')}
            className="text-xs"
          >
            STAR Framework
          </Button>
        </div>
      </div>

      {activeTab === 'mock' ? (
        <div className="space-y-5">
          {/* Question Card */}
          <Card className="p-6 border-blue-100 dark:border-blue-900/30 bg-gradient-to-br from-white to-blue-50/20 dark:from-slate-900 dark:to-blue-950/20">
            <div className="flex items-center justify-between gap-2 mb-3">
              <Badge variant="blue" className="text-xs">
                Question {currentQuestionIndex + 1} of {questions.length}
              </Badge>
              <Button size="sm" variant="ghost" onClick={handleNext} rightIcon={<RefreshCw className="w-3.5 h-3.5" />}>
                Next Question
              </Button>
            </div>

            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
              "{currentQuestion}"
            </h2>

            <div className="mt-5 space-y-3">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Mic2 className="w-3.5 h-3.5 text-blue-500" />
                Type your response:
              </label>
              <Textarea
                rows={5}
                placeholder="Structure your answer with Situation, Task, Action, and Result..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full text-sm"
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">
                  {answer.trim() ? `${answer.trim().split(/\s+/).length} words` : '0 words'}
                </span>
                <Button
                  size="sm"
                  onClick={handleSubmitAnswer}
                  loading={loading}
                  leftIcon={<Sparkles className="w-4 h-4 text-amber-400" />}
                >
                  Analyze with AI
                </Button>
              </div>
            </div>
          </Card>

          {/* Feedback Card */}
          {feedback && (
            <Card className="p-5 border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                AI Coach Assessment
              </div>
              <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {feedback}
              </div>
              <div className="pt-2 flex justify-end">
                <Button size="sm" variant="outline" onClick={handleNext} rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Continue to Next Question
                </Button>
              </div>
            </Card>
          )}
        </div>
      ) : (
        /* STAR Framework Guide */
        <div className="space-y-4">
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              The STAR Method Explained
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Ambassador interviewers evaluate leadership and problem-solving through behavioral questions. Using STAR ensures structured, impactful answers:
            </p>

            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">S — Situation</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Set the context. Describe the specific challenge, project, or campus club setting.</p>
              </div>

              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">T — Task</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">What goal did you need to accomplish? What was expected of you as an organizer?</p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">A — Action</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">What steps did YOU take? Emphasize collaboration, leadership, and proactive problem solving.</p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">R — Result</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">What was the outcome? Use numbers, percentages, or measurable community impact.</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
