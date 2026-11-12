import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Textarea } from '@/components/ui/Textarea'
import {
  Sparkles, CheckCircle2,
  HelpCircle, RefreshCw, Star, Trophy, ArrowRight, BookOpen, CheckSquare
} from 'lucide-react'
import { toast } from 'sonner'

export default function InterviewPrepPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [notes, setNotes] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'practice' | 'star' | 'checklist'>('practice')

  const questions = [
    'Tell me about a time you organized a campus event or student initiative. What challenges did you face and how did you resolve them?',
    'How would you engage students on campus who are hesitant or intimidated to learn new technologies?',
    'Describe a situation where a team member did not complete their assigned task. How did you handle the collaboration?',
    'Why do you want to represent your university as a student ambassador, and what unique value will you bring to the cohort?',
    'If selected, what is the first major workshop or campaign you would launch at your campus?'
  ]

  const currentQuestion = questions[currentQuestionIndex]

  const handleSaveDraft = () => {
    if (!answer.trim()) {
      toast.error('Please type your notes or talking points before saving')
      return
    }
    setNotes(prev => [answer.trim(), ...prev])
    setAnswer('')
    toast.success('Practice answer saved to your session notes!')
  }

  const handleNext = () => {
    setCurrentQuestionIndex((prev) => (prev + 1) % questions.length)
    setAnswer('')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-500" />
            Interview Preparation & Practice Guide
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Master the STAR framework, practice standard ambassador interview questions, and review readiness checklists.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <Button
            size="sm"
            variant={activeTab === 'practice' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('practice')}
          >
            Practice Questions
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'star' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('star')}
          >
            STAR Framework
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'checklist' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('checklist')}
          >
            Checklist
          </Button>
        </div>
      </div>

      {activeTab === 'practice' && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="primary" className="bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border-none">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </Badge>
                <Button variant="ghost" size="sm" onClick={handleNext} rightIcon={<RefreshCw className="w-3.5 h-3.5" />}>
                  Next Question
                </Button>
              </div>

              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6 leading-relaxed">
                "{currentQuestion}"
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Your Talking Points & Practice Answer:
                  </label>
                  <Textarea
                    rows={6}
                    placeholder="Structure your answer using Situation, Task, Action, and Result..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="w-full text-sm"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-400">
                    {answer.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveDraft}
                    >
                      Save to Notes
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleNext}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {notes.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Your Saved Practice Notes ({notes.length})
                </h3>
                <div className="space-y-3">
                  {notes.map((note, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-700">
                      {note}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                Key Evaluation Criteria
              </h3>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2.5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Initiative:</strong> Evidence of proactive community organizing or self-driven projects.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Communication:</strong> Clear, confident delivery and active listening skills.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Teamwork:</strong> Resolving conflicts gracefully and lifting peer collaborators.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Impact:</strong> Measurable outcomes (attendance, student satisfaction, project delivery).</span>
                </li>
              </ul>
            </Card>

            <Card className="p-5 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-900/40">
              <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
                <Trophy className="w-4 h-4" />
                <span className="font-semibold text-xs uppercase tracking-wider">Top Interviewer Tip</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Always follow up actions with tangible numbers: "We registered 120 attendees across 3 colleges" sounds far more persuasive than "A lot of students attended".
              </p>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'star' && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-6 border-l-4 border-l-blue-500">
            <Badge variant="primary" className="mb-2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">S — Situation</Badge>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Set the Scene</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Describe the context, problem, or campus event you were involved in. Be concise and keep background details focused on what directly matters.
            </p>
            <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-[11px] text-slate-500 font-mono">
              "During our campus annual tech week, attendance in cloud workshops had dropped by 40%..."
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-indigo-500">
            <Badge variant="primary" className="mb-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">T — Task</Badge>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Identify the Goal</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              What was your responsibility? What specific target or milestone needed to be achieved to reverse the situation or reach the goal?
            </p>
            <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-[11px] text-slate-500 font-mono">
              "My objective was to lead a peer outreach team and redesign the hands-on lab format..."
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-emerald-500">
            <Badge variant="primary" className="mb-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">A — Action</Badge>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Highlight What YOU Did</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Use "I" rather than "we" to describe your specific contribution. Highlight problem solving, communication, leadership, and proactive steps taken.
            </p>
            <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-[11px] text-slate-500 font-mono">
              "I surveyed student interests, partnered with 3 club leads, and designed a beginner-friendly 45-min track..."
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-amber-500">
            <Badge variant="primary" className="mb-2 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">R — Result</Badge>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Quantify the Outcome</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              What happened after your actions? What metrics improved? What lessons or skills did you develop for the future?
            </p>
            <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-[11px] text-slate-500 font-mono">
              "We attracted 185 active participants, saw an 88% satisfaction score, and 30 students launched their first repo."
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'checklist' && (
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-500" />
            Interview Day Readiness Checklist
          </h2>

          <div className="space-y-3 pt-2">
            {[
              { title: 'Test Audio & Video Gear', desc: 'Verify microphone clarity, camera angle, lighting, and background 30 minutes before joining.' },
              { title: 'Check Stable Connection', desc: 'Ensure reliable Wi-Fi or backup mobile hotspot to prevent disconnections during round.' },
              { title: 'Keep Portfolio & Student ID Handy', desc: 'Have your student ID number, GitHub/LinkedIn links, and project summaries accessible.' },
              { title: 'Prepare 2 Questions for Interviewer', desc: 'Ask about community initiatives, cohort expectations, or upcoming regional events.' },
              { title: 'Join 5 Minutes Early', desc: 'Join the Google Meet / Zoom link ahead of time to confirm the room connection.' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
