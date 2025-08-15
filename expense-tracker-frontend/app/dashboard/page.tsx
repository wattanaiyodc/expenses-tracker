// app/dashboard/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  PlusIcon, 
  ChartBarIcon, 
  CogIcon, 
  CurrencyDollarIcon, 
  CalendarIcon,
  BanknotesIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import AddExpenseModal from '@/components/AddExpenseModal'
import CategoryManagementModal from '@/components/CategoryManagementModal'
import AddIncomeModal from '@/components/AddIncomeModal'

interface Expense {
  id: number
  amount: number
  note?: string
  date: string
  category: {
    id: number
    name: string
  }
}

interface Income {
  id: number
  amount: number
  note?: string
  date: string
  category: {
    id: number
    name: string
  }
}

interface DashboardData {
  totalExpenses: number
  monthlyExpenses: number
  todayExpenses: number
  recentExpenses: Expense[]
  expensesByCategory: {
    category: string
    amount: number
    percentage: number
  }[]
  dailyExpenses: {
    date: string
    amount: number
  }[]
  // เพิ่มข้อมูลรายรับ
  totalIncome: number
  monthlyIncome: number
  todayIncome: number
  recentIncome: Income[]
  incomeByCategory: {
    category: string
    amount: number
    percentage: number
  }[]
  netBalance: number
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<{ firstname: string; lastname: string } | null>(null)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false)
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState<boolean>(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false)
  const router = useRouter()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchDashboardData()
    fetchUserData()
  }, [router])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Fetch expenses data
      const expenseResponse = await fetch(`${API_URL}/expenses/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      // Fetch income data
      const incomeResponse = await fetch(`${API_URL}/incomes/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (expenseResponse.ok && incomeResponse.ok) {
        const expenseData = await expenseResponse.json()
        const incomeData = await incomeResponse.json()
        
        // รวมข้อมูลทั้งสองส่วน
        setData({
          ...expenseData,
          recentExpenses: expenseData.recentExpenses || [],
          expensesByCategory: expenseData.expensesByCategory || [],
          totalIncome: incomeData.totalIncome || 0,
          monthlyIncome: incomeData.monthlyIncome || 0,
          todayIncome: incomeData.todayIncome || 0,
          recentIncome: incomeData.recentIncome || [],
          incomeByCategory: incomeData.incomeByCategory || [],
          netBalance: (incomeData.totalIncome || 0) - (expenseData.totalExpenses || 0)
        })
      } else if (expenseResponse.status === 401 || incomeResponse.status === 401) {
        localStorage.removeItem('token')
        router.push('/login')
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error)
    }
  }

  const handleExpenseAdded = (newExpense: any) => {
    fetchDashboardData()
    console.log('รายจ่ายใหม่ถูกเพิ่มแล้ว:', newExpense)
  }

  const handleIncomeAdded = (newIncome: any) => {
    fetchDashboardData()
    console.log('รายรับใหม่ถูกเพิ่มแล้ว:', newIncome)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Expense Tracker</h1>
              {user && (
                <p className="text-sm text-gray-600">สวัสดี, {user.firstname} {user.lastname}</p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button 
              onClick={() => setIsExpenseModalOpen(true)}
              className="bg-red-600 text-white p-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowDownIcon className="h-5 w-5" />
              <span>เพิ่มรายจ่าย</span>
            </button>
            
            <button 
              onClick={() => setIsIncomeModalOpen(true)}
              className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowUpIcon className="h-5 w-5" />
              <span>เพิ่มรายรับ</span>
            </button>
            
            <button 
              onClick={() => router.push('/reports')}
              className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <ChartBarIcon className="h-5 w-5" />
              <span>ดูรายงาน</span>
            </button>
            
            <button 
              onClick={() => setIsCategoryModalOpen(true)}
              className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
            >
              <TagIcon className="h-5 w-5" />
              <span>จัดการหมวดหมู่</span>
            </button>
          </div>
        </div>

        {/* Summary Cards - แถวแรก */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <ArrowUpIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">รายรับวันนี้</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(data?.todayIncome || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <ArrowDownIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">รายจ่ายวันนี้</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(data?.todayExpenses || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BanknotesIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ยอดคงเหลือ</p>
                <p className={`text-2xl font-bold ${(data?.netBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data?.netBalance || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ประหยัดได้เดือนนี้</p>
                <p className={`text-2xl font-bold ${((data?.monthlyIncome || 0) - (data?.monthlyExpenses || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency((data?.monthlyIncome || 0) - (data?.monthlyExpenses || 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards - แถวสอง */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">รายรับเดือนนี้</h3>
              <div className="p-2 bg-green-100 rounded-lg">
                <ArrowUpIcon className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(data?.monthlyIncome || 0)}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              รวมรายรับทั้งหมด: {formatCurrency(data?.totalIncome || 0)}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">รายจ่ายเดือนนี้</h3>
              <div className="p-2 bg-red-100 rounded-lg">
                <ArrowDownIcon className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-red-600">
              {formatCurrency(data?.monthlyExpenses || 0)}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              รวมรายจ่ายทั้งหมด: {formatCurrency(data?.totalExpenses || 0)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Income & Expenses */}
          <div className="space-y-6">
            {/* Recent Income */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ArrowUpIcon className="h-5 w-5 text-green-600 mr-2" />
                  รายรับล่าสุด
                </h2>
              </div>
              <div className="p-6">
                {data && data.recentIncome && data.recentIncome.length > 0 ? (
                  <div className="space-y-4">
                    {data.recentIncome.slice(0, 5).map((income) => (
                      <div key={income.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {income.category.name}
                            </p>
                            <p className="text-lg font-semibold text-green-600">
                              +{formatCurrency(income.amount)}
                            </p>
                          </div>
                          {income.note && (
                            <p className="text-sm text-gray-500 mt-1">{income.note}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(income.date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">ยังไม่มีรายการรายรับ</p>
                )}
              </div>
            </div>

            {/* Recent Expenses */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ArrowDownIcon className="h-5 w-5 text-red-600 mr-2" />
                  รายจ่ายล่าสุด
                </h2>
              </div>
              <div className="p-6">
                {data && data.recentExpenses.length > 0 ? (
                  <div className="space-y-4">
                    {data.recentExpenses.slice(0, 5).map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {expense.category.name}
                            </p>
                            <p className="text-lg font-semibold text-red-600">
                              -{formatCurrency(expense.amount)}
                            </p>
                          </div>
                          {expense.note && (
                            <p className="text-sm text-gray-500 mt-1">{expense.note}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(expense.date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">ยังไม่มีรายการค่าใช้จ่าย</p>
                )}
              </div>
            </div>
          </div>

          {/* Categories Analysis */}
          <div className="space-y-6">
            {/* Income by Category */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ArrowUpIcon className="h-5 w-5 text-green-600 mr-2" />
                  รายรับแยกตามหมวดหมู่
                </h2>
              </div>
              <div className="p-6">
                {data && data.incomeByCategory && data.incomeByCategory.length > 0 ? (
                  <div className="space-y-4">
                    {data.incomeByCategory.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              {item.category}
                            </span>
                            <span className="text-sm font-semibold text-green-600">
                              {formatCurrency(item.amount)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 mt-1">
                            {item.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">ยังไม่มีข้อมูลหมวดหมู่รายรับ</p>
                )}
              </div>
            </div>

            {/* Expenses by Category */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ArrowDownIcon className="h-5 w-5 text-red-600 mr-2" />
                  รายจ่ายแยกตามหมวดหมู่
                </h2>
              </div>
              <div className="p-6">
                {data && data.expensesByCategory.length > 0 ? (
                  <div className="space-y-4">
                    {data.expensesByCategory.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              {item.category}
                            </span>
                            <span className="text-sm font-semibold text-red-600">
                              {formatCurrency(item.amount)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 mt-1">
                            {item.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">ยังไม่มีข้อมูลหมวดหมู่รายจ่าย</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onExpenseAdded={handleExpenseAdded}
        API_URL={API_URL}
      />

      {/* Add Income Modal */}
      <AddIncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        onIncomeAdded={handleIncomeAdded}
        API_URL={API_URL}
      />

      {/* Category Management Modal */}
      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        API_URL={API_URL}
      />
    </div>
  )
}