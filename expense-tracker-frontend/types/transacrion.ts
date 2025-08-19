interface Transaction  {
  id: number
  amount: number
  note?: string
  date: string
  category: {
    id: number
    name: string
  }
}

export interface FormData {
  amount: string;
  categoryId: string;
  note: string;
  date: string;
}

export interface UpdateExpenseData {
  amount: number
  category_id: number
  note?: string
  date: string
}

export interface UpdateIncomeData {
  amount: number
  category_id: number
  note?: string
  date: string
}

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
}
export type Expense = Transaction
export type Income = Transaction



