import Link from 'next/link'
import Image from 'next/image'
import ButtonComponent from '@/app/components/ui/ButtonComponent'
import ThemeToggle from '@/app/components/ui/ThemeToggle'

export default function Home() {
  return (
    <div className="min-h-screen bg-background transition-all duration-300">
      {/* Header with Theme Toggle */}
      <header className="absolute top-0 right-0 p-6">
        <ThemeToggle showLabel />
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            {/* Company Logo */}
            <div className="mb-8">
              <Image
                src="/logo.webp"
                alt="Apex Solar Logo"
                width={120}
                height={120}
                className="mx-auto rounded-full shadow-lg ring-4 ring-primary/20"
                priority
              />
            </div>
            
            <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              ApexSolar
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Employee Management System
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto rounded-full"></div>
          </div>

          {/* Portal Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Admin Portal Card */}
            <div className="group bg-card rounded-2xl shadow-card border border-border hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1 p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                
                <h3 className="text-2xl font-bold mb-4 text-card-foreground">
                  Admin Portal
                </h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Comprehensive employee management, document storage, payment tracking, attendance monitoring, and invoice management.
                </p>
                
                <Link 
                  href="/admin/login" 
                  className="inline-block w-full"
                >
                  <ButtonComponent
                    variant="primary"
                    size="lg"
                    fullWidth={true}
                    className="group-hover:shadow-lg transition-shadow duration-300"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Access Admin Portal
                  </ButtonComponent>
                </Link>
              </div>
            </div>
            
            {/* Accountant Portal Card */}
            <div className="group bg-card rounded-2xl shadow-card border border-border hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1 p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                
                <h3 className="text-2xl font-bold mb-4 text-card-foreground">
                  Accountant Portal
                </h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Financial management including challan uploads, attendance tracking, PF/ESI management, invoicing, and document access.
                </p>
                
                <Link 
                  href="/accountant/login" 
                  className="inline-block w-full"
                >
                  <ButtonComponent
                    variant="success"
                    size="lg"
                    fullWidth={true}
                    className="group-hover:shadow-lg transition-shadow duration-300"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Access Accountant Portal
                  </ButtonComponent>
                </Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-16">
            <p className="text-muted-foreground text-sm">
              Secure employee management system for ApexSolar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
