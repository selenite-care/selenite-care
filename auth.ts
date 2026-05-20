import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth"

const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

export { handlers, auth, signIn, signOut }