import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { VNPayService } from '../services/vnpay.service';
import prisma from '../utils/prisma';

const normalizeIp = (value: unknown) => String(value || '').trim().replace(/^::ffff:/, '');

const getCandidateClientIps = (req: Request) => {
  const forwarded = req.headers['x-forwarded-for'];
  const forwardedRaw = Array.isArray(forwarded) ? forwarded.join(',') : String(forwarded || '');
  const forwardedIps = forwardedRaw
    .split(',')
    .map(normalizeIp)
    .filter(Boolean);

  const candidates = [
    normalizeIp(req.headers['cf-connecting-ip']),
    normalizeIp(req.headers['true-client-ip']),
    normalizeIp(req.headers['x-real-ip']),
    ...forwardedIps,
    normalizeIp(req.socket?.remoteAddress),
  ].filter(Boolean);

  return Array.from(new Set(candidates));
};

const parseClientIp = (req: Request) => getCandidateClientIps(req)[0] || '';

const getHeaderToken = (req: Request) => {
  let apiKey = req.headers['x-api-key'] || req.headers['apikeys'];
  const authHeader = req.headers['authorization'];

  if (!apiKey && authHeader) {
    const authStr = authHeader.toString().trim();
    const lower = authStr.toLowerCase();
    if (lower.startsWith('apikey ')) {
      apiKey = authStr.substring(7).trim();
    } else if (lower.startsWith('bearer ')) {
      apiKey = authStr.substring(7).trim();
    }
  }

  return String(apiKey || '').trim();
};

const isWebhookIpAllowed = (req: Request) => {
  const allowlist = (process.env.SEPAY_WEBHOOK_IP_ALLOWLIST || process.env.SEPAY_ALLOWED_IPS || '')
    .split(',')
    .map(ip => ip.trim())
    .filter(Boolean);

  const candidateIps = getCandidateClientIps(req);
  console.log('[SePay Webhook] Allowlist:', allowlist.length > 0 ? allowlist : 'Empty (Allow All)');
  console.log('[SePay Webhook] Candidate Client IPs:', candidateIps);

  if (allowlist.length === 0) return true;
  return candidateIps.some(ip => allowlist.includes(ip));
};

export const createPayment = async (req: Request, res: Response) => {
  try {
    const { tuitionId, provider } = req.body;
    const user: any = (req as any).user;

    if (!user || !user.studentId) {
      return res.status(403).json({ error: 'Chỉ sinh viên mới có thể thực hiện thanh toán.' });
    }

    const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    const payment = await PaymentService.createPayment({
      studentId: user.studentId,
      tuitionId: Number(tuitionId),
      provider: provider || 'SEPAY',
      ipAddr: (Array.isArray(ipAddr) ? ipAddr[0] : (ipAddr as string)) || '127.0.0.1',
    });

    res.json({
      ...payment,
      orderCode: payment.paymentCode,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const createVNPayPayment = async (req: Request, res: Response) => {
  try {
    const { tuitionId } = req.body;
    const user: any = (req as any).user;

    if (!user || !user.studentId) {
      return res.status(403).json({ error: 'Chỉ sinh viên mới có thể thực hiện thanh toán.' });
    }

    const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    const payment = await PaymentService.createPayment({
      studentId: user.studentId,
      tuitionId: Number(tuitionId),
      provider: 'VNPAY',
      ipAddr: (Array.isArray(ipAddr) ? ipAddr[0] : (ipAddr as string)) || '127.0.0.1',
    });

    res.json({
      ...payment,
      orderCode: payment.paymentCode,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const handleVNPayReturn = async (req: Request, res: Response) => {
  try {
    const vnp_Params = req.query;
    const isValidSignature = VNPayService.verifySignature(vnp_Params);

    if (!isValidSignature) {
      return res.redirect(`${process.env.VNPAY_RETURN_URL}?status=error&message=InvalidSignature`);
    }

    const responseCode = vnp_Params['vnp_ResponseCode'];
    const paymentCode = vnp_Params['vnp_TxnRef'] as string;

    const payment = await (prisma as any).payment.findUnique({ where: { paymentCode } });
    if (payment) {
      await (prisma as any).paymentLog.create({
        data: {
          paymentId: payment.id,
          type: 'RETURN',
          payload: vnp_Params as any,
        }
      });
    }

    if (responseCode === '00') {
      res.redirect(`${process.env.VNPAY_RETURN_URL}?status=success&paymentCode=${paymentCode}`);
    } else {
      res.redirect(`${process.env.VNPAY_RETURN_URL}?status=failed&code=${responseCode}`);
    }
  } catch (error) {
    console.error('Lỗi VNPay Return:', error);
    res.redirect(`${process.env.VNPAY_RETURN_URL}?status=error`);
  }
};

export const handleVNPayIPN = async (req: Request, res: Response) => {
  const result = await PaymentService.handleIPN(req.query);
  res.json(result);
};

export const handleSePayWebhook = async (req: Request, res: Response) => {
  console.log('[SePay Webhook] Request entered controller. Path:', req.originalUrl);
  try {
    const clientIp = parseClientIp(req);
    const candidateIps = getCandidateClientIps(req);
    console.log('[SePay Webhook] Client IP:', clientIp);
    console.log('[SePay Webhook] Candidate IPs:', candidateIps);

    if (!isWebhookIpAllowed(req)) {
      console.warn('[SePay Webhook] Blocked by IP allowlist. Candidates:', getCandidateClientIps(req));
      return res.status(403).json({ 
        error: 'IP not allowed', 
        debug: { candidates: getCandidateClientIps(req) } 
      });
    }

    const apiKey = getHeaderToken(req);
    const expectedKey = String(process.env.SEPAY_API_KEY || 'kzi207').trim();

    if (!apiKey || apiKey !== expectedKey) {
      console.warn('[SePay Webhook] Unauthorized. Received:', apiKey, 'Expected:', expectedKey);
      return res.status(403).json({ 
        error: 'Unauthorized', 
        debug: { receivedKey: apiKey ? 'Present' : 'Missing' } 
      });
    }

    const payload = req.body;
    const result = await PaymentService.handleSePayWebhook(payload);

    if (result.status === 'success') {
      res.json({ status: 'ok', message: result.message });
    } else if (result.status === 'ignored') {
      res.json({ status: 'ignored', message: result.message });
    } else {
      res.status(400).json({ status: 'error', message: result.message });
    }
  } catch (error: any) {
    console.error('Lỗi SePay Webhook Controller:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { paymentCode } = req.params;
    const status = await PaymentService.getPaymentStatus(paymentCode as string);
    if (!status) return res.status(404).json({ error: 'Không tìm thấy giao dịch' });
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const cancelPayment = async (req: Request, res: Response) => {
  try {
    const { paymentCode } = req.params;
    await PaymentService.cancelPayment(paymentCode as string);
    res.json({ message: 'Hủy giao dịch thành công' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getMyPayments = async (req: Request, res: Response) => {
  try {
    const user: any = (req as any).user;
    if (!user || !user.studentId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const payments = await (prisma as any).payment.findMany({
      where: { studentId: user.studentId },
      include: { tuition: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
