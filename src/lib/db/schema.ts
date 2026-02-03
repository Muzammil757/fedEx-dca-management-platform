import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  jsonb,
  date,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// USERS TABLE (Admin & DCA Agent)
// ============================================
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).unique().notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    role: varchar("role", { length: 20 }).notNull(), // 'admin' | 'dca'
    phone: varchar("phone", { length: 50 }),
    isActive: boolean("is_active").default(true),
    lastLogin: timestamp("last_login", { withTimezone: true }),
    preferences: jsonb("preferences").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_users_email").on(table.email)]
);

// ============================================
// AUTH SESSIONS TABLE
// ============================================
export const authSessions = pgTable(
  "auth_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    token: varchar("token", { length: 255 }).unique().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: varchar("ip_address", { length: 50 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_auth_sessions_token").on(table.token),
    index("idx_auth_sessions_user").on(table.userId),
  ]
);

// ============================================
// CUSTOMERS TABLE (Debtors)
// ============================================
export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    alternatePhone: varchar("alternate_phone", { length: 50 }),
    address: text("address"),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 100 }),
    pincode: varchar("pincode", { length: 20 }),
    creditScore: integer("credit_score"),
    riskLevel: varchar("risk_level", { length: 20 }), // 'low' | 'medium' | 'high' | 'critical'
    notes: text("notes"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_customers_name").on(table.name),
    index("idx_customers_phone").on(table.phone),
  ]
);

// ============================================
// DCA AGENCIES TABLE
// ============================================
export const dcaAgencies = pgTable(
  "dca_agencies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id), // Links to DCA user account
    agencyName: varchar("agency_name", { length: 255 }).notNull(),
    contactEmail: varchar("contact_email", { length: 255 }),
    contactPhone: varchar("contact_phone", { length: 50 }),
    address: text("address"),
    status: varchar("status", { length: 20 }).default("active"), // 'active' | 'paused' | 'flagged' | 'terminated'
    specialization: varchar("specialization", { length: 50 }), // 'commercial' | 'consumer' | 'both'
    performanceTarget: decimal("performance_target", {
      precision: 5,
      scale: 2,
    }).default("75.00"),
    commissionRate: decimal("commission_rate", {
      precision: 5,
      scale: 2,
    }).default("10.00"),
    notes: text("notes"),
    joinedDate: date("joined_date").defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_dca_agencies_user").on(table.userId),
    index("idx_dca_agencies_status").on(table.status),
  ]
);

// ============================================
// CASES TABLE (Core Business Entity)
// ============================================
export const cases = pgTable(
  "cases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseNumber: varchar("case_number", { length: 50 }).unique().notNull(),
    customerId: uuid("customer_id")
      .references(() => customers.id, { onDelete: "cascade" })
      .notNull(),
    dcaAgencyId: uuid("dca_agency_id").references(() => dcaAgencies.id),

    // Assignment tracking
    assignedBy: uuid("assigned_by").references(() => users.id),
    assignedAt: timestamp("assigned_at", { withTimezone: true }),

    // Financial details
    originalAmount: decimal("original_amount", {
      precision: 15,
      scale: 2,
    }).notNull(),
    overdueAmount: decimal("overdue_amount", {
      precision: 15,
      scale: 2,
    }).notNull(),
    paidAmount: decimal("paid_amount", { precision: 15, scale: 2 }).default(
      "0"
    ),
    interestRate: decimal("interest_rate", { precision: 5, scale: 2 }),
    penaltyAmount: decimal("penalty_amount", { precision: 15, scale: 2 }),

    // Status & Priority
    status: varchar("status", { length: 30 }).notNull().default("unassigned"),
    // 'unassigned' | 'active' | 'contacted' | 'negotiating' | 'payment_plan' | 'escalated' | 'legal' | 'resolved' | 'closed' | 'written_off'
    priority: varchar("priority", { length: 20 }).notNull().default("medium"),
    // 'critical' | 'high' | 'medium' | 'low'

    // Timing & SLA
    agingDays: integer("aging_days").default(0),
    dueDate: date("due_date"),
    slaDeadline: timestamp("sla_deadline", { withTimezone: true }),
    timeRemaining: integer("time_remaining"), // hours
    slaStatus: varchar("sla_status", { length: 20 }).default("on-track"),
    // 'on-track' | 'at-risk' | 'breached'

    // Workflow
    stage: varchar("stage", { length: 30 }).default("initial-contact"),
    // 'initial-contact' | 'follow-up' | 'negotiation' | 'payment-plan' | 'legal-review' | 'escalated'
    isEscalated: boolean("is_escalated").default(false),
    isPaused: boolean("is_paused").default(false),
    pauseReason: text("pause_reason"),

    // AI Insights (for future)
    aiProbability: integer("ai_probability"), // 0-100 recovery probability
    aiNextAction: text("ai_next_action"),
    aiEstResolution: varchar("ai_est_resolution", { length: 50 }),

    // Contact tracking
    lastContact: timestamp("last_contact", { withTimezone: true }),
    nextFollowUp: timestamp("next_follow_up", { withTimezone: true }),
    contactAttempts: integer("contact_attempts").default(0),

    // Meta
    notes: text("notes"),
    tags: jsonb("tags").default([]),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_cases_status").on(table.status),
    index("idx_cases_priority").on(table.priority),
    index("idx_cases_dca").on(table.dcaAgencyId),
    index("idx_cases_customer").on(table.customerId),
    index("idx_cases_sla").on(table.slaStatus),
    index("idx_cases_case_number").on(table.caseNumber),
  ]
);

