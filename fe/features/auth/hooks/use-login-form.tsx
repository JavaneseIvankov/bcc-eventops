import { LoginInput } from "@/shared/repository/types"
import { z } from "zod"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

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
  name: z.string().min(3).max(20),
  email: z.email(),
  password: passwordSchema,
})
type TLoginInputSchema = z.infer<typeof loginInputSchema>

export const useLoginForm = () => {
  return useForm<TLoginInputSchema>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    resolver: zodResolver(loginInputSchema),
  })
}
