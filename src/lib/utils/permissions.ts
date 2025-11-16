export type UserRole = 'owner' | 'admin' | 'officer';
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export const roleHierarchy: Record<UserRole, number> = {
  owner: 3,
  admin: 2,
  officer: 1,
};

export function hasPermission(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function canManageRole(
  userRole: UserRole,
  targetRole: UserRole
): boolean {
  return roleHierarchy[userRole] > roleHierarchy[targetRole];
}

export function canInviteRole(
  userRole: UserRole,
  roleToInvite: 'admin' | 'officer'
): boolean {
  if (userRole === 'owner') return true;
  if (userRole === 'admin' && roleToInvite === 'officer') return true;
  return false;
}

type ResourcePermissions = {
  view?: readonly UserRole[];
  create?: readonly UserRole[];
  edit?: readonly UserRole[];
  delete?: readonly UserRole[];
};

export const permissions: Record<string, ResourcePermissions> = {
  classes: {
    view: ['owner', 'admin', 'officer'],
    create: ['owner', 'admin', 'officer'],
    edit: ['owner', 'admin', 'officer'],
    delete: ['owner', 'admin'],
  },
  events: {
    view: ['owner', 'admin', 'officer'],
    create: ['owner', 'admin', 'officer'],
    edit: ['owner', 'admin', 'officer'],
    delete: ['owner', 'admin'],
  },
  team: {
    view: ['owner', 'admin'],
    create: ['owner', 'admin'],
    edit: ['owner', 'admin'],
    delete: ['owner', 'admin'],
  },
  users: {
    view: ['owner', 'admin'],
    create: ['owner', 'admin'],
    edit: ['owner', 'admin'],
    delete: ['owner'],
  },
  hsk: {
    view: ['owner', 'admin', 'officer'],
    create: ['owner', 'admin', 'officer'],
    edit: ['owner', 'admin', 'officer'],
    delete: ['owner', 'admin'],
  },
  inquiries: {
    view: ['owner', 'admin', 'officer'],
    edit: ['owner', 'admin', 'officer'],
    delete: ['owner', 'admin'],
  },
  auditLogs: {
    view: ['owner', 'admin'],
  },
} as const;

export function hasResourcePermission(
  userRole: UserRole,
  resource: keyof typeof permissions,
  action: PermissionAction
): boolean {
  const resourcePermissions = permissions[resource];
  if (!resourcePermissions) return false;

  const allowedRoles = resourcePermissions[action];
  if (!allowedRoles) return false;

  return allowedRoles.includes(userRole);
}