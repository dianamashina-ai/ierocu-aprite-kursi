import { Cog, FileBadge, Globe, ListChecks, Route, Scale, ShieldCheck, Target, Vault } from "lucide-react";
import { MODULE_META, type ModuleIcon as IconName } from "@/config/module-meta";

const ICONS: Record<IconName, typeof Cog> = {
  cog: Cog,
  shield: ShieldCheck,
  list: ListChecks,
  badge: FileBadge,
  vault: Vault,
  route: Route,
  globe: Globe,
  target: Target,
  scale: Scale,
};

/** Moduļa ikona aplī. size: "md" kartītēm, "lg" moduļa lapas galvenei. */
export function ModuleIcon({ moduleId, size = "md" }: { moduleId: string; size?: "md" | "lg" }) {
  const Icon = ICONS[MODULE_META[moduleId]?.icon ?? "cog"];
  const box = size === "lg" ? "size-20 sm:size-24" : "size-12";
  const icon = size === "lg" ? "size-9 sm:size-10" : "size-5";
  return (
    <span aria-hidden="true" className={`flex shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong ${box}`}>
      <Icon className={icon} strokeWidth={1.75} />
    </span>
  );
}
