"use client"

import { z } from "zod"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRegister } from "@/shared/repository/queries"
import type { RegisterInput } from "@/shared/repository/types"
import { passwordSchema } from "./use-login-form"

const registerInputSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" })
    .max(50, { message: "Name must be at most 50 characters long" }),
  email: z.email({ message: "Please enter a valid email address" }),
  password: passwordSchema,
})

export type TRegisterInputSchema = z.infer<typeof registerInputSchema>

export const useRegisterForm = () => {
  const registerMut = useRegister()

  const form = useForm<TRegisterInputSchema>({
    resolver: zodResolver(registerInputSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  })

  const onSubmit: SubmitHandler<TRegisterInputSchema> = (
    values: RegisterInput
  ) => {
    registerMut.mutate(values, {
      onError: (err) => {
        if (err.error?.code === "EMAIL_ALREADY_EXISTS") {
          form.setError("email", {
            message: err.error.message || "Email is already registered",
          })
          return
        }

        form.setError("root", {
          message: err.error?.message || "Failed to create account",
        })
      },
    })
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isPending: registerMut.isPending,
  }
}