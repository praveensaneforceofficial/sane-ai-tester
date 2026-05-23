import React, { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { Zap, ArrowUp, ArrowDown, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useAnalyticsStore } from '../../store/analyticsStore'
import socketService from '../../services/socket'

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend, Filler
)

const fmt = (n) => {
  if (!n) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

const API_COLORS = {
  openai: { bg: '#6366f1', light: 'rgba(99,102,241,0.15)', border: '#6366f1' },
  ollama: { bg: '#10b981', light: 'rgba(16,185,129,0.15)', border: '#10b981' },
}

export default function TokenUsageChart() {
  const { tokenUsage, tokenLoading, fetchTokenUsage } = useAnalyticsStore()
  const [days, setDays] = useState(7)

  useEffect(() => {
    fetchTokenUsage(days)

    const handleUpdate = () => {
      fetchTokenUsage(days)
    }

    socketService.on('dashboard:update', handleUpdate)
    socketService.on('update-brain', handleUpdate)

    return () => {
      socketService.off('dashboard:update', handleUpdate)
      socketService.off('update-brain', handleUpdate)
    }
  }, [days, fetchTokenUsage])

  const data = tokenUsage || {}
  const totals = data.totals || { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0, call_count: 0 }
  const summary = data.summary || []
  const recent  = data.recent  || []
  const labels  = data.labels  || []
  const openaiD = data.openaiDaily || []
  const ollamaD = data.ollamaDaily || []

  // ── KPI Cards ──────────────────────────────────────────────
  const kpiCards = [
    {
      label: 'Total Tokens',
      value: fmt(totals.total_tokens),
      icon: Zap,
      color: '#6366f1',
      bg: '#eef2ff',
    },
    {
      label: 'Prompt Tokens',
      value: fmt(totals.prompt_tokens),
      icon: ArrowUp,
      color: '#f59e0b',
      bg: '#fffbeb',
    },
    {
      label: 'Completion Tokens',
      value: fmt(totals.completion_tokens),
      icon: ArrowDown,
      color: '#10b981',
      bg: '#ecfdf5',
    },
    {
      label: 'Total API Calls',
      value: fmt(totals.call_count),
      icon: Clock,
      color: '#3b82f6',
      bg: '#eff6ff',
    },
  ]

  // ── Bar chart: daily tokens by provider ───────────────────
  const barData = {
    labels: labels.length ? labels.map(l => l.slice(5)) : ['No data'],
    datasets: [
      {
        label: 'OpenAI',
        data: openaiD.length ? openaiD : [0],
        backgroundColor: API_COLORS.openai.bg,
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Ollama',
        data: ollamaD.length ? ollamaD : [0],
        backgroundColor: API_COLORS.ollama.bg,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8 } },
      tooltip: {
        backgroundColor: '#1e1b4b',
        titleColor: '#c7d2fe',
        bodyColor: '#e0e7ff',
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y)} tokens`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, stacked: false },
      y: { beginAtZero: true, grid: { color: '#f1f5f9' },
           ticks: { callback: (v) => fmt(v) } },
    },
  }

  // ── Doughnut: prompt vs completion ────────────────────────
  const promptPct = totals.total_tokens
    ? Math.round((totals.prompt_tokens / totals.total_tokens) * 100)
    : 50
  const completionPct = 100 - promptPct

  const doughnutData = {
    labels: [`Prompt (${promptPct}%)`, `Completion (${completionPct}%)`],
    datasets: [{
      data: [totals.prompt_tokens || 1, totals.completion_tokens || 1],
      backgroundColor: ['#6366f1', '#10b981'],
      borderWidth: 0,
      cutout: '72%',
    }],
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 } } },
      tooltip: {
        callbacks: { label: (ctx) => ` ${ctx.label}: ${fmt(ctx.parsed)} tokens` },
      },
    },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1e293b' }}>
            🧠 AI Token Usage
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>
            Real-time data from <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>ai_api_usage</code>
          </p>
        </div>
        <select
          value={days}
          onChange={e => setDays(Number(e.target.value))}
          style={{
            padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
            fontSize: 13, background: '#fff', color: '#475569', cursor: 'pointer',
          }}
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {kpiCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} style={{
              background: '#fff', borderRadius: 12, padding: '14px 16px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8, background: card.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={16} color={card.color} />
              </div>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                {tokenLoading ? '—' : card.value}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                {card.label}
              </p>
            </div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>

        {/* Bar Chart */}
        <div style={{
          background: '#fff', borderRadius: 12, padding: 20,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9',
        }}>
          <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 600, color: '#334155' }}>
            Daily Token Usage by Provider
          </p>
          <div style={{ height: 200 }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        {/* Doughnut */}
        <div style={{
          background: '#fff', borderRadius: 12, padding: 20,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9',
          display: 'flex', flexDirection: 'column',
        }}>
          <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 600, color: '#334155' }}>
            Prompt vs Completion
          </p>
          <div style={{ flex: 1, height: 180 }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Provider Summary Cards */}
      {summary.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${summary.length}, 1fr)`, gap: 12 }}>
          {summary.map((s) => {
            const col = API_COLORS[s.api_type] || API_COLORS.openai
            const successRate = s.call_count ? Math.round((s.success_count / s.call_count) * 100) : 0
            return (
              <div key={s.api_type} style={{
                background: '#fff', borderRadius: 12, padding: '16px 20px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: `1px solid ${col.light}`,
                borderLeft: `4px solid ${col.bg}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', background: col.bg,
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase' }}>
                    {s.api_type}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Total Tokens', value: fmt(s.total_tokens) },
                    { label: 'API Calls', value: s.call_count },
                    { label: 'Avg Response', value: `${s.avg_duration_ms}ms` },
                    { label: 'Success Rate', value: `${successRate}%` },
                  ].map(item => (
                    <div key={item.label}>
                      <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{item.label}</p>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Recent Calls Table */}
      {recent.length > 0 && (
        <div style={{
          background: '#fff', borderRadius: 12,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#334155' }}>
              Recent API Calls
            </p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Provider', 'Total', 'Prompt', 'Completion', 'Duration', 'Status', 'Time'].map(h => (
                    <th key={h} style={{
                      padding: '8px 16px', textAlign: 'left',
                      color: '#64748b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((row, i) => {
                  const col = API_COLORS[row.api_type] || API_COLORS.openai
                  const ts = new Date(row.timestamp)
                  return (
                    <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          background: col.light, color: col.bg,
                          padding: '2px 8px', borderRadius: 20, fontWeight: 600, fontSize: 11,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: col.bg }} />
                          {row.api_type}
                        </span>
                      </td>
                      <td style={{ padding: '8px 16px', fontWeight: 600, color: '#1e293b' }}>
                        {fmt(row.tokens_used)}
                      </td>
                      <td style={{ padding: '8px 16px', color: '#6366f1' }}>{fmt(row.prompt_tokens)}</td>
                      <td style={{ padding: '8px 16px', color: '#10b981' }}>{fmt(row.completion_tokens)}</td>
                      <td style={{ padding: '8px 16px', color: '#64748b' }}>{row.request_duration}ms</td>
                      <td style={{ padding: '8px 16px' }}>
                        {row.success
                          ? <CheckCircle size={14} color="#10b981" />
                          : <XCircle size={14} color="#ef4444" />}
                      </td>
                      <td style={{ padding: '8px 16px', color: '#94a3b8' }}>
                        {ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!tokenLoading && recent.length === 0 && (
        <div style={{
          background: '#f8fafc', borderRadius: 12, padding: 32, textAlign: 'center',
          border: '2px dashed #e2e8f0',
        }}>
          <Zap size={32} color="#cbd5e1" style={{ marginBottom: 8 }} />
          <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>
            No token usage logged yet. Trigger a Brain Agent to see data here.
          </p>
        </div>
      )}
    </div>
  )
}
