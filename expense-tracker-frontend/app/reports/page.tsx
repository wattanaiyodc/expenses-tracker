// app/reports/page.tsx (updated to use real API)
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeftIcon,
  CalendarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24
    }
  }
}

const cardHoverVariants = {
  hover: {
    scale: 1.02,
    y: -5,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 10
    }
  }
}

// Colors for charts
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']

interface ReportData {
  monthlyData: {
    month: string
    income: number
    expenses: number
    net: number
  }[]
  categoryData: {
    name: string
    value: number
    type: 'income' | 'expense'
  }[]
  weeklyData: {
    day: string
    income: number
    expenses: number
  }[]
  summary: {
    totalIncome: number
    totalExpenses: number
    netBalance: number
    avgMonthlyIncome: number
    avgMonthlyExpenses: number
    monthlyGrowth: number
  }
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('6months')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const API_URL = process.env.NEXT_PUBLIC_API_URL 

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchReportData()
  }, [selectedPeriod])

  const fetchReportData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const token = localStorage.getItem('token')
      
      console.log('🔍 Debug Info:')
      console.log('- API_URL:', API_URL)
      console.log('- Token exists:', !!token)
      console.log('- Selected period:', selectedPeriod)
      
      if (!token) {
        console.log('❌ No token found, redirecting to login')
        router.push('/login')
        return
      }

      const url = `${API_URL}/reports?period=${selectedPeriod}`
      console.log('🌐 Fetching from:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('📡 Response status:', response.status)
      console.log('📡 Response ok:', response.ok)

      if (response.status === 401) {
        console.log('🔐 Unauthorized, removing token and redirecting')
        localStorage.removeItem('token')
        router.push('/login')
        return
      }

      const responseText = await response.text()
      console.log('📄 Raw response:', responseText)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText || response.statusText}`)
      }

      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${responseText}`)
      }
      
      console.log('✅ Parsed result:', result)
      
      if (result.success) {
        setData(result.data)
        console.log('✅ Data set successfully')
      } else {
        throw new Error(result.message || 'API returned success: false')
      }
      
    } catch (error) {
      console.error('❌ API Error:', error)
      setError(`API Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      // ใช้ mock data เมื่อ API fail
      console.log('🔄 Using fallback mock data')
      const mockData: ReportData = {
        monthlyData: [
          { month: 'ม.ค.', income: 45000, expenses: 32000, net: 13000 },
          { month: 'ก.พ.', income: 48000, expenses: 28000, net: 20000 },
          { month: 'มี.ค.', income: 52000, expenses: 35000, net: 17000 },
          { month: 'เม.ย.', income: 46000, expenses: 31000, net: 15000 },
          { month: 'พ.ค.', income: 50000, expenses: 29000, net: 21000 },
          { month: 'มิ.ย.', income: 55000, expenses: 33000, net: 22000 }
        ],
        categoryData: [
          { name: 'เงินเดือน', value: 180000, type: 'income' },
          { name: 'รายได้เสริม', value: 45000, type: 'income' },
          { name: 'อาหาร', value: 25000, type: 'expense' },
          { name: 'ที่อยู่อาศัย', value: 35000, type: 'expense' },
          { name: 'คมนาคม', value: 15000, type: 'expense' },
          { name: 'ช้อปปิ้ง', value: 18000, type: 'expense' }
        ],
        weeklyData: [
          { day: 'จ', income: 2000, expenses: 1200 },
          { day: 'อ', income: 8000, expenses: 1500 },
          { day: 'พ', income: 1000, expenses: 2200 },
          { day: 'พฤ', income: 3000, expenses: 1800 },
          { day: 'ศ', income: 5000, expenses: 2500 },
          { day: 'ส', income: 2500, expenses: 3200 },
          { day: 'อา', income: 1500, expenses: 1100 }
        ],
        summary: {
          totalIncome: 225000,
          totalExpenses: 93000,
          netBalance: 132000,
          avgMonthlyIncome: 37500,
          avgMonthlyExpenses: 15500,
          monthlyGrowth: 8.5
        }
      }
      setData(mockData)
      console.log('✅ Mock data loaded')
    } finally {
      setIsLoading(false)
      console.log('🏁 Loading finished')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-gray-600 text-lg">กำลังโหลดข้อมูลรายงาน...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <motion.header 
        className="bg-white shadow-lg border-b border-gray-200"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <motion.button
                onClick={handleBackToDashboard}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </motion.button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">รายงานทางการเงิน</h1>
                <p className="text-sm text-gray-600">วิเคราะห์รายรับ-รายจ่าย</p>
                {error && (
                  <p className="text-xs text-orange-600 mt-1">
                    กำลังใช้ข้อมูลตัวอย่าง (ไม่สามารถเชื่อมต่อ API ได้)
                  </p>
                )}
              </div>
            </div>
            
            {/* Period Selector */}
            <motion.div 
              className="flex bg-gray-100 rounded-lg p-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {[
                { value: '3months', label: '3 เดือน' },
                { value: '6months', label: '6 เดือน' },
                { value: '1year', label: '1 ปี' }
              ].map((period) => (
                <motion.button
                  key={period.value}
                  onClick={() => setSelectedPeriod(period.value)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    selectedPeriod === period.value
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {period.label}
                </motion.button>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Summary Cards */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            variants={itemVariants}
          >
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
              variants={cardHoverVariants}
              whileHover="hover"
            >
              <div className="flex items-center">
                <motion.div 
                  className="p-3 bg-gradient-to-r from-green-400 to-green-600 rounded-lg"
                  whileHover={{ rotate: 5 }}
                >
                  <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
                </motion.div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">รายรับรวม</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(data?.summary.totalIncome || 0)}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
              variants={cardHoverVariants}
              whileHover="hover"
            >
              <div className="flex items-center">
                <motion.div 
                  className="p-3 bg-gradient-to-r from-red-400 to-red-600 rounded-lg"
                  whileHover={{ rotate: -5 }}
                >
                  <ArrowTrendingDownIcon className="h-6 w-6 text-white" />
                </motion.div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">รายจ่ายรวม</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(data?.summary.totalExpenses || 0)}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
              variants={cardHoverVariants}
              whileHover="hover"
            >
              <div className="flex items-center">
                <motion.div 
                  className="p-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg"
                  whileHover={{ scale: 1.1 }}
                >
                  <BanknotesIcon className="h-6 w-6 text-white" />
                </motion.div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">ยอดคงเหลือ</p>
                  <p className={`text-2xl font-bold ${(data?.summary.netBalance || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {formatCurrency(data?.summary.netBalance || 0)}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
              variants={cardHoverVariants}
              whileHover="hover"
            >
              <div className="flex items-center">
                <motion.div 
                  className="p-3 bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg"
                  whileHover={{ rotate: 10 }}
                >
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </motion.div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">การเติบโต</p>
                  <p className={`text-2xl font-bold ${(data?.summary.monthlyGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data?.summary.monthlyGrowth ? `${data.summary.monthlyGrowth > 0 ? '+' : ''}${data.summary.monthlyGrowth.toFixed(1)}%` : '0%'}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Monthly Trend Chart */}
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
              variants={itemVariants}
            >
              <motion.h3 
                className="text-lg font-semibold text-gray-900 mb-6 flex items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
                แนวโน้มรายเดือน
              </motion.h3>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data?.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="income" 
                      fill="#22c55e" 
                      name="รายรับ" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="expenses" 
                      fill="#ef4444" 
                      name="รายจ่าย" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </motion.div>

            {/* Weekly Trend Chart */}
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
              variants={itemVariants}
            >
              <motion.h3 
                className="text-lg font-semibold text-gray-900 mb-6 flex items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <ChartBarIcon className="h-5 w-5 mr-2 text-purple-600" />
                แนวโน้มรายสัปดาห์
              </motion.h3>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data?.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#22c55e" 
                      strokeWidth={3}
                      name="รายรับ"
                      dot={{ fill: '#22c55e', r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#ef4444" 
                      strokeWidth={3}
                      name="รายจ่าย"
                      dot={{ fill: '#ef4444', r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            </motion.div>
          </div>

          {/* Category Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Income Categories */}
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
              variants={itemVariants}
            >
              <motion.h3 
                className="text-lg font-semibold text-gray-900 mb-6 flex items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <ArrowTrendingUpIcon className="h-5 w-5 mr-2 text-green-600" />
                หมวดหมู่รายรับ
              </motion.h3>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9, duration: 0.5 }}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data?.categoryData.filter(item => item.type === 'income')}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: { name: string; percent?: number }) => 
                        `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data?.categoryData.filter(item => item.type === 'income').map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            </motion.div>

            {/* Expense Categories */}
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
              variants={itemVariants}
            >
              <motion.h3 
                className="text-lg font-semibold text-gray-900 mb-6 flex items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <ArrowTrendingDownIcon className="h-5 w-5 mr-2 text-red-600" />
                หมวดหมู่รายจ่าย
              </motion.h3>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0, duration: 0.5 }}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data?.categoryData.filter(item => item.type === 'expense')}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: { name: string; percent?: number }) => 
                        `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data?.categoryData.filter(item => item.type === 'expense').map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}