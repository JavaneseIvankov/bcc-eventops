"use client"

import { RegisterForm } from "@/features/auth/components/register-form"
import { LogoSvg } from "@/shared/components/logo"
import { Pattern } from "@/shared/components/patterns"

export default function RegisterPage() {
  return (
    <div className="relative isolate flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <Pattern variant="light" className="absolute inset-0 z-0 dark:hidden" />
      <Pattern
        variant="dark"
        className="absolute inset-0 z-0 hidden dark:block"
      />
      <div className="relative z-10 flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <LogoSvg className="size-14" />
        </a>
        <RegisterForm />
      </div>
    </div>
  )
}
