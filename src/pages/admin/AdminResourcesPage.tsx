import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { BookOpen, Plus, ExternalLink, Trash2, Search, FileText, Sparkles, HelpCircle, Check, Copy } from 'lucide-react'
import { getResources, createResource, deleteResource } from '@/services/resourceService'
import type { Resource } from '@/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [previewQuestions, setPreviewQuestions] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Interview Preparation',
    type: 'PDF',
    url: ''
  })

  const loadResources = async () => {
    setLoading(true)
    try {
      const data = await getResources()
      setResources(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResources()
  }, [])

  const handleCopyQuestion = (text: string, idx: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    toast.success('Question copied!')
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.url) {
      toast.error('Title and URL are required')
      return
    }

    try {
      await createResource(formData)
      toast.success('Resource published to students! 📚')
      setIsModalOpen(false)
      setFormData({ title: '', description: '', category: 'Interview Preparation', type: 'PDF', url: '' })
      loadResources()
    } catch {
      toast.error('Failed to create resource')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this resource?')) return
    try {
      await deleteResource(id)
      setResources(prev => prev.filter(r => r.id !== id))
      toast.success('Resource removed')
    } catch {
      toast.error('Failed to delete resource')
    }
  }

  const filtered = resources.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            Learning & Program Resources
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Publish official guidelines, PDFs, and interview preparation materials for student ambassadors.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Add Resource
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((res) => {
          const isInterviewQuestions = res.title.toLowerCase().includes('interview question') || res.url?.startsWith('#')

          return (
            <Card key={res.id} className="p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="blue" className="text-[10px]">{res.category}</Badge>
                  <Badge variant="outline" className="text-[10px] uppercase">{res.type}</Badge>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-2">{res.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{res.description}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                {isInterviewQuestions ? (
                  <button
                    type="button"
                    onClick={() => setPreviewQuestions(true)}
                    className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Preview Questions
                  </button>
                ) : (
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Resource
                  </a>
                )}
                <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(res.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* ── Interactive Interview Questions Preview Modal ── */}
      <Modal
        isOpen={previewQuestions}
        onClose={() => setPreviewQuestions(false)}
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
            <Button variant="tactile" size="sm" onClick={() => setPreviewQuestions(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Publish Learning Resource">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Resource Title</label>
            <Input
              required
              placeholder="e.g. STAR Framework Mastery Guide"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            >
              <option value="Interview Preparation">Interview Preparation</option>
              <option value="Program Guidelines">Program Guidelines</option>
              <option value="Resume & Portfolio">Resume & Portfolio</option>
              <option value="Technical Workshops">Technical Workshops</option>
              <option value="FAQs">FAQs</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Resource Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            >
              <option value="PDF">PDF Document</option>
              <option value="Video">Video Tutorial</option>
              <option value="Website">External Website</option>
              <option value="Document">Document / Framework</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Direct Link / Storage URL</label>
            <Input
              required
              placeholder="https://drive.google.com/... or #interview-questions"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Description</label>
            <textarea
              rows={3}
              placeholder="Brief summary of what this guide or document contains..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm">Publish Resource</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
