import { useState } from 'react'

interface LookapStageProps {
  studentName?: string
  studentId?: string
  role?: string
  program?: string
}

export function LookapStage({
  studentName = 'Devesh Sharma',
  studentId = 'CC-2026-8841',
  role = 'Campus Fellow',
  program = 'Google Student Ambassador'
}: LookapStageProps) {
  const [isIn, setIsIn] = useState(false)
  const [isPre, setIsPre] = useState(false)

  return (
    <div className="cs-wrap">
      <div
        className="cs-stage"
        onMouseEnter={() => {
          setIsPre(true)
          setTimeout(() => setIsIn(true), 250)
        }}
        onMouseLeave={() => {
          setIsIn(false)
          setIsPre(false)
        }}
        onClick={() => setIsIn(!isIn)}
        aria-label="Student ID card reader demo. Hover or tap to insert the card."
      >
        <div className={`cs-rig ${isIn ? 'in' : isPre ? 'pre' : ''}`}>
          
          {/* Physical ID Card */}
          <div className="cs-card">
            <div className="cs-avatar">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" />
                <path d="M20 21a8 8 0 0 0-16 0" />
              </svg>
            </div>
            <div className="cs-who">
              {studentName}
              <small>{program}</small>
            </div>
          </div>

          {/* Sleeve & Lip */}
          <div className="cs-sleeve">
            <div className="cs-lip" />
            <div className="cs-tab" />

            {/* Dot Matrix LCD Display */}
            <div className="cs-screen">
              <div className="cs-row">
                <span className="cs-lbl">Identity</span>
                <span className={`cs-val ${isIn ? 'done' : ''}`}>
                  <span className="t">{isIn ? 'Verified' : ''}</span>
                  <span className="ok">
                    <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
                  </span>
                </span>
              </div>

              <div className="cs-row">
                <span className="cs-lbl">Role</span>
                <span className={`cs-val ${isIn ? 'done' : ''}`}>
                  <span className="t">{isIn ? role : ''}</span>
                  <span className="ok">
                    <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
                  </span>
                </span>
              </div>

              <div className="cs-row">
                <span className="cs-lbl">Standing</span>
                <span className={`cs-val ${isIn ? 'done' : ''}`}>
                  <span className="t">{isIn ? 'Active 3.9' : ''}</span>
                  <span className="ok">
                    <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
                  </span>
                </span>
              </div>

              <div className="cs-row">
                <span className="cs-lbl">Access</span>
                <span className={`cs-val ${isIn ? 'done' : ''}`}>
                  <span className="t">{isIn ? 'Full Pass' : ''}</span>
                  <span className="ok">
                    <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
                  </span>
                </span>
              </div>
            </div>

            {/* Tactile Hardware Grip Ridges */}
            <div className="cs-ridges">
              <i /><i /><i /><i /><i /><i /><i /><i />
            </div>
          </div>

          {/* Blueprint Measurement Callout Tags */}
          <div className="cs-co">
            <div className="t" style={{ left: '10%', top: '4%' }}>376 x 240 px · r 28</div>
            <div className="t" style={{ right: '6%', top: '62%' }}>430 x 212 px · LCD</div>
          </div>

        </div>
      </div>
    </div>
  )
}
