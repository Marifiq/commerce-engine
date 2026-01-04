import { PrismaClient } from "@prisma/client";
import { setActiveDatabaseUrl } from "./utils/dbConfig.js";

// Set the active database URL based on USE_LOCAL_DB flag
setActiveDatabaseUrl();

// Create Prisma client with the active database URL
const prisma = new PrismaClient();

export default prisma;
