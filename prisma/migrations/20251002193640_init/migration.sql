-- CreateEnum
CREATE TYPE "public"."DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "public"."LinkOverrideType" AS ENUM ('BLOCK', 'ADDITIONAL');

-- CreateEnum
CREATE TYPE "public"."MeetingStatus" AS ENUM ('BOOKED', 'CANCELLED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "public"."MeetingAttendeeRole" AS ENUM ('HOST', 'GUEST');

-- CreateEnum
CREATE TYPE "public"."AttendeeResponseStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "public"."SchedulingLink" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "bufferBeforeMinutes" INTEGER NOT NULL DEFAULT 0,
    "bufferAfterMinutes" INTEGER NOT NULL DEFAULT 0,
    "minNoticeMinutes" INTEGER NOT NULL DEFAULT 60,
    "maxAdvanceDays" INTEGER DEFAULT 60,
    "timeZone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requireConfirmation" BOOLEAN NOT NULL DEFAULT false,
    "allowReschedule" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchedulingLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SchedulingLinkAvailability" (
    "id" TEXT NOT NULL,
    "schedulingLinkId" TEXT NOT NULL,
    "dayOfWeek" "public"."DayOfWeek" NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "customDurationMinutes" INTEGER,
    "customBufferBefore" INTEGER,
    "customBufferAfter" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchedulingLinkAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SchedulingLinkOverride" (
    "id" TEXT NOT NULL,
    "schedulingLinkId" TEXT NOT NULL,
    "overrideDate" DATE NOT NULL,
    "startTime" TIME,
    "endTime" TIME,
    "type" "public"."LinkOverrideType" NOT NULL DEFAULT 'BLOCK',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchedulingLinkOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Meeting" (
    "id" TEXT NOT NULL,
    "schedulingLinkId" TEXT NOT NULL,
    "hostUserId" UUID NOT NULL,
    "status" "public"."MeetingStatus" NOT NULL DEFAULT 'BOOKED',
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "guestName" TEXT,
    "guestEmail" TEXT NOT NULL,
    "company" TEXT,
    "notes" TEXT,
    "location" TEXT,
    "meetingUrl" TEXT,
    "videoConferenceId" TEXT,
    "calendarEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MeetingAttendee" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "public"."MeetingAttendeeRole" NOT NULL DEFAULT 'GUEST',
    "responseStatus" "public"."AttendeeResponseStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingAttendee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchedulingLink_slug_key" ON "public"."SchedulingLink"("slug");

-- CreateIndex
CREATE INDEX "SchedulingLink_userId_idx" ON "public"."SchedulingLink"("userId");

-- CreateIndex
CREATE INDEX "SchedulingLinkAvailability_schedulingLinkId_dayOfWeek_idx" ON "public"."SchedulingLinkAvailability"("schedulingLinkId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "SchedulingLinkOverride_schedulingLinkId_overrideDate_idx" ON "public"."SchedulingLinkOverride"("schedulingLinkId", "overrideDate");

-- CreateIndex
CREATE INDEX "Meeting_schedulingLinkId_idx" ON "public"."Meeting"("schedulingLinkId");

-- CreateIndex
CREATE INDEX "Meeting_hostUserId_idx" ON "public"."Meeting"("hostUserId");

-- CreateIndex
CREATE INDEX "Meeting_startTime_idx" ON "public"."Meeting"("startTime");

-- CreateIndex
CREATE INDEX "MeetingAttendee_meetingId_email_idx" ON "public"."MeetingAttendee"("meetingId", "email");

-- AddForeignKey
ALTER TABLE "public"."SchedulingLinkAvailability" ADD CONSTRAINT "SchedulingLinkAvailability_schedulingLinkId_fkey" FOREIGN KEY ("schedulingLinkId") REFERENCES "public"."SchedulingLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SchedulingLinkOverride" ADD CONSTRAINT "SchedulingLinkOverride_schedulingLinkId_fkey" FOREIGN KEY ("schedulingLinkId") REFERENCES "public"."SchedulingLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Meeting" ADD CONSTRAINT "Meeting_schedulingLinkId_fkey" FOREIGN KEY ("schedulingLinkId") REFERENCES "public"."SchedulingLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MeetingAttendee" ADD CONSTRAINT "MeetingAttendee_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "public"."Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
