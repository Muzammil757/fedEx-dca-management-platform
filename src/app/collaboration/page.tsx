"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  Send,
  FileText,
  Clock,
  User,
  Building2,
  Shield,
  Eye,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Mail,
  Calendar,
  History,
  Users,
  Lock,
} from "lucide-react";

const caseNotes = [
  {
    id: 1,
    author: "John Smith",
    role: "DCA Agent",
    organization: "Alpha Recovery Inc",
    content: "Initial contact made with customer. They acknowledged the debt but requested additional time to arrange payment. Scheduled follow-up call for next week.",
    timestamp: "2024-03-15 14:32",
    type: "contact",
  },
  {
    id: 2,
    author: "Sarah Johnson",
    role: "Enterprise Recovery",
    organization: "Global Logistics",
    content: "Reviewed case history. Customer has made partial payments in the past. Recommend offering a structured payment plan.",
    timestamp: "2024-03-14 09:15",
    type: "review",
  },
  {
    id: 3,
    author: "Mike Chen",
    role: "DCA Supervisor",
    organization: "Alpha Recovery Inc",
    content: "Escalated from agent due to complexity. Will coordinate with enterprise team for payment plan approval.",
    timestamp: "2024-03-13 16:45",
    type: "escalation",
  },
  {
    id: 4,
    author: "System",
    role: "Automated",
    organization: "Platform",
    content: "SLA warning: Case approaching deadline for Follow-up stage. 2 days remaining.",
    timestamp: "2024-03-12 08:00",
    type: "alert",
  },
];

const activityLog = [
  { action: "Case status updated to 'Negotiating'", user: "John Smith", time: "2 hours ago", icon: Edit3 },
  { action: "Note added by DCA Agent", user: "John Smith", time: "2 hours ago", icon: MessageSquare },
  { action: "Document uploaded: Payment History.pdf", user: "Sarah Johnson", time: "1 day ago", icon: FileText },
  { action: "Case viewed by Enterprise Team", user: "Sarah Johnson", time: "1 day ago", icon: Eye },
  { action: "Case escalated to DCA Supervisor", user: "Mike Chen", time: "2 days ago", icon: AlertTriangle },
  { action: "SLA warning triggered", user: "System", time: "3 days ago", icon: Clock },
  { action: "Case assigned to Alpha Recovery Inc", user: "System", time: "5 days ago", icon: Building2 },
  { action: "Case created", user: "System", time: "10 days ago", icon: FileText },
];

const roleAccessLevels = [
  {
    role: "Enterprise Admin",
    permissions: ["View all cases", "Edit all cases", "Manage DCAs", "Configure SLAs", "Generate reports"],
    color: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    role: "DCA Supervisor",
    permissions: ["View DCA cases", "Assign agents", "Add notes", "Request escalation"],
    color: "bg-sky-50 text-sky-600 border-sky-100",
  },
  {
    role: "DCA Agent",
    permissions: ["View assigned cases", "Add notes", "Update status", "Request supervisor review"],
    color: "bg-slate-50 text-slate-600 border-slate-200",
  },
];

