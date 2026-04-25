import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Bắt đầu cập nhật công nợ...');
  
  // Lấy tất cả học phí
  const tuitions = await (prisma as any).tuition.findMany();
  
  for (const t of tuitions) {
    const remaining = t.totalAmount - t.paidAmount;
    let status = t.status;
    
    if (remaining <= 0) {
      status = 'PAID';
    } else if (t.paidAmount > 0) {
      status = 'PARTIAL_PAID';
    } else {
      status = 'UNPAID';
    }

    await (prisma as any).tuition.update({
      where: { id: t.id },
      data: {
        remainingAmount: remaining,
        status: status
      }
    });
  }
  
  console.log(`Đã cập nhật ${tuitions.length} bản ghi học phí.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
