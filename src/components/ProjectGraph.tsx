/**
 * ProjectGraph — lightweight force-directed graph visualizing relationships
 * between Person, Organizations, and Projects.
 *
 * Reads directly from the structured registry (data/projects.ts) and
 * config/projects.ts to compute edges.
 *
 * Relationships rendered:
 *   Person  --founder-->  Organization
 *   Organization --developer--> Project  (owner match)
 *   Person --creator--> Project  (all projects)
 */

import * as d3 from 'd3'
import { useEffect, useRef, useState } from 'react'

import { GlassCard } from '@/components/ui/glass-card'
import { PROJECT_REGISTRY } from '@/data/projects'

// ── Graph data model ──

interface GraphNode extends d3.SimulationNodeDatum {
  id: string
  label: string
  type: 'person' | 'organization' | 'project'
  color: string
  url?: string
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  relationship: string
}

function buildGraphData(): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = []
  const links: GraphLink[] = []
  const seen = new Set<string>()

  // Person node
  const personId = 'devon-tyler-barber'
  nodes.push({ id: personId, label: 'Devon Tyler Barber', type: 'person', color: '#a78bfa' })
  seen.add(personId)

  // Derive unique owners → organizations
  const owners = new Map<string, string | undefined>()
  for (const p of PROJECT_REGISTRY) {
    if (p.owner && !owners.has(p.owner)) {
      owners.set(p.owner, p.url)
    }
  }

  for (const [name, url] of owners) {
    const orgId = name.toLowerCase().replace(/\s+/g, '-')
    if (!seen.has(orgId)) {
      nodes.push({ id: orgId, label: name, type: 'organization', color: '#34d399', url })
      seen.add(orgId)
      links.push({ source: personId, target: orgId, relationship: 'founder' })
    }
  }

  // Project nodes + edges
  for (const p of PROJECT_REGISTRY) {
    if (!seen.has(p.id)) {
      nodes.push({ id: p.id, label: p.name, type: 'project', color: '#60a5fa', url: p.url })
      seen.add(p.id)
    }

    // person → project (creator)
    links.push({ source: personId, target: p.id, relationship: 'creator' })

    // organization → project (developer)
    if (p.owner) {
      const orgId = p.owner.toLowerCase().replace(/\s+/g, '-')
      links.push({ source: orgId, target: p.id, relationship: 'developer' })
    }
  }

  return { nodes, links }
}

// ── Component ──

const NODE_RADIUS: Record<string, number> = { person: 22, organization: 18, project: 12 }
const TYPE_LABELS: Record<string, string> = { person: 'Person', organization: 'Organization', project: 'Project' }

export default function ProjectGraph() {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: GraphNode } | null>(null)

  useEffect(() => {
    const svg = svgRef.current
    const container = containerRef.current
    if (!svg || !container) return

    const width = container.clientWidth
    const height = 420

    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)

    const { nodes, links } = buildGraphData()

    const sel = d3.select(svg)
    sel.selectAll('*').remove()

    const g = sel.append('g')

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 3])
      .on('zoom', (event) => g.attr('transform', event.transform))
    sel.call(zoom)

    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(90))
      .force('charge', d3.forceManyBody().strength(-260))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<GraphNode>().radius(d => (NODE_RADIUS[d.type] || 12) + 8))

    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#334155')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', (d) => d.relationship === 'creator' ? '4 2' : 'none')

    // Nodes
    const node = g.append('g')
      .selectAll<SVGCircleElement, GraphNode>('circle')
      .data(nodes)
      .join('circle')
      .attr('r', d => NODE_RADIUS[d.type] || 12)
      .attr('fill', d => d.color)
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 2)
      .attr('cursor', 'grab')
      .on('mouseenter', (_event, d) => {
        const el = svg.getBoundingClientRect()
        setTooltip({ x: (d.x ?? 0) + el.left, y: (d.y ?? 0) + el.top - 30, node: d })
      })
      .on('mouseleave', () => setTooltip(null))
      .call(
        d3.drag<SVGCircleElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          }),
      )

    // Labels
    const labels = g.append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text(d => d.label)
      .attr('fill', '#cbd5e1')
      .attr('font-size', d => d.type === 'person' ? 11 : d.type === 'organization' ? 10 : 9)
      .attr('text-anchor', 'middle')
      .attr('dy', d => (NODE_RADIUS[d.type] || 12) + 14)
      .attr('pointer-events', 'none')

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x ?? 0)
        .attr('y1', d => (d.source as GraphNode).y ?? 0)
        .attr('x2', d => (d.target as GraphNode).x ?? 0)
        .attr('y2', d => (d.target as GraphNode).y ?? 0)

      node
        .attr('cx', d => d.x ?? 0)
        .attr('cy', d => d.y ?? 0)

      labels
        .attr('x', d => d.x ?? 0)
        .attr('y', d => d.y ?? 0)
    })

    return () => { simulation.stop() }
  }, [])

  return (
    <section aria-labelledby="graph-heading" className="mb-10">
      <h2 id="graph-heading" className="text-2xl font-bold mb-6">Ecosystem Graph</h2>
      <GlassCard intensity="medium" className="p-4 overflow-hidden relative">
        <div ref={containerRef} className="w-full" style={{ minHeight: 420 }}>
          <svg ref={svgRef} className="w-full" style={{ height: 420 }} />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 justify-center text-xs text-muted-foreground">
          {[
            { color: '#a78bfa', label: 'Person' },
            { color: '#34d399', label: 'Organization' },
            { color: '#60a5fa', label: 'Project' },
          ].map(item => (
            <span key={item.label} className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />
              {item.label}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-6 border-t border-dashed border-muted-foreground" aria-hidden="true" />
            creator
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-6 border-t border-muted-foreground" aria-hidden="true" />
            developer / founder
          </span>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="fixed z-50 rounded-lg border border-border/50 bg-card/95 backdrop-blur-lg px-3 py-2 text-xs shadow-xl pointer-events-none"
            style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
          >
            <div className="font-semibold">{tooltip.node.label}</div>
            <div className="text-muted-foreground">{TYPE_LABELS[tooltip.node.type]}</div>
          </div>
        )}
      </GlassCard>
    </section>
  )
}
