"use client"

import { z } from "zod"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useLogin } from "@/shared/repository/queries"
import type { LoginInput } from "@/shared/repository/types"

export const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters long" })
  .max(64, { message: "Password must be at most 64 characters long" })
  .regex(/[A-Z]/, { message: "Must contain at least one uppercase letter" })
  .regex(/[a-z]/, { message: "Must contain at least one lowercase letter" })
  .regex(/[0-9]/, { message: "Must contain at least one number" })
  .regex(/[^A-Za-z0-9]/, {
    message: "Must contain at least one special character",
  })

const loginInputSchema = z.object({
  email: z.email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
})

export type TLoginInputSchema = z.infer<typeof loginInputSchema>

export const useLoginForm = () => {
  const loginMut = useLogin()

  const form = useForm<TLoginInputSchema>({
    resolver: zodResolver(loginInputSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit: SubmitHandler<TLoginInputSchema> = (values: LoginInput) => {
    loginMut.mutate(values, {
      onError: (err) => {
        form.setError("root", {
          message: err.error?.message || "Invalid email or password",
        })
      },
    })
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isPending: loginMut.isPending,
  }
}
