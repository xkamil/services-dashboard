import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
  const session = await auth();

  return (
    <HydrateClient>
      <main>
        <p>{session?.user?.name ?? "Not signed in"}</p>
      </main>
    </HydrateClient>
  );
}
