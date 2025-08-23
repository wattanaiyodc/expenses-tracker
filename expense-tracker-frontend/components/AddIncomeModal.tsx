'use client'
import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { AddIncomeModalProps } from "../types/model"; 
import { Category } from "../types/category"; 

/* interface Category {
  id: number
  name: string
}

interface AddIncomeModalProps {
  isOpen: boolean
  onClose: () => void
  onIncomeAdded: (income: any) => void
  API_URL: string
  editingIncome: Income | null; // ✅ เพิ่ม
  isEditing: boolean;           // ✅ เพิ่ม
} */

export default function AddIncomeModal({
  isOpen,
  onClose,
  onIncomeAdded = () => {}, // Default to no-op function
  API_URL,
  
}: AddIncomeModalProps) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // ฟังก์ชันสำหรับดึงวันที่ปัจจุบันในรูปแบบ Local
  const getTodayLocal = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (isOpen) {
      // ใช้ getTodayLocal() แทน toISOString()
      setDate(getTodayLocal())
      fetchCategories()
      
      // Reset form เมื่อเปิด modal
      setAmount('')
      setNote('')
      setCategoryId('')
      setError('')
    }
  }, [isOpen])

  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/income-categories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCategories(data)
        if (data.length > 0) {
          setCategoryId(data[0].id.toString())
        }
      } else {
        setError('ไม่สามารถดึงข้อมูลหมวดหมู่รายรับได้')
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
      console.error('Failed to fetch income categories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || !date || !categoryId) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    const amountNumber = parseFloat(amount)
    if (isNaN(amountNumber) || amountNumber <= 0) {
      setError('กรุณากรอกจำนวนเงินที่ถูกต้อง')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/incomes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amountNumber,
          note: note.trim() || undefined,
          date: date,
          categoryId: parseInt(categoryId)
        })
      })

      if (response.ok) {
        const newIncome = await response.json()
        onIncomeAdded(newIncome)
        handleClose()
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'ไม่สามารถเพิ่มรายรับได้')
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
      console.error('Failed to add income:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setAmount('')
    setNote('')
    setDate('')
    setCategoryId('')
    setError('')
    onClose()
  }

  // เพิ่มปุ่มสำหรับรีเซ็ตวันที่เป็นวันปัจจุบัน
  const resetToToday = () => {
    setDate(getTodayLocal())
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">เพิ่มรายรับ</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                จำนวนเงิน *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                หมวดหมู่ *
              </label>
              {isLoading ? (
                <div className="flex items-center justify-center py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  <span className="ml-2 text-sm text-gray-600">กำลังโหลด...</span>
                </div>
              ) : (
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={isSubmitting}
                  required
                >
                  <option value="">เลือกหมวดหมู่</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  วันที่ *
                </label>
                <button
                  type="button"
                  onClick={resetToToday}
                  className="text-xs text-green-600 hover:text-green-700"
                  disabled={isSubmitting}
                >
                  วันนี้
                </button>
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isSubmitting}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                วันที่ปัจจุบัน: {new Date().toLocaleDateString('th-TH')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                หมายเหตุ
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="หมายเหตุ (ไม่บังคับ)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={isSubmitting}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !amount || !date || !categoryId}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <span>บันทึก</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}