export default function CollaborationPage() {
  const [newNote, setNewNote] = useState("");
  const [viewRole, setViewRole] = useState("Enterprise");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              Collaboration
            </h1>
            <p className="text-sm text-muted-foreground">
              Centralized communication channel between Enterprise and DCAs
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white p-1 rounded-lg border border-border shadow-sm">
            <Button 
              variant={viewRole === "Enterprise" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewRole("Enterprise")}
              className="text-xs h-8"
            >
              Enterprise View
            </Button>
            <Button 
              variant={viewRole === "DCA" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewRole("DCA")}
              className="text-xs h-8"
            >
              DCA View
            </Button>
          </div>
        </div>

        <Tabs defaultValue="notes" className="space-y-6">
          <TabsList className="bg-secondary/30 border border-border">
            <TabsTrigger value="notes" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <MessageSquare className="mr-2 h-4 w-4" />
              Case Notes
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <History className="mr-2 h-4 w-4" />
              Activity Log
            </TabsTrigger>
            <TabsTrigger value="access" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Shield className="mr-2 h-4 w-4" />
              Governance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-white border-border shadow-sm">
                  <CardHeader className="pb-3 border-b border-border bg-secondary/10">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                      <Edit3 className="h-4 w-4 text-primary" />
                      Add Communication Update
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Type your note here... (Visible to all participants)"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="min-h-[100px] bg-slate-50 border-border focus:border-primary resize-none"
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          <User className="h-3.5 w-3.5" />
                          Posting as {viewRole} User
                        </div>
                        <Button className="bg-primary hover:bg-primary/90 h-9 px-6 font-bold text-xs uppercase tracking-wider">
                          <Send className="mr-2 h-3.5 w-3.5" />
                          Post Update
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {caseNotes.map((note) => (
                    <Card key={note.id} className="bg-white border-border shadow-sm overflow-hidden">
                      <div className="flex">
                        <div className={`w-1.5 shrink-0 ${
                          note.type === "contact" ? "bg-blue-500" :
                          note.type === "review" ? "bg-violet-500" :
                          note.type === "escalation" ? "bg-amber-500" : "bg-rose-500"
                        }`} />
                        <CardContent className="p-5 flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 border border-border shadow-sm">
                                <AvatarFallback className="bg-sky-50 text-primary text-[10px] font-bold">
                                  {note.author.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-bold text-foreground">{note.author}</p>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                  <span>{note.role}</span>
                                  <span>•</span>
                                  <span>{note.organization}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              <Clock className="h-3 w-3" />
                              {note.timestamp}
                            </div>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed pl-11">{note.content}</p>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <Card className="bg-white border-border shadow-sm">
                  <CardHeader className="pb-3 border-b border-border bg-secondary/10">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider">
                      <Users className="h-4 w-4 text-primary" />
                      Active Participants
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {[
                        { name: "John Smith", role: "DCA Agent", org: "Alpha Recovery", active: true },
                        { name: "Mike Chen", role: "DCA Supervisor", org: "Alpha Recovery", active: true },
                        { name: "Sarah Johnson", role: "Recovery Lead", org: "Global Logistics", active: false },
                      ].map((participant, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-8 w-8 border border-border">
                              <AvatarFallback className="bg-slate-50 text-slate-600 text-[10px] font-bold">
                                {participant.name.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            {participant.active && (
                              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{participant.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">{participant.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-border shadow-sm">
                  <CardHeader className="pb-3 border-b border-border bg-secondary/10">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider">
                      <FileText className="h-4 w-4 text-primary" />
                      Shared Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {[
                        { name: "Invoice_Copy_482.pdf", size: "1.2 MB", date: "2d ago" },
                        { name: "Contract_Terms.pdf", size: "840 KB", date: "5d ago" },
                        { name: "Payment_History.xlsx", size: "45 KB", date: "1w ago" },
                      ].map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-border transition-all group">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-sky-50 text-primary border border-sky-100 group-hover:bg-primary group-hover:text-white transition-colors">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-foreground truncate max-w-[120px]">{doc.name}</p>
                              <p className="text-[9px] font-bold text-muted-foreground uppercase">{doc.size}</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase">{doc.date}</span>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full mt-2 text-[10px] font-bold uppercase tracking-wider h-8 border-dashed border-2 hover:bg-slate-50">
                        Upload Document
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="bg-white border-border shadow-sm">
              <CardHeader className="pb-3 border-b border-border bg-secondary/10">
                <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider">
                  <History className="h-4 w-4 text-primary" />
                  Audit Trail / Activity Log
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {activityLog.map((activity, idx) => {
                    const Icon = activity.icon;
                    return (
                      <div key={idx} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                        <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-foreground">{activity.action}</p>
                          <div className="flex items-center gap-4 mt-0.5">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {activity.user}
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {activity.time}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
                          System Log
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {roleAccessLevels.map((role) => (
                <Card key={role.role} className="bg-white border-border shadow-sm">
                  <CardHeader className="pb-3 border-b border-border bg-secondary/10">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider">
                      <Shield className="h-4 w-4 text-primary" />
                      {role.role}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      {role.permissions.map((permission, idx) => (
                        <div key={idx} className={`flex items-center gap-3 p-2 rounded-lg ${role.color} border border-transparent`}>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span className="text-xs font-semibold">{permission}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-sky-50/50 border-sky-100 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-sky-100 shadow-sm">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-foreground mb-1">Audit Trail & Governance</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      All communications, status changes, and document uploads are logged with an immutable audit trail. 
                      Access is restricted based on the role and organization associated with the user account.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
