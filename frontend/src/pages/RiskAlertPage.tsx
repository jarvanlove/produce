import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Row, Col, Select, Table, Button, message, Spin, Tag, Badge } from 'antd'
import request from '../utils/request'

interface ExamItem {
  id: number
  name: string
  exam_date: string
}

interface ClassItem {
  id: number
  name: string
  school_name: string
}

interface AlertItem {
  risk_type: string
  risk_level: string
  reason: string
  advice: string
}

interface RiskStudent {
  student_id: number
  student_name: string
  student_no: string
  alerts: AlertItem[]
}

interface RiskData {
  class_name: string
  exam_name: string
  summary: { high: number; medium: number; low: number }
  risk_students: RiskStudent[]
  student_count: number
}

const levelMap: Record<string, { color: string; text: string }> = {
  high: { color: 'red', text: '高风险' },
  medium: { color: 'orange', text: '中风险' },
  low: { color: 'blue', text: '低风险' },
}

const typeMap: Record<string, string> = {
  continuous_decline: '连续下滑',
  sharp_drop: '大幅退步',
  severe_imbalance: '偏科严重',
}

const RiskAlertPage = () => {
  const { classId, examId } = useParams()
  const navigate = useNavigate()
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [exams, setExams] = useState<ExamItem[]>([])
  const [selectedClassId, setSelectedClassId] = useState<number | undefined>(
    classId ? parseInt(classId) : undefined
  )
  const [selectedExamId, setSelectedExamId] = useState<number | undefined>(
    examId ? parseInt(examId) : undefined
  )
  const [riskData, setRiskData] = useState<RiskData | null>(null)
  const [loading, setLoading] = useState(false)

  // 加载班级列表（当无 classId 时）
  useEffect(() => {
    if (classId) return
    request
      .get<ClassItem[]>('/classes')
      .then((res) => setClasses(res.data))
      .catch(() => message.error('获取班级列表失败'))
  }, [classId])

  // 加载考试列表
  useEffect(() => {
    if (!selectedClassId) return
    request
      .get<ExamItem[]>(`/dashboard/classes/${selectedClassId}/exams`)
      .then((res) => {
        setExams(res.data)
        if (!selectedExamId && res.data.length > 0) {
          setSelectedExamId(res.data[res.data.length - 1].id)
        }
      })
      .catch(() => message.error('获取考试列表失败'))
  }, [selectedClassId])

  // 加载风险数据
  useEffect(() => {
    if (!selectedClassId || !selectedExamId) return
    setLoading(true)
    request
      .get<RiskData>(`/risk/classes/${selectedClassId}/exams/${selectedExamId}`)
      .then((res) => setRiskData(res.data))
      .catch(() => message.error('获取风险预警数据失败'))
      .finally(() => setLoading(false))
  }, [selectedClassId, selectedExamId])

  const handleClassChange = (value: number) => {
    setSelectedClassId(value)
    setSelectedExamId(undefined)
    setExams([])
    setRiskData(null)
    navigate(`/risk/${value}`)
  }

  const handleExamChange = (value: number) => {
    setSelectedExamId(value)
    if (selectedClassId) {
      navigate(`/risk/${selectedClassId}/${value}`)
    }
  }

  const columns = [
    { title: '姓名', dataIndex: 'student_name', key: 'student_name' },
    { title: '考号', dataIndex: 'student_no', key: 'student_no' },
    {
      title: '风险等级',
      key: 'risk_level',
      render: (_: unknown, record: RiskStudent) => {
        const maxLevel = record.alerts.some((a) => a.risk_level === 'high')
          ? 'high'
          : record.alerts.some((a) => a.risk_level === 'medium')
            ? 'medium'
            : 'low'
        const info = levelMap[maxLevel]
        return <Tag color={info.color}>{info.text}</Tag>
      },
    },
    {
      title: '风险类型',
      key: 'risk_types',
      render: (_: unknown, record: RiskStudent) => (
        <span>
          {record.alerts.map((a, i) => (
            <Tag key={i} style={{ marginBottom: 4 }}>
              {typeMap[a.risk_type] || a.risk_type}
            </Tag>
          ))}
        </span>
      ),
    },
    {
      title: '预警原因',
      key: 'reason',
      width: 280,
      render: (_: unknown, record: RiskStudent) => (
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          {record.alerts.map((a, i) => (
            <li key={i} style={{ marginBottom: 4 }}>{a.reason}</li>
          ))}
        </ul>
      ),
    },
    {
      title: '建议措施',
      key: 'advice',
      width: 280,
      render: (_: unknown, record: RiskStudent) => (
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          {record.alerts.map((a, i) => (
            <li key={i} style={{ marginBottom: 4 }}>{a.advice}</li>
          ))}
        </ul>
      ),
    },
  ]

  return (
    <Spin spinning={loading}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>风险预警</h2>
          <div>
            {!classId && (
              <Select
                style={{ width: 200, marginRight: 8 }}
                placeholder="选择班级"
                value={selectedClassId}
                onChange={handleClassChange}
                options={classes.map((c) => ({ label: `${c.name} (${c.school_name})`, value: c.id }))}
              />
            )}
            <Select
              style={{ width: 220 }}
              placeholder="选择考试"
              value={selectedExamId}
              onChange={handleExamChange}
              options={exams.map((e) => ({ label: `${e.name} (${e.exam_date})`, value: e.id }))}
            />
          </div>
        </div>

        {riskData && (
          <>
            <Row gutter={16}>
              <Col span={8}>
                <Card>
                  <Badge count={riskData.summary.high} style={{ backgroundColor: '#ff4d4f' }}>
                    <div style={{ padding: '0 12px' }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#ff4d4f' }}>{riskData.summary.high}</div>
                      <div style={{ color: '#666' }}>高风险学生</div>
                    </div>
                  </Badge>
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Badge count={riskData.summary.medium} style={{ backgroundColor: '#faad14' }}>
                    <div style={{ padding: '0 12px' }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#faad14' }}>{riskData.summary.medium}</div>
                      <div style={{ color: '#666' }}>中风险学生</div>
                    </div>
                  </Badge>
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Badge count={riskData.summary.low} style={{ backgroundColor: '#1890ff' }}>
                    <div style={{ padding: '0 12px' }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#1890ff' }}>{riskData.summary.low}</div>
                      <div style={{ color: '#666' }}>低风险学生</div>
                    </div>
                  </Badge>
                </Card>
              </Col>
            </Row>

            <Card
              title={`风险学生列表（共 ${riskData.risk_students.length} 人 / 班级 ${riskData.student_count} 人）`}
              style={{ marginTop: 16 }}
            >
              {riskData.risk_students.length > 0 ? (
                <Table
                  dataSource={riskData.risk_students}
                  columns={columns}
                  rowKey="student_id"
                  pagination={{ pageSize: 10 }}
                  size="small"
                />
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                  <p>本次考试暂未发现风险学生</p>
                </div>
              )}
            </Card>
          </>
        )}

        {!riskData && !loading && selectedClassId && exams.length === 0 && (
          <Card style={{ marginTop: 16, textAlign: 'center' }}>
            <p>该班级暂无考试数据，请先导入成绩</p>
            <Button type="primary" onClick={() => navigate(`/import/${selectedClassId}`)}>
              去导入
            </Button>
          </Card>
        )}
      </div>
    </Spin>
  )
}

export default RiskAlertPage
