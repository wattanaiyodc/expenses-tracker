// components/EditExpenseModal.tsx
'use client'
import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface Category {
  id: number
  name: string
  type: 'expense' | 'income'
}

interface Expense {
  id: number
  amount: number
  note: string
  date: string
  categoryId: number
  category: Category
}

interface EditExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onExpenseUpdated: (expense: Expense) => void
  API_URL: string
  expenseId: number | null
}

export default function EditExpenseModal({
  isOpen,
  onClose,
  onExpenseUpdated,
  API_URL,
  expenseId
}: EditExpenseModalProps) {
  const [expense, setExpense] = useState<Expense | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form data state
  const [formData, setFormData] = useState({
    amount: '',
    categoryId: '',
    note: '',
    date: ''
  })

  // เมื่อเปิด modal และมี expenseId ให้ดึงข้อมูล
  useEffect(() => {
    if (isOpen && expenseId) {
      fetchExpenseData()
      fetchCategories()
    }
  }, [isOpen, expenseId])

  // ดึงข้อมูลรายจ่ายที่ต้องการแก้ไข
  const fetchExpenseData = async () => {
    if (!expenseId) return
    
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/expenses/${expenseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const expenseData = await response.json()
        setExpense(expenseData)
        
        // ตั้งค่าฟอร์มด้วยข้อมูลที่ดึงมา
        setFormData({
          amount: expenseData.amount.toString(),
          categoryId: expenseData.categoryId.toString(),
          note: expenseData.note || '',
          date: new Date(expenseData.date).toISOString().split('T')[0]
        })
      } else {
        alert('ไม่สามารถดึงข้อมูลรายจ่ายได้')
        onClose()
      }
    } catch (error) {
      console.error('Error fetching expense:', error)
      alert('เกิดข้อผิดพลาดในการดึงข้อมูล')
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  // ดึงข้อมูลหมวดหมู่
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // กรองเฉพาะหมวดหมู่รายจ่าย
        const expenseCategories = data.filter((cat: Category) => cat.type === 'expense')
        setCategories(expenseCategories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  // จัดการการเปลี่ยนแปลงของฟอร์ม
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // ส่งข้อมูลที่แก้ไขแล้ว
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expenseId || isSubmitting) return

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/expenses/${expenseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          categoryId: parseInt(formData.categoryId),
          note: formData.note,
          date: formData.date
        })
      })

      if (response.ok) {
        const updatedExpense = await response.json()
        onExpenseUpdated(updatedExpense)
        handleClose()
      } else {
        const errorData = await response.json()
        alert(errorData.message || 'เกิดข้อผิดพลาดในการอัพเดทรายจ่าย')
      }
    } catch (error) {
      console.error('Error updating expense:', error)
      alert('เกิดข้อผิดพลาดในการอัพเดทรายจ่าย')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ปิด modal และรีเซ็ตข้อมูล
  const handleClose = () => {
    setExpense(null)
    setFormData({
      amount: '',
      categoryId: '',
      note: '',
      date: ''
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">แก้ไขรายจ่าย</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            // Loading State
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <span className="ml-3 text-gray-600">กำลังโหลดข้อมูล...</span>
            </div>
          ) : expense ? (
            // Form
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* จำนวนเงิน */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  จำนวนเงิน *
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              {/* หมวดหมู่ */}
              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
                  หมวดหมู่ *
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">เลือกหมวดหมู่</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* วันที่ */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  วันที่ *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              {/* หมายเหตุ */}
              <div>
                <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                  หมายเหตุ
                </label>
                <textarea
                  id="note"
                  name="note"
                  rows={3}
                  value={formData.note}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  placeholder="หมายเหตุเพิ่มเติม..."
                />
              </div>

              {/* Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      กำลังอัพเดท...
                    </div>
                  ) : (
                    'อัพเดทรายจ่าย'
                  )}
                </button>
              </div>
            </form>
          ) : (
            // Error State
            <div className="text-center py-8">
              <p className="text-red-600">ไม่สามารถโหลดข้อมูลได้</p>
              <button
                onClick={handleClose}
                className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                ปิด
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}