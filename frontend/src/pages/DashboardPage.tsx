import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Row, Col, Select, Table, Button, message, Skeleton, Modal, Form, InputNumber } from 'antd'
import { BookOutlined, FileTextOutlined, TeamOutlined, TrophyOutlined, RiseOutlined, BarChartOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import request from '../utils/request'
import EmptyState from '../components/EmptyState'

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

interface KnowledgePoint {
  id: number
  name: string
  parent_id: number | null
}

interface ExamMapping {
  mapping_id: number
  knowledge_point_id: number
  name: string
  max_score: number
}

interface MappingFormItem {
  subject: string
  knowledge_point_id?: number
  max_score?: number
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

  // 知识点映射配置相关
  const [mappingModalOpen, setMappingModalOpen] = useState(false)
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([])
  const [mappingForm] = Form.useForm()
  const [savingMapping, setSavingMapping] = useState(false)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!classId) {
      const storedClassId = localStorage.getItem('currentClassId')
      if (storedClassId) {
        navigate(`/dashboard/${storedClassId}`, { replace: true })
      }
      return
    }
    request
      .get<ExamItem[]>(`/dashboard/classes/${classId}/exams`)
      .then((res) => {
        setExams(res.data)
        if (!initializedRef.current && res.data.length > 0) {
          initializedRef.current = true
          setSelectedExamId(res.data[res.data.length - 1].id)
        }
      })
      .catch(() => message.error('获取考试列表失败'))
  }, [classId, navigate])

  useEffect(() => {
    if (!selectedExamId || !classId) return
    setLoading(true)
    const controller = new AbortController()
    Promise.all([
      request.get<StatsData>(`/dashboard/classes/${classId}/exams/${selectedExamId}/stats`, { signal: controller.signal }),
      request.get<ScoreItem[]>(`/dashboard/classes/${classId}/exams/${selectedExamId}/scores`, { signal: controller.signal }),
    ])
      .then(([statsRes, scoresRes]) => {
        if (!controller.signal.aborted) {
          setStats(statsRes.data)
          setScores(scoresRes.data)
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          message.error(err?.response?.data?.detail || '获取数据失败')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })
    return () => controller.abort()
  }, [classId, selectedExamId])

  // 获取科目列表（从成绩数据的 subject_scores 中提取）
  const getSubjectList = (): string[] => {
    if (scores.length === 0) return []
    const first = scores[0].subject_scores
    return Object.keys(first || {})
  }

  const openMappingModal = async () => {
    if (!selectedExamId || !classId) {
      message.warning('请先选择考试')
      return
    }
    const subjects = getSubjectList()
    if (subjects.length === 0) {
      message.warning('当前考试无科目数据，请先导入成绩')
      return
    }

    try {
      const [kpRes, mapRes] = await Promise.all([
        request.get<KnowledgePoint[]>(`/knowledge-points/classes/${classId}`),
        request.get<ExamMapping[]>(`/knowledge-points/classes/${classId}/exams/${selectedExamId}/mapping`),
      ])
      setKnowledgePoints(kpRes.data)

      // 初始化表单：每个科目对应一行
      const initialValues: { mappings: MappingFormItem[] } = { mappings: [] }
      subjects.forEach((subject) => {
        const existing = mapRes.data.find((m) => m.name === subject)
        initialValues.mappings.push({
          subject,
          knowledge_point_id: existing ? existing.knowledge_point_id : undefined,
          max_score: existing ? existing.max_score : 100,
        })
      })
      mappingForm.setFieldsValue(initialValues)
      setMappingModalOpen(true)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      message.error(detail || '加载知识点数据失败')
    }
  }

  const handleSaveMapping = async () => {
    try {
      const values = await mappingForm.validateFields()
      if (!selectedExamId || !classId) return

      setSavingMapping(true)
      const payload = (values.mappings as MappingFormItem[])
        .filter((m) => m.knowledge_point_id)
        .map((m) => ({
          knowledge_point_id: m.knowledge_point_id,
          max_score: m.max_score || 100,
        }))

      await request.post(`/knowledge-points/classes/${classId}/exams/${selectedExamId}/mapping`, payload)
      message.success('知识点映射已保存')
      setMappingModalOpen(false)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      if (detail) message.error(detail)
    } finally {
      setSavingMapping(false)
    }
  }

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

  const distChartOption = {
    title: { text: '分数段分布', left: 'center', textStyle: { fontSize: 16, fontWeight: 600, color: '#1e293b' } },
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#334155' } },
    xAxis: { type: 'category', data: stats?.score_distribution.map((d) => d.range) || [], axisLine: { lineStyle: { color: '#cbd5e1' } }, axisLabel: { color: '#64748b' } },
    yAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: { color: '#64748b' } },
    series: [
      {
        data: stats?.score_distribution.map((d) => d.count) || [],
        type: 'bar',
        itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
        barWidth: '50%',
      },
    ],
  }

  const scoreColumns = [
    { title: '姓名', dataIndex: 'student_name', key: 'student_name', render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { title: '考号', dataIndex: 'student_no', key: 'student_no' },
    { title: '总分', dataIndex: 'total_score', key: 'total_score', sorter: (a: ScoreItem, b: ScoreItem) => a.total_score - b.total_score },
    { title: '班名次', dataIndex: 'class_rank', key: 'class_rank', render: (v: number) => <span style={{ fontWeight: 600, color: v <= 3 ? '#2563eb' : '#475569' }}>{v}</span> },
  ]

  const statCards = stats ? [
    { title: '参考人数', value: stats.student_count, suffix: '人', icon: <TeamOutlined />, color: '#2563eb', bg: '#eff6ff' },
    { title: '班级均分', value: stats.class_avg, suffix: '分', icon: <BarChartOutlined />, color: '#059669', bg: '#ecfdf5' },
    { title: '及格率', value: (stats.pass_rate * 100).toFixed(1), suffix: '%', icon: <RiseOutlined />, color: '#d97706', bg: '#fffbeb' },
    { title: '优秀率', value: (stats.excellent_rate * 100).toFixed(1), suffix: '%', icon: <TrophyOutlined />, color: '#dc2626', bg: '#fef2f2' },
  ] : []

  return (
    <div className="page-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontWeight: 600, fontSize: 20 }}>学情仪表盘</h2>
        <div>
          <Select
            style={{ width: 220, marginRight: 8 }}
            placeholder="选择考试"
            value={selectedExamId}
            onChange={(value) => setSelectedExamId(value)}
            options={exams.map((e) => ({ label: `${e.name} (${e.exam_date})`, value: e.id }))}
          />
          <Button icon={<BookOutlined />} onClick={openMappingModal} style={{ marginRight: 8 }}>
            配置知识点
          </Button>
          <Button
            type="primary"
            disabled={!selectedExamId}
            icon={<FileTextOutlined />}
            onClick={() => navigate(`/report/${classId}/${selectedExamId}`)}
          >
            生成AI报告
          </Button>
        </div>
      </div>

      {loading && !stats ? (
        <Row gutter={16}>
          {[1, 2, 3, 4].map((i) => (
            <Col span={6} key={i}>
              <Card><Skeleton active paragraph={{ rows: 1 }} /></Card>
            </Col>
          ))}
        </Row>
      ) : stats ? (
        <>
          <Row gutter={16}>
            {statCards.map((s) => (
              <Col span={6} key={s.title}>
                <Card className="card-hover" bodyStyle={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                      {s.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>{s.title}</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>
                        {s.value}<span style={{ fontSize: 14, fontWeight: 400, color: '#94a3b8', marginLeft: 4 }}>{s.suffix}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          <Card style={{ marginTop: 16 }} className="card-hover">
            <ReactECharts option={distChartOption} style={{ height: 320 }} />
          </Card>

          <Card title="学生成绩明细" style={{ marginTop: 16 }} className="card-hover">
            <Table
              dataSource={scores}
              columns={scoreColumns}
              rowKey="student_no"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </Card>
        </>
      ) : (
        <Card>
          <EmptyState
            description="暂无考试数据，请先导入成绩"
            action={{ text: '去导入成绩', onClick: () => navigate(`/import/${classId}`) }}
          />
        </Card>
      )}

      <Modal
        title="配置考试知识点映射"
        open={mappingModalOpen}
        onOk={handleSaveMapping}
        onCancel={() => setMappingModalOpen(false)}
        okText="保存映射"
        cancelText="取消"
        width={640}
        confirmLoading={savingMapping}
      >
        <p style={{ color: '#666', marginBottom: 16 }}>
          将本次考试的各科目与知识点进行关联，系统将根据映射关系在热力图中展示各知识点的掌握情况。
          <br />
          如未配置映射，热力图将默认按原始科目名展示。
        </p>
        <Form form={mappingForm} layout="vertical">
          <Form.List name="mappings">
            {(fields) => (
              <>
                {fields.map((field) => {
                  const subject = mappingForm.getFieldValue(['mappings', field.name, 'subject'])
                  return (
                    <div key={field.key} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ width: 120, paddingTop: 5, fontWeight: 500 }}>{subject}</div>
                      <Form.Item
                        name={[field.name, 'knowledge_point_id']}
                        style={{ flex: 1, marginBottom: 0 }}
                        rules={[{ required: false }]}
                      >
                        <Select
                          placeholder="选择关联知识点"
                          allowClear
                          options={knowledgePoints.map((kp) => ({ label: kp.name, value: kp.id }))}
                        />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, 'max_score']}
                        style={{ width: 100, marginBottom: 0 }}
                        rules={[{ required: true, message: '必填' }]}
                      >
                        <InputNumber min={0} max={200} placeholder="满分" style={{ width: '100%' }} />
                      </Form.Item>
                    </div>
                  )
                })}
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  )
}

export default DashboardPage
