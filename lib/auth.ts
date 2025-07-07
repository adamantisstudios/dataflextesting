import { supabase } from "./supabase"
import type { Agent } from "./supabase"

export interface AdminUser {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
  last_login?: string
}

export interface AdminSession {
  id: string
  admin_id: string
  session_token: string
  expires_at: string
  created_at: string
}

// Generate session token
function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Admin login - simplified and working
export async function loginAdmin(
  email: string,
  password: string,
): Promise<{ success: boolean; user?: AdminUser; token?: string; error?: string }> {
  try {
    console.log("Attempting login for:", email)

    // Get admin user
    const { data: adminUser, error: userError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email)
      .eq("is_active", true)
      .single()

    console.log("User query result:", { adminUser, userError })

    if (userError || !adminUser) {
      console.log("User not found or error:", userError)
      return { success: false, error: "Invalid email or password" }
    }

    // Direct password comparison - simple and working
    const isValidPassword = password === adminUser.password_hash

    console.log("Password check:", { provided: password, stored: adminUser.password_hash, valid: isValidPassword })

    if (!isValidPassword) {
      console.log("Invalid password")
      return { success: false, error: "Invalid email or password" }
    }

    // Create session
    const sessionToken = generateSessionToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    const { error: sessionError } = await supabase.from("admin_sessions").insert([
      {
        admin_id: adminUser.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
      },
    ])

    if (sessionError) {
      console.log("Session creation error:", sessionError)
      return { success: false, error: "Failed to create session" }
    }

    // Update last login
    await supabase.from("admin_users").update({ last_login: new Date().toISOString() }).eq("id", adminUser.id)

    console.log("Login successful")
    return {
      success: true,
      user: adminUser,
      token: sessionToken,
    }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, error: "Login failed" }
  }
}

// Verify admin session
export async function verifyAdminSession(token: string): Promise<{ valid: boolean; user?: AdminUser }> {
  try {
    const { data: session, error: sessionError } = await supabase
      .from("admin_sessions")
      .select(`
        *,
        admin_users (*)
      `)
      .eq("session_token", token)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (sessionError || !session) {
      return { valid: false }
    }

    return {
      valid: true,
      user: session.admin_users as AdminUser,
    }
  } catch (error) {
    console.error("Session verification error:", error)
    return { valid: false }
  }
}

// Logout admin
export async function logoutAdmin(token: string): Promise<void> {
  try {
    await supabase.from("admin_sessions").delete().eq("session_token", token)
  } catch (error) {
    console.error("Logout error:", error)
  }
}

// Get current admin from localStorage
export function getCurrentAdmin(): AdminUser | null {
  if (typeof window === "undefined") return null

  const adminData = localStorage.getItem("admin_user")
  return adminData ? JSON.parse(adminData) : null
}

// Get current admin token
export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null

  return localStorage.getItem("admin_token")
}

// Set admin session in localStorage
export function setAdminSession(user: AdminUser, token: string): void {
  if (typeof window === "undefined") return

  localStorage.setItem("admin_user", JSON.stringify(user))
  localStorage.setItem("admin_token", token)
}

// Clear admin session
export function clearAdminSession(): void {
  if (typeof window === "undefined") return

  localStorage.removeItem("admin_user")
  localStorage.removeItem("admin_token")
}

// ============ AGENT HELPERS ============

// Get current agent from localStorage
export function getCurrentAgent(): Agent | null {
  if (typeof window === "undefined") return null

  const agentData = localStorage.getItem("agent")
  return agentData ? (JSON.parse(agentData) as Agent) : null
}

// Get current agent token (if you decide to save a token for agents)
export function getAgentToken(): string | null {
  if (typeof window === "undefined") return null

  return localStorage.getItem("agent_token")
}
