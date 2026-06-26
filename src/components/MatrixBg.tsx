import { useEffect, useRef } from "react"

export function MatrixBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext("2d")
    if (!context) return

    const cvs = canvas
    const ctx = context

    function resize() {
      cvs.width = window.innerWidth
      cvs.height = window.innerHeight
    }
    resize()

    const alphabet = "01"
    const fontSize = 16
    const columns = Math.floor(cvs.width / fontSize)
    const drops: number[] = Array.from({ length: columns }, () => 1)

    function drawMatrix() {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
      ctx.fillRect(0, 0, cvs.width, cvs.height)

      ctx.fillStyle = "#00e55b"
      ctx.font = fontSize + 'px "JetBrains Mono"'

      for (let i = 0; i < drops.length; i++) {
        const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length))
        ctx.fillText(text, i * fontSize, drops[i] * fontSize)

        if (drops[i] * fontSize > cvs.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
    }

    const interval = setInterval(drawMatrix, 50)
    window.addEventListener("resize", resize)

    return () => {
      clearInterval(interval)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none opacity-[0.05] overflow-hidden"
    />
  )
}
