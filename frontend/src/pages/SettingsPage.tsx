import { useEffect, useState } from 'react'
import { Card, Form, Input, Button, message, Select } from 'antd'
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
      // 若用户未修改 API Key 且当前是脱敏值，则不传该字段，避免覆盖真实密钥
      if (!apiKeyTouched && isMaskedKey(values.ai_api_key || '')) {
        delete (payload as Partial<SettingsData>).ai_api_key
      }
      await request.put('/settings', payload)
      message.success('设置已保存')
      setApiKeyTouched(false)
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
      const res = await request.post<{ success: boolean; message: string }>('/settings/test', values)
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
    <div>
      <h2 style={{ marginBottom: 24 }}>系统设置</h2>
      <Card title="AI 模型配置" style={{ maxWidth: 600 }} loading={loading}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="ai_provider"
            label="模型服务商"
            rules={[{ required: true }]}
          >
            <Select options={PROVIDER_OPTIONS} onChange={handleProviderChange} />
          </Form.Item>

          <Form.Item
            name="ai_api_key"
            label="API Key"
            rules={[{ required: true, message: '请输入 API Key' }]}
          >
            <Input.Password placeholder="sk-..." onChange={() => setApiKeyTouched(true)} />
          </Form.Item>

          <Form.Item
            name="ai_base_url"
            label="Base URL"
            rules={[{ required: true, message: '请输入 Base URL' }]}
          >
            <Input placeholder="https://api.xxx.com/v1" />
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
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving} style={{ marginRight: 12 }}>
              保存设置
            </Button>
            <Button onClick={handleTest} loading={testing}>
              测试连接
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default SettingsPage
