"use client";
import { useState, useEffect, useCallback, useMemo, ChangeEvent, FormEvent, memo } from "react";
import { Plus, Save, Calendar, DollarSign, FileText, Tag, X } from "lucide-react";

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

// Memoized utilities
const getTodayLocal = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Cache with expiry (5 minutes)
let categoriesCache: { data: Category[] | null; timestamp: number } = {
  data: null,
  timestamp: 0
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Memoized Category Button Component
const CategoryButton = memo(({ 
  category, 
  isSelected, 
  onClick 
}: { 
  category: Category; 
  isSelected: boolean; 
  onClick: () => void; 
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`p-3 rounded-xl border text-sm font-medium transition-all ${
      isSelected
        ? "border-blue-500 bg-blue-50 text-blue-700"
        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
    }`}
  >
    <div className="flex items-center gap-2">
      <div 
        className="w-3 h-3 rounded-full" 
        style={{ backgroundColor: category.color }}
      />
      {category.name}
    </div>
  </button>
));

CategoryButton.displayName = 'CategoryButton';

// Memoized Message Component
const Message = memo(({ type, message }: { type: 'success' | 'error'; message: string }) => (
  <div className={`px-4 py-3 rounded-lg mb-4 ${
    type === 'success' 
      ? 'bg-green-50 border border-green-200 text-green-700'
      : 'bg-red-50 border border-red-200 text-red-700'
  }`}>
    {message}
  </div>
));

Message.displayName = 'Message';

const AddExpenseModal = ({ 
  isOpen, 
  onClose, 
  onExpenseAdded, 
  API_URL 
}: AddExpenseModalProps) => {
  // Initialize with lazy computation
  const [formData, setFormData] = useState<FormData>(() => ({
    amount: "",
    categoryId: "",
    note: "",
    date: getTodayLocal(),
  }));

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Memoized validation
  const isFormValid = useMemo(() => {
    return formData.amount && 
           formData.categoryId && 
           formData.date && 
           parseFloat(formData.amount) > 0;
  }, [formData.amount, formData.categoryId, formData.date]);

  // Optimized fetch categories with cache
  const fetchCategories = useCallback(async () => {
    if (!API_URL) return;

    // Check cache validity
    const now = Date.now();
    const isCacheValid = categoriesCache.data && 
                        (now - categoriesCache.timestamp < CACHE_DURATION);
    
    if (isCacheValid) {
      setCategories(categoriesCache.data!);
      return;
    }

    setIsLoadingCategories(true);
    setCategoriesError("");

    try {
      const token = localStorage.getItem("token");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const res = await fetch(`${API_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลหมวดหมู่ได้");

      const data: Category[] = await res.json();
      
      // Update cache
      categoriesCache = {
        data,
        timestamp: now
      };
      
      setCategories(data);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setCategoriesError("การเชื่อมต่อหมดเวลา");
      } else {
        console.error("Failed to fetch categories:", error);
        setCategoriesError("ไม่สามารถโหลดหมวดหมู่ได้");
      }
      setCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  }, [API_URL]);

  // Reset form when modal opens
  const resetForm = useCallback(() => {
    setFormData({
      amount: "",
      categoryId: "",
      note: "",
      date: getTodayLocal(),
    });
    setErrorMessage("");
    setSuccessMessage("");
  }, []);

  // Effect for modal open
  useEffect(() => {
    if (isOpen) {
      resetForm();
      fetchCategories();
    }
  }, [isOpen, resetForm, fetchCategories]);

  // Optimized input change handler
  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear messages on input change
    if (errorMessage) setErrorMessage("");
    if (successMessage) setSuccessMessage("");
  }, [errorMessage, successMessage]);

  // Optimized category selection
  const handleCategorySelect = useCallback((categoryId: string) => {
    setFormData(prev => ({ ...prev, categoryId }));
    if (errorMessage) setErrorMessage("");
  }, [errorMessage]);

  // Optimized submit handler with debounce protection
  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent double submission
    
    setErrorMessage("");
    setSuccessMessage("");

    if (!isFormValid) {
      setErrorMessage("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const res = await fetch(`${API_URL}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          categoryId: parseInt(formData.categoryId),
          note: formData.note || undefined,
          date: formData.date,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "เกิดข้อผิดพลาดในการเพิ่มรายจ่าย");
      }

      const newExpense = await res.json();
      setSuccessMessage("เพิ่มรายจ่ายสำเร็จแล้ว!");
      
      // Reset form immediately
      resetForm();
      
      onExpenseAdded?.(newExpense);

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        setErrorMessage("การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง");
      } else {
        setErrorMessage(error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, isFormValid, formData, API_URL, onExpenseAdded, onClose, resetForm]);

  // Optimized close handler
  const handleClose = useCallback(() => {
    if (isSubmitting) return; // Prevent closing during submission
    onClose();
    resetForm();
  }, [isSubmitting, onClose, resetForm]);

  // Early return for better performance
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 backdrop-blur-sm bg-white/20 z-40 transition-opacity duration-300" 
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
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
              disabled={isSubmitting}
              aria-label="ปิด"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Messages */}
            {successMessage && <Message type="success" message={successMessage} />}
            {errorMessage && <Message type="error" message={errorMessage} />}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount */}
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
                  disabled={isSubmitting}
                  required 
                />
              </div>

              {/* Categories */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <Tag className="w-4 h-4" />
                  หมวดหมู่ * {isLoadingCategories && <span className="text-xs text-gray-500">(กำลังโหลด...)</span>}
                </label>
                
                {categoriesError ? (
                  <div className="text-red-500 text-sm mb-2 p-2 bg-red-50 rounded">
                    {categoriesError}
                    <button 
                      type="button" 
                      onClick={fetchCategories}
                      className="ml-2 text-blue-600 underline"
                    >
                      ลองใหม่
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((cat) => (
                      <CategoryButton
                        key={cat.id}
                        category={cat}
                        isSelected={formData.categoryId === cat.id.toString()}
                        onClick={() => handleCategorySelect(cat.id.toString())}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Date */}
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
                  disabled={isSubmitting}
                  required 
                />
              </div>

              {/* Note */}
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
                  disabled={isSubmitting}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={handleClose} 
                  className="flex-1 py-3 rounded-xl font-semibold text-gray-600 border border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !isFormValid}
                  className={`flex-1 py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                    isSubmitting || !isFormValid
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 active:scale-95"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
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
            </form>

            <p className="text-xs text-gray-500 text-center mt-4">
              * ข้อมูลที่จำเป็นต้องกรอก
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

AddExpenseModal.displayName = 'AddExpenseModal';

export default memo(AddExpenseModal);