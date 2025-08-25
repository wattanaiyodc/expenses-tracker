// components/CategoryManagementModal.tsx
'use client'
import { useState, useEffect } from 'react'
import { XMarkIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

interface Category {
  id: number
  name: string
}

interface CategoryManagementModalProps {
  isOpen: boolean
  onClose: () => void
  API_URL?: string
}

export default function CategoryManagementModal({
  isOpen,
  onClose,
  API_URL 
}: CategoryManagementModalProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

  const fetchCategories = async () => {
    setIsLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      } else {
        setError('ไม่สามารถดึงข้อมูลหมวดหมู่ได้')
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
      console.error('Failed to fetch categories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('กรุณากรอกชื่อหมวดหมู่')
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newCategoryName.trim()
        })
      })

      if (response.ok) {
        const newCategory = await response.json()
        setCategories(prev => [...prev, newCategory])
        setNewCategoryName('')
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'ไม่สามารถเพิ่มหมวดหมู่ได้')
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
      console.error('Failed to add category:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      setError('กรุณากรอกชื่อหมวดหมู่')
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingCategory.name.trim()
        })
      })

      if (response.ok) {
        const updatedCategory = await response.json()
        setCategories(prev => 
          prev.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat)
        )
        setEditingCategory(null)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'ไม่สามารถแก้ไขหมวดหมู่ได้')
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
      console.error('Failed to update category:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่นี้?')) {
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setCategories(prev => prev.filter(cat => cat.id !== categoryId))
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'ไม่สามารถลบหมวดหมู่ได้')
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
      console.error('Failed to delete category:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setNewCategoryName('')
    setEditingCategory(null)
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">จัดการหมวดหมู่</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Add New Category */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เพิ่มหมวดหมู่ใหม่
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="ชื่อหมวดหมู่"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <button
                onClick={handleAddCategory}
                disabled={isSubmitting || !newCategoryName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <PlusIcon className="h-4 w-4" />
                <span>เพิ่ม</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Categories List */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              หมวดหมู่ทั้งหมด
            </label>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">กำลังโหลด...</span>
              </div>
            ) : categories.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-gray-50"
                  >
                    {editingCategory?.id === category.id ? (
                      <div className="flex items-center space-x-2 flex-1">
                        <input
                          type="text"
                          value={editingCategory.name}
                          onChange={(e) =>
                            setEditingCategory({ ...editingCategory, name: e.target.value })
                          }
                          className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          disabled={isSubmitting}
                          onKeyPress={(e) => e.key === 'Enter' && handleEditCategory()}
                          autoFocus
                        />
                        <button
                          onClick={handleEditCategory}
                          disabled={isSubmitting}
                          className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          บันทึก
                        </button>
                        <button
                          onClick={() => setEditingCategory(null)}
                          disabled={isSubmitting}
                          className="px-2 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-gray-900 flex-1">{category.name}</span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setEditingCategory(category)}
                            disabled={isSubmitting}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded disabled:opacity-50"
                            title="แก้ไข"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            disabled={isSubmitting}
                            className="p-1 text-red-600 hover:bg-red-100 rounded disabled:opacity-50"
                            title="ลบ"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">ยังไม่มีหมวดหมู่</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            disabled={isSubmitting}
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  )
}