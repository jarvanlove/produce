import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Table, Button, Space, message, Modal, Form, Input, InputNumber, Select, Empty } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import request from '../utils/request'

interface KnowledgePoint {
  id: number
  class_id: number
  name: string
  parent_id: number | null
  weight: number
}

interface ClassItem {
  id: number
  name: string
}

const KnowledgePointPage = () => {
  const { classId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<KnowledgePoint[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [selectedClassId, setSelectedClassId] = useState<number | undefined>(
    classId ? parseInt(classId) : undefined
  )
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<KnowledgePoint | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    if (!classId) {
      const storedClassId = localStorage.getItem('currentClassId')
      if (storedClassId) {
        navigate(`/knowledge-points/${storedClassId}`, { replace: true })
      }
    }
  }, [classId, navigate])

  useEffect(() => {
    request
      .get<ClassItem[]>('/classes')
      .then((res) => setClasses(res.data))
      .catch(() => message.error('获取班级列表失败'))
  }, [])

  useEffect(() => {
    if (!selectedClassId) return
    setLoading(true)
    request
      .get<KnowledgePoint[]>(`/knowledge-points/classes/${selectedClassId}`)
      .then((res) => setData(res.data))
      .catch(() => message.error('获取知识点失败'))
      .finally(() => setLoading(false))
  }, [selectedClassId])

  const handleClassChange = (value: number) => {
    setSelectedClassId(value)
    localStorage.setItem('currentClassId', String(value))
    navigate(`/knowledge-points/${value}`, { replace: true })
  }

  const handleAdd = () => {
    if (!selectedClassId) {
      message.warning('请先选择班级')
      return
    }
    setEditingRecord(null)
    form.resetFields()
    setModalOpen(true)
  }

  const handleEdit = (record: KnowledgePoint) => {
    setEditingRecord(record)
    form.setFieldsValue({
      name: record.name,
      parent_id: record.parent_id,
      weight: record.weight,
    })
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id)
      await request.delete(`/knowledge-points/${id}`)
      message.success('删除成功')
      if (selectedClassId) {
        const res = await request.get<KnowledgePoint[]>(`/knowledge-points/classes/${selectedClassId}`)
        setData(res.data)
      }
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      message.error(detail || '删除失败')
    } finally {
      setDeletingId(null)
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      if (!selectedClassId) return
      if (editingRecord) {
        await request.put(`/knowledge-points/${editingRecord.id}`, {
          ...values,
          class_id: selectedClassId,
        })
        message.success('修改成功')
      } else {
        await request.post('/knowledge-points', {
          ...values,
          class_id: selectedClassId,
        })
        message.success('添加成功')
      }
      setModalOpen(false)
      const res = await request.get<KnowledgePoint[]>(`/knowledge-points/classes/${selectedClassId}`)
      setData(res.data)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      if (detail) message.error(detail)
    }
  }

  const parentOptions = data
    .filter((item) => !editingRecord || item.id !== editingRecord.id)
    .map((item) => ({ label: item.name, value: item.id }))

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '知识点名称', dataIndex: 'name', key: 'name' },
    {
      title: '上级知识点',
      dataIndex: 'parent_id',
      key: 'parent_id',
      render: (v: number | null) => {
        if (!v) return '-'
        const parent = data.find((d) => d.id === v)
        return parent ? parent.name : '-'
      },
    },
    { title: '权重', dataIndex: 'weight', key: 'weight', width: 80 },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_: unknown, record: KnowledgePoint) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            loading={deletingId === record.id}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>知识点管理</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <Select
            style={{ width: 200 }}
            placeholder="选择班级"
            value={selectedClassId}
            onChange={handleClassChange}
            options={classes.map((c) => ({ label: c.name, value: c.id }))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增知识点
          </Button>
        </div>
      </div>

      {selectedClassId ? (
        <Table dataSource={data} columns={columns} rowKey="id" loading={loading} pagination={false} />
      ) : (
        <Card style={{ textAlign: 'center', marginTop: 80 }}>
          <Empty description="请先选择班级">
            <Button type="primary" onClick={() => navigate('/classes')}>
              去班级列表
            </Button>
          </Empty>
        </Card>
      )}

      <Modal
        title={editingRecord ? '编辑知识点' : '新增知识点'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        okText={editingRecord ? '保存' : '添加'}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="知识点名称" rules={[{ required: true, message: '请输入知识点名称' }]}>
            <Input placeholder="例如：函数与方程" />
          </Form.Item>
          <Form.Item name="parent_id" label="上级知识点">
            <Select
              allowClear
              placeholder="留空表示一级知识点"
              options={parentOptions}
            />
          </Form.Item>
          <Form.Item name="weight" label="权重" initialValue={1.0}>
            <InputNumber min={0} max={10} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default KnowledgePointPage
