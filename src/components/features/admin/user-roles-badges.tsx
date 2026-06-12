import { Badge } from "@/components/ui/badge";
import { GLOBAL_ROLE_LABELS, type GlobalRoleValue } from "@/lib/user-roles";

type UserRolesBadgesProps = {
  roles: string[];
  isInternal: boolean;
};

export function UserRolesBadges({ roles, isInternal }: UserRolesBadgesProps) {
  if (!isInternal) {
    return <span className="text-[13px] text-muted-foreground">—</span>;
  }

  if (roles.length === 0) {
    return (
      <Badge variant="outline" className="font-normal text-muted-foreground">
        Aucun rôle
      </Badge>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {roles.map((role) => (
        <Badge key={role} variant="secondary" className="font-normal">
          {GLOBAL_ROLE_LABELS[role as GlobalRoleValue] ?? role}
        </Badge>
      ))}
    </div>
  );
}
