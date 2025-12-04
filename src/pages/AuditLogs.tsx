import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, FileText, History, User, Shield } from "lucide-react";
import { format } from "date-fns";
import { Json } from "@/integrations/supabase/types";

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  old_data: Json;
  new_data: Json;
  user_id: string | null;
  created_at: string;
  user_email?: string;
}

export default function AuditLogs() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");

  useEffect(() => {
    // Small delay to let auth state settle
    const timer = setTimeout(() => setAuthChecked(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (authChecked && !isAdmin) {
      navigate("/admin");
    }
  }, [isAdmin, authChecked, navigate]);

  useEffect(() => {
    if (authChecked && isAdmin) {
      fetchAuditLogs();
    }
  }, [tableFilter, actionFilter, authChecked, isAdmin]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (tableFilter !== "all") {
        query = query.eq("table_name", tableFilter);
      }
      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch user emails for logs with user_ids
      const userIds = [...new Set((data || []).filter(log => log.user_id).map(log => log.user_id))];
      
      let userEmails: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, email")
          .in("user_id", userIds);
        
        if (profiles) {
          userEmails = profiles.reduce((acc, p) => {
            acc[p.user_id] = p.email || "Unknown";
            return acc;
          }, {} as Record<string, string>);
        }
      }

      const logsWithEmails: AuditLog[] = (data || []).map(log => ({
        ...log,
        user_email: log.user_id ? userEmails[log.user_id] || "Unknown" : "System"
      }));

      setLogs(logsWithEmails);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "INSERT": return "default";
      case "UPDATE": return "secondary";
      case "DELETE": return "destructive";
      default: return "outline";
    }
  };

  const getTableIcon = (tableName: string) => {
    switch (tableName) {
      case "orders": return <FileText className="h-4 w-4" />;
      case "user_roles": return <Shield className="h-4 w-4" />;
      default: return <History className="h-4 w-4" />;
    }
  };

  const formatChanges = (log: AuditLog) => {
    if (log.action === "INSERT") {
      return <span className="text-muted-foreground text-sm">New record created</span>;
    }
    if (log.action === "DELETE") {
      return <span className="text-muted-foreground text-sm">Record deleted</span>;
    }
    if (log.action === "UPDATE" && log.old_data && log.new_data && typeof log.old_data === 'object' && typeof log.new_data === 'object') {
      const oldData = log.old_data as Record<string, unknown>;
      const newData = log.new_data as Record<string, unknown>;
      const changes: string[] = [];
      Object.keys(newData).forEach(key => {
        if (key !== "updated_at" && JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
          changes.push(`${key}: ${oldData[key]} → ${newData[key]}`);
        }
      });
      return (
        <div className="text-sm text-muted-foreground max-w-xs truncate">
          {changes.length > 0 ? changes.join(", ") : "No visible changes"}
        </div>
      );
    }
    return null;
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
            <p className="text-muted-foreground">Track all changes to orders and user roles</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4 flex-wrap">
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by table" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tables</SelectItem>
                <SelectItem value="orders">Orders</SelectItem>
                <SelectItem value="user_roles">User Roles</SelectItem>
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="INSERT">Insert</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No audit logs found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Changes</TableHead>
                    <TableHead>User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.created_at), "MMM d, yyyy HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTableIcon(log.table_name)}
                          <span className="capitalize">{log.table_name.replace("_", " ")}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatChanges(log)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{log.user_email}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