// ============================================
// DCA PERFORMANCE METRICS TABLE
// ============================================
export const dcaPerformanceMetrics = pgTable(
  "dca_performance_metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dcaAgencyId: uuid("dca_agency_id")
      .references(() => dcaAgencies.id, { onDelete: "cascade" })
      .notNull(),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    totalCases: integer("total_cases").default(0),
    activeCases: integer("active_cases").default(0),
    recoveredCases: integer("recovered_cases").default(0),
    recoveryRate: decimal("recovery_rate", { precision: 5, scale: 2 }).default(
      "0"
    ),
    slaCompliance: decimal("sla_compliance", {
      precision: 5,
      scale: 2,
    }).default("0"),
    avgResolutionDays: integer("avg_resolution_days").default(0),
    totalRecovered: decimal("total_recovered", {
      precision: 15,
      scale: 2,
    }).default("0"),
    rank: integer("rank"),
    trend: varchar("trend", { length: 10 }), // 'up' | 'down' | 'stable'
    weeklyTrend: jsonb("weekly_trend").default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_dca_metrics_agency").on(table.dcaAgencyId),
    index("idx_dca_metrics_period").on(table.periodStart, table.periodEnd),
  ]
);

// ============================================
// CASE NOTES TABLE
// ============================================
export const caseNotes = pgTable(
  "case_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id")
      .references(() => cases.id, { onDelete: "cascade" })
      .notNull(),
    authorId: uuid("author_id")
      .references(() => users.id)
      .notNull(),
    content: text("content").notNull(),
    noteType: varchar("note_type", { length: 30 }).default("general"),
    // 'general' | 'contact' | 'payment' | 'escalation' | 'legal' | 'system'
    isPrivate: boolean("is_private").default(false), // Admin-only notes
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_case_notes_case").on(table.caseId),
    index("idx_case_notes_author").on(table.authorId),
  ]
);

// ============================================
// ACTIVITY LOGS TABLE (Audit Trail)
// ============================================
export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id),
    userEmail: varchar("user_email", { length: 255 }), // Denormalized for quick access
    userRole: varchar("user_role", { length: 20 }),
    action: varchar("action", { length: 50 }).notNull(),
    // 'create' | 'update' | 'delete' | 'assign' | 'unassign' | 'login' | 'logout' | 'view' | 'export'
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    // 'customer' | 'case' | 'dca_agency' | 'user' | 'payment'
    entityId: uuid("entity_id"),
    entityName: varchar("entity_name", { length: 255 }), // Denormalized
    description: text("description"),
    oldValues: jsonb("old_values"),
    newValues: jsonb("new_values"),
    ipAddress: varchar("ip_address", { length: 50 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_activity_logs_user").on(table.userId),
    index("idx_activity_logs_entity").on(table.entityType, table.entityId),
    index("idx_activity_logs_action").on(table.action),
    index("idx_activity_logs_created").on(table.createdAt),
  ]
);

// ============================================
// SLA ALERTS TABLE
// ============================================
export const slaAlerts = pgTable(
  "sla_alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id")
      .references(() => cases.id, { onDelete: "cascade" })
      .notNull(),
    alertType: varchar("alert_type", { length: 20 }).notNull(),
    // 'warning' | 'breach' | 'critical'
    message: text("message").notNull(),
    isRead: boolean("is_read").default(false),
    readBy: uuid("read_by").references(() => users.id),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_sla_alerts_case").on(table.caseId),
    index("idx_sla_alerts_unread").on(table.isRead),
  ]
);

