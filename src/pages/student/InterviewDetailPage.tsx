import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, Video, MapPin, User, MessageSquare, Sparkles, Download } from 'lucide-react'
import { format } from 'date-fns'
import { useInterviews } from '@/hooks/useInterviews'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CountdownTimer } from '@/components/common/CountdownTimer'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { createICSEvent } from '@/lib/utils'
import { InterviewStatus, InterviewType } from '@/types/interview'
import { toast } from 'sonner'

const STATUS_COLORS: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  scheduled: 'primary', confirmed: 'success', completed: 'default', rescheduled: 'warning',
  cancelled: 'danger', selected: 'success', rejected: 'danger', pending: 'info'
}

export default function InterviewDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { interviews, loading } = useInterviews()
  const interview = interviews.find(i => i.id === id)

  if (loading) return <LoadingSpinner fullScreen />
  if (!interview) return (
    <div className="max-w-2xl mx-auto text-center py-20">
      <p className="text-4xl mb-4">🎓</p>
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Interview not found</h2>
      <Button onClick={() => navigate('/interviews')} leftIcon={<ArrowLeft className="w-4 h-4" />} variant="outline">Back to Interviews</Button>
    </div>
  )

  const interviewDateTime = new Date(interview.date)
  const isUpcoming = interviewDateTime > new Date() && [InterviewStatus.SCHEDULED, InterviewStatus.CONFIRMED].includes(interview.status)

  const addToCalendar = () => {
    const end = new Date(interviewDateTime.getTime() + (interview.duration || 60) * 60000)
    const ics = createICSEvent({
      title: interview.title,
      description: `Interview with ${interview.organization}\\n\\nInterviewer: ${interview.interviewer}\\n\\nInstructions: ${interview.instructions}`,
      location: interview.location || interview.meetingLink || 'Online',
      startDate: interviewDateTime,
      endDate: end
    })
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${interview.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Calendar (.ics) invite downloaded!')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/interviews')} aria-label="Back"><ArrowLeft className="w-5 h-5" /></Button>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">{interview.title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{interview.organization}</p>
        </div>
      </div>

      {/* Status & Countdown */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <Badge variant={STATUS_COLORS[interview.status] || 'default'} className="text-sm px-3 py-1 font-semibold">
            {interview.status.toUpperCase()}
          </Badge>
          {isUpcoming && <CountdownTimer targetDate={interviewDateTime} />}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center"><Calendar className="w-4 h-4 text-blue-500" /></div>
            <div>
              <p className="text-xs text-slate-400">Date</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{format(interview.date, 'dd MMM yyyy')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center"><Clock className="w-4 h-4 text-blue-500" /></div>
            <div>
              <p className="text-xs text-slate-400">Time</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{interview.time}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              {interview.interviewType === InterviewType.ONLINE ? <Video className="w-4 h-4 text-blue-500" /> : <MapPin className="w-4 h-4 text-blue-500" />}
            </div>
            <div>
              <p className="text-xs text-slate-400">Type</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 capitalize">{interview.interviewType}</p>
            </div>
          </div>
          {interview.interviewer && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center"><User className="w-4 h-4 text-blue-500" /></div>
              <div>
                <p className="text-xs text-slate-400">Interviewer</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{interview.interviewer}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {interview.meetingLink && (
          <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button className="w-full" leftIcon={<Video className="w-4 h-4" />}>Join Meeting</Button>
          </a>
        )}
        <Button variant="outline" onClick={addToCalendar} leftIcon={<Download className="w-4 h-4" />}>Add to Calendar (.ics)</Button>
      </div>

      {/* Instructions */}
      {interview.instructions && (
        <Card>
          <CardContent>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              Candidate Instructions
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">{interview.instructions}</p>
          </CardContent>
        </Card>
      )}

      {/* Location */}
      {interview.location && !interview.meetingLink && (
        <Card>
          <CardContent>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-500" />
              Venue Location
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{interview.location}</p>
          </CardContent>
        </Card>
      )}

      {/* AI Prep Link */}
      <Link to="/assistant">
        <Card hover className="p-5 bg-gradient-to-r from-indigo-50/70 to-purple-50/70 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-100 dark:border-indigo-800/40">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Prepare for this Interview</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Use AI to generate mock questions, STAR format responses, and communication tips</p>
            </div>
            <Button variant="outline" size="sm" leftIcon={<Sparkles className="w-3 h-3 text-indigo-500" />}>Prepare</Button>
          </div>
        </Card>
      </Link>
    </div>
  )
}
