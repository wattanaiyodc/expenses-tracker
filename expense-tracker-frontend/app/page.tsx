// app/page.tsx
import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect ไปหน้า login เป็นหน้าแรก
  redirect('/login')
}