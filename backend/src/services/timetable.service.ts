// @ts-nocheck
import prisma from '../utils/prisma';

export interface TimetableEvent {
  day: number;
  startPeriod: number;
  endPeriod: number;
  room: string;
  teacher: string;
  classId: string;
  startDate: string;
  endDate: string;
  semesterId: string;
}

export const checkConflicts = async (events: TimetableEvent[]) => {
  const conflicts = [];

  for (const event of events) {
    // 1. Check against DB
    const dbConflicts = await prisma.timetable.findMany({
      where: {
        semesterId: event.semesterId,
        day: event.day,
        OR: [
          { room: event.room },
          { teacher: event.teacher },
          { classId: event.classId }
        ],
        // Overlapping periods
        AND: [
          { startPeriod: { lte: event.endPeriod } },
          { endPeriod: { gte: event.startPeriod } }
        ],
      }
    });

    if (dbConflicts.length > 0) {
      conflicts.push({
        event,
        type: 'DB_CONFLICT',
        details: dbConflicts
      });
      continue;
    }

    // 2. Check against other events in the same batch
    const batchConflicts = events.filter(e => 
      e !== event && 
      e.day === event.day &&
      (e.room === event.room || e.teacher === event.teacher || e.classId === event.classId) &&
      e.startPeriod <= event.endPeriod && e.endPeriod >= event.startPeriod
    );

    if (batchConflicts.length > 0) {
      conflicts.push({
        event,
        type: 'BATCH_CONFLICT',
        details: batchConflicts
      });
    }
  }

  return conflicts;
};

export const bulkCreateSchedules = async (events: TimetableEvent[]) => {
  return await prisma.$transaction(
    events.map(e => prisma.timetable.create({
      data: {
        semesterId: e.semesterId,
        day: e.day,
        startPeriod: e.startPeriod,
        endPeriod: e.endPeriod,
        room: e.room,
        teacher: e.teacher,
        classId: e.classId,
        subject: 'Môn học mới', // Fallback or from event
      }
    }))
  );
};
