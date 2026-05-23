import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Upload, Button, message, Form, Input, Card, Tag, Divider } from 'antd'
import { UploadOutlined, FileExcelOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import type { UploadProps, UploadFile } from 'antd'
import { AxiosError } from 'axios'
import request from '../utils/request'
import EmptyState from '../components/EmptyState'

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
      setFileList([])
      setRawFile(null)
      form.resetFields()
      navigate(`/dashboard/${classId}`)
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
        <EmptyState
          description="请先从班级列表选择一个班级"
          action={{ text: '去班级列表', onClick: () => navigate('/classes') }}
        />
      </Card>
    )
  }

  return (
    <div className="page-fade-in">
      <h2 style={{ margin: 0, fontWeight: 600, fontSize: 20, marginBottom: 24 }}>导入成绩</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
        <Card className="card-hover">
          <Form form={form} layout="vertical">
            <Form.Item
              name="exam_name"
              label="考试名称"
              rules={[{ required: true, message: '请输入考试名称' }]}
            >
              <Input placeholder="例如：期中考试" size="large" />
            </Form.Item>
            <Form.Item
              name="exam_date"
              label="考试日期"
              rules={[{ required: true, message: '请输入考试日期' }]}
            >
              <Input type="date" size="large" />
            </Form.Item>

            <Form.Item label="Excel 文件" required>
              <Upload.Dragger {...uploadProps} style={{ padding: 32 }}>
                <p className="ant-upload-drag-icon">
                  <FileExcelOutlined style={{ fontSize: 48, color: '#059669' }} />
                </p>
                <p className="ant-upload-text" style={{ fontWeight: 500, color: '#1e293b' }}>
                  点击或拖拽文件到此处上传
                </p>
                <p className="ant-upload-hint" style={{ color: '#94a3b8' }}>
                  支持 .xlsx / .xls 格式，文件大小不超过 10MB
                </p>
              </Upload.Dragger>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                size="large"
                onClick={handleUpload}
                loading={uploading}
                disabled={!rawFile}
                block
                icon={<UploadOutlined />}
                style={{ height: 44 }}
              >
                {uploading ? '正在导入...' : '开始导入'}
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <div>
          <Card title="导入说明" size="small" className="card-hover">
            <div style={{ color: '#475569', fontSize: 14, lineHeight: 1.8 }}>
              <p>
                <InfoCircleOutlined style={{ color: '#2563eb', marginRight: 8 }} />
                Excel 文件需包含以下列：
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {['考号', '姓名', '总分', '语文得分', '数学得分', '英语得分'].map((col) => (
                  <Tag key={col} style={{ borderRadius: 4 }}>{col}</Tag>
                ))}
              </div>
              <p>科目列名规则：「科目名 + 得分」，如「语文得分」。</p>
              <Divider style={{ margin: '12px 0' }} />
              <p>
                <CheckCircleOutlined style={{ color: '#059669', marginRight: 8 }} />
                导入后系统会自动：
              </p>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                <li>创建/更新学生信息</li>
                <li>创建考试记录</li>
                <li>录入各科成绩</li>
                <li>更新班级人数统计</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ImportPage
