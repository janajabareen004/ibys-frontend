import tenantImg from "@/assets/hero-tenant.jpg";
import managerImg from "@/assets/hero-manager.jpg";
import companyImg from "@/assets/hero-company.jpg";
import type { Role } from "@/api/authApi";

const SRC: Record<Role, string> = {
  TENANT: tenantImg,
  PROJECT_MANAGER: managerImg,
  BUILDING_COMPANY: companyImg,
};

const ALT: Record<Role, string> = {
  TENANT: "Homeowner receiving keys in front of a modern residential building",
  PROJECT_MANAGER: "Project manager reviewing plans on a construction site",
  BUILDING_COMPANY: "Panoramic construction site with cranes and buildings under construction",
};

/**
 * Role-specific hero image block.
 * - Mobile: renders as a compact banner on top of the hero (h-40 / ~160px).
 * - Desktop: fills the right-side column of the hero at full height.
 * A dark/teal gradient overlay keeps adjacent text legible and blends the
 * image into the hero's primary color. RTL-aware fade toward the text side.
 */
export function RoleHeroArt({ role }: { role: Role }) {
  return (
    <div className="relative h-40 w-full overflow-hidden sm:h-48 md:h-full md:min-h-[240px]">
      <img
        src={SRC[role]}
        alt={ALT[role]}
        width={1200}
        height={800}
        className="h-full w-full object-cover"
        loading="lazy"
      />
      {/* Base dark/teal wash for legibility on top of the image */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklch, var(--primary) 45%, transparent) 0%, color-mix(in oklch, var(--primary) 20%, transparent) 100%)",
        }}
      />
      {/* Fade toward the text side. On mobile the text sits below → fade to bottom.
          On desktop the text sits on the inline-start side → fade to that edge. */}
      <div
        aria-hidden
        className="absolute inset-0 rtl:hidden"
        style={{
          background:
            "linear-gradient(to bottom, transparent 40%, color-mix(in oklch, var(--primary) 70%, transparent) 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 hidden md:block rtl:md:hidden"
        style={{
          background:
            "linear-gradient(to left, transparent 0%, color-mix(in oklch, var(--primary) 55%, transparent) 70%, var(--primary) 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 hidden rtl:md:block"
        style={{
          background:
            "linear-gradient(to right, transparent 0%, color-mix(in oklch, var(--primary) 55%, transparent) 70%, var(--primary) 100%)",
        }}
      />
    </div>
  );
}
