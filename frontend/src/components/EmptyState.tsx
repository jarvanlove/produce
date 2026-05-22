import { Button, Empty } from 'antd'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  description: string
  action?: {
    text: string
    onClick: () => void
  }
  icon?: ReactNode
}

const EmptyState = ({ description, action, icon }: EmptyStateProps) => {
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px' }}>
      <Empty
        image={
          icon ? (
            <div style={{ fontSize: 64, color: '#CBD5E1', marginBottom: 16 }}>{icon}</div>
          ) : (
            Empty.PRESENTED_IMAGE_SIMPLE
          )
        }
        description={
          <span style={{ color: '#64748B', fontSize: 14 }}>{description}</span>
        }
      >
        {action && (
          <Button type="primary" onClick={action.onClick} style={{ marginTop: 16 }}>
            {action.text}
          </Button>
        )}
      </Empty>
    </div>
  )
}

export default EmptyState
