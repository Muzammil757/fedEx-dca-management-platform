"use client";

import { useState, useEffect, useMemo } from "react";
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
  Eye,
  Edit3,
  AlertTriangle,
  History,
  Users,
} from "lucide-react";
import { useAppData } from "@/lib/data/app-data-context";

// Helper to get relative time string
const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

// Helper to get icon for action type
const getIconForAction = (action: string) => {
  if (action.includes("status") || action.includes("update")) return Edit3;
  if (action.includes("note") || action.includes("message")) return MessageSquare;
  if (action.includes("document") || action.includes("file")) return FileText;
  if (action.includes("view")) return Eye;
  if (action.includes("escalat")) return AlertTriangle;
  if (action.includes("assign") || action.includes("allocat")) return Building2;
  return Clock;
};

// Empty fallback - populated from backend via useAppData
const caseNotesFallback: { id: number; author: string; role: string; organization: string; content: string; timestamp: string; type: string }[] = [];

const activityLogFallback: { action: string; user: string; time: string; icon: typeof Clock }[] = [];


export default function CollaborationPage() {
  // Backend data integration
  const { data } = useAppData();
  
  const [newNote, setNewNote] = useState("");
  const [viewRole, setViewRole] = useState("Enterprise");

  // Get activities from backend or use default
  const activities = useMemo(() => {
    if (data?.recentActivities && data.recentActivities.length > 0) {
      return data.recentActivities.map(a => ({
        action: a.description || a.action,
        user: a.userEmail?.split("@")[0] || "System",
        time: getRelativeTime(new Date(a.createdAt)),
        icon: getIconForAction(a.action),
      }));
    }
    return activityLogFallback;
  }, [data?.recentActivities]);

  // Get case notes from backend activities or use empty fallback
  const caseNotes = useMemo(() => {
    if (data?.recentActivities && data.recentActivities.length > 0) {
      return data.recentActivities.slice(0, 10).map((a, idx) => ({
        id: idx + 1,
        author: a.userEmail?.split("@")[0] || "System",
        role: a.action.includes("allocat") ? "DCA Agent" : "Enterprise Recovery",
        organization: "Platform",
        content: a.description || a.action,
        timestamp: new Date(a.createdAt).toLocaleString(),
        type: a.action.includes("escalat") ? "escalation" : 
              a.action.includes("note") ? "review" : 
              a.action.includes("alert") || a.action.includes("SLA") ? "alert" : "contact",
      }));
    }
    return caseNotesFallback;
  }, [data?.recentActivities]);

  // Derive participants from activities and DCA agencies
  const participants = useMemo(() => {
    const participantMap = new Map<string, { name: string; role: string; org: string; active: boolean }>();
    
    // Add participants from activities
    if (data?.recentActivities) {
      data.recentActivities.forEach((a, idx) => {
        const userName = a.userEmail?.split("@")[0] || "System";
        if (!participantMap.has(userName) && userName !== "System") {
          participantMap.set(userName, {
            name: userName.split(".").map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(" "),
            role: a.action.includes("allocat") ? "DCA Agent" : "Recovery Specialist",
            org: "Platform",
            active: idx < 3, // Recent activity = active
          });
        }
      });
    }
    
    // Add DCA contacts as participants
    if (data?.dcaAgencies) {
      data.dcaAgencies.slice(0, 2).forEach(dca => {
        const name = dca.agencyName.split(" ")[0] + " Team";
        if (!participantMap.has(name)) {
          participantMap.set(name, {
            name,
            role: "DCA Partner",
            org: dca.agencyName,
            active: dca.status === "active",
          });
        }
      });
    }
    
    return Array.from(participantMap.values()).slice(0, 5);
  }, [data?.recentActivities, data?.dcaAgencies]);

  // Documents placeholder - derived from case context
  const sharedDocuments = useMemo(() => {
    if (!data?.cases || data.cases.length === 0) return [];
    
    // Generate document names from case numbers
    return data.cases.slice(0, 3).map(c => ({
      name: `Case_${c.caseNumber}_docs.pdf`,
      size: `${Math.floor(Math.random() * 900 + 100)} KB`,
      date: getRelativeTime(new Date(c.updatedAt)),
    }));
  }, [data?.cases]);

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
                      {participants.length > 0 ? participants.map((participant, idx) => (
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
                      )) : (
                        <p className="text-xs text-muted-foreground text-center py-2">No active participants</p>
                      )}
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
                      {sharedDocuments.length > 0 ? sharedDocuments.map((doc, idx) => (
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
                      )) : (
                        <p className="text-xs text-muted-foreground text-center py-2">No shared documents</p>
                      )}
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
                  {activities.map((activity, idx) => {
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
