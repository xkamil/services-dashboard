"use client";

import { SubNav, type NavLink } from "~/app/_components/navbar";
import { ENVIRONMENT_TYPE_META } from "~/lib/config/environment-type";
import { environmentSlug } from "~/lib/config/resolve";
import { api } from "~/trpc/react";

/**
 * The environments sub-navigation: one tab per configured environment, linking
 * to its own page. Renders with the same {@link SubNav} used by the admin area.
 */
export function EnvironmentsNav() {
  const { data } = api.admin.config.getResolved.useQuery({});

  const links: NavLink[] = (data?.environments ?? []).map((env) => ({
    href: `/environments/${environmentSlug(env.name)}`,
    label: env.name.toUpperCase(),
    accentColor: ENVIRONMENT_TYPE_META[env.type].accentColor,
  }));

  return <SubNav links={links} />;
}
