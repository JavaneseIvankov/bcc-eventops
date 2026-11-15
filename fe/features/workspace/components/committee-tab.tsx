"use client"

import * as React from "react"
import { LogOut, Mail, Trash2, UserPlus, Users } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Input } from "@/shared/components/ui/input"
import { Badge } from "@/shared/components/ui/badge"
import { Skeleton } from "@/shared/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"
import {
  useCancelInvitation,
  useGetEventCommittees,
  useInviteCommittee,
  useLeaveCommittee,
  useRemoveCommitteeMember,
} from "@/shared/repository/queries"
import type { CommitteeRole } from "@/shared/repository/types"
import { formatDateTime } from "@/features/events/components/event-date"

export function CommitteeTab({
  eventId,
  role,
  currentUserId,
}: {
  eventId: string
  role: CommitteeRole
  currentUserId: string
}) {
  const { data, isLoading } = useGetEventCommittees(eventId)
  const inviteMut = useInviteCommittee()
  const removeMut = useRemoveCommitteeMember()
  const cancelInviteMut = useCancelInvitation()
  const leaveMut = useLeaveCommittee()

  const [email, setEmail] = React.useState("")
  const [inviteRole, setInviteRole] = React.useState<CommitteeRole>("COMMITTEE")

  const members = data?.data.members ?? []
  const invitations = data?.data.invitations ?? []
  const isCoordinator = role === "COORDINATOR"

  const handleInvite = (event: React.FormEvent) => {
    event.preventDefault()
    if (!email.trim()) return

    inviteMut.mutate(
      { eventId, body: { email: email.trim(), role: inviteRole } },
      { onSuccess: () => setEmail("") }
    )
  }

  return (
    <div className="space-y-4">
      {isCoordinator && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="h-4 w-4 text-primary" />
              Undang Panitia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="email"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Select
                value={inviteRole}
                onValueChange={(value) => {
                  if (typeof value !== "string") return
                  setInviteRole(value as CommitteeRole)
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMMITTEE">Committee</SelectItem>
                  <SelectItem value="COORDINATOR">Coordinator</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={inviteMut.isPending || !email.trim()}>
                <Mail className="mr-1.5 h-3.5 w-3.5" />
                Kirim undangan
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />
            Panitia Aktif
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead>Peran</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.user_id}>
                      <TableCell className="font-medium">
                        {member.name}
                        {member.user_id === currentUserId && (
                          <span className="ml-1.5 text-[10px] text-muted-foreground">
                            (kamu)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                        {member.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            member.role === "COORDINATOR"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {member.role === "COORDINATOR"
                            ? "Coordinator"
                            : "Committee"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {member.user_id === currentUserId ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            disabled={leaveMut.isPending}
                            onClick={() => leaveMut.mutate(eventId)}
                          >
                            <LogOut className="mr-1 h-3 w-3" />
                            Keluar
                          </Button>
                        ) : (
                          isCoordinator && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              disabled={removeMut.isPending}
                              onClick={() =>
                                removeMut.mutate({
                                  eventId,
                                  userId: member.user_id,
                                })
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {invitations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Undangan Pending</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between gap-2 rounded-lg border p-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {invitation.invitee_name ?? invitation.invitee_email}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {invitation.invitee_email} ·{" "}
                    {formatDateTime(invitation.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary">{invitation.role}</Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    disabled={cancelInviteMut.isPending}
                    onClick={() =>
                      cancelInviteMut.mutate({
                        eventId,
                        invitationId: invitation.id,
                      })
                    }
                  >
                    Batalkan
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
