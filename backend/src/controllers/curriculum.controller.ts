import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getFaculties = async (req: Request, res: Response) => {
  try {
    const faculties = await prisma.faculty.findMany({
      include: { majors: true }
    });
    res.json(faculties);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createFaculty = async (req: Request, res: Response) => {
  try {
    const faculty = await prisma.faculty.create({ data: req.body });
    res.json(faculty);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateFaculty = async (req: Request, res: Response) => {
  try {
    const faculty = await prisma.faculty.update({
      where: { id: Number(req.params.id) },
      data: req.body
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
    const major = await prisma.major.create({ data: req.body });
    res.json(major);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateMajor = async (req: Request, res: Response) => {
  try {
    const major = await prisma.major.update({
      where: { id: Number(req.params.id) },
      data: req.body
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
        curriculumSemesters: {
          orderBy: { semesterNumber: 'asc' },
          include: {
            subjects: {
              orderBy: { displayOrder: 'asc' },
              include: {
                subject: true,
                prerequisite: true
              }
            }
          }
        }
      }
    });
    res.json(curriculum);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllSubjects = async (req: Request, res: Response) => {
  try {
    const subjects = await prisma.subject.findMany();
    res.json(subjects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createCurriculumSubject = async (req: Request, res: Response) => {
  try {
    const { majorId } = req.params;
    const { semesterId, subjectId, isRequired, prerequisiteSubjectId, displayOrder } = req.body;

    const newAssignment = await prisma.curriculumSubject.create({
      data: {
        majorId: Number(majorId),
        semesterId: Number(semesterId),
        subjectId: Number(subjectId),
        isRequired,
        prerequisiteSubjectId: prerequisiteSubjectId ? Number(prerequisiteSubjectId) : null,
        displayOrder: displayOrder || 0
      },
      include: { subject: true }
    });

    res.status(201).json(newAssignment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCurriculumSubject = async (req: Request, res: Response) => {
  try {
    const { curriculumSubjectId } = req.params;
    const data = req.body;

    const updated = await prisma.curriculumSubject.update({
      where: { id: Number(curriculumSubjectId) },
      data: {
        semesterId: data.semesterId ? Number(data.semesterId) : undefined,
        isRequired: data.isRequired,
        prerequisiteSubjectId: data.prerequisiteSubjectId ? Number(data.prerequisiteSubjectId) : undefined,
        displayOrder: data.displayOrder
      }
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCurriculumSubject = async (req: Request, res: Response) => {
  try {
    const { curriculumSubjectId } = req.params;
    
    // Check if this subject is a prerequisite for others in the same major
    const isPrerequisite = await prisma.curriculumSubject.findFirst({
      where: { prerequisiteSubjectId: Number(curriculumSubjectId) }
    });

    if (isPrerequisite) {
      return res.status(400).json({ error: 'Không thể xóa vì môn này là tiên quyết của môn khác.' });
    }

    await prisma.curriculumSubject.delete({
      where: { id: Number(curriculumSubjectId) }
    });

    res.json({ message: 'Xóa thành công' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyCurriculum = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.studentId;
    console.log('Fetching curriculum for studentId:', studentId);
    
    if (!studentId) {
      console.warn('getMyCurriculum: No studentId in req.user', req.user);
      return res.status(404).json({ error: 'Người dùng hiện tại không phải là sinh viên hoặc thiếu thông tin sinh viên.' });
    }

    const student = await prisma.student.findUnique({
      where: { id: Number(studentId) },
      include: {
        class: {
          include: {
            major: {
              include: {
                faculty: true,
                curriculumSemesters: {
                  orderBy: { semesterNumber: 'asc' },
                  include: {
                    subjects: {
                      orderBy: { displayOrder: 'asc' },
                      include: {
                        subject: true,
                        prerequisite: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        grades: true
      }
    });

    console.log('Student found:', student?.name, 'Class:', student?.class_id, 'Major:', student?.class?.major?.name);

    if (!student) {
      return res.status(404).json({ error: `Không tìm thấy thông tin sinh viên với ID ${studentId}` });
    }

    if (!student.class?.major) {
      return res.status(404).json({ error: `Sinh viên ${student.name} (Lớp ${student.class_id}) chưa được gán chương trình đào tạo.` });
    }

    res.json({
      major: student.class.major,
      grades: student.grades
    });
  } catch (error: any) {
    console.error('Error in getMyCurriculum:', error);
    res.status(500).json({ error: error.message });
  }
};

export const addCurriculumSemester = async (req: AuthRequest, res: Response) => {
  const { majorId } = req.params;
  try {
    const lastSem = await prisma.curriculumSemester.findFirst({
      where: { majorId: Number(majorId) },
      orderBy: { semesterNumber: 'desc' }
    });

    const nextNumber = lastSem ? lastSem.semesterNumber + 1 : 1;

    const newSem = await prisma.curriculumSemester.create({
      data: {
        majorId: Number(majorId),
        semesterNumber: nextNumber,
        name: `Học kỳ ${nextNumber}`,
        expectedCredits: 0
      }
    });

    res.status(201).json(newSem);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
