"use client"

import * as React from "react"
import { Check, Loader2, Mail, X } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import {
  useAcceptInvitation,
  useGetMyInvitations,
  useRejectInvitation,
} from "@/shared/repository/queries"
import { formatDateTime } from "@/features/events/components/event-date"

export function PendingInvitations() {
  const { data, isLoading } = useGetMyInvitations({ status: "PENDING" })
  const [busyId, setBusyId] = React.useState<string | null>(null)

  const acceptMut = useAcceptInvitation()
  const rejectMut = useRejectInvitation()

  const invitations = data?.data ?? []

  if (isLoading || invitations.length === 0) return null

  const handleAccept = (id: string) => {
    setBusyId(id)
    acceptMut.mutate(id, { onSettled: () => setBusyId(null) })
  }

  const handleReject = (id: string) => {
    setBusyId(id)
    rejectMut.mutate(id, { onSettled: () => setBusyId(null) })
  }

  return (
    <Card id="invitations" className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4 text-primary" />
          Undangan Panitia
          <Badge variant="default" className="h-5 px-1.5 text-[10px]">
            {invitations.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {invitations.map((invitation) => {
          const isBusy = busyId === invitation.id

          return (
            <div
              key={invitation.id}
              className="flex flex-col gap-3 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-sm font-medium">
                  {invitation.event?.name ?? "Event"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Diundang sebagai{" "}
                  <span className="font-medium text-foreground">
                    {invitation.role === "COORDINATOR"
                      ? "Koordinator"
                      : "Panitia"}
                  </span>
                  {invitation.invited_by_name &&
                    ` oleh ${invitation.invited_by_name}`}
                  {invitation.event?.start_time &&
                    ` · ${formatDateTime(invitation.event.start_time)}`}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  disabled={isBusy}
                  onClick={() => handleAccept(invitation.id)}
                >
                  {isBusy ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Terima
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isBusy}
                  onClick={() => handleReject(invitation.id)}
                >
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  Tolak
                </Button>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
