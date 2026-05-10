'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

type Variant = 'acier' | 'bronze'

const palettes: Record<Variant, { color: number; specular: number }> = {
  acier:  { color: 0xb5bcc7, specular: 0x6a7280 },
  bronze: { color: 0xc8985f, specular: 0x8a6535 },
}

function makeStriedBumpMap(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#888'
  ctx.fillRect(0, 0, 1024, 512)
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 6
  for (let y = 80; y < 432; y += 44) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(1024, y)
    ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.6)'
  ctx.lineWidth = 14
  for (let y = 80; y < 432; y += 44) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(1024, y)
    ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

interface MeshProps {
  variant: Variant
  rotateSpeed: number
}

function BouleMesh({ variant, rotateSpeed }: MeshProps) {
  const ref = useRef<THREE.Mesh>(null!)
  const bump = useMemo(() => makeStriedBumpMap(), [])
  const p = palettes[variant]
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * rotateSpeed
      ref.current.rotation.x = Math.sin(Date.now() * 0.0003) * 0.08
    }
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 96, 96]} />
      <meshPhongMaterial
        color={p.color}
        specular={p.specular}
        shininess={60}
        bumpMap={bump}
        bumpScale={0.08}
      />
    </mesh>
  )
}

interface Boule3DProps {
  size?: number
  variant?: Variant
  rotateSpeed?: number
  className?: string
}

export function Boule3D({
  size = 200,
  variant = 'acier',
  rotateSpeed = 0.4,
  className = '',
}: Boule3DProps) {
  return (
    <div className={className} style={{ width: size, height: size }}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.6} color="#fff4e0" />
        <directionalLight position={[3, 5, 2]} intensity={0.85} color="#ffffff" />
        <directionalLight position={[-3, 2, -2]} intensity={0.35} color="#b8d4e0" />
        <pointLight position={[0, -1, -3]} intensity={0.4} color="#fff0d0" />
        <BouleMesh variant={variant} rotateSpeed={rotateSpeed} />
      </Canvas>
    </div>
  )
}
