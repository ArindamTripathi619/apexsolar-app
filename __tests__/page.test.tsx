import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />)
    
    const heading = screen.getByRole('heading', { name: /apexsolar/i })
    expect(heading).toBeInTheDocument()
  })

  it('renders portal access links', () => {
    render(<Home />)
    
    const adminLink = screen.getByRole('link', { name: /access admin/i })
    const attendanceLink = screen.getByRole('link', { name: /access portal/i })
    
    expect(adminLink).toBeInTheDocument()
    expect(attendanceLink).toBeInTheDocument()
    expect(adminLink).toHaveAttribute('href', '/admin/login')
    expect(attendanceLink).toHaveAttribute('href', '/attendance/login')
  })

  it('renders key features section', () => {
    render(<Home />)
    
    expect(screen.getByText('Key Features')).toBeInTheDocument()
    expect(screen.getByText('Security First')).toBeInTheDocument()
    expect(screen.getByText('Document Management')).toBeInTheDocument()
    expect(screen.getByText('Payment Tracking')).toBeInTheDocument()
    expect(screen.getByText('Attendance Management')).toBeInTheDocument()
  })

  it('has responsive design elements', () => {
    render(<Home />)
    
    const container = document.querySelector('.min-h-screen')
    expect(container).toBeInTheDocument()
  })
})