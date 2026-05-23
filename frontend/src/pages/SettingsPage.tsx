import { useEffect, useState } from 'react'
import { Card, Form, Input, Button, message, Select, Tag, Divider } from 'antd'
import { SettingOutlined, ApiOutlined, LinkOutlined, RobotOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import request from '../utils/request'

interface SettingsData {
  ai_provider: string
  ai_api_key: string
  ai_base_url: string
  ai_model: string
}

const PROVIDER_OPTIONS = [
  { label: 'DeepSeek (深度求索)', value: 'deepseek' },
  { label: 'MiniMax (稀宇科技)', value: 'minimax' },
  { label: 'Qwen (通义千问)', value: 'qwen' },
  { label: 'GLM (智谱)', value: 'glm' },
]

const PRESETS: Record<string, { base_url: string; model: string }> = {
  deepseek: { base_url: 'https://api.deepseek.com/v1', model: 'deepseek-v4-pro' },
  minimax: { base_url: 'https://api.minimax.chat/v1', model: 'MiniMax-M2.7' },
  qwen: { base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen3.5-plus' },
  glm: { base_url: 'https://open.bigmodel.cn/api/paas/v4', model: 'GLM-5.1' },
}

const MODEL_OPTIONS: Record<string, { label: string; value: string }[]> = {
  deepseek: [
    { label: 'deepseek-v4-pro (旗舰推理)', value: 'deepseek-v4-pro' },
    { label: 'deepseek-v4-flash (快速低成本)', value: 'deepseek-v4-flash' },
    { label: 'deepseek-chat (兼容版)', value: 'deepseek-chat' },
    { label: 'deepseek-reasoner (兼容版)', value: 'deepseek-reasoner' },
  ],
  minimax: [
    { label: 'MiniMax-M2.7 (旗舰)', value: 'MiniMax-M2.7' },
    { label: 'MiniMax-M2.5 (生产力)', value: 'MiniMax-M2.5' },
    { label: 'MiniMax-M2.1 (代码)', value: 'MiniMax-M2.1' },
    { label: 'MiniMax-01 (免费1M上下文)', value: 'MiniMax-01' },
  ],
  qwen: [
    { label: 'qwen3.5-plus (最新旗舰)', value: 'qwen3.5-plus' },
    { label: 'qwen3.5-flash (轻量快速)', value: 'qwen3.5-flash' },
    { label: 'qwen3-max ( reasoning )', value: 'qwen3-max' },
    { label: 'qwen3-coder-plus (代码)', value: 'qwen3-coder-plus' },
    { label: 'qwen-plus (通用)', value: 'qwen-plus' },
  ],
  glm: [
    { label: 'GLM-5.1 (旗舰)', value: 'GLM-5.1' },
    { label: 'GLM-5-Turbo (工具优化)', value: 'GLM-5-Turbo' },
    { label: 'GLM-4.7 (中高端)', value: 'GLM-4.7' },
    { label: 'GLM-4.7-Flash (低成本)', value: 'GLM-4.7-Flash' },
    { label: 'GLM-4.6V (多模态)', value: 'GLM-4.6V' },
  ],
}

const isMaskedKey = (key: string): boolean => key.includes('****')

const SettingsPage = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [provider, setProvider] = useState<string>('deepseek')
  const [apiKeyTouched, setApiKeyTouched] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    setLoading(true)
    request
      .get<SettingsData>('/settings')
      .then((res) => {
        form.setFieldsValue(res.data)
        setProvider(res.data.ai_provider || 'deepseek')
      })
      .catch(() => message.error('获取设置失败'))
      .finally(() => setLoading(false))
  }, [form])

  const handleProviderChange = (value: string) => {
    setProvider(value)
    const preset = PRESETS[value]
    if (preset) {
      form.setFieldsValue({
        ai_base_url: preset.base_url,
        ai_model: preset.model,
      })
    }
  }

  const handleSave = async (values: SettingsData) => {
    setSaving(true)
    try {
      const payload = { ...values }
      if (!apiKeyTouched && isMaskedKey(values.ai_api_key || '')) {
        delete (payload as Partial<SettingsData>).ai_api_key
      }
      await request.put('/settings', payload)
      message.success('设置已保存')
      setApiKeyTouched(false)
      setTestResult(null)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      message.error(detail || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    try {
      const values = await form.validateFields()
      setTesting(true)
      setTestResult(null)
      const res = await request.post<{ success: boolean; message: string }>('/settings/test', values)
      setTestResult(res.data)
      if (res.data.success) {
        message.success(res.data.message)
      } else {
        message.error(res.data.message)
      }
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      if (detail) message.error(detail)
    } finally {
      setTesting(false)
    }
  }

  const modelOptions = MODEL_OPTIONS[provider] || []

  return (
    <div className="page-fade-in">
      <h2 style={{ margin: 0, fontWeight: 600, fontSize: 20, marginBottom: 24 }}>系统设置</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <RobotOutlined style={{ color: '#2563eb' }} />
              <span>AI 模型配置</span>
            </div>
          }
          className="card-hover"
          loading={loading}
        >
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item
              name="ai_provider"
              label="模型服务商"
              rules={[{ required: true, message: '请选择模型服务商' }]}
            >
              <Select options={PROVIDER_OPTIONS} onChange={handleProviderChange} size="large" />
            </Form.Item>

            <Form.Item
              name="ai_api_key"
              label="API Key"
              rules={[{ required: true, message: '请输入 API Key' }]}
            >
              <Input.Password
                placeholder="sk-..."
                onChange={() => setApiKeyTouched(true)}
                size="large"
                prefix={<ApiOutlined style={{ color: '#94a3b8' }} />}
              />
            </Form.Item>

            <Form.Item
              name="ai_base_url"
              label="Base URL"
              rules={[{ required: true, message: '请输入 Base URL' }]}
            >
              <Input
                placeholder="https://api.xxx.com/v1"
                size="large"
                prefix={<LinkOutlined style={{ color: '#94a3b8' }} />}
              />
            </Form.Item>

            <Form.Item
              name="ai_model"
              label="模型名称"
              rules={[{ required: true, message: '请选择模型名称' }]}
            >
              <Select
                options={modelOptions}
                placeholder="请选择模型"
                showSearch
                allowClear
                size="large"
              />
            </Form.Item>

            {testResult && (
              <div
                style={{
                  marginBottom: 16,
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: testResult.success ? '#ecfdf5' : '#fef2f2',
                  border: `1px solid ${testResult.success ? '#a7f3d0' : '#fecaca'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {testResult.success ? (
                  <CheckCircleOutlined style={{ color: '#059669' }} />
                ) : (
                  <CloseCircleOutlined style={{ color: '#dc2626' }} />
                )}
                <span style={{ color: testResult.success ? '#065f46' : '#991b1b', fontSize: 14 }}>
                  {testResult.message}
                </span>
              </div>
            )}

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={saving}
                size="large"
                icon={<SettingOutlined />}
                style={{ marginRight: 12, height: 40 }}
              >
                保存设置
              </Button>
              <Button
                onClick={handleTest}
                loading={testing}
                size="large"
                style={{ height: 40 }}
              >
                测试连接
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <div>
          <Card title="配置说明" size="small" className="card-hover">
            <div style={{ color: '#475569', fontSize: 14, lineHeight: 1.8 }}>
              <p style={{ marginBottom: 8 }}>
                <Tag color="blue">DeepSeek</Tag> 国产大模型，推理能力强
              </p>
              <p style={{ marginBottom: 8 }}>
                <Tag color="orange">MiniMax</Tag> 稀宇科技，中文对话流畅
              </p>
              <p style={{ marginBottom: 8 }}>
                <Tag color="cyan">Qwen</Tag> 阿里通义千问，开源生态丰富
              </p>
              <p style={{ marginBottom: 8 }}>
                <Tag color="purple">GLM</Tag> 智谱清言，学术场景表现好
              </p>
              <Divider style={{ margin: '12px 0' }} />
              <p style={{ fontSize: 13, color: '#94a3b8' }}>
                切换服务商时，Base URL 和推荐模型会自动填充。API Key 仅在修改时才会更新。
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
