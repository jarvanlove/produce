import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Form, Input, Button, message, Typography } from 'antd'
import { UserOutlined, LockOutlined, BarChartOutlined } from '@ant-design/icons'
import request from '../utils/request'

const { Title, Text } = Typography

const LoginPage = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const res = await request.post('/auth/login', values)
      localStorage.setItem('token', res.data.access_token)
      message.success('登录成功')
      navigate('/classes')
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      message.error(detail || '账号或密码错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
        padding: 24,
      }}
    >
      <div className="page-fade-in" style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <BarChartOutlined style={{ fontSize: 32, color: '#fff' }} />
          </div>
          <Title level={3} style={{ color: '#fff', marginBottom: 8, fontWeight: 600 }}>
            学情智能分析与预警系统
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
            面向教师的学情分析与预警平台
          </Text>
        </div>

        <Card
          style={{
            borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            border: 'none',
          }}
          bodyStyle={{ padding: '32px' }}
        >
          <Form onFinish={onFinish} initialValues={{ username: 'admin', password: '123456' }}>
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入账号' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                placeholder="账号"
                size="large"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                placeholder="密码"
                size="large"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
                style={{
                  borderRadius: 8,
                  height: 44,
                  fontWeight: 500,
                  background: '#2563eb',
                }}
              >
                登录
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              默认账号：admin / 密码：123456
            </Text>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage
