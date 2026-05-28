import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Table, Tag, Spin, message, Row, Col, Skeleton } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import request from '../utils/request'
import EmptyState from '../components/EmptyState'

interface StudentItem {
  id: number
  name: string
  student_no: string
  latest_total_score: number | null
  latest_class_rank: number | null
}

interface TrendItem {
  exam_name: string
  total_score: number
  class_rank: number
}

interface ProfileData {
  student: {
    name: string
    student_no: string
  }
  trend: TrendItem[]
  subject_radar: Record<string, number>
  weak_points: string[]
}

const StudentProfilePage = () => {
  const { classId } = useParams()
  const navigate = useNavigate()
  const [students, setStudents] = useState<StudentItem[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>(undefined)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loadingList, setLoadingList] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(false)

  useEffect(() => {
    if (!classId) {
      const storedClassId = localStorage.getItem('currentClassId')
      if (storedClassId) {
        navigate(`/students/${storedClassId}`, { replace: true })
      }
      return
    }
    setLoadingList(true)
    request
      .get<StudentItem[]>(`/students/classes/${classId}`)
      .then((res) => {
        setStudents(res.data)
        if (res.data.length > 0) {
          setSelectedStudentId(res.data[0].id)
        }
      })
      .catch(() => message.error('获取学生列表失败'))
      .finally(() => setLoadingList(false))
  }, [classId, navigate])

  useEffect(() => {
    if (!selectedStudentId) return
    setLoadingProfile(true)
    request
      .get<ProfileData>(`/students/${selectedStudentId}/profile`)
      .then((res) => setProfile(res.data))
      .catch(() => message.error('获取学生画像失败'))
      .finally(() => setLoadingProfile(false))
  }, [selectedStudentId])

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

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name', render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { title: '考号', dataIndex: 'student_no', key: 'student_no' },
    {
      title: '最新总分',
      dataIndex: 'latest_total_score',
      key: 'latest_total_score',
      render: (v: number | null) => (v !== null && v !== undefined ? v : '-'),
    },
    {
      title: '最新班名次',
      dataIndex: 'latest_class_rank',
      key: 'latest_class_rank',
      render: (v: number | null) =>
        v !== null && v !== undefined ? (
          <span style={{ fontWeight: 600, color: v <= 3 ? '#2563eb' : '#475569' }}>{v}</span>
        ) : (
          '-'
        ),
    },
  ]

  const trendOption = {
    title: { text: '成绩趋势', left: 'center', textStyle: { fontSize: 14, fontWeight: 600, color: '#1e293b' } },
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#334155' } },
    grid: { left: '8%', right: '8%', bottom: '12%' },
    xAxis: {
      type: 'category',
      data: profile?.trend.map((t) => t.exam_name) || [],
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { color: '#64748b', rotate: 20 },
    },
    yAxis: { type: 'value', name: '总分', axisLine: { show: false }, splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: { color: '#64748b' } },
    series: [
      {
        data: profile?.trend.map((t) => t.total_score) || [],
        type: 'line',
        smooth: true,
        itemStyle: { color: '#3b82f6' },
        lineStyle: { width: 3 },
        areaStyle: { color: 'rgba(59,130,246,0.1)' },
        symbolSize: 8,
      },
    ],
  }

  const radarOption = (() => {
    const subjects = Object.keys(profile?.subject_radar || {})
    const values = subjects.map((s) => profile?.subject_radar[s] || 0)
    return {
      title: { text: '学科雷达', left: 'center', textStyle: { fontSize: 14, fontWeight: 600, color: '#1e293b' } },
      tooltip: {},
      radar: {
        indicator: subjects.map((s) => ({ name: s, max: 100 })),
        axisName: { color: '#64748b' },
        splitArea: { areaStyle: { color: ['#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1'] } },
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: values,
              name: '得分',
              areaStyle: { color: 'rgba(59,130,246,0.25)' },
              itemStyle: { color: '#3b82f6' },
              lineStyle: { width: 2 },
            },
          ],
        },
      ],
    }
  })()

  return (
    <div className="page-fade-in">
      <h2 style={{ margin: 0, fontWeight: 600, fontSize: 20, marginBottom: 24 }}>学生画像</h2>
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Card title="学生列表" size="small" className="card-hover">
            {loadingList && students.length === 0 ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : students.length === 0 ? (
              <EmptyState
                description="暂无学生数据，请先导入成绩"
                action={{ text: '去导入成绩', onClick: () => navigate(`/import/${classId}`) }}
              />
            ) : (
              <Table
                dataSource={students}
                columns={columns}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ y: 500 }}
                rowClassName={(record) =>
                  record.id === selectedStudentId ? 'ant-table-row-selected' : ''
                }
                onRow={(record) => ({
                  onClick: () => setSelectedStudentId(record.id),
                  style: { cursor: 'pointer' },
                })}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Spin spinning={loadingProfile}>
            {profile ? (
              <>
                <Card size="small" style={{ marginBottom: 16 }} className="card-hover">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        background: '#eff6ff',
                        color: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                      }}
                    >
                      <UserOutlined />
                    </div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
                        {profile.student.name}
                        <span style={{ fontSize: 14, fontWeight: 400, color: '#94a3b8', marginLeft: 12 }}>
                          考号: {profile.student.student_no}
                        </span>
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <span style={{ color: '#64748b', fontSize: 13 }}>薄弱学科：</span>
                        {profile.weak_points.length > 0 ? (
                          profile.weak_points.map((wp) => (
                            <Tag color="red" key={wp} style={{ borderRadius: 4 }}>
                              {wp}
                            </Tag>
                          ))
                        ) : (
                          <Tag color="green" style={{ borderRadius: 4 }}>暂无薄弱学科</Tag>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                <Row gutter={16}>
                  <Col xs={24} lg={12}>
                    <Card size="small" className="card-hover">
                      <ReactECharts option={trendOption} style={{ height: 300 }} />
                    </Card>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Card size="small" className="card-hover">
                      <ReactECharts option={radarOption} style={{ height: 300 }} />
                    </Card>
                  </Col>
                </Row>
              </>
            ) : (
              <Card className="card-hover">
                <EmptyState description="选择左侧学生查看画像" />
              </Card>
            )}
          </Spin>
        </Col>
      </Row>
    </div>
  )
}

export default StudentProfilePage
