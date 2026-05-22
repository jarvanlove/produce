import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Row, Col, Statistic, Select, Table, Button, message, Spin } from 'antd'
import ReactECharts from 'echarts-for-react'
import request from '../utils/request'

interface ExamItem {
  id: number
  name: string
  exam_date: string
}

interface StatsData {
  class_name: string
  exam_name: string
  class_avg: number
  std_dev: number
  pass_rate: number
  excellent_rate: number
  score_distribution: { range: string; count: number }[]
  student_count: number
}

interface ScoreItem {
  student_name: string
  student_no: string
  total_score: number
  class_rank: number
  subject_scores: Record<string, number>
}

const DashboardPage = () => {
  const { classId, examId } = useParams()
  const navigate = useNavigate()
  const [exams, setExams] = useState<ExamItem[]>([])
  const [selectedExamId, setSelectedExamId] = useState<number | undefined>(
    examId ? parseInt(examId) : undefined
  )
  const [stats, setStats] = useState<StatsData | null>(null)
  const [scores, setScores] = useState<ScoreItem[]>([])
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
    Promise.all([
      request.get<StatsData>(`/dashboard/classes/${classId}/exams/${selectedExamId}/stats`),
      request.get<ScoreItem[]>(`/dashboard/classes/${classId}/exams/${selectedExamId}/scores`),
    ])
      .then(([statsRes, scoresRes]) => {
        setStats(statsRes.data)
        setScores(scoresRes.data)
      })
      .catch(() => message.error('获取数据失败'))
      .finally(() => setLoading(false))
  }, [classId, selectedExamId])

  const distChartOption = {
    title: { text: '分数段分布', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: stats?.score_distribution.map((d) => d.range) || [] },
    yAxis: { type: 'value' },
    series: [
      {
        data: stats?.score_distribution.map((d) => d.count) || [],
        type: 'bar',
        itemStyle: { color: '#5470c6' },
      },
    ],
  }

  const scoreColumns = [
    { title: '姓名', dataIndex: 'student_name', key: 'student_name' },
    { title: '考号', dataIndex: 'student_no', key: 'student_no' },
    { title: '总分', dataIndex: 'total_score', key: 'total_score', sorter: (a: ScoreItem, b: ScoreItem) => a.total_score - b.total_score },
    { title: '班名次', dataIndex: 'class_rank', key: 'class_rank' },
  ]

  return (
    <Spin spinning={loading}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>学情仪表盘</h2>
          <div>
            <Select
              style={{ width: 200, marginRight: 8 }}
              placeholder="选择考试"
              value={selectedExamId}
              onChange={(value) => setSelectedExamId(value)}
              options={exams.map((e) => ({ label: `${e.name} (${e.exam_date})`, value: e.id }))}
            />
            <Button type="primary" onClick={() => navigate(`/report/${classId}/${selectedExamId}`)}>
              生成AI报告
            </Button>
          </div>
        </div>

        {stats && (
          <>
            <Row gutter={16}>
              <Col span={6}>
                <Card><Statistic title="班级均分" value={stats.class_avg} /></Card>
              </Col>
              <Col span={6}>
                <Card><Statistic title="标准差" value={stats.std_dev} /></Card>
              </Col>
              <Col span={6}>
                <Card><Statistic title="及格率" value={stats.pass_rate * 100} precision={1} suffix="%" /></Card>
              </Col>
              <Col span={6}>
                <Card><Statistic title="优秀率" value={stats.excellent_rate * 100} precision={1} suffix="%" /></Card>
              </Col>
            </Row>

            <Card style={{ marginTop: 16 }}>
              <ReactECharts option={distChartOption} style={{ height: 300 }} />
            </Card>

            <Card title="学生成绩明细" style={{ marginTop: 16 }}>
              <Table
                dataSource={scores}
                columns={scoreColumns}
                rowKey="student_no"
                pagination={{ pageSize: 10 }}
                size="small"
              />
            </Card>
          </>
        )}

        {!stats && !loading && (
          <Card style={{ marginTop: 16, textAlign: 'center' }}>
            <p>暂无考试数据，请先导入成绩</p>
            <Button type="primary" onClick={() => navigate(`/import/${classId}`)}>
              去导入
            </Button>
          </Card>
        )}
      </div>
    </Spin>
  )
}

export default DashboardPage
