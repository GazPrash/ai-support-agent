import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: `file:${process.env.DATABASE_PATH ?? "./data/pshr-support-agent.sqlite"}`,
  },
});
