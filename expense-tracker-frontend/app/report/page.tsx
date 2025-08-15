'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ChartBarIcon, 
  CalendarIcon, 
  ArrowLeftIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  PresentationChartBarIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ReportData {
  monthlyTrend: {
    month: string
    income: number
    expense: number
    net: number
  }[]
  categoryBreakdown: {
    category: string
    amount: number
    percentage: number
    color: string
    type: 'income' | 'expense'
  }[]
  dailyTrend: {
    date: string
    income: number
    expense: number
    net: number
  }[]
  summary: {
    totalIncome: number
    totalExpense: number
    netBalance: number
    avgMonthlyIncome: number
    avgMonthlyExpense: number
    savingsRate: number
  }
}

export default function Reports() {
  const [data, setData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState('last3months')
  const [reportType, setReportType] = useState('overview')
  const router = useRouter()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  useEffect(() => {
    fetchReportData()
  }, [dateRange])

  const fetchReportData = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`${API_URL}/reports?range=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const reportData = await response.json()
        setData(reportData)
      } else if (response.status === 401) {
        localStorage.removeItem('token')
        router.push('/login')
      }
    } catch (error) {
      console.error('Failed to fetch report data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount)
  }

  // Custom formatter for Tooltip with proper typing
  const tooltipFormatter = (value: number | string | (number | string)[], name?: string) => {
    const numericValue = typeof value === 'number' ? value : Number(value)
    return [formatCurrency(numericValue), name]
  }

  // Custom label formatter for Pie chart
  const pieChartLabelFormatter = ({ category, percentage }: { category: string; percentage: number }) => 
    `${category} (${percentage.toFixed(1)}%)`

  const exportReport = () => {
    // สร้างข้อมูล CSV
    if (!data) return
    
    const csvData = [
      ['ประเภท', 'หมวดหมู่', 'จำนวน', 'เปอร์เซ็นต์'],
      ...data.categoryBreakdown.map(item => [
        item.type === 'income' ? 'รายรับ' : 'รายจ่าย',
        item.category,
        item.amount.toString(),
        item.percentage.toFixed(2) + '%'
      ])
    ]

    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `expense-report-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Colors for charts
  const COLORS = {
    income: '#10B981',
    expense: '#EF4444',
    net: '#3B82F6',
    categories: ['#8B5CF6', '#F59E0B', '#EF4444', '#10B981', '#6366F1', '#EC4899', '#14B8A6', '#F97316']
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูลรายงาน...</p>
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <PresentationChartBarIcon className="h-6 w-6 mr-2 text-blue-600" />
                  รายงานการเงิน
                </h1>
                <p className="text-sm text-gray-600">วิเคราะห์รายรับ-รายจ่ายของคุณ</p>
              </div>
            </div>
            <button
              onClick={exportReport}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
              <span>ส่งออกรายงาน</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4">
              <FunnelIcon className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-700">ตัวกรอง:</span>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="last7days">7 วันที่ผ่านมา</option>
                <option value="last30days">30 วันที่ผ่านมา</option>
                <option value="last3months">3 เดือนที่ผ่านมา</option>
                <option value="last6months">6 เดือนที่ผ่านมา</option>
                <option value="last12months">12 เดือนที่ผ่านมา</option>
                <option value="thisyear">ปีนี้</option>
              </select>

              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="overview">ภาพรวม</option>
                <option value="income">รายรับ</option>
                <option value="expense">รายจ่าย</option>
                <option value="comparison">เปรียบเทียบ</option>
              </select>
            </div>
          </div>
        </div>

        {data && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">รายรับรวม</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(data.summary.totalIncome)}
                    </p>
                    <p className="text-xs text-gray-500">เฉลี่ย/เดือน: {formatCurrency(data.summary.avgMonthlyIncome)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">รายจ่ายรวม</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(data.summary.totalExpense)}
                    </p>
                    <p className="text-xs text-gray-500">เฉลี่ย/เดือน: {formatCurrency(data.summary.avgMonthlyExpense)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BanknotesIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">ยอดคงเหลือสุทธิ</p>
                    <p className={`text-2xl font-bold ${data.summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(data.summary.netBalance)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <ChartBarIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">อัตราการออม</p>
                    <p className={`text-2xl font-bold ${data.summary.savingsRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.summary.savingsRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Monthly Trend */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">แนวโน้มรายเดือน</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={tooltipFormatter} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      stroke={COLORS.income} 
                      name="รายรับ"
                      strokeWidth={3}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expense" 
                      stroke={COLORS.expense} 
                      name="รายจ่าย"
                      strokeWidth={3}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="net" 
                      stroke={COLORS.net} 
                      name="สุทธิ"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Category Breakdown Pie Chart */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">สัดส่วนตามหมวดหมู่</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.categoryBreakdown.filter(item => item.type === 'expense')}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="amount"
                      label={pieChartLabelFormatter}
                    >
                      {data.categoryBreakdown.filter(item => item.type === 'expense').map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.categories[index % COLORS.categories.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={tooltipFormatter} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Daily Trend Bar Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">แนวโน้มรายวัน</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={tooltipFormatter} />
                  <Legend />
                  <Bar dataKey="income" fill={COLORS.income} name="รายรับ" />
                  <Bar dataKey="expense" fill={COLORS.expense} name="รายจ่าย" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category Details Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">รายละเอียดตามหมวดหมู่</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        หมวดหมู่
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ประเภท
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        จำนวนเงิน
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        เปอร์เซ็นต์
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.categoryBreakdown.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-3"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-sm font-medium text-gray-900">
                              {item.category}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.type === 'income' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                          {item.percentage.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}