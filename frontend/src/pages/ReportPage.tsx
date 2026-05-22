import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Spin, Typography, message, Tag, Button, Space, Empty } from 'antd'
import { FileWordOutlined, FilePdfOutlined } from '@ant-design/icons'
import request from '../utils/request'

const { Title, Text } = Typography

interface GenerateResponse {
  report_id: number
  status: string
}

interface ReportData {
  id: number
  class_id: number
  exam_id: number
  report_type: string
  content: string
  generated_by: string
  created_at: string
}

const ReportPage = () => {
  const { classId, examId } = useParams<{ classId: string; examId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<ReportData | null>(null)
  const [exporting, setExporting] = useState<string | null>(null)

  useEffect(() => {
    if (!classId || !examId) return
    let ignore = false

    const generateAndFetch = async () => {
      try {
        setLoading(true)
        const genRes = await request.post<GenerateResponse>('/reports/generate', {
          class_id: parseInt(classId),
          exam_id: parseInt(examId),
          report_type: 'full',
        })

        const { report_id } = genRes.data
        const getRes = await request.get<ReportData>(`/reports/${report_id}`)
        if (!ignore) {
          setReport(getRes.data)
        }
      } catch (err: unknown) {
        const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        if (!ignore) {
          message.error(detail || '报告生成失败')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    generateAndFetch()
    return () => { ignore = true }
  }, [classId, examId])

  const handleExport = async (format: 'docx' | 'pdf') => {
    if (!report) return
    setExporting(format)
    try {
      const res = await request.get(`/reports/${report.id}/export?format=${format}`, {
        responseType: 'blob',
      })
      const mimeType =
        format === 'docx'
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'application/pdf'
      const blob = new Blob([res.data], { type: mimeType })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `学情分析报告_${report.id}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch {
      message.error('导出失败，请重试')
    } finally {
      setExporting(null)
    }
  }

  useEffect(() => {
    if (!classId || !examId) {
      const storedClassId = localStorage.getItem('currentClassId')
      if (storedClassId) {
        navigate(`/dashboard/${storedClassId}`, { replace: true })
      }
    }
  }, [classId, examId, navigate])

  if (!classId || !examId) {
    return (
      <Card style={{ textAlign: 'center', marginTop: 80 }}>
        <Empty description="请从学情仪表盘选择考试后生成报告">
          <Button type="primary" onClick={() => navigate('/classes')}>
            去班级列表
          </Button>
        </Empty>
      </Card>
    )
  }

  return (
    <Spin spinning={loading} tip="正在生成 AI 分析报告，请稍候...">
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {report && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Title level={3} style={{ marginBottom: 8 }}>
                AI 学情分析报告
              </Title>
              <Text type="secondary">
                生成时间：{new Date(report.created_at).toLocaleString('zh-CN')}
              </Text>
              <Tag color={report.generated_by === 'ai' ? 'blue' : 'orange'} style={{ marginLeft: 12 }}>
                {report.generated_by === 'ai' ? 'AI 生成' : '模板生成'}
              </Tag>
              <div style={{ marginTop: 12 }}>
                <Space>
                  <Button
                    icon={<FileWordOutlined />}
                    loading={exporting === 'docx'}
                    onClick={() => handleExport('docx')}
                  >
                    导出 Word
                  </Button>
                  <Button
                    icon={<FilePdfOutlined />}
                    loading={exporting === 'pdf'}
                    onClick={() => handleExport('pdf')}
                  >
                    导出 PDF
                  </Button>
                </Space>
              </div>
            </div>

            <Card>
              <div
                className="markdown-body"
                style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.8,
                  fontSize: 14,
                }}
              >
                {report.content}
              </div>
            </Card>
          </>
        )}

        {!report && !loading && (
          <Card style={{ textAlign: 'center' }}>
            <Text type="secondary">报告生成失败，请稍后重试。</Text>
          </Card>
        )}
      </div>
    </Spin>
  )
}

export default ReportPage
