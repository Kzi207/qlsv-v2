import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getFaculties = async (req: Request, res: Response) => {
  try {
    const faculties = await prisma.faculty.findMany({
      include: { major: true }
    });

    const formattedFaculties = faculties.map((f: any) => ({
      ...f,
      majors: f.major || []
    }));

    res.json(formattedFaculties);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createFaculty = async (req: Request, res: Response) => {
  try {
    const faculty = await prisma.faculty.create({ 
      data: {
        ...req.body,
        updatedAt: new Date()
      } 
    });
    res.json(faculty);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateFaculty = async (req: Request, res: Response) => {
  try {
    const faculty = await prisma.faculty.update({
      where: { id: Number(req.params.id) },
      data: {
        ...req.body,
        updatedAt: new Date()
      }
    });
    res.json(faculty);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteFaculty = async (req: Request, res: Response) => {
  try {
    await prisma.faculty.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMajors = async (req: Request, res: Response) => {
  try {
    const { facultyId } = req.query;
    const where = facultyId ? { facultyId: Number(facultyId) } : {};
    const majors = await prisma.major.findMany({
      where,
      include: { faculty: true }
    });
    res.json(majors);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createMajor = async (req: Request, res: Response) => {
  try {
    const major = await prisma.major.create({ 
      data: {
        ...req.body,
        facultyId: Number(req.body.facultyId),
        updatedAt: new Date()
      }
    });
    res.json(major);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateMajor = async (req: Request, res: Response) => {
  try {
    const major = await prisma.major.update({
      where: { id: Number(req.params.id) },
      data: {
        ...req.body,
        facultyId: Number(req.body.facultyId),
        updatedAt: new Date()
      }
    });
    res.json(major);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteMajor = async (req: Request, res: Response) => {
  try {
    await prisma.major.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMajorCurriculum = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const curriculum = await prisma.major.findUnique({
      where: { id: Number(id) },
      include: {
        faculty: true,
        curriculumsemester: {
          orderBy: { semesterNumber: 'asc' },
          include: {
            curriculumsubject: {
              orderBy: { displayOrder: 'asc' },
              include: {
                subject_curriculumsubject_subjectIdTosubject: true,
                subject_curriculumsubject_prerequisiteSubjectIdTosubject: true
              }
            }
          }
        }
      }
    });

    if (!curriculum) return res.status(404).json({ error: 'Not found' });

    const formatted = {
      id: curriculum.id,
      name: curriculum.name,
      code: curriculum.code,
      totalCredits: curriculum.totalCredits,
      totalSemesters: curriculum.totalSemesters,
      faculty: curriculum.faculty,
      curriculumSemesters: curriculum.curriculumsemester.map((s: any) => ({
        id: s.id,
        semesterNumber: s.semesterNumber,
        name: s.name,
        expectedCredits: s.expectedCredits,
        subjects: s.curriculumsubject.map((cs: any) => ({
          id: cs.id,
          subjectId: cs.subjectId,
          code: cs.subject_curriculumsubject_subjectIdTosubject.code,
          name: cs.subject_curriculumsubject_subjectIdTosubject.name,
          credits: cs.subject_curriculumsubject_subjectIdTosubject.credits,
          theoryPeriods: cs.subject_curriculumsubject_subjectIdTosubject.theoryPeriods,
          practicePeriods: cs.subject_curriculumsubject_subjectIdTosubject.practicePeriods,
          isRequired: cs.isRequired,
          prerequisite: cs.subject_curriculumsubject_prerequisiteSubjectIdTosubject
        }))
      }))
    };

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const addSemester = async (req: Request, res: Response) => {
  try {
    const { majorId } = req.params;
    const mId = Number(majorId);
    if (isNaN(mId)) return res.status(400).json({ error: 'Mã ngành không hợp lệ' });

    const lastSem = await prisma.curriculumsemester.findFirst({
      where: { majorId: mId },
      orderBy: { semesterNumber: 'desc' }
    });
    
    const nextNum = (lastSem?.semesterNumber || 0) + 1;
    const semester = await prisma.curriculumsemester.create({
      data: {
        majorId: mId,
        semesterNumber: nextNum,
        name: `Học kỳ ${nextNum}`,
        expectedCredits: 15,
        updatedAt: new Date()
      }
    });
    res.json(semester);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const addSubjectToCurriculum = async (req: Request, res: Response) => {
  try {
    const { majorId, semesterId, subjectId, isRequired, prerequisiteSubjectId } = req.body;
    
    // 1. Validation & Parsing
    const mId = Number(majorId);
    const sId = Number(semesterId);
    const subId = Number(subjectId);
    
    if (isNaN(mId) || isNaN(sId) || isNaN(subId)) {
      return res.status(400).json({ error: 'Thông tin ID không hợp lệ (NaN)' });
    }

    // 2. Creation with explicit relations to satisfy Prisma Client validation
    const subject = await prisma.curriculumsubject.create({
      data: {
        isRequired: Boolean(isRequired),
        updatedAt: new Date(),
        // Explicit relations
        major: { connect: { id: mId } },
        curriculumsemester: { connect: { id: sId } },
        subject_curriculumsubject_subjectIdTosubject: { connect: { id: subId } },
        // Optional relation
        ...(prerequisiteSubjectId && {
          subject_curriculumsubject_prerequisiteSubjectIdTosubject: { connect: { id: Number(prerequisiteSubjectId) } }
        })
      }
    });
    res.json(subject);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCurriculumSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isRequired, prerequisiteSubjectId, semesterId } = req.body;
    
    const subject = await prisma.curriculumsubject.update({
      where: { id: Number(id) },
      data: {
        isRequired: isRequired !== undefined ? Boolean(isRequired) : undefined,
        updatedAt: new Date(),
        ...(semesterId && { curriculumsemester: { connect: { id: Number(semesterId) } } }),
        ...(prerequisiteSubjectId !== undefined && {
          subject_curriculumsubject_prerequisiteSubjectIdTosubject: prerequisiteSubjectId 
            ? { connect: { id: Number(prerequisiteSubjectId) } } 
            : { disconnect: true }
        })
      }
    });
    res.json(subject);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCurriculumSubject = async (req: Request, res: Response) => {
  try {
    await prisma.curriculumsubject.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyCurriculum = async (req: AuthRequest, res: Response) => {
  try {
    const sId = req.user?.studentId;
    if (!sId) {
      return res.status(400).json({ error: 'Chỉ sinh viên mới có thể xem chương trình đào tạo cá nhân' });
    }

    const student = await prisma.student.findUnique({
      where: { id: Number(sId) },
      include: {
        class: {
          include: {
            major: {
              include: {
                faculty: true,
                curriculumsemester: {
                  orderBy: { semesterNumber: 'asc' },
                  include: {
                    curriculumsubject: {
                      orderBy: { displayOrder: 'asc' },
                      include: {
                        subject_curriculumsubject_subjectIdTosubject: true,
                        subject_curriculumsubject_prerequisiteSubjectIdTosubject: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        grade: true
      }
    });

    if (!student || !student.Renamedclass?.major) {
      return res.status(404).json({ error: 'Chưa gán ngành học hoặc thông tin sinh viên không hợp lệ' });
    }

    const curriculum = student.Renamedclass.major;
    const formattedMajor = {
      id: curriculum.id,
      name: curriculum.name,
      code: curriculum.code,
      totalCredits: curriculum.totalCredits,
      totalSemesters: curriculum.totalSemesters,
      faculty: curriculum.faculty,
      curriculumSemesters: curriculum.curriculumsemester.map((s: any) => ({
        id: s.id,
        semesterNumber: s.semesterNumber,
        name: s.name,
        expectedCredits: s.expectedCredits,
        subjects: s.curriculumsubject.map((cs: any) => ({
          id: cs.id,
          subjectId: cs.subjectId,
          subject: {
            id: cs.subjectId,
            code: cs.subject_curriculumsubject_subjectIdTosubject.code,
            name: cs.subject_curriculumsubject_subjectIdTosubject.name,
            credits: cs.subject_curriculumsubject_subjectIdTosubject.credits,
            theoryPeriods: cs.subject_curriculumsubject_subjectIdTosubject.theoryPeriods,
            practicePeriods: cs.subject_curriculumsubject_subjectIdTosubject.practicePeriods
          },
          isRequired: cs.isRequired,
          prerequisite: cs.subject_curriculumsubject_prerequisiteSubjectIdTosubject
        }))
      }))
    };

    res.json({
      major: formattedMajor,
      grades: student.grade
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
