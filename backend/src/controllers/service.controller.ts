import prisma from '../utils/prisma';

export const createServiceRequest = async (req: any, res: any) => {
  try {
    const { studentId, studentName, type, details } = req.body;
    
    if (!studentId || !studentName || !type || !details) {
      return res.status(400).json({ message: 'Thiếu thông tin yêu cầu' });
    }

    const sid = Number(studentId);
    const detailsStr = typeof details === 'string' ? details : JSON.stringify(details);

    // Hardcoded SQL for maximum stability
    await prisma.$executeRawUnsafe(
      `INSERT INTO servicerequest (studentId, studentName, type, status, details, createdAt, updatedAt) 
       VALUES (?, ?, ?, 'PENDING', ?, NOW(), NOW())`,
      sid, studentName, type, detailsStr
    );

    res.status(201).json({ message: 'Gửi yêu cầu thành công' });
  } catch (error: any) {
    console.error('SQL Error in create:', error);
    res.status(500).json({ message: 'Lỗi Database', error: error.message });
  }
};

export const getAllServiceRequests = async (req: any, res: any) => {
  try {
    const requests: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM servicerequest ORDER BY createdAt DESC`
    );

    const formattedRequests = requests.map((item: any) => ({
      ...item,
      details: typeof item.details === 'string' ? JSON.parse(item.details) : item.details
    }));

    res.json(formattedRequests);
  } catch (error: any) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const updateServiceRequestStatus = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 1. Update status
    await prisma.$executeRawUnsafe(
      `UPDATE servicerequest SET status = ?, updatedAt = NOW() WHERE id = ?`,
      status, Number(id)
    );

    // 2. Add notification if approved (using raw SQL for safety)
    if (status === 'APPROVED') {
       const rows: any[] = await prisma.$queryRawUnsafe(
         `SELECT * FROM servicerequest WHERE id = ?`, Number(id)
       );
       const reqData = rows[0];

       if (reqData) {
         await prisma.$executeRawUnsafe(
           `INSERT INTO notification (title, content, tag, color, createdAt, updatedAt) 
            VALUES (?, ?, ?, ?, NOW(), NOW())`,
           'Xác nhận hồ sơ',
           `Đơn ${reqData.type} của sinh viên ${reqData.studentName} đã được xác nhận. Vui lòng đến phòng QLSV để nhận giấy.`,
           'Dịch vụ',
           'emerald'
         );
       }
    }

    res.json({ message: 'Cập nhật thành công' });
  } catch (error: any) {
    console.error('SQL Error in update:', error);
    res.status(500).json({ message: 'Lỗi Database', error: error.message });
  }
};

export const getAvailableServices = async (req: any, res: any) => {
  try {
    const services: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM onestopservice WHERE isActive = true ORDER BY id ASC`
    );
    res.json(services);
  } catch (error: any) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
