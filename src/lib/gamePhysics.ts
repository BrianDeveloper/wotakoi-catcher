import { CAPSULE_RADIUS, BOUNDS } from '../constants/game'
import type { CapsulePosition, InitialNode } from '../types'

interface PackNode {
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
}

export function simulatePacking(count: number, initialNodes?: InitialNode[]): CapsulePosition[] {
  const nodes: PackNode[] = initialNodes ? initialNodes.map((n) => ({
    x: n.x + CAPSULE_RADIUS,
    y: n.y + CAPSULE_RADIUS,
    vx: n.vx || (Math.random() - 0.5) * 4,
    vy: n.vy || (Math.random() - 0.5) * 4,
    rotation: n.rotation,
  })) : Array.from({ length: count }).map(() => ({
    x: BOUNDS.minX + CAPSULE_RADIUS + Math.random() * (BOUNDS.maxX - BOUNDS.minX - CAPSULE_RADIUS * 2),
    y: Math.random() * 100, // Drop from top
    vx: (Math.random() - 0.5) * 4,
    vy: (Math.random() - 0.5) * 4,
    rotation: Math.random() * 360,
  }))

  const iterations = 400
  const gravity = 0.8
  const damping = 0.7
  const restitution = 0.2

  for (let step = 0; step < iterations; step++) {
    for (let i = 0; i < count; i++) {
      let n = nodes[i]
      n.vy += gravity

      n.x += n.vx
      n.y += n.vy

      if (n.y + CAPSULE_RADIUS > BOUNDS.maxY) {
        n.y = BOUNDS.maxY - CAPSULE_RADIUS
        n.vy *= -restitution
        n.vx *= damping
      }

      if (n.x - CAPSULE_RADIUS < BOUNDS.minX) {
        n.x = BOUNDS.minX + CAPSULE_RADIUS
        n.vx *= -restitution
      }
      if (n.x + CAPSULE_RADIUS > BOUNDS.maxX) {
        n.x = BOUNDS.maxX - CAPSULE_RADIUS
        n.vx *= -restitution
      }
    }

    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        let dx = nodes[j].x - nodes[i].x
        let dy = nodes[j].y - nodes[i].y
        let distSq = dx * dx + dy * dy
        let minDist = CAPSULE_RADIUS * 2
        if (distSq < minDist * minDist && distSq > 0) {
          let dist = Math.sqrt(distSq)
          let overlap = minDist - dist
          let nx = dx / dist
          let ny = dy / dist

          nodes[i].x -= nx * overlap * 0.5
          nodes[i].y -= ny * overlap * 0.5
          nodes[j].x += nx * overlap * 0.5
          nodes[j].y += ny * overlap * 0.5

          let dvx = nodes[j].vx - nodes[i].vx
          let dvy = nodes[j].vy - nodes[i].vy
          let dot = dvx * nx + dvy * ny
          if (dot < 0) {
            let impulse = dot * (1 + restitution) * 0.5
            nodes[i].vx += nx * impulse
            nodes[i].vy += ny * impulse
            nodes[j].vx -= nx * impulse
            nodes[j].vy -= ny * impulse
          }
        }
      }
    }
  }

  return nodes.map(n => ({
    x: n.x - CAPSULE_RADIUS,
    y: n.y - CAPSULE_RADIUS,
    rotation: n.rotation,
  }))
}

export function generateCapsulePositions(count: number): CapsulePosition[] {
  return simulatePacking(count)
}