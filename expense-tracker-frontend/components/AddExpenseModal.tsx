"use client";
import { useState, ChangeEvent, FormEvent } from 'react';
import { Plus, Save, Calendar, DollarSign, FileText, Tag, X } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  color: string;
}

interface FormData {
  amount: string;
  categoryId: string;
  note: string;
  date: string;
}

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseAdded?: (expense: any) => void;
  API_URL?: string;
}

const AddExpenseModal = ({ 
  isOpen, 
  onClose, 
  onExpenseAdded, 
  API_URL 
}: AddExpenseModalProps) => {
  const [formData, setFormData] = useState<FormData>({
    amount: '',
    categoryId: '',
    note: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [categories] = useState<Category[]>([
    { id: 1, name: 'อาหาร', color: '#FF6B6B' },
    { id: 2, name: 'การเดินทาง', color: '#4ECDC4' },
    { id: 3, name: 'ช็อปปิ้ง', color: '#45B7D1' },
    { id: 4, name: 'บันเทิง', color: '#96CEB4' },
    { id: 5, name: 'สุขภาพ', color: '#FFEAA7' },
    { id: 6, name: 'การศึกษา', color: '#DDA0DD' },
    { id: 7, name: 'อื่นๆ', color: '#95A5A6' }
  ]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validation
    if (!formData.amount || !formData.categoryId || !formData.date) {
      setErrorMessage('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      setErrorMessage('จำนวนเงินต้องมากกว่า 0');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // ใช้ API_URL ที่ส่งมาเป็น props หรือค่า default
      const apiEndpoint = `${API_URL}/expenses`;
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          categoryId: parseInt(formData.categoryId),
          note: formData.note,
          date: formData.date
        })
      });

      if (response.ok) {
        const newExpense = await response.json();
        setSuccessMessage('เพิ่มรายจ่ายสำเร็จแล้ว!');
        
        // Reset form
        setFormData({
          amount: '',
          categoryId: '',
          note: '',
          date: new Date().toISOString().split('T')[0]
        });
        
        // เรียก callback function ถ้ามี
        if (onExpenseAdded) {
          onExpenseAdded(newExpense);
        }
        
        // ปิด modal หลังจาก 1.5 วินาที
        setTimeout(() => {
          onClose();
          setSuccessMessage('');
        }, 1500);
        
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'เกิดข้อผิดพลาดในการเพิ่มรายจ่าย');
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // รีเซ็ตฟอร์มเมื่อปิด modal
    setFormData({
      amount: '',
      categoryId: '',
      note: '',
      date: new Date().toISOString().split('T')[0]
    });
    setSuccessMessage('');
    setErrorMessage('');
    onClose();
  };

  // ถ้าไม่เปิด modal ก็ไม่แสดงอะไร
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 backdrop-blur-sm bg-white/20 z-40 transition-opacity duration-300"
        onClick={handleClose}
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">เพิ่มรายจ่าย</h1>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Success/Error Messages */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                {successMessage}
              </div>
            )}
            
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Amount Input */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4" />
                    จำนวนเงิน *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                    <Tag className="w-4 h-4" />
                    หมวดหมู่ *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, categoryId: category.id.toString() }))}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                          formData.categoryId === category.id.toString()
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          ></div>
                          {category.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Input */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4" />
                    วันที่ *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                {/* Note Input */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4" />
                    หมายเหตุ
                  </label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    placeholder="เพิ่มรายละเอียดเพิ่มเติม..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-3 rounded-xl font-semibold text-gray-600 border border-gray-300 hover:bg-gray-50 transition-all"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                      isSubmitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 active:scale-95'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        บันทึก...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        บันทึก
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Info */}
            <p className="text-xs text-gray-500 text-center mt-4">
              * ข้อมูลที่จำเป็นต้องกรอก
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddExpenseModal;