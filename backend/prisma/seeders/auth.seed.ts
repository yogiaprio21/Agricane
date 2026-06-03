import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const PASSWORD = 'admin123';

const demoUsers = [
  ['admin@agricane.com', 'Admin', 'User', Role.ADMIN],
  ['manager@agricane.com', 'Michael', 'Manager', Role.MANAGER],
  ['agronomist@agricane.com', 'John', 'Agronomist', Role.AGRONOMIST],
  ['drone@agricane.com', 'Sarah', 'Pilot', Role.DRONE_OPERATOR],
  ['technician@agricane.com', 'Tia', 'Technician', Role.TECHNICIAN],
  ['viewer@agricane.com', 'Demo', 'Viewer', Role.VIEWER],
] as const;

export type SeededUsers = Awaited<ReturnType<typeof seedUsers>>;

export async function seedUsers(prisma: PrismaClient) {
  const hashedPassword = await bcrypt.hash(PASSWORD, 10);
  const result: Record<string, { id: string; email: string }> = {};

  for (const [email, firstName, lastName, role] of demoUsers) {
    result[email] = await prisma.user.upsert({
      where: { email },
      update: { password: hashedPassword, firstName, lastName, role, isActive: true },
      create: { email, password: hashedPassword, firstName, lastName, role, isActive: true },
      select: { id: true, email: true },
    });
  }

  return result;
}
