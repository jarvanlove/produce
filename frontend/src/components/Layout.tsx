import { useState, useEffect } from 'react'
import { Layout as AntLayout, Menu, Avatar, Button, Breadcrumb, Tooltip } from 'antd'
import {
  HomeOutlined,
  UploadOutlined,
  BarChartOutlined,
  WarningOutlined,
  FileTextOutlined,
  UserOutlined,
  LogoutOutlined,
  FireOutlined,
  BookOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import type { MenuProps } from 'antd'

const { Sider, Header, Content } = AntLayout

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [currentClassName, setCurrentClassName] = useState<string | null>(
    localStorage.getItem('currentClassName')
  )

  // 监听路由变化，提取并保存当前班级上下文
  useEffect(() => {
    const path = location.pathname
    const match = path.match(/^\/(dashboard|import|students|risk|heatmap|report|knowledge-points)\/(\d+)/)
    if (match) {
      const classId = match[2]
      localStorage.setItem('currentClassId', classId)
      setCurrentClassName(localStorage.getItem('currentClassName'))
    } else if (path === '/classes' || path === '/') {
      localStorage.removeItem('currentClassId')
      localStorage.removeItem('currentClassName')
      setCurrentClassName(null)
    }
  }, [location.pathname])

  const menuItems: MenuProps['items'] = [
    { key: '/classes', icon: <HomeOutlined />, label: '班级管理' },
    { key: '/import', icon: <UploadOutlined />, label: '数据导入' },
    { key: '/dashboard', icon: <BarChartOutlined />, label: '学情仪表盘' },
    { key: '/students', icon: <UserOutlined />, label: '学生画像' },
    { key: '/heatmap', icon: <FireOutlined />, label: '知识点热力图' },
    { key: '/knowledge-points', icon: <BookOutlined />, label: '知识点管理' },
    { key: '/risk', icon: <WarningOutlined />, label: '风险预警' },
    { key: '/report', icon: <FileTextOutlined />, label: 'AI分析报告' },
    { key: '/settings', icon: <SettingOutlined />, label: '系统设置' },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    const classId = localStorage.getItem('currentClassId')
    const routesNeedClass = ['/dashboard', '/import', '/students', '/risk', '/heatmap', '/knowledge-points']
    if (classId && routesNeedClass.includes(key)) {
      navigate(`${key}/${classId}`)
    } else if (key === '/report' && classId) {
      // 报告需要考试ID，先跳到仪表盘选择考试
      navigate(`/dashboard/${classId}`)
    } else {
      navigate(key)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('currentClassId')
    localStorage.removeItem('currentClassName')
    navigate('/login')
  }

  // 面包屑构建
  const buildBreadcrumbs = () => {
    const path = location.pathname
    const items: { title: string; onClick?: () => void }[] = []

    if (path === '/classes') {
      items.push({ title: '班级管理' })
    } else if (path === '/settings') {
      items.push({ title: '系统设置' })
    } else {
      items.push({ title: '班级管理', onClick: () => navigate('/classes') })

      const classMatch = path.match(/^\/(dashboard|import|students|risk|heatmap|report|knowledge-points)\/(\d+)/)
      if (classMatch && currentClassName) {
        items.push({ title: currentClassName })

        const routeNameMap: Record<string, string> = {
          dashboard: '学情仪表盘',
          import: '数据导入',
          students: '学生画像',
          risk: '风险预警',
          heatmap: '知识点热力图',
          'knowledge-points': '知识点管理',
          report: 'AI分析报告',
        }
        const routeName = routeNameMap[classMatch[1]]
        if (routeName) {
          items.push({ title: routeName })
        }
      } else if (path.startsWith('/import')) {
        items.push({ title: '数据导入' })
      } else if (path.startsWith('/students')) {
        items.push({ title: '学生画像' })
      } else if (path.startsWith('/risk')) {
        items.push({ title: '风险预警' })
      } else if (path.startsWith('/heatmap')) {
        items.push({ title: '知识点热力图' })
      } else if (path.startsWith('/knowledge-points')) {
        items.push({ title: '知识点管理' })
      } else if (path.startsWith('/report')) {
        items.push({ title: 'AI分析报告' })
      }
    }
    return items
  }

  const breadcrumbItems = buildBreadcrumbs()
  const showBreadcrumb = breadcrumbItems.length > 0 && location.pathname !== '/classes'

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
          selectedKeys={(() => {
            const path = location.pathname
            if (path === '/classes') return ['/classes']
            if (path.startsWith('/import')) return ['/import']
            if (path.startsWith('/dashboard')) return ['/dashboard']
            if (path.startsWith('/students')) return ['/students']
            if (path.startsWith('/heatmap')) return ['/heatmap']
            if (path.startsWith('/knowledge-points')) return ['/knowledge-points']
            if (path.startsWith('/risk')) return ['/risk']
            if (path.startsWith('/report')) return ['/report']
            if (path === '/settings') return ['/settings']
            return []
          })()}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0, marginTop: 8 }}
        />

        <Tooltip
          title="退出登录"
          placement={collapsed ? 'right' : 'top'}
        >
          <div
            onClick={handleLogout}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              borderTop: '1px solid #E2E8F0',
              padding: collapsed ? '12px 0' : '12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 12,
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: '#fff',
            }}
          >
            <Avatar
              size="small"
              icon={<UserOutlined />}
              style={{ background: '#2563EB', flexShrink: 0 }}
            />
            {!collapsed && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>
                  管理员
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
                  点击退出登录
                </div>
              </div>
            )}
          </div>
        </Tooltip>
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
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #E2E8F0',
            height: 56,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {showBreadcrumb && (
              <Breadcrumb
                items={breadcrumbItems.map((item) => ({
                  title: item.onClick ? (
                    <a onClick={item.onClick} style={{ cursor: 'pointer' }}>
                      {item.title}
                    </a>
                  ) : (
                    item.title
                  ),
                }))}
              />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {currentClassName && (
              <div
                style={{
                  fontSize: 13,
                  color: '#2563EB',
                  background: '#EFF6FF',
                  padding: '4px 12px',
                  borderRadius: 16,
                  fontWeight: 500,
                }}
              >
                当前班级：{currentClassName}
              </div>
            )}
          </div>
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
