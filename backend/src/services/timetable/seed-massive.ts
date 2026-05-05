import { PrismaClient } from '../../generated/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const lecturersData = [
  { id: 1, name: "Nguyễn Văn An", subjects: ["Lập trình Web", "ReactJS", "HTML/CSS", "JavaScript"] },
  { id: 2, name: "Trần Thị Bình", subjects: ["Trí tuệ nhân tạo", "Machine Learning", "Deep Learning", "Python"] },
  { id: 3, name: "Lê Văn Cường", subjects: ["NodeJS Backend", "API Design", "Microservices", "Database"] },
  { id: 4, name: "Phạm Thị Dung", subjects: ["Cơ sở dữ liệu", "SQL", "NoSQL", "Data Modeling"] },
  { id: 5, name: "Hoàng Văn Em", subjects: ["Mạng máy tính", "CCNA", "Network Security", "TCP/IP"] },
  { id: 6, name: "Võ Thị Giang", subjects: ["Frontend", "ReactJS", "UI/UX", "JavaScript"] },
  { id: 7, name: "Đặng Văn Hải", subjects: ["Bảo mật hệ thống", "Ethical Hacking", "Pentest", "Security"] },
  { id: 8, name: "Bùi Thị Hạnh", subjects: ["Machine Learning", "AI", "Data Science", "Python"] },
  { id: 9, name: "Phan Văn Khoa", subjects: ["IoT", "Embedded", "Arduino", "ESP32"] },
  { id: 10, name: "Ngô Thị Lan", subjects: ["Android", "Flutter", "Mobile Dev", "Kotlin"] },
  { id: 11, name: "Dương Văn Minh", subjects: ["Hệ điều hành", "Linux", "System Design", "Cloud"] },
  { id: 12, name: "Lý Thị Ngọc", subjects: ["Database", "SQL", "Data Warehouse", "Big Data"] },
  { id: 13, name: "Trịnh Văn Phúc", subjects: ["Backend", "NodeJS", "API", "Microservices"] },
  { id: 14, name: "Đoàn Thị Quỳnh", subjects: ["Frontend", "VueJS", "UI/UX", "CSS"] },
  { id: 15, name: "Mai Văn Sơn", subjects: ["AI", "Deep Learning", "Computer Vision", "NLP"] },
  { id: 16, name: "Huỳnh Thị Trang", subjects: ["Web", "PHP", "Laravel", "MySQL"] },
  { id: 17, name: "Lâm Văn Tuấn", subjects: ["Network", "Security", "Firewall", "Routing"] },
  { id: 18, name: "Phùng Thị Uyên", subjects: ["Security", "Cryptography", "Blockchain", "Pentest"] },
  { id: 19, name: "Tạ Văn Vinh", subjects: ["IoT", "Raspberry Pi", "Embedded", "Automation"] },
  { id: 20, name: "Nguyễn Thị Yến", subjects: ["Mobile", "Android", "iOS", "Flutter"] }
];

async function main() {
  console.log('🌱 Bắt đầu import 20 Giảng viên và Môn học tương ứng...');

  const passwordHash = await bcrypt.hash('123456', 10);

  // 1. Thu thập tất cả Môn học (Unique)
  const uniqueSubjects = new Set<string>();
  lecturersData.forEach(lec => {
    lec.subjects.forEach(sub => uniqueSubjects.add(sub));
  });

  const subjectMap = new Map<string, number>(); // Tên Môn -> ID Môn trong DB

  // 2. Tạo Môn học trong DB
  for (const subName of uniqueSubjects) {
    // Generate a unique code (e.g. "ReactJS" -> "SUB_REACTJS")
    const code = 'SUB_' + subName.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
    
    const dbSubject = await prisma.subject.upsert({
      where: { code: code },
      update: {},
      create: {
        code: code,
        name: subName,
        credits: 3, // Giả định mặc định 3 tín chỉ
        theoryPeriods: 3,
        subjectType: 'LECTURE'
      }
    });
    subjectMap.set(subName, dbSubject.id);
  }
  console.log(`✅ Đã tạo/cập nhật ${uniqueSubjects.size} môn học.`);

  // 3. Tạo Giảng viên và Phân công
  let assignmentCount = 0;

  for (const lec of lecturersData) {
    // Generate username from name
    // e.g. "Nguyễn Văn An" -> "gv.nguyenvanan" (simplified, just remove spaces/accents roughly)
    const normalizedName = lec.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '').toLowerCase();
    const username = `gv.${normalizedName}`;

    const dbUser = await prisma.user.upsert({
      where: { username: username },
      update: {},
      create: {
        username: username,
        password: passwordHash,
        name: lec.name,
        role: 'LECTURER',
      }
    });

    // 4. Phân công giảng dạy cho giảng viên này
    for (const subName of lec.subjects) {
      const subjectId = subjectMap.get(subName)!;
      
      await prisma.teachingAssignment.upsert({
        where: {
          userId_subjectId: {
            userId: dbUser.id,
            subjectId: subjectId
          }
        },
        update: {},
        create: {
          userId: dbUser.id,
          subjectId: subjectId
        }
      });
      assignmentCount++;
    }
  }

  console.log(`✅ Đã tạo/cập nhật 20 Giảng viên.`);
  console.log(`✅ Đã phân công thành công ${assignmentCount} lượt giảng dạy.`);
  console.log('🎉 Hoàn tất import!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
