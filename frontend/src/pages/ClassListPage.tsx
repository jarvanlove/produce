import { useEffect, useState } from 'react'
import { Table, Button, Space, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import request from '../utils/request'

interface ClassItem {
  id: number
  name: string
  subject: string
  grade: string
  school_name: string
  student_count: number
}

const ClassListPage = () => {
  const navigate = useNavigate()
  const [data, setData] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    request
      .get<ClassItem[]>('/classes')
      .then((res) => setData(res.data))
      .catch(() => message.error('获取班级列表失败'))
      .finally(() => setLoading(false))
  }, [])

  const columns = [
    { title: '班级名称', dataIndex: 'name', key: 'name' },
    { title: '学科', dataIndex: 'subject', key: 'subject' },
    { title: '年级', dataIndex: 'grade', key: 'grade' },
    { title: '学校', dataIndex: 'school_name', key: 'school_name' },
    { title: '学生数', dataIndex: 'student_count', key: 'student_count' },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: ClassItem) => (
        <Space>
          <Button type="primary" size="small" onClick={() => navigate(`/dashboard/${record.id}`)}>
            仪表盘
          </Button>
          <Button size="small" onClick={() => navigate(`/import/${record.id}`)}>
            导入成绩
          </Button>
          <Button size="small" onClick={() => navigate(`/students/${record.id}`)}>
            学生画像
          </Button>
          <Button size="small" danger onClick={() => navigate(`/risk/${record.id}`)}>
            风险预警
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <h2>班级列表</h2>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} style={{ marginTop: 16 }} />
    </div>
  )
}

export default ClassListPage
