import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

// POST /api/ai/chat (General Assistant)
router.post('/chat', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { message, context = 'student' } = req.body
    const apiKey = process.env.GEMINI_API_KEY

    if (!message) {
      res.status(400).json({ error: 'Message is required' })
      return
    }

    if (apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: `You are the CampusConnect AI Student Assistant. You help student ambassadors prepare for interviews, understand program deadlines, structure answers using the STAR method, and excel in campus leadership. Context: ${context}. User query: ${message}`
                    }
                  ]
                }
              ]
            })
          }
        )

        if (response.ok) {
          const data = await response.json()
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) {
            res.json({ reply: text })
            return
          }
        }
      } catch (geminiErr) {
        console.warn('[AI] Gemini API request failed, utilizing local fallback engine:', geminiErr)
      }
    }

    // High quality contextual fallback response when GEMINI_API_KEY is not configured
    let reply = `Here are actionable guidelines for: "${message}"\n\n`
    const lower = message.toLowerCase()

    if (lower.includes('interview') || lower.includes('prepare')) {
      reply += `🎯 **Interview Preparation Strategy**:\n` +
        `1. **Study the Program Objectives**: Understand the ambassador role—community outreach, workshops, and student advocacy.\n` +
        `2. **Use the STAR Method**: Frame behavioral answers around **Situation**, **Task**, **Action**, and **Result**.\n` +
        `3. **Technical Setup**: Verify your webcam, microphone, and stable WiFi 15 minutes before your scheduled slot.\n` +
        `4. **Prepare Questions**: Ask the interviewer about cohort milestones and upcoming campus initiatives.`
    } else if (lower.includes('star') || lower.includes('framework')) {
      reply += `⭐ **STAR Framework Coaching**:\n` +
        `- **Situation**: Set the scene. (e.g., "Our campus tech club had only 15 active attendees...")\n` +
        `- **Task**: What needed to be done? ("As Ambassador, I aimed to scale engagement to 100+ students...")\n` +
        `- **Action**: Exactly what did YOU do? ("I hosted interactive hands-on coding labs and partnered with student societies...")\n` +
        `- **Result**: Quantify your outcome. ("Attendance increased by 300%, and 45 students submitted projects to our hackathon.")`
    } else if (lower.includes('certificate') || lower.includes('verify')) {
      reply += `🏆 **Certificate & Verification Info**:\n` +
        `All CampusConnect certificates are issued with unique, cryptographically verifiable IDs (e.g. \`GSA-2026-XXXXXX\`) and QR codes. Anyone can verify authenticity publicly without logging in at \`/verify/:certificateId\`.`
    } else {
      reply += `As your CampusConnect Student Assistant, I can help you with:\n` +
        `• Mock interview practice & STAR behavioral answer coaching\n` +
        `• Program orientation & event registration walkthroughs\n` +
        `• Reviewing task deadlines and verified credentials\n` +
        `Feel free to ask a specific question!`
    }

    res.json({ reply })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'AI service error' })
  }
})

// POST /api/ai/mock-interview (Interview Simulation & Feedback)
router.post('/mock-interview', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { questionIndex = 0, userAnswer, targetRole = 'Google Student Ambassador' } = req.body

    const questions = [
      'Tell me about a time you organized a campus event or student initiative. What challenges did you face?',
      'How would you engage students on campus who are hesitant to learn new technologies?',
      'Describe a situation where a team member did not complete their assigned task. How did you handle it?',
      'Why do you want to represent your university as a student ambassador, and what unique value will you bring?',
      'If chosen, what is the first major workshop or campaign you would launch at your campus?'
    ]

    const nextIndex = (questionIndex + 1) % questions.length
    const nextQuestion = questions[nextIndex]

    let feedback = ''
    if (userAnswer) {
      const wordCount = userAnswer.trim().split(/\s+/).length
      if (wordCount < 20) {
        feedback = '💡 **Tip**: Your response is quite brief. Elaborate on the specific Actions you took and quantify the Results achieved.'
      } else {
        feedback = '👏 **Strong Response**: Good structure! Notice how highlighting measurable impact (numbers, student turnout, feedback) will make your answer even more compelling to interviewers.'
      }
    }

    res.json({
      feedback,
      nextQuestion,
      questionIndex: nextIndex,
      totalQuestions: questions.length
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Mock interview service error' })
  }
})

export default router
