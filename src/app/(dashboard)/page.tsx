import { redirect } from "next/navigation";

// Environments is the default landing page for now. More dashboard pages will
// live alongside it under (dashboard), so `/` just forwards to it.
export default function DashboardPage() {
  redirect("/environments");
}
