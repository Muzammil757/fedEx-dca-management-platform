import { db } from "@/lib/db";
import { users, authSessions, activityLogs } from "@/lib/db/schema";
import { eq, and, gt, lt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

// ============================================
// TYPES
// ============================================
export type UserRole = "admin" | "dca";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string | null;
};

export type Session = {
  user: AuthUser;
  token: string;
  expiresAt: Date;
};

// ============================================
// HELPERS
// ============================================
function generateToken(): string {
  return `${crypto.randomUUID()}-${crypto.randomUUID()}-${Date.now()}`;
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// ============================================
// LOGIN
// ============================================
export async function login(
  email: string,
  password: string,
  ipAddress?: string,
  userAgent?: string
): Promise<Session | null> {
  // Find user by email
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });

  if (!user) {
    return null;
  }

  if (!user.isActive) {
    return null;
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    return null;
  }

  // Create session token
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Insert session
  await db.insert(authSessions).values({
    userId: user.id,
    token,
    expiresAt,
    ipAddress,
    userAgent,
  });

  // Update last login
  await db
    .update(users)
    .set({ lastLogin: new Date(), updatedAt: new Date() })
    .where(eq(users.id, user.id));

  // Log activity
  await db.insert(activityLogs).values({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: "login",
    entityType: "user",
    entityId: user.id,
    entityName: user.name,
    description: `User ${user.name} logged in`,
    ipAddress,
    userAgent,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      phone: user.phone,
    },
    token,
    expiresAt,
  };
}

// ============================================
// LOGOUT
// ============================================
export async function logout(token: string): Promise<void> {
  // Get session to find user for logging
  const session = await db.query.authSessions.findFirst({
    where: eq(authSessions.token, token),
    with: { user: true },
  });

  // Delete session
  await db.delete(authSessions).where(eq(authSessions.token, token));

  // Log activity if session existed
  if (session?.user) {
    await db.insert(activityLogs).values({
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: session.user.role,
      action: "logout",
      entityType: "user",
      entityId: session.user.id,
      entityName: session.user.name,
      description: `User ${session.user.name} logged out`,
    });
  }
}

// ============================================
// GET SESSION
// ============================================
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  // Find valid session
  const session = await db.query.authSessions.findFirst({
    where: and(
      eq(authSessions.token, token),
      gt(authSessions.expiresAt, new Date())
    ),
    with: { user: true },
  });

  if (!session || !session.user) {
    return null;
  }

  if (!session.user.isActive) {
    return null;
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role as UserRole,
      phone: session.user.phone,
    },
    token: session.token,
    expiresAt: session.expiresAt,
  };
}

// ============================================
// GET SESSION FROM TOKEN (for API routes)
// ============================================
export async function getSessionFromToken(
  token: string
): Promise<Session | null> {
  const session = await db.query.authSessions.findFirst({
    where: and(
      eq(authSessions.token, token),
      gt(authSessions.expiresAt, new Date())
    ),
    with: { user: true },
  });

  if (!session || !session.user || !session.user.isActive) {
    return null;
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role as UserRole,
      phone: session.user.phone,
    },
    token: session.token,
    expiresAt: session.expiresAt,
  };
}

// ============================================
// AUTH GUARDS
// ============================================
export async function requireAuth(): Promise<AuthUser> {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized: Please login");
  }

  return session.user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized: Please login");
  }

  if (session.user.role !== "admin") {
    throw new Error("Forbidden: Admin access required");
  }

  return session.user;
}

export async function requireDca(): Promise<AuthUser> {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized: Please login");
  }

  if (session.user.role !== "dca") {
    throw new Error("Forbidden: DCA access required");
  }

  return session.user;
}

// ============================================
// PASSWORD MANAGEMENT
// ============================================
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return false;
  }

  const isValidPassword = await verifyPassword(
    currentPassword,
    user.passwordHash
  );
  if (!isValidPassword) {
    return false;
  }

  const newPasswordHash = await hashPassword(newPassword);

  await db
    .update(users)
    .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
    .where(eq(users.id, userId));

  // Invalidate all other sessions
  await db.delete(authSessions).where(eq(authSessions.userId, userId));

  return true;
}

// ============================================
// CREATE USER (Admin only)
// ============================================
export async function createUser(
  email: string,
  password: string,
  name: string,
  role: UserRole,
  phone?: string
): Promise<AuthUser> {
  const passwordHash = await hashPassword(password);

  const [newUser] = await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      passwordHash,
      name,
      role,
      phone,
    })
    .returning();

  return {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role as UserRole,
    phone: newUser.phone,
  };
}

// ============================================
// CLEANUP EXPIRED SESSIONS
// ============================================
export async function cleanupExpiredSessions(): Promise<number> {
  await db
    .delete(authSessions)
    .where(lt(authSessions.expiresAt, new Date()));

  return 0; // Drizzle doesn't return count easily, adjust if needed
}
