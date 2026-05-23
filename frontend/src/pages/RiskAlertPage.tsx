import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Row, Col, Select, Table, message, Tag, Skeleton } from 'antd'
import { WarningOutlined, TeamOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons'
import request from '../utils/request'
import EmptyState from '../components/EmptyState'

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

const levelMap: Record<string, { color: string; text: string; bg: string; border: string }> = {
  high: { color: '#dc2626', text: '高风险', bg: '#fef2f2', border: '#fecaca' },
  medium: { color: '#d97706', text: '中风险', bg: '#fffbeb', border: '#fde68a' },
  low: { color: '#2563eb', text: '低风险', bg: '#eff6ff', border: '#bfdbfe' },
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
    if (classId) {
      setSelectedClassId(parseInt(classId))
      return
    }
    const storedClassId = localStorage.getItem('currentClassId')
    if (storedClassId) {
      navigate(`/risk/${storedClassId}`, { replace: true })
      return
    }
    request
      .get<ClassItem[]>('/classes')
      .then((res) => setClasses(res.data))
      .catch(() => message.error('获取班级列表失败'))
  }, [classId, navigate])

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
    { title: '姓名', dataIndex: 'student_name', key: 'student_name', render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { title: '考号', dataIndex: 'student_no', key: 'student_no' },
    {
      title: '风险等级',
      key: 'risk_level',
      width: 100,
      render: (_: unknown, record: RiskStudent) => {
        const maxLevel = record.alerts.some((a) => a.risk_level === 'high')
          ? 'high'
          : record.alerts.some((a) => a.risk_level === 'medium')
            ? 'medium'
            : 'low'
        const info = levelMap[maxLevel]
        return (
          <Tag style={{ color: info.color, background: info.bg, borderColor: info.border, borderRadius: 4, fontWeight: 600 }}>
            {info.text}
          </Tag>
        )
      },
    },
    {
      title: '风险类型',
      key: 'risk_types',
      width: 160,
      render: (_: unknown, record: RiskStudent) => (
        <div>
          {record.alerts.map((a, i) => (
            <Tag key={i} style={{ marginBottom: 4, borderRadius: 4 }}>
              {typeMap[a.risk_type] || a.risk_type}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: '预警原因',
      key: 'reason',
      width: 280,
      render: (_: unknown, record: RiskStudent) => (
        <ul style={{ margin: 0, paddingLeft: 16, color: '#475569' }}>
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
        <ul style={{ margin: 0, paddingLeft: 16, color: '#475569' }}>
          {record.alerts.map((a, i) => (
            <li key={i} style={{ marginBottom: 4 }}>{a.advice}</li>
          ))}
        </ul>
      ),
    },
  ]

  const summaryCards = riskData ? [
    { title: '高风险学生', value: riskData.summary.high, icon: <FallOutlined />, color: '#dc2626', bg: '#fef2f2' },
    { title: '中风险学生', value: riskData.summary.medium, icon: <WarningOutlined />, color: '#d97706', bg: '#fffbeb' },
    { title: '低风险学生', value: riskData.summary.low, icon: <RiseOutlined />, color: '#2563eb', bg: '#eff6ff' },
    { title: '班级总人数', value: riskData.student_count, icon: <TeamOutlined />, color: '#059669', bg: '#ecfdf5' },
  ] : []

  return (
    <div className="page-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontWeight: 600, fontSize: 20 }}>风险预警</h2>
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

      {loading && !riskData ? (
        <Row gutter={16}>
          {[1, 2, 3, 4].map((i) => (
            <Col span={6} key={i}>
              <Card><Skeleton active paragraph={{ rows: 1 }} /></Card>
            </Col>
          ))}
        </Row>
      ) : riskData ? (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            {summaryCards.map((s) => (
              <Col span={6} key={s.title}>
                <Card className="card-hover" bodyStyle={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                      {s.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>{s.title}</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>
                        {s.value}
                        <span style={{ fontSize: 14, fontWeight: 400, color: '#94a3b8', marginLeft: 4 }}>人</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          <Card
            title={`风险学生列表（共 ${riskData.risk_students.length} 人 / 班级 ${riskData.student_count} 人）`}
            className="card-hover"
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
              <EmptyState description="本次考试暂未发现风险学生，请继续保持关注" />
            )}
          </Card>
        </>
      ) : (
        <Card>
          <EmptyState
            description="该班级暂无考试数据，请先导入成绩"
            action={{ text: '去导入', onClick: () => navigate(`/import/${selectedClassId}`) }}
          />
        </Card>
      )}
    </div>
  )
}

export default RiskAlertPage
