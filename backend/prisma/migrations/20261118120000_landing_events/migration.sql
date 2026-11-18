CREATE TABLE "LandingEvent" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LandingEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LandingEvent_event_createdAt_idx" ON "LandingEvent"("event", "createdAt");
