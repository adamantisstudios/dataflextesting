import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * In local/preview mode the required env variables may be missing.
 * We fall back to Supabase's public demo project so the UI doesn't crash.
 * Replace these values with your real project credentials in production:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jjjaaipqiobbenqihttt.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqamFhaXBxaW9iYmVucWlodHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTQxNjksImV4cCI6MjA2NjA5MDE2OX0.zN_EzOp_PfwjzOReP9CjSWZMG5hhffqPOeutYJNw2i0"

// Remove the warning since we now have valid credentials
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.log("Using fallback Supabase credentials for development")
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Agent {
  id: string
  full_name: string
  phone_number: string
  momo_number: string
  region: string
  password_hash?: string
  isapproved: boolean
  wallet_balance?: number
  created_at: string
}

export interface Service {
  id: string
  title: string
  description: string
  commission_amount: number
  product_cost?: number
  service_type?: "referral" | "data_bundle"
  materials_link?: string
  image_url?: string
  created_at: string
}

export interface DataBundle {
  id: string
  name: string
  provider: "MTN" | "AirtelTigo" | "Telecel"
  size_gb: number
  price: number
  validity_months: number
  image_url?: string
  is_active: boolean
  created_at: string
  commission_rate: number // Stored as a decimal (e.g., 0.01 for 1%)
}

export interface DataOrder {
  id: string
  agent_id: string
  bundle_id: string
  recipient_phone: string
  payment_reference: string
  payment_method: "manual" | "wallet"
  status: "pending" | "confirmed" | "processing" | "completed" | "canceled"
  admin_notes?: string
  admin_message?: string
  commission_amount: number
  commission_paid: boolean
  created_at: string
  updated_at: string
  agents?: Agent
  data_bundles?: DataBundle
}

export interface DataOrderNote {
  id: string
  order_id: string
  note_text: string
  original_note?: string
  is_edited: boolean
  created_by: string
  created_at: string
  edited_at?: string
}

export interface Referral {
  id: string
  agent_id: string
  service_id: string
  client_name: string
  client_phone: string
  description: string
  allow_direct_contact?: boolean
  status: "pending" | "confirmed" | "in_progress" | "completed" | "rejected"
  commission_paid: boolean
  created_at: string
  agents?: Agent
  services?: Service
}

export interface ProjectChat {
  id: string
  referral_id: string
  sender_type: "admin" | "agent"
  sender_id: string
  message_type: "text" | "image"
  message_content: string
  timestamp: string
}

export interface Withdrawal {
  id: string
  agent_id: string
  amount: number
  status: "requested" | "processing" | "paid" | "rejected"
  momo_number: string
  requested_at: string
  paid_at?: string
  processing_at?: string
  rejected_at?: string
  agents?: Agent
  commission_items?: Array<{ type: string; id: string }> // New field to track paid items
}

export interface WalletTransaction {
  id: string
  agent_id: string
  transaction_type: "topup" | "deduction" | "refund"
  amount: number
  reference_code: string
  description: string
  status: "pending" | "approved" | "rejected"
  payment_method: "manual" | "auto"
  admin_notes?: string
  admin_id?: string
  created_at: string
  approved_at?: string
  rejected_at?: string
  agents?: Agent
}

// Job Board Types
export interface Job {
  id: string
  job_title: string
  industry: string
  description: string
  application_deadline: string
  location: string
  salary_type: "negotiable" | "fixed_range" | "exact_amount"
  salary_min?: number
  salary_max?: number
  salary_exact?: number
  salary_currency: string
  employer_name: string
  application_method: "email" | "hyperlink"
  application_contact: string
  is_active: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
  created_by?: string
}

export const JOB_INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Marketing",
  "Sales",
  "Customer Service",
  "Human Resources",
  "Operations",
  "Construction",
  "Manufacturing",
  "Retail",
  "Hospitality",
  "Transportation",
  "Agriculture",
  "Government",
  "Non-Profit",
  "Other",
] as const

export type JobIndustry = (typeof JOB_INDUSTRIES)[number]

// Utility function to hash passwords (simple implementation)
export const hashPassword = async (password: string): Promise<string> => {
  // In production, use bcrypt or similar
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "dataflex_salt")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  // Try with the current salt (DataFlex)
  const hashedInputCurrent = await hashPassword(password) // This uses "dataflex_salt"
  if (hashedInputCurrent === hash) {
    return true
  }

  // Try with the old salt (TrustReach) for backward compatibility
  const encoder = new TextEncoder()
  const dataOldSalt = encoder.encode(password + "trustreach_salt")
  const hashBufferOldSalt = await crypto.subtle.digest("SHA-256", dataOldSalt)
  const hashArrayOldSalt = Array.from(new Uint8Array(hashBufferOldSalt))
  const hashedInputOld = hashArrayOldSalt.map((b) => b.toString(16).padStart(2, "0")).join("")

  if (hashedInputOld === hash) {
    // If an old password matches, you might consider re-hashing it with the new salt
    // and updating it in the database for future logins, but for a quick fix,
    // just returning true is sufficient.
    return true
  }

  return false
}

function generatePaymentReference(): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 5; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

const calculateDataBundleCommission = (bundlePrice: number, commissionRate: number): number => {
  return bundlePrice * commissionRate // commissionRate is already a decimal
}

// Job Board functions
export async function getJobs(): Promise<Job[]> {
  const { data, error } = await supabase.from("jobs").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return data || []
}

export async function getActiveJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data || []
}

export async function getFeaturedJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data || []
}

export async function getLatestJobs(limit = 5): Promise<Job[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function getJobById(id: string): Promise<Job | null> {
  const { data, error } = await supabase.from("jobs").select("*").eq("id", id).single()
  if (error) throw error
  return data
}

export async function createJob(job: Omit<Job, "id" | "created_at" | "updated_at">): Promise<Job> {
  const { data, error } = await supabase.from("jobs").insert(job).select().single()
  if (error) throw error
  return data
}

export async function updateJob(id: string, updates: Partial<Job>): Promise<Job> {
  const { data, error } = await supabase.from("jobs").update(updates).eq("id", id).select().single()
  if (error) throw error
  return data
}

export async function deleteJob(id: string): Promise<void> {
  const { error } = await supabase.from("jobs").delete().eq("id", id)
  if (error) throw error
}

export { generatePaymentReference, calculateDataBundleCommission }
