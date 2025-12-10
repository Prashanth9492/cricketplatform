import { useState, useEffect, useRef } from "react"
import { X, Maximize2, Activity } from "lucide-react"
import axios from "axios"
import { socketService } from "@/lib/socket"
import { MatchStartNotification } from "./MatchStartNotification"

type Match = {
  _id: string
  matchId: string
  team1: string
  team2: string
  team1Logo?: string
  team2Logo?: string
  score?: string
  matchDate: Date
  tournament: string
  status: "upcoming" | "completed" | "live" | "scheduled"
  venue?: string
  currentInnings: number
  innings: Array<{
    inningsNumber: number
    battingTeam: string
    bowlingTeam: string
    runs: number
    wickets: number
    currentOver: number
    currentBall: number
    striker?: string
    nonStriker?: string
    bowler?: string
  }>
  batsmanStats: Array<{
    playerName: string
    runs: number
    ballsFaced: number
    fours: number
    sixes: number
    isOut: boolean
  }>
  result?: {
    winner?: string
  }
}

export function NativePiPScores() {
  const [showPermissionDialog, setShowPermissionDialog] = useState(false)
  const [isPiPActive, setIsPiPActive] = useState(false)
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [isStartingPiP, setIsStartingPiP] = useState(false)
  const [socketConnected, setSocketConnected] = useState(false)
  const [userDismissed, setUserDismissed] = useState(false)
  const [showMatchStartNotification, setShowMatchStartNotification] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const previousMatchStatusRef = useRef<string | null>(null)

  // Check localStorage on mount
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('pipDialogDismissed')
      console.log('📦 localStorage pipDialogDismissed:', dismissed)
      if (dismissed === 'true') {
        console.log('⚠️ User previously dismissed PiP dialog')
        setUserDismissed(true)
      }
    } catch (error) {
      console.warn('⚠️ localStorage access denied:', error)
      // If localStorage is blocked, just proceed without checking
    }
    
    // Check if PiP is already active
    if (document.pictureInPictureElement) {
      console.log('🎬 PiP already active on mount')
      setIsPiPActive(true)
      setShowPermissionDialog(false)
    }
  }, [])

  // Fetch live matches
  const fetchMatch = async () => {
    try {
      const response = await axios.get("http://localhost:5001/api/matches/live")
      const matches: Match[] = response.data

     

      // Find live match first
      const liveMatch = matches.find(m => m.status === "live")
      if (liveMatch) {
        // console.log('🔴 Found live match:', liveMatch.matchId, liveMatch.team1, 'vs', liveMatch.team2)
        setCurrentMatch(liveMatch)
        setLoading(false)
        return
      }

      // Otherwise find upcoming match
      const now = new Date()
      const upcomingMatches = matches
        .filter(m => m.status === "upcoming" && new Date(m.matchDate) >= now)
        .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime())

      if (upcomingMatches.length > 0) {
        setCurrentMatch(upcomingMatches[0])
      } else {
        // Show most recent completed match
        const completedMatches = matches
          .filter(m => m.status === "completed")
          .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())
        
        if (completedMatches.length > 0) {
          setCurrentMatch(completedMatches[0])
        }
      }

      setLoading(false)
    } catch (error) {
      // console.error("Error fetching match data:", error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatch()
    
    // Connect to Socket.IO for real-time updates
    const socket = socketService.connect()
    if (socket) {
      setSocketConnected(socket.connected)
      
      socket.on('connect', () => {
        // console.log('🟢 PiP connected to Socket.IO')
        setSocketConnected(true)
      })
      
      socket.on('disconnect', () => {
        // console.log('🔴 PiP disconnected from Socket.IO')
        setSocketConnected(false)
      })
      
      // Listen for real-time ball updates
      socketService.onBallUpdate((data) => {
        // console.log('⚡ PiP received ball update:', data)
        
        // If this is the current match, update it immediately
        if (currentMatch && data.matchId === currentMatch.matchId) {
          // console.log('✅ Updating current match with new data')
          setCurrentMatch(data.match)
          
          // Redraw canvas immediately for PiP
          if (isPiPActive) {
            drawScoreToCanvas()
          }
        } else {
          // Otherwise, refetch to get latest
          fetchMatch()
        }
      })
      
      // Listen for match started/ended
      socketService.onMatchStarted((match) => {
        console.log('🎯 PiP: Match started', match)
        setCurrentMatch(match)
        
        // Auto-show PiP dialog when match starts
        if (!isPiPActive && match.status === 'live') {
          console.log('🚀 Auto-showing PiP dialog because match just started!')
          setShowPermissionDialog(true)
          setUserDismissed(false)
          // Clear localStorage so dialog can show again
          try {
            localStorage.removeItem('pipDialogDismissed')
          } catch (error) {
            console.warn('⚠️ Could not clear localStorage:', error)
          }
        }
      })
    }
    
    // Polling fallback (reduced frequency since we have websockets)
    const interval = setInterval(fetchMatch, 30000) // Every 30 seconds as backup
    
    return () => {
      clearInterval(interval)
      socketService.offBallUpdate()
      socketService.offMatchStarted()
    }
  }, [currentMatch, isPiPActive])

  // Show permission dialog immediately when match is available
  useEffect(() => {
    console.log('🔍 Dialog check:', { loading, isPiPActive, showPermissionDialog, userDismissed })
    if (!loading && !isPiPActive && !showPermissionDialog && !userDismissed) {
      console.log('✅ Showing PiP permission dialog')
      // Show dialog immediately when entering the website (even without match)
      setShowPermissionDialog(true)
    }
  }, [loading, isPiPActive, showPermissionDialog, userDismissed])

  // Auto-show PiP dialog when match status changes to 'live'
  useEffect(() => {
    if (currentMatch) {
      const previousStatus = previousMatchStatusRef.current
      const currentStatus = currentMatch.status
      
      console.log('📊 Match status check:', { previousStatus, currentStatus, matchId: currentMatch.matchId })
      
      // If status changed from 'scheduled' to 'live', auto-show dialog
      if (previousStatus === 'scheduled' && currentStatus === 'live') {
        console.log('🎉 Match just went LIVE! Auto-showing PiP dialog')
        
        // Show match start notification
        setShowMatchStartNotification(true)
        
        // Show PiP dialog after a brief moment
        setTimeout(() => {
          setShowPermissionDialog(true)
          setUserDismissed(false)
          
          // Clear localStorage so dialog shows
          try {
            localStorage.removeItem('pipDialogDismissed')
          } catch (error) {
            console.warn('⚠️ Could not clear localStorage:', error)
          }
        }, 2000) // 2 second delay to let notification show first
      }
      
      // Update previous status
      previousMatchStatusRef.current = currentStatus
    }
  }, [currentMatch?.status, currentMatch?.matchId])

  // Draw Cricbuzz-style score on canvas
  const drawScoreToCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Canvas dimensions
    canvas.width = 800
    canvas.height = 250

    // Background - Cricbuzz green gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, "#09AA5B") // Cricbuzz green
    gradient.addColorStop(1, "#078C4A")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Top bar
    ctx.fillStyle = "#067A42"
    ctx.fillRect(0, 0, canvas.width, 50)

    // Title
    ctx.fillStyle = "#FFFFFF"
    ctx.font = "bold 20px Arial"
    ctx.fillText("LIVE CRICKET SCORE", 20, 32)

    // If no match available, show "No Live Matches"
    if (!currentMatch) {
      ctx.textAlign = "center"
      ctx.font = "bold 32px Arial"
      ctx.fillStyle = "#FFFFFF"
      ctx.fillText("No Live Matches Available", canvas.width / 2, canvas.height / 2)
      
      ctx.font = "16px Arial"
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
      ctx.fillText("Check back later for live cricket action!", canvas.width / 2, canvas.height / 2 + 40)
      return
    }

    // LIVE indicator
    if (currentMatch.status === "live") {
      const t = Date.now() / 1000
      const pulse = 5 + Math.abs(Math.sin(t * 3)) * 4

      // Pulsing red dot
      ctx.fillStyle = `rgba(255, 0, 0, ${0.3 + Math.abs(Math.sin(t * 3)) * 0.4})`
      ctx.beginPath()
      ctx.arc(canvas.width - 80, 25, pulse + 4, 0, 2 * Math.PI)
      ctx.fill()

      ctx.fillStyle = "#FF0000"
      ctx.beginPath()
      ctx.arc(canvas.width - 80, 25, pulse, 0, 2 * Math.PI)
      ctx.fill()

      ctx.fillStyle = "#FFFFFF"
      ctx.font = "bold 16px Arial"
      ctx.fillText("LIVE", canvas.width - 55, 31)
    }

    // Match info section
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)"
    ctx.fillRect(0, 50, canvas.width, 40)

    ctx.fillStyle = "#FFFFFF"
    ctx.font = "14px Arial"
    ctx.fillText(currentMatch.tournament, 20, 75)
    
    if (currentMatch.venue) {
      ctx.font = "12px Arial"
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
      ctx.fillText(currentMatch.venue, 20, 87)
    }

    // Date/Time
    const matchDate = new Date(currentMatch.matchDate)
    const dateStr = matchDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    const timeStr = matchDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
    ctx.font = "12px Arial"
    ctx.textAlign = "right"
    ctx.fillText(`${dateStr} • ${timeStr}`, canvas.width - 20, 75)

    // Teams and Score section
    const centerY = 140
    const teamSpacing = 50

    // Team 1
    ctx.textAlign = "left"
    ctx.fillStyle = "#FFFFFF"
    ctx.font = "bold 20px Arial"
    ctx.fillText(currentMatch.team1, 40, centerY - 10)

    // Team 2
    ctx.fillText(currentMatch.team2, 40, centerY + teamSpacing - 10)

    // VS divider
    ctx.font = "bold 14px Arial"
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)"
    ctx.textAlign = "center"
    ctx.fillText("VS", 25, centerY + 20)

    // Score display with batsman stats
    if (currentMatch.status === "live" && currentMatch.innings && currentMatch.innings.length > 0) {
      const currentInnings = currentMatch.innings[currentMatch.currentInnings - 1]
      
      // console.log('🏏 PiP Drawing:', {
      //   battingTeam: currentInnings.battingTeam,
      //   striker: currentInnings.striker,
      //   nonStriker: currentInnings.nonStriker,
      //   batsmanStats: currentMatch.batsmanStats
      // })
      
      // Batting team indicator
      ctx.textAlign = "left"
      ctx.font = "bold 14px Arial"
      ctx.fillStyle = "#FFD700"
      ctx.fillText(`${currentInnings.battingTeam} - Batting`, 40, centerY - 35)
      
      // Main score (team total) - RIGHT SIDE
      ctx.textAlign = "right"
      ctx.font = "bold 48px 'Segoe UI', Arial, sans-serif"
      ctx.fillStyle = "#FFD700" // Gold color for scores
      
      // Add shadow for better readability
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)"
      ctx.shadowBlur = 6
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
      
      const scoreText = `${currentInnings.runs}/${currentInnings.wickets}`
      ctx.fillText(scoreText, canvas.width - 40, centerY + 25)
      
      // Reset shadow
      ctx.shadowColor = "transparent"
      ctx.shadowBlur = 0
      
      // Overs below score - RIGHT SIDE
      ctx.font = "bold 20px Arial"
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
      const oversText = `(${currentInnings.currentOver}.${currentInnings.currentBall} overs)`
      ctx.fillText(oversText, canvas.width - 40, centerY + 50)
      
      // Remove batsmen section - only show team score
      
    } else if (currentMatch.score) {
      const scores = currentMatch.score.split(" vs ")
      
      ctx.textAlign = "right"
      ctx.font = "bold 28px Arial"
      ctx.fillStyle = "#FFD700" // Gold color for scores
      
      if (scores.length >= 1) {
        ctx.fillText(scores[0], canvas.width - 40, centerY - 10)
      }
      
      if (scores.length >= 2) {
        ctx.fillText(scores[1], canvas.width - 40, centerY + teamSpacing - 10)
      }
    } else {
      // Show status if no score
      ctx.textAlign = "right"
      ctx.font = "italic 16px Arial"
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
      ctx.fillText(
        currentMatch.status === "upcoming" ? "Match Starting Soon" : "Match Ended",
        canvas.width - 40,
        centerY + 15
      )
    }

    // Winner display for completed matches
    if (currentMatch.status === "completed" && currentMatch.result?.winner) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
      ctx.fillRect(0, canvas.height - 35, canvas.width, 35)
      
      ctx.fillStyle = "#FFD700"
      ctx.font = "bold 16px Arial"
      ctx.textAlign = "center"
      ctx.fillText(`🏆 ${currentMatch.result.winner} WON`, canvas.width / 2, canvas.height - 12)
    }

    // Footer bar
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)"
    ctx.fillRect(0, canvas.height - 30, canvas.width, 30)

    ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
    ctx.font = "11px Arial"
    ctx.textAlign = "left"
    const now = new Date()
    ctx.fillText(`Updated: ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, 20, canvas.height - 10)

    ctx.textAlign = "right"
    ctx.fillText("College Cricket • Live Score Feed", canvas.width - 20, canvas.height - 10)
  }

  // Start native Picture-in-Picture
  const enterPiP = async () => {
    console.log('🎯 enterPiP called')
    
    // Check browser support first
    if (!document.pictureInPictureEnabled) {
      console.error('❌ Picture-in-Picture is not supported in this browser')
      alert('Your browser does not support Picture-in-Picture mode. Please try Chrome, Edge, or a modern browser.')
      return
    }
    
    if (isStartingPiP) {
      console.log('⏳ Already starting PiP, please wait...')
      return
    }
    setIsStartingPiP(true)

    try {
      const video = videoRef.current
      const canvas = canvasRef.current

      if (!video || !canvas) {
        console.error('❌ Video or canvas not ready')
        alert('Video or canvas element not found. Please refresh the page.')
        setIsStartingPiP(false)
        return
      }
      console.log('✅ Video and canvas ready')
      
      // Get canvas context to verify it works
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        console.error('❌ Could not get canvas context')
        alert('Canvas context not available. Please try a different browser.')
        setIsStartingPiP(false)
        return
      }

      // Draw initial frame (works even without currentMatch)
      drawScoreToCanvas()
      console.log('✅ Canvas drawn')
      
      // Verify canvas has content
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const hasContent = imageData.data.some(pixel => pixel !== 0)
      console.log('📊 Canvas has content:', hasContent)

      // Create stream from canvas
      const stream = canvas.captureStream(30) // 30 FPS
      if (!stream || stream.getTracks().length === 0) {
        console.error('❌ Failed to create stream from canvas')
        alert('Could not create video stream. Please try again.')
        setIsStartingPiP(false)
        return
      }
      video.srcObject = stream
      console.log('✅ Stream created with', stream.getTracks().length, 'tracks')

      // Wait for video to be ready
      console.log('⏳ Waiting for video to load...')
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.error('❌ Video loading timeout')
          reject(new Error("Video loading timeout"))
        }, 5000)

        const onReady = () => {
          clearTimeout(timeout)
          video.removeEventListener("loadedmetadata", onReady)
          console.log('✅ Video metadata loaded')
          resolve()
        }

        video.addEventListener("loadedmetadata", onReady)
        video.play().then(() => {
          console.log('✅ Video is playing')
        }).catch(reject)
      })

      // Check PiP support
      console.log('📊 PiP Status:', {
        enabled: document.pictureInPictureEnabled,
        currentElement: document.pictureInPictureElement
      })
      
      if (document.pictureInPictureEnabled && !document.pictureInPictureElement) {
        console.log('✅ Requesting PiP window...')
        const pipWindow = await video.requestPictureInPicture()
        console.log('✅ PiP window opened:', pipWindow.width, 'x', pipWindow.height)
        setIsPiPActive(true)
        setShowPermissionDialog(false)
        console.log('🎉 PiP activated successfully!')
      } else {
        console.error('❌ PiP not supported or already active')
        throw new Error("Picture-in-Picture not supported")
      }
    } catch (error) {
      console.error("❌ Failed to enter PiP mode:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert(`Picture-in-Picture failed: ${errorMessage}\n\nPlease ensure:\n1. You're using a modern browser (Chrome/Edge/Safari)\n2. You've allowed autoplay permissions\n3. The page is in focus`)
    } finally {
      setIsStartingPiP(false)
    }
  }

  const exitPiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      }
      setIsPiPActive(false)
    } catch (error) {
      // console.error("Failed to exit PiP mode:", error)
    }
  }

  // Continuous animation loop when PiP is active
  useEffect(() => {
    if (isPiPActive) {
      const animate = () => {
        drawScoreToCanvas()
        animationFrameRef.current = requestAnimationFrame(animate)
      }
      animate()

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }
    }
  }, [isPiPActive, currentMatch])

  // Handle PiP events
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleEnterPiP = () => {
      console.log('🎬 enterpictureinpicture event fired')
      setIsPiPActive(true)
    }
    
    const handleLeavePiP = () => {
      console.log('🚪 leavepictureinpicture event fired')
      setIsPiPActive(false)
    }

    video.addEventListener("enterpictureinpicture", handleEnterPiP)
    video.addEventListener("leavepictureinpicture", handleLeavePiP)

    return () => {
      video.removeEventListener("enterpictureinpicture", handleEnterPiP)
      video.removeEventListener("leavepictureinpicture", handleLeavePiP)
    }
  }, [])

  if (loading) return null

  return (
    <>
      {/* Match Start Notification */}
      {showMatchStartNotification && currentMatch && (
        <MatchStartNotification
          matchTitle={currentMatch.tournament || 'Cricket Match'}
          team1={currentMatch.team1}
          team2={currentMatch.team2}
          onDismiss={() => setShowMatchStartNotification(false)}
        />
      )}

      {/* Hidden video and canvas for PiP */}
      <video 
        ref={videoRef} 
        className="hidden" 
        muted 
        playsInline 
        autoPlay
        style={{ width: '800px', height: '250px' }}
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Permission Dialog */}
      {showPermissionDialog && !isPiPActive && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl shadow-2xl border-2 border-green-400/50 p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 bg-white rounded-full p-3">
                <Activity className="h-8 w-8 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-white text-xl font-bold mb-2">
                  {currentMatch?.status === 'live' ? '🔴 MATCH IS LIVE!' : '🏏 Enable Floating Live Score?'}
                </h3>
                <p className="text-white/90 text-sm mb-4">
                  {currentMatch?.status === 'live' 
                    ? 'The match has started! Enable floating scores to follow the action while multitasking.' 
                    : 'Get live cricket scores that float on top of all your apps - VSCode, Chrome, and more!'}
                </p>

                {/* Match Preview */}
                {currentMatch ? (
                  <div className="bg-black/30 rounded-lg p-4 mb-4 border border-white/20">
                    <div className="text-center mb-3">
                      <span className="text-white/80 text-xs font-semibold">{currentMatch.tournament}</span>
                      {currentMatch.status === "live" && (
                        <span className="ml-2 text-red-400 text-xs font-bold flex items-center justify-center gap-1 mt-1">
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          LIVE NOW
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-semibold">{currentMatch.team1}</span>
                        <span className="bg-yellow-400 text-black px-3 py-1 rounded font-bold">
                          {currentMatch.score?.split(" vs ")[0] || "TBA"}
                        </span>
                      </div>
                      <div className="text-center text-white/60 text-xs">VS</div>
                      <div className="flex items-center justify-between">
                        <span className="text-white font-semibold">{currentMatch.team2}</span>
                        <span className="bg-yellow-400 text-black px-3 py-1 rounded font-bold">
                          {currentMatch.score?.split(" vs ")[1] || "TBA"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-black/30 rounded-lg p-4 mb-4 border border-white/20">
                    <div className="text-center text-white/80">
                      <p className="text-sm">No live matches available</p>
                      <p className="text-xs mt-2 text-white/60">PiP will show updates when matches start</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowPermissionDialog(false)
                      setUserDismissed(true)
                      try {
                        localStorage.setItem('pipDialogDismissed', 'true')
                      } catch (error) {
                        console.warn('⚠️ Could not save to localStorage:', error)
                      }
                    }}
                    className="flex-1 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-colors"
                  >
                    Not Now
                  </button>
                  <button
                    onClick={enterPiP}
                    disabled={isStartingPiP}
                    className="flex-1 px-4 py-2.5 bg-white hover:bg-gray-100 text-green-700 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isStartingPiP ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-700 border-t-transparent" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Maximize2 className="h-4 w-4" />
                        {currentMatch?.status === 'live' ? 'Watch Live Now!' : 'Enable Float'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PiP Active Notification (small corner indicator) */}
      {/* {isPiPActive && (
        <div className="fixed bottom-4 right-4 z-[9998] bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom duration-300">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-semibold">PiP Active</span>
          <button
            onClick={exitPiP}
            className="ml-2 hover:bg-white/20 rounded p-1 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )} */}

      {/* Floating PiP Button - Shows if dialog dismissed and PiP not active */}
      {!showPermissionDialog && !isPiPActive && (
        <button
          onClick={() => {
            console.log('🔘 Floating PiP button clicked')
            // Reset dismissed state and show dialog
            setUserDismissed(false)
            try {
              localStorage.removeItem('pipDialogDismissed')
              console.log('✅ Cleared pipDialogDismissed from localStorage')
            } catch (error) {
              console.warn('⚠️ Could not clear localStorage:', error)
            }
            setShowPermissionDialog(true)
          }}
          className="fixed bottom-6 right-6 z-[9998] bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 flex items-center gap-2 group animate-pulse hover:animate-none"
          title="Enable Floating Live Score"
        >
          <Maximize2 className="h-6 w-6" />
          <span className="hidden group-hover:inline-block text-sm font-semibold mr-2 whitespace-nowrap">Live PiP</span>
        </button>
      )}
    </>
  )
}

export default NativePiPScores
