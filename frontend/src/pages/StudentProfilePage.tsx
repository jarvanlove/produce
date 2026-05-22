import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Table, Tag, Spin, message, Row, Col } from 'antd'
import ReactECharts from 'echarts-for-react'
import request from '../utils/request'

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
  const [students, setStudents] = useState<StudentItem[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>(undefined)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loadingList, setLoadingList] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(false)

  useEffect(() => {
    if (!classId) return
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
  }, [classId])

  useEffect(() => {
    if (!selectedStudentId) return
    setLoadingProfile(true)
    request
      .get<ProfileData>(`/students/${selectedStudentId}/profile`)
      .then((res) => setProfile(res.data))
      .catch(() => message.error('获取学生画像失败'))
      .finally(() => setLoadingProfile(false))
  }, [selectedStudentId])

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
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
      render: (v: number | null) => (v !== null && v !== undefined ? v : '-'),
    },
  ]

  const trendOption = {
    title: { text: '成绩趋势', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: profile?.trend.map((t) => t.exam_name) || [],
    },
    yAxis: { type: 'value', name: '总分' },
    series: [
      {
        data: profile?.trend.map((t) => t.total_score) || [],
        type: 'line',
        smooth: true,
        itemStyle: { color: '#5470c6' },
      },
    ],
  }

  const radarOption = (() => {
    const subjects = Object.keys(profile?.subject_radar || {})
    const values = subjects.map((s) => profile?.subject_radar[s] || 0)
    return {
      title: { text: '学科雷达', left: 'center' },
      tooltip: {},
      radar: {
        indicator: subjects.map((s) => ({ name: s, max: 100 })),
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: values,
              name: '得分',
              areaStyle: { opacity: 0.3 },
              itemStyle: { color: '#91cc75' },
            },
          ],
        },
      ],
    }
  })()

  return (
    <Spin spinning={loadingList}>
      <div>
        <h2>学生画像</h2>
        <Row gutter={16}>
          <Col span={8}>
            <Card title="学生列表" size="small">
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
            </Card>
          </Col>
          <Col span={16}>
            <Spin spinning={loadingProfile}>
              {profile && (
                <>
                  <Card size="small" style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>
                      {profile.student.name}{' '}
                      <span style={{ fontSize: 14, fontWeight: 400, color: '#666' }}>
                        考号: {profile.student.student_no}
                      </span>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      薄弱学科：
                      {profile.weak_points.length > 0 ? (
                        profile.weak_points.map((wp) => (
                          <Tag color="red" key={wp}>
                            {wp}
                          </Tag>
                        ))
                      ) : (
                        <Tag color="green">暂无薄弱学科</Tag>
                      )}
                    </div>
                  </Card>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Card size="small">
                        <ReactECharts option={trendOption} style={{ height: 300 }} />
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small">
                        <ReactECharts option={radarOption} style={{ height: 300 }} />
                      </Card>
                    </Col>
                  </Row>
                </>
              )}
              {!profile && !loadingProfile && (
                <Card style={{ textAlign: 'center' }}>
                  <p>暂无数据</p>
                </Card>
              )}
            </Spin>
          </Col>
        </Row>
      </div>
    </Spin>
  )
}

export default StudentProfilePage
