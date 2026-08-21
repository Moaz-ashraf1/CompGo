import app from './app.js';
import { logger } from "./config/logger.js";
import "dotenv/config";
import { prisma } from './config/prisma.js';

async function startServer() {
    try {
        await prisma.$connect();
        logger.info("Connected to DB (Prisma)");

    
      const PORT =Number(process.env.PORT) || 3000;
      app.listen(PORT, () => {
      logger.info("Server running", {
        port: PORT,
        env: process.env.NODE_ENV || "development",
      });
    });
  }  catch (error) {
        logger.error("Failed to connect to DB", {
        error: (error as Error).message,
        stack: (error as Error).stack,
    });
       process.exit(1);
    }
}
startServer();