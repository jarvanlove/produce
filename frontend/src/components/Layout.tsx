import { useState } from 'react'
import { Layout as AntLayout, Menu, Avatar, Button } from 'antd'
import {
  HomeOutlined,
  UploadOutlined,
  BarChartOutlined,
  WarningOutlined,
  FileTextOutlined,
  UserOutlined,
  LogoutOutlined,
  FireOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import type { MenuProps } from 'antd'

const { Sider, Header, Content } = AntLayout

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const menuItems: MenuProps['items'] = [
    { key: '/classes', icon: <HomeOutlined />, label: '班级管理' },
    { key: '/import', icon: <UploadOutlined />, label: '数据导入' },
    { key: '/dashboard', icon: <BarChartOutlined />, label: '学情仪表盘' },
    { key: '/students', icon: <UserOutlined />, label: '学生画像' },
    { key: '/heatmap', icon: <FireOutlined />, label: '知识点热力图' },
    { key: '/risk', icon: <WarningOutlined />, label: '风险预警' },
    { key: '/report', icon: <FileTextOutlined />, label: 'AI分析报告' },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        theme="light"
        width={220}
        collapsed={collapsed}
        collapsedWidth={80}
        style={{
          borderRight: '1px solid #E2E8F0',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: collapsed ? '16px 0' : '16px 20px',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          {!collapsed && (
            <div style={{ fontWeight: 700, fontSize: 16, color: '#2563EB' }}>
              学情分析系统
            </div>
          )}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ color: '#64748B' }}
          />
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0, marginTop: 8 }}
        />

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            borderTop: '1px solid #E2E8F0',
            padding: collapsed ? '12px 0' : '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onClick={handleLogout}
        >
          <Avatar
            icon={<UserOutlined />}
            style={{ background: '#2563EB', flexShrink: 0 }}
          />
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>
                演示教师
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <LogoutOutlined />
                退出登录
              </div>
            </div>
          )}
        </div>
      </Sider>

      <AntLayout
        style={{
          marginLeft: collapsed ? 80 : 220,
          transition: 'margin-left 0.2s',
        }}
      >
        <Header
          style={{
            background: '#fff',
            padding: '0 32px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            borderBottom: '1px solid #E2E8F0',
            height: 56,
          }}
        >
          <div style={{ fontSize: 14, color: '#64748B' }}>学情智能分析与预警系统</div>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout
