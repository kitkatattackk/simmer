import 'dotenv/config';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '../src/generated/prisma/client.ts';

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? 'file:./dev.db' });

export const prisma = new PrismaClient({ adapter } as any);
