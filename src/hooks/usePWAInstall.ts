import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    window.dispatchEvent(new CustomEvent('pwa-prompt-ready'))
  })
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(() => deferredPrompt)
  const [isInstallable, setIsInstallable] = useState(() => Boolean(deferredPrompt))
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIosDevice)

    const checkStandalone = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
        || (window.navigator as any).standalone === true
        || document.referrer.includes('android-app://')
      setIsInstalled(isStandalone)
    }
    checkStandalone()

    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt = e as BeforeInstallPromptEvent
      setInstallPrompt(deferredPrompt)
      setIsInstallable(true)
    }

    const onPromptReady = () => {
      if (deferredPrompt) {
        setInstallPrompt(deferredPrompt)
        setIsInstallable(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('pwa-prompt-ready', onPromptReady)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('pwa-prompt-ready', onPromptReady)
    }
  }, [])

  async function install() {
    const promptToUse = installPrompt || deferredPrompt
    if (!promptToUse) return false
    try {
      await promptToUse.prompt()
      const { outcome } = await promptToUse.userChoice
      if (outcome === 'accepted') {
        setIsInstalled(true)
        setIsInstallable(false)
      }
      deferredPrompt = null
      setInstallPrompt(null)
      return outcome === 'accepted'
    } catch {
      return false
    }
  }

  return {
    isInstallable,
    canInstall: isInstallable || isIOS,
    hasNativePrompt: Boolean(installPrompt || deferredPrompt),
    isInstalled,
    isIOS,
    install
  }
}
