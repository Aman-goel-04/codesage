import dotenv from "dotenv";
import path from "path";
const x = dotenv.config({
	path: path.resolve(process.cwd(), "../../.env"),
});
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({
	connectionString,
});

export const prisma = new PrismaClient({
	adapter,
});