// ============================================
// PAYMENT RECORDS TABLE
// ============================================
export const paymentRecords = pgTable(
  "payment_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id")
      .references(() => cases.id, { onDelete: "cascade" })
      .notNull(),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    paymentDate: timestamp("payment_date", { withTimezone: true }).notNull(),
    paymentMethod: varchar("payment_method", { length: 50 }),
    // 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'card' | 'other'
    referenceNumber: varchar("reference_number", { length: 100 }),
    notes: text("notes"),
    recordedBy: uuid("recorded_by")
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_payment_records_case").on(table.caseId),
    index("idx_payment_records_date").on(table.paymentDate),
  ]
);

// ============================================
// COMPLETED CASES ARCHIVE TABLE
// ============================================
export const completedCasesArchive = pgTable("completed_cases_archive", {
  id: uuid("id").primaryKey().defaultRandom(),
  originalCaseId: uuid("original_case_id"),
  caseNumber: varchar("case_number", { length: 50 }).notNull(),
  customerName: varchar("customer_name", { length: 255 }),
  customerPhone: varchar("customer_phone", { length: 50 }),
  dcaAgencyId: uuid("dca_agency_id").references(() => dcaAgencies.id),
  dcaAgencyName: varchar("dca_agency_name", { length: 255 }),
  resolutionType: varchar("resolution_type", { length: 30 }),
  // 'full_payment' | 'partial_settlement' | 'written_off' | 'disputed'
  originalAmount: decimal("original_amount", { precision: 15, scale: 2 }),
  recoveredAmount: decimal("recovered_amount", { precision: 15, scale: 2 }),
  recoveryPercentage: decimal("recovery_percentage", { precision: 5, scale: 2 }),
  totalDays: integer("total_days"),
  closedBy: uuid("closed_by").references(() => users.id),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(authSessions),
  activities: many(activityLogs),
  notes: many(caseNotes),
  customersCreated: many(customers),
  dcaAgency: one(dcaAgencies, {
    fields: [users.id],
    references: [dcaAgencies.userId],
  }),
}));

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(users, {
    fields: [authSessions.userId],
    references: [users.id],
  }),
}));

export const customersRelations = relations(customers, ({ many, one }) => ({
  cases: many(cases),
  createdByUser: one(users, {
    fields: [customers.createdBy],
    references: [users.id],
  }),
}));

export const dcaAgenciesRelations = relations(dcaAgencies, ({ many, one }) => ({
  cases: many(cases),
  user: one(users, {
    fields: [dcaAgencies.userId],
    references: [users.id],
  }),
  metrics: many(dcaPerformanceMetrics),
}));

export const casesRelations = relations(cases, ({ one, many }) => ({
  customer: one(customers, {
    fields: [cases.customerId],
    references: [customers.id],
  }),
  dcaAgency: one(dcaAgencies, {
    fields: [cases.dcaAgencyId],
    references: [dcaAgencies.id],
  }),
  assignedByUser: one(users, {
    fields: [cases.assignedBy],
    references: [users.id],
  }),
  notes: many(caseNotes),
  alerts: many(slaAlerts),
  payments: many(paymentRecords),
}));

export const dcaPerformanceMetricsRelations = relations(
  dcaPerformanceMetrics,
  ({ one }) => ({
    dcaAgency: one(dcaAgencies, {
      fields: [dcaPerformanceMetrics.dcaAgencyId],
      references: [dcaAgencies.id],
    }),
  })
);

export const caseNotesRelations = relations(caseNotes, ({ one }) => ({
  case: one(cases, {
    fields: [caseNotes.caseId],
    references: [cases.id],
  }),
  author: one(users, {
    fields: [caseNotes.authorId],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const slaAlertsRelations = relations(slaAlerts, ({ one }) => ({
  case: one(cases, {
    fields: [slaAlerts.caseId],
    references: [cases.id],
  }),
  readByUser: one(users, {
    fields: [slaAlerts.readBy],
    references: [users.id],
  }),
}));

export const paymentRecordsRelations = relations(paymentRecords, ({ one }) => ({
  case: one(cases, {
    fields: [paymentRecords.caseId],
    references: [cases.id],
  }),
  recordedByUser: one(users, {
    fields: [paymentRecords.recordedBy],
    references: [users.id],
  }),
}));

// ============================================
// TYPE EXPORTS
// ============================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type DcaAgency = typeof dcaAgencies.$inferSelect;
export type NewDcaAgency = typeof dcaAgencies.$inferInsert;

export type Case = typeof cases.$inferSelect;
export type NewCase = typeof cases.$inferInsert;

export type CaseNote = typeof caseNotes.$inferSelect;
export type NewCaseNote = typeof caseNotes.$inferInsert;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;

export type PaymentRecord = typeof paymentRecords.$inferSelect;
export type NewPaymentRecord = typeof paymentRecords.$inferInsert;
