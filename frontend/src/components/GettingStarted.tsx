import { Card, Steps, Button, Row, Col, Divider } from 'antd'
import {
  PlusOutlined,
  UploadOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  FileExcelOutlined,
  RiseOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

interface GettingStartedProps {
  step: number // 0 = no class, 1 = has class but no exam, 2 = has exam but no student, 3 = complete
  classId?: number
}

const GettingStarted = ({ step, classId }: GettingStartedProps) => {
  const navigate = useNavigate()

  const stepItems = [
    {
      title: '创建班级',
      description: '先创建一个班级，作为数据管理的基本单位',
      icon: <TeamOutlined />,
      action: {
        text: '创建班级',
        onClick: () => navigate('/classes'),
      },
      done: step >= 1,
    },
    {
      title: '导入成绩',
      description: '上传 Excel 成绩表，系统自动完成统计和分析',
      icon: <FileExcelOutlined />,
      action: {
        text: classId ? '去导入成绩' : '先创建班级',
        onClick: () => navigate(classId ? `/import/${classId}` : '/classes'),
        disabled: step < 1,
      },
      done: step >= 2,
    },
    {
      title: '查看分析',
      description: '查看学情仪表盘、学生画像、风险预警和 AI 报告',
      icon: <RiseOutlined />,
      action: {
        text: '查看仪表盘',
        onClick: () => navigate(classId ? `/dashboard/${classId}` : '/classes'),
        disabled: step < 2,
      },
      done: step >= 3,
    },
  ]

  return (
    <div className="page-fade-in">
      <Card
        style={{ maxWidth: 800, margin: '40px auto', borderRadius: 12 }}
        className="card-hover"
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: '#eff6ff',
              color: '#2563eb',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              marginBottom: 16,
            }}
          >
            <BarChartOutlined />
          </div>
          <h2 style={{ margin: 0, fontWeight: 600, fontSize: 20, color: '#1e293b' }}>
            欢迎使用学情智能分析与预警系统
          </h2>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 8, marginBottom: 0 }}>
            只需 3 步，即可开启智能化教学分析
          </p>
        </div>

        <Steps
          current={step}
          items={stepItems.map((s) => ({
            title: s.title,
            description: s.description,
            icon: s.done ? <CheckCircleOutlined style={{ color: '#059669' }} /> : undefined,
          }))}
          style={{ marginBottom: 32 }}
        />

        <Divider style={{ margin: '24px 0' }} />

        <Row gutter={[16, 16]}>
          {stepItems.map((s, idx) => (
            <Col xs={24} md={8} key={idx}>
              <Card
                size="small"
                style={{
                  borderRadius: 8,
                  borderColor: s.done ? '#a7f3d0' : idx === step ? '#bfdbfe' : '#e2e8f0',
                  background: s.done ? '#ecfdf5' : idx === step ? '#eff6ff' : '#f8fafc',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: s.done ? '#d1fae5' : idx === step ? '#dbeafe' : '#f1f5f9',
                      color: s.done ? '#059669' : idx === step ? '#2563eb' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                    }}
                  >
                    {s.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: s.done ? '#065f46' : idx === step ? '#1e293b' : '#64748b' }}>
                      {s.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      {s.done ? '已完成' : idx === step ? '当前步骤' : '待完成'}
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: '#475569', margin: '0 0 12px 0', lineHeight: 1.6 }}>
                  {s.description}
                </p>
                <Button
                  type={idx === step ? 'primary' : 'default'}
                  size="small"
                  block
                  disabled={s.action.disabled}
                  onClick={s.action.onClick}
                  icon={idx === 0 ? <PlusOutlined /> : idx === 1 ? <UploadOutlined /> : <BarChartOutlined />}
                >
                  {s.action.text}
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  )
}

export default GettingStarted
