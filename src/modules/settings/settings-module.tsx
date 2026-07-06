'use client'
import { useState } from 'react'
import { PageHeader } from '@/shared/components/page-header'
import { DataTable, type Column } from '@/shared/components/data-table'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge, StatusBadge } from '@/shared/components/status-badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Settings, ShieldCheck, Users, History, Check, X, Lock, KeyRound, UserPlus } from 'lucide-react'
import { ROLE_LABELS, RBAC, MODULES, type ModuleName } from '@/shared/lib/rbac'
import { fmtDateTime, cn } from '@/shared/lib/format'
import { useUsers, useAuditLog } from '@/shared/services/mutations'
import { UserFormDrawer } from './user-form-drawer'
import { Can } from '@/shared/hooks/use-permission'
import type { Role, User } from '@/shared/types'

export function SettingsModule() {
  const { data: users = [], isLoading: loadingUsers } = useUsers()
  const { data: audit = [], isLoading: loadingAudit } = useAuditLog()
  const loading = loadingUsers || loadingAudit
  const [userOpen, setUserOpen] = useState(false)

  const userColumns: Column<User>[] = [
    {
      key: 'name', header: 'User', sortable: true,
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-500 text-white text-xs">
              {u.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{u.name}</p>
            <p className="text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role', header: 'Role', sortable: true,
      cell: (u) => <Badge variant="outline">{ROLE_LABELS[u.role as Role]}</Badge>,
    },
    {
      key: 'phone', header: 'Phone',
      cell: (u) => <span className="text-xs font-mono">{u.phone ?? '—'}</span>,
    },
    {
      key: 'employeeId', header: 'Emp ID',
      cell: (u) => <span className="text-xs font-mono">{u.employeeId ?? '—'}</span>,
    },
    {
      key: 'lastLoginAt', header: 'Last Login', sortable: true,
      cell: (u) => <span className="text-xs text-muted-foreground">{fmtDateTime(u.lastLoginAt)}</span>,
    },
    {
      key: 'isActive', header: 'Status', align: 'center',
      cell: (u) => <StatusBadge status={u.isActive ? 'active' : 'blocked'} />,
    },
  ]

  const auditColumns: Column<any>[] = [
    {
      key: 'createdAt', header: 'When', sortable: true,
      cell: (a) => <span className="text-xs">{fmtDateTime(a.createdAt)}</span>,
    },
    {
      key: 'user', header: 'User',
      cell: (a) => <span className="text-sm">{a.user?.name ?? 'System'}</span>,
    },
    {
      key: 'action', header: 'Action',
      cell: (a) => <Badge variant="outline" className="capitalize">{a.action}</Badge>,
    },
    {
      key: 'entity', header: 'Entity',
      cell: (a) => <span className="text-xs font-mono">{a.entity}:{a.entityId?.slice(-6) ?? '—'}</span>,
    },
    {
      key: 'ip', header: 'IP',
      cell: (a) => <span className="text-xs font-mono text-muted-foreground">{a.ip ?? '—'}</span>,
    },
    {
      key: 'device', header: 'Device',
      cell: (a) => <span className="text-xs text-muted-foreground truncate max-w-[200px] block">{a.device ?? '—'}</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Users, roles, RBAC matrix, audit log"
        icon={Settings}
        accent="violet"
        actions={
          <Can module="settings" action="create">
            <Button size="sm" onClick={() => setUserOpen(true)}><UserPlus className="h-4 w-4" /> Add User</Button>
          </Can>
        }
      />

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users"><Users className="h-4 w-4" /> Users ({users.length})</TabsTrigger>
          <TabsTrigger value="rbac"><ShieldCheck className="h-4 w-4" /> RBAC Matrix</TabsTrigger>
          <TabsTrigger value="audit"><History className="h-4 w-4" /> Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <DataTable data={users} columns={userColumns} loading={loading} pageSize={12} searchPlaceholder="Search users..." />
        </TabsContent>

        <TabsContent value="rbac" className="mt-4">
          <Card className="p-5 shadow-soft overflow-x-auto">
            <div className="mb-4">
              <h3 className="text-sm font-semibold">Role-Based Access Control Matrix</h3>
              <p className="text-xs text-muted-foreground">Module-level permissions per role · View / Create / Edit / Delete / Approve</p>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-2 py-2 font-medium text-muted-foreground">Module</th>
                  {Object.keys(ROLE_LABELS).map((role) => (
                    <th key={role} className="px-2 py-2 text-center font-medium text-muted-foreground">{ROLE_LABELS[role as Role]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULES.map((mod: ModuleName) => (
                  <tr key={mod} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-2 py-2 font-medium capitalize">{mod}</td>
                    {Object.keys(ROLE_LABELS).map((role) => {
                      const perm = RBAC[role as Role][mod]
                      return (
                        <td key={role} className="px-2 py-2 text-center">
                          {perm?.view ? (
                            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              <Check className="h-3 w-3" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                              <X className="h-3 w-3" />
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-emerald-500/20" /> View allowed</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-rose-500/20" /> No access</span>
              <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> System roles</span>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <DataTable data={audit} columns={auditColumns} loading={loading} pageSize={15} searchPlaceholder="Search audit log..." />
        </TabsContent>
      </Tabs>

      <Card className="p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Security & Compliance</h3>
            <p className="text-xs text-muted-foreground mt-1">
              All actions are logged with user, timestamp, IP, and device fingerprint.
              Role permissions are enforced server-side via Appwrite Teams.
              JWT-based authentication with rate limiting and Zod input validation.
            </p>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <Badge variant="success"><Check className="h-3 w-3" /> JWT Auth</Badge>
              <Badge variant="success"><Check className="h-3 w-3" /> Zod Validation</Badge>
              <Badge variant="success"><Check className="h-3 w-3" /> Audit Trail</Badge>
              <Badge variant="success"><Check className="h-3 w-3" /> RBAC Enforced</Badge>
              <Badge variant="success"><Check className="h-3 w-3" /> Rate Limited</Badge>
              <Badge variant="success"><Check className="h-3 w-3" /> Encrypted Secrets</Badge>
            </div>
          </div>
        </div>
      </Card>

      <UserFormDrawer open={userOpen} onOpenChange={setUserOpen} />
    </div>
  )
}
