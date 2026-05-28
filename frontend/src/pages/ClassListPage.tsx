import { useEffect, useState } from 'react'
import { Card, Button, message, Modal, Form, Input, Popconfirm, Statistic, Row, Col, Skeleton } from 'antd'
import { useNavigate } from 'react-router-dom'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LoginOutlined,
  TeamOutlined,
  BookOutlined,
  BankOutlined,
} from '@ant-design/icons'
import request from '../utils/request'
import GettingStarted from '../components/GettingStarted'

interface ClassItem {
  id: number
  name: string
  subject: string
  grade: string
  school_name: string
  student_count: number
}

interface FormValues {
  name: string
  subject: string
  grade: string
  school_name: string
}

const ClassListPage = () => {
  const navigate = useNavigate()
  const [data, setData] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ClassItem | null>(null)
  const [form] = Form.useForm()

  const fetchData = () => {
    setLoading(true)
    request
      .get<ClassItem[]>('/classes')
      .then((res) => setData(res.data))
      .catch((err: unknown) => {
        const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        message.error(detail || '获取班级列表失败')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [])

  const enterClass = (record: ClassItem) => {
    localStorage.setItem('currentClassId', String(record.id))
    localStorage.setItem('currentClassName', record.name)
    navigate(`/dashboard/${record.id}`)
  }

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalOpen(true)
  }

  const handleEdit = (record: ClassItem) => {
    setEditingRecord(record)
    form.setFieldsValue({
      name: record.name,
      subject: record.subject,
      grade: record.grade,
      school_name: record.school_name,
    })
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await request.delete(`/classes/${id}`)
      message.success('删除成功')
      fetchData()
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      message.error(detail || '删除失败')
    }
  }

  const handleModalOk = async () => {
    try {
      const values: FormValues = await form.validateFields()
      if (editingRecord) {
        await request.put(`/classes/${editingRecord.id}`, values)
        message.success('修改成功')
      } else {
        await request.post('/classes', values)
        message.success('添加成功')
      }
      setModalOpen(false)
      fetchData()
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      if (detail) message.error(detail)
    }
  }

  const totalStudents = data.reduce((sum, cls) => sum + (cls.student_count || 0), 0)

  if (loading && data.length === 0) {
    return (
      <div className="page-fade-in">
        <Skeleton active paragraph={{ rows: 4 }} />
        <Row gutter={16} style={{ marginTop: 24 }}>
          {[1, 2, 3].map((i) => (
            <Col span={8} key={i}>
              <Card><Skeleton active /></Card>
            </Col>
          ))}
        </Row>
      </div>
    )
  }

  return (
    <div className="page-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontWeight: 600, fontSize: 20 }}>班级管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增班级
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8}>
          <Card className="card-hover">
            <Statistic
              title="班级总数"
              value={data.length}
              prefix={<BookOutlined style={{ color: '#2563eb' }} />}
              valueStyle={{ color: '#1e293b', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card className="card-hover">
            <Statistic
              title="学生总数"
              value={totalStudents}
              prefix={<TeamOutlined style={{ color: '#059669' }} />}
              valueStyle={{ color: '#1e293b', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card className="card-hover">
            <Statistic
              title="覆盖学校"
              value={new Set(data.map((d) => d.school_name)).size}
              prefix={<BankOutlined style={{ color: '#d97706' }} />}
              valueStyle={{ color: '#1e293b', fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      {data.length === 0 && !loading ? (
        <GettingStarted step={0} />
      ) : (
        <Row gutter={[16, 16]}>
          {data.map((cls) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={cls.id}>
              <Card
                className="card-hover"
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: '#eff6ff',
                        color: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: 14,
                      }}
                    >
                      {cls.name.slice(0, 2)}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{cls.name}</span>
                  </div>
                }
                actions={[
                  <Button
                    key="enter"
                    type="link"
                    icon={<LoginOutlined />}
                    onClick={() => enterClass(cls)}
                    style={{ color: '#2563eb', fontWeight: 500 }}
                  >
                    进入班级
                  </Button>,
                  <Button
                    key="edit"
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(cls)}
                  >
                    编辑
                  </Button>,
                  <Popconfirm
                    key="delete"
                    title="确认删除"
                    description={`确定要删除班级 "${cls.name}" 吗？删除后该班级的所有数据将一并清除。`}
                    onConfirm={() => handleDelete(cls.id)}
                    okText="删除"
                    okButtonProps={{ danger: true }}
                    cancelText="取消"
                  >
                    <Button type="link" danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <div style={{ color: '#475569', fontSize: 14 }}>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ color: '#94a3b8', marginRight: 8 }}>学科</span>
                    {cls.subject}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ color: '#94a3b8', marginRight: 8 }}>年级</span>
                    {cls.grade}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ color: '#94a3b8', marginRight: 8 }}>学校</span>
                    {cls.school_name}
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', marginRight: 8 }}>学生数</span>
                    <span style={{ fontWeight: 600, color: '#2563eb' }}>{cls.student_count}</span> 人
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title={editingRecord ? '编辑班级' : '新增班级'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        okText={editingRecord ? '保存' : '添加'}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="班级名称"
            rules={[{ required: true, message: '请输入班级名称' }]}
          >
            <Input placeholder="例如：三年级2班" />
          </Form.Item>
          <Form.Item
            name="subject"
            label="学科"
            rules={[{ required: true, message: '请输入学科' }]}
          >
            <Input placeholder="例如：数学" />
          </Form.Item>
          <Form.Item
            name="grade"
            label="年级"
            rules={[{ required: true, message: '请输入年级' }]}
          >
            <Input placeholder="例如：三年级" />
          </Form.Item>
          <Form.Item
            name="school_name"
            label="学校"
            rules={[{ required: true, message: '请输入学校名称' }]}
          >
            <Input placeholder="例如：实验小学" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ClassListPage
