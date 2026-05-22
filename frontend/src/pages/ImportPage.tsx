import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Upload, Button, message, Form, Input, Card, Empty } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { UploadProps, UploadFile } from 'antd'
import { AxiosError } from 'axios'
import request from '../utils/request'

interface ApiErrorDetail {
  msg?: string
  loc?: (string | number)[]
  type?: string
}

interface ApiErrorResponse {
  detail?: string | ApiErrorDetail[]
}

const ImportPage = () => {
  const { classId } = useParams()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [rawFile, setRawFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async () => {
    const values = form.getFieldsValue()
    if (!values.exam_name || !values.exam_date) {
      message.error('请输入考试名称和日期')
      return
    }
    if (!rawFile) {
      message.error('请选择Excel文件')
      return
    }

    const formData = new FormData()
    formData.append('file', rawFile)
    formData.append('class_id', classId || '')
    formData.append('exam_name', values.exam_name)
    formData.append('exam_date', values.exam_date)

    setUploading(true)
    try {
      const res = await request.post('/import/excel', formData)
      message.success(`导入成功，共导入 ${res.data.imported} 条记录`)
      navigate(`/classes`)
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>
      const detail = axiosErr.response?.data?.detail
      if (Array.isArray(detail)) {
        message.error(detail.map((d) => d.msg).join('; '))
      } else {
        message.error((detail as string) || '导入失败')
      }
    } finally {
      setUploading(false)
    }
  }

  const uploadProps: UploadProps = {
    onRemove: () => {
      setFileList([])
      setRawFile(null)
    },
    beforeUpload: (file) => {
      setRawFile(file as File)
      setFileList([{ uid: String(Date.now()), name: file.name, status: 'done', size: file.size, type: file.type }])
      return false
    },
    fileList,
    accept: '.xlsx,.xls',
  }

  if (!classId) {
    const storedClassId = localStorage.getItem('currentClassId')
    if (storedClassId) {
      navigate(`/import/${storedClassId}`, { replace: true })
      return null
    }
    return (
      <Card style={{ textAlign: 'center', marginTop: 80 }}>
        <Empty description="请先从班级列表选择一个班级">
          <Button type="primary" onClick={() => navigate('/classes')}>
            去班级列表
          </Button>
        </Empty>
      </Card>
    )
  }

  return (
    <div>
      <h2>导入成绩</h2>
      <Card style={{ maxWidth: 600, marginTop: 16 }}>
        <Form form={form} layout="vertical">
          <Form.Item name="exam_name" label="考试名称" rules={[{ required: true }]}>
            <Input placeholder="例如：期中考试" />
          </Form.Item>
          <Form.Item name="exam_date" label="考试日期" rules={[{ required: true }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item label="Excel 文件" required>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleUpload} loading={uploading}>
              开始导入
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default ImportPage
