import { Income, Expense } from "../types/transacrion";

export interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseAdded?: (expense: any) => void;
  API_URL?: string;
  editingExpense: Expense | null;
  isEditing: boolean;
}

export interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIncomeAdded?: (income: any) => void;
  API_URL: string;
  editingIncome: Income | null;
  isEditing: boolean;
}
