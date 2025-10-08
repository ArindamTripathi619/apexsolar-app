import Link from 'next/link'
import ButtonComponent from '@/app/components/ui/ButtonComponent';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            ApexSolar
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
            Advanced Employee Management System - Secure, Scalable, and Responsive
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto mb-12 sm:mb-16">
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mx-2 sm:mx-0">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-blue-600">
                Admin Portal
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed">
                Comprehensive employee management, document storage, payment tracking, attendance monitoring, and invoice management.
              </p>
              <Link 
                href="/admin/login" 
                className="inline-block w-full sm:w-auto text-center"
              >
                <ButtonComponent
                  variant="primary"
                  size="lg"
                  fullWidth={true}
                  className="sm:w-auto"
                >
                  Access Admin Portal
                </ButtonComponent>
              </Link>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mx-2 sm:mx-0">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-green-600">
                Accountant Portal
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed">
                Financial management including challan uploads, attendance tracking, PF/ESI management, invoicing, and document access.
              </p>
              <Link 
                href="/accountant/login" 
                className="inline-block w-full sm:w-auto text-center"
              >
                <ButtonComponent
                  variant="success"
                  size="lg"
                  fullWidth={true}
                  className="sm:w-auto"
                >
                  Access Accountant Portal
                </ButtonComponent>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
