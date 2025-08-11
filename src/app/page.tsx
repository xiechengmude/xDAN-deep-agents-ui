import { redirect } from "next/navigation"

export default function HomePage() {
  // Redirect to the deep agents app
  redirect("/deep-agents-polished")
}