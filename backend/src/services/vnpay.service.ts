import crypto from 'crypto';
import { vnpayConfig } from '../config/vnpay.config';
import { format } from 'date-fns';

export class VNPayService {
  /**
   * Tạo URL thanh toán VNPay
   */
  static createPaymentUrl(params: {
    amount: number;
    ipAddr: string;
    orderInfo: string;
    txnRef: string; // paymentCode của mình
  }) {
    const { amount, ipAddr, orderInfo, txnRef } = params;
    
    const date = new Date();
    const createDate = format(date, 'yyyyMMddHHmmss');
    
    let vnp_Params: any = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = vnpayConfig.tmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = txnRef;
    vnp_Params['vnp_OrderInfo'] = orderInfo;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = Math.floor(amount * 100).toString(); // Đảm bảo là chuỗi số nguyên
    vnp_Params['vnp_ReturnUrl'] = vnpayConfig.returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;

    // Sắp xếp các tham số theo alphabet
    const sortedParams = this.sortObject(vnp_Params);

    const signData = Object.keys(sortedParams)
      .map((key) => {
        return `${encodeURIComponent(key)}=${encodeURIComponent(sortedParams[key]).replace(/%20/g, '+')}`;
      })
      .join('&');

    const hmac = crypto.createHmac('sha512', vnpayConfig.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    
    vnp_Params['vnp_SecureHash'] = signed;

    const queryParams = Object.keys(vnp_Params)
      .map((key) => {
        return `${encodeURIComponent(key)}=${encodeURIComponent(vnp_Params[key]).replace(/%20/g, '+')}`;
      })
      .join('&');

    return `${vnpayConfig.paymentUrl}?${queryParams}`;
  }

  /**
   * Verify chữ ký từ VNPay trả về
   */
  static verifySignature(vnp_Params: any) {
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    const sortedParams = this.sortObject(vnp_Params);
    
    const signData = Object.keys(sortedParams)
      .map((key) => {
        return `${encodeURIComponent(key)}=${encodeURIComponent(sortedParams[key]).replace(/%20/g, '+')}`;
      })
      .join('&');
    
    const hmac = crypto.createHmac('sha512', vnpayConfig.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return secureHash === signed;
  }

  private static sortObject(obj: any) {
    const sorted: any = {};
    const keys = Object.keys(obj).sort();
    keys.forEach((key) => {
      sorted[key] = obj[key];
    });
    return sorted;
  }
}
