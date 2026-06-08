import { EnvironmentDetail } from "../_components/environment-detail";

export default async function EnvironmentPage({
  params,
}: {
  params: Promise<{ env: string }>;
}) {
  const { env } = await params;
  return <EnvironmentDetail slug={env} />;
}
