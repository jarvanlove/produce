import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Select, message, Skeleton } from 'antd'
import { FireOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import request from '../utils/request'
import EmptyState from '../components/EmptyState'

interface ExamItem {
  id: number
  name: string
  exam_date: string
}

interface HeatmapData {
  knowledge_points: string[]
  students: string[]
  data: number[][]
}

const HeatmapPage = () => {
  const { classId, examId } = useParams()
  const navigate = useNavigate()
  const [exams, setExams] = useState<ExamItem[]>([])
  const [selectedExamId, setSelectedExamId] = useState<number | undefined>(
    examId ? parseInt(examId) : undefined
  )
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!classId) {
      const storedClassId = localStorage.getItem('currentClassId')
      if (storedClassId) {
        navigate(`/heatmap/${storedClassId}`, { replace: true })
      }
      return
    }
    request
      .get<ExamItem[]>(`/dashboard/classes/${classId}/exams`)
      .then((res) => {
        setExams(res.data)
        if (!selectedExamId && res.data.length > 0) {
          setSelectedExamId(res.data[res.data.length - 1].id)
        }
      })
      .catch(() => message.error('获取考试列表失败'))
  }, [classId, navigate])

  useEffect(() => {
    if (!selectedExamId) return
    setLoading(true)
    request
      .get<HeatmapData>(`/heatmap/classes/${classId}/exams/${selectedExamId}`)
      .then((res) => {
        setHeatmapData(res.data)
      })
      .catch(() => message.error('获取热力图数据失败'))
      .finally(() => setLoading(false))
  }, [classId, selectedExamId])

  if (!classId) {
    return (
      <Card style={{ textAlign: 'center', marginTop: 80 }}>
        <EmptyState
          description="请先选择班级"
          action={{ text: '去班级列表', onClick: () => navigate('/classes') }}
        />
      </Card>
    )
  }

  const option = heatmapData
    ? {
        tooltip: {
          position: 'top',
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderColor: '#e2e8f0',
          textStyle: { color: '#334155' },
          formatter: (params: any) => {
            const student = heatmapData.students[params.data[1]]
            const kp = heatmapData.knowledge_points[params.data[0]]
            const score = params.data[2]
            return `<div style="font-weight:600;margin-bottom:4px">${student}</div><div style="color:#64748b">${kp}: <span style="color:#2563eb;font-weight:600">${score}</span></div>`
          },
        },
        grid: {
          height: '70%',
          top: '8%',
          left: '12%',
          right: '8%',
        },
        xAxis: {
          type: 'category',
          data: heatmapData.knowledge_points,
          splitArea: { show: true },
          axisLabel: { rotate: 35, interval: 0, color: '#475569', fontSize: 11 },
          axisLine: { lineStyle: { color: '#e2e8f0' } },
        },
        yAxis: {
          type: 'category',
          data: heatmapData.students.slice(0, 20),
          splitArea: { show: true },
          axisLabel: { interval: 0, color: '#475569', fontSize: 11 },
          axisLine: { lineStyle: { color: '#e2e8f0' } },
        },
        visualMap: {
          min: 0,
          max: 100,
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: '2%',
          textStyle: { color: '#64748b' },
          inRange: {
            color: ['#fef2f2', '#fecaca', '#f87171', '#dc2626', '#991b1b'],
          },
        },
        series: [
          {
            name: '掌握度',
            type: 'heatmap',
            data: heatmapData.data
              .slice(0, 20)
              .flatMap((row, y) =>
                row.map((val, x) => [x, y, val])
              ),
            label: { show: true, fontSize: 10, color: '#fff', textShadowColor: 'rgba(0,0,0,0.3)', textShadowBlur: 2 },
            emphasis: {
              itemStyle: {
                shadowBlur: 12,
                shadowColor: 'rgba(0, 0, 0, 0.3)',
                borderColor: '#1e293b',
                borderWidth: 2,
              },
            },
          },
        ],
      }
    : {}

  return (
    <div className="page-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FireOutlined style={{ fontSize: 22, color: '#dc2626' }} />
          <h2 style={{ margin: 0, fontWeight: 600, fontSize: 20 }}>知识点热力图</h2>
        </div>
        <Select
          style={{ width: 220 }}
          placeholder="选择考试"
          value={selectedExamId}
          onChange={(value) => {
            setSelectedExamId(value)
            navigate(`/heatmap/${classId}/${value}`, { replace: true })
          }}
          options={exams.map((e) => ({ label: `${e.name} (${e.exam_date})`, value: e.id }))}
        />
      </div>

      {loading && !heatmapData ? (
        <Card>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      ) : heatmapData && heatmapData.students.length > 0 ? (
        <Card className="card-hover">
          <ReactECharts option={option} style={{ height: 600 }} />
        </Card>
      ) : (
        <Card>
          <EmptyState
            description="暂无数据，请先导入成绩并配置知识点映射"
            action={{ text: '去导入', onClick: () => navigate(`/import/${classId}`) }}
          />
        </Card>
      )}
    </div>
  )
}

export default HeatmapPage
