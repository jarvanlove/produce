import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Select, Spin, message } from 'antd'
import ReactECharts from 'echarts-for-react'
import request from '../utils/request'

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
    request
      .get<ExamItem[]>(`/dashboard/classes/${classId}/exams`)
      .then((res) => {
        setExams(res.data)
        if (!selectedExamId && res.data.length > 0) {
          setSelectedExamId(res.data[res.data.length - 1].id)
        }
      })
      .catch(() => message.error('获取考试列表失败'))
  }, [classId])

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
        <Empty description="请先选择班级">
          <Button type="primary" onClick={() => navigate('/classes')}>
            去班级列表
          </Button>
        </Empty>
      </Card>
    )
  }

  const option = heatmapData
    ? {
        tooltip: {
          position: 'top',
          formatter: (params: any) => {
            const student = heatmapData.students[params.data[1]]
            const kp = heatmapData.knowledge_points[params.data[0]]
            const score = params.data[2]
            return `${student}<br/>${kp}: ${score}`
          },
        },
        grid: {
          height: '70%',
          top: '10%',
          left: '15%',
          right: '10%',
        },
        xAxis: {
          type: 'category',
          data: heatmapData.knowledge_points,
          splitArea: { show: true },
          axisLabel: { rotate: 30, interval: 0 },
        },
        yAxis: {
          type: 'category',
          data: heatmapData.students.slice(0, 20),
          splitArea: { show: true },
          axisLabel: { interval: 0 },
        },
        visualMap: {
          min: 0,
          max: 100,
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: '5%',
          inRange: {
            color: ['#f0f9e8', '#bae4bc', '#7bccc4', '#43a2ca', '#0868ac'],
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
            label: { show: true, fontSize: 10 },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.5)',
              },
            },
          },
        ],
      }
    : {}

  return (
    <Spin spinning={loading}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>知识点热力图</h2>
          <Select
            style={{ width: 200 }}
            placeholder="选择考试"
            value={selectedExamId}
            onChange={(value) => {
              setSelectedExamId(value)
              navigate(`/heatmap/${classId}/${value}`, { replace: true })
            }}
            options={exams.map((e) => ({ label: `${e.name} (${e.exam_date})`, value: e.id }))}
          />
        </div>

        {heatmapData && heatmapData.students.length > 0 ? (
          <Card>
            <ReactECharts option={option} style={{ height: 600 }} />
          </Card>
        ) : (
          <Card style={{ textAlign: 'center' }}>
            <p>暂无数据，请先导入成绩</p>
          </Card>
        )}
      </div>
    </Spin>
  )
}

export default HeatmapPage
