import Link from "next/link";

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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-7xl mx-auto mb-12 sm:mb-16">
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mx-2 sm:mx-0">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-blue-600">
                Admin Portal
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed">
                Comprehensive employee management, document storage, and payment tracking.
              </p>
              <Link 
                href="/admin/login" 
                className="inline-block w-full sm:w-auto text-center bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base font-medium"
              >
                Access Admin
              </Link>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mx-2 sm:mx-0">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-green-600">
                Accountant Portal
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed">
                Challan management, invoicing, and financial tracking for accountants.
              </p>
              <Link 
                href="/accountant/login" 
                className="inline-block w-full sm:w-auto text-center bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base font-medium"
              >
                Accountant Login
              </Link>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mx-2 sm:mx-0">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-orange-600">
                Employee Management
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed">
                Create and manage employee profiles with secure document access.
              </p>
              <Link 
                href="/admin/dashboard" 
                className="inline-block w-full sm:w-auto text-center bg-orange-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-orange-700 transition-colors text-sm sm:text-base font-medium"
              >
                Manage Employees
              </Link>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mx-2 sm:mx-0">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-purple-600">
                Attendance Portal
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed">
                Attendance tracking and PF/ESI management dashboard.
              </p>
              <Link 
                href="/attendance/login" 
                className="inline-block w-full sm:w-auto text-center bg-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base font-medium"
              >
                Access Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
