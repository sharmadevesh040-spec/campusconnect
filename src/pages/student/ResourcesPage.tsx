import { useState } from 'react'
import { BookOpen, ExternalLink, FileText, Video, Globe, Sparkles, HelpCircle, Check, Copy } from 'lucide-react'
import { useResources } from '@/hooks/useResources'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ResourceType } from '@/types/resource'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const CATEGORIES = ['All', 'Interview Preparation', 'Resume', 'Communication', 'Technical', 'Ambassador Guidelines', 'FAQs']

const TYPE_ICONS: Record<string, React.ReactNode> = {
  [ResourceType.PDF]: <FileText className="w-4 h-4" />,
  [ResourceType.VIDEO]: <Video className="w-4 h-4" />,
  [ResourceType.WEBSITE]: <Globe className="w-4 h-4" />,
  [ResourceType.DOCUMENT]: <FileText className="w-4 h-4" />,
  [ResourceType.EXTERNAL_LINK]: <ExternalLink className="w-4 h-4" />,
}

const INTERVIEW_QUESTIONS = [
  {
    num: 'Q1',
    badgeBg: 'bg-blue-600',
    borderColor: 'border-blue-400 dark:border-blue-500/60',
    question: 'When your professor shares the syllabus and a pile of PPTs and PDFs, how do you decide what to study first?'
  },
  {
    num: 'Q2',
    badgeBg: 'bg-rose-500',
    borderColor: 'border-rose-300 dark:border-rose-500/60',
    question: 'How do you make notes right now: handwritten, typed, borrowing a friend’s, or screenshotting slides? Which part do you hate the most?'
  },
  {
    num: 'Q3',
    badgeBg: 'bg-emerald-600',
    borderColor: 'border-emerald-400 dark:border-emerald-500/60',
    question: 'If a tool used your own class material to find your weak units and teach those first, would you use it?'
  },
  {
    num: 'Q4',
    badgeBg: 'bg-rose-500',
    borderColor: 'border-rose-300 dark:border-rose-500/60',
    question: 'That’s close to what Study Notebooks does inside Google Gemini. It works from your own PPTs and notes. Let me show you.'
  }
]

export default function ResourcesPage() {
  const { resources, loading } = useResources()
  const [category, setCategory] = useState('All')
  const [selectedQuestionsResource, setSelectedQuestionsResource] = useState<any | null>(null)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const filtered = resources.filter(r => category === 'All' || r.category.toLowerCase() === category.toLowerCase())

  const handleCopyQuestion = (text: string, idx: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    toast.success('Question copied to clipboard!')
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const handleResourceClick = (resource: any, e: React.MouseEvent) => {
    if (resource.title.toLowerCase().includes('interview question') || resource.url?.startsWith('#')) {
      e.preventDefault()
      setSelectedQuestionsResource(resource)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Student Resources</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Study materials, guidelines, and preparation documents</p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all',
              category === cat
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState emoji="📚" title="No resources found" description="Resources for this category will appear here." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map(resource => {
            const isInterviewQuestions = resource.title.toLowerCase().includes('interview question') || resource.url?.startsWith('#')

            return (
              <a
                key={resource.id}
                href={resource.url}
                target={isInterviewQuestions ? undefined : '_blank'}
                rel={isInterviewQuestions ? undefined : 'noopener noreferrer'}
                onClick={(e) => handleResourceClick(resource, e)}
                className="block group"
              >
                <Card hover className="p-4 h-full flex flex-col justify-between cursor-pointer">
                  <div>
                    <div className="flex items-start gap-3 mb-2">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                        isInterviewQuestions ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' :
                        resource.type === ResourceType.VIDEO ? 'bg-red-50 dark:bg-red-900/20 text-red-500' :
                        resource.type === ResourceType.PDF ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-500' :
                        'bg-blue-50 dark:bg-blue-900/20 text-blue-500'
                      )}>
                        {isInterviewQuestions ? <HelpCircle className="w-5 h-5 text-purple-500" /> : (TYPE_ICONS[resource.type] || <BookOpen className="w-4 h-4" />)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {resource.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{resource.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/50 mt-2">
                    <Badge variant="default" className="text-[10px]">{resource.category}</Badge>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
                      {isInterviewQuestions ? 'View Questions' : resource.type}
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </Card>
              </a>
            )
          })}
        </div>
      )}

      {/* ── Interactive Interview Questions Modal ── */}
      <Modal
        isOpen={!!selectedQuestionsResource}
        onClose={() => setSelectedQuestionsResource(null)}
        title="Resource · Interview questions"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Campus Ambassador Discovery Questions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Google Gemini Study Notebooks & syllabus discovery conversation framework
              </p>
            </div>
            <Badge variant="blue" className="text-xs">Interview Preparation</Badge>
          </div>

          <div className="space-y-3.5 pt-1">
            {INTERVIEW_QUESTIONS.map((item, idx) => (
              <div
                key={item.num}
                className={cn(
                  'rounded-2xl border-2 p-4 sm:p-5 flex items-start gap-4 bg-white dark:bg-slate-900/60 shadow-sm transition-all hover:shadow-md relative group',
                  item.borderColor
                )}
              >
                {/* Question Pill Badge */}
                <div
                  className={cn(
                    'w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md',
                    item.badgeBg
                  )}
                >
                  {item.num}
                </div>

                {/* Question Text */}
                <div className="flex-1 min-w-0 pr-8">
                  <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                    {item.question}
                  </p>
                </div>

                {/* Copy button */}
                <button
                  type="button"
                  onClick={() => handleCopyQuestion(item.question, idx)}
                  className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 opacity-60 group-hover:opacity-100 transition-all"
                  title="Copy question"
                >
                  {copiedIdx === idx ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-mono">4 Ambassador Pitch Questions</span>
            <Button variant="tactile" size="sm" onClick={() => setSelectedQuestionsResource(null)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

