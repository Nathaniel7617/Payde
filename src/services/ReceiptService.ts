
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import { Platform } from 'react-native';

export interface Receipt {
  id: string;
  transactionId: string;
  type: 'transfer' | 'bill_payment' | 'card_transaction' | 'airtime' | 'data_purchase';
  timestamp: string;
  amount: number;
  currency: string;
  recipient: ReceiptRecipient;
  sender: ReceiptSender;
  status: 'successful' | 'failed' | 'pending';
  reference: string;
  fees: FeeBreakdown;
  balance: {
    before: number;
    after: number;
  };
  additionalInfo?: Record<string, any>;
}

export interface ReceiptRecipient {
  name: string;
  account?: string;
  phone?: string;
  email?: string;
  bank?: string;
}

export interface ReceiptSender {
  id: string;
  name: string;
  account: string;
  phone: string;
  email: string;
}

export interface FeeBreakdown {
  transactionFee: number;
  exchangeFee?: number;
  processingFee?: number;
  total: number;
}

export interface ReceiptColors {
  primary: string;
  secondary: string;
  text: string;
  background: string;
  accent: string;
}

export interface ReceiptConfig {
  template: 'standard' | 'detailed' | 'summary';
  format: 'pdf' | 'image' | 'html';
  delivery: ('email' | 'sms' | 'push' | 'download' | 'share')[];
  branding: {
    logo: string;
    colors: ReceiptColors;
    footer: string;
    companyInfo: {
      name: string;
      address: string;
      phone: string;
      email: string;
      website: string;
    };
  };
}

class ReceiptService {
  private config: ReceiptConfig;

  constructor(config: ReceiptConfig) {
    this.config = config;
  }

  /**
   * Generate a complete receipt for a transaction
   */
  async generateReceipt(transaction: any): Promise<Receipt> {
    try {
      const receipt: Receipt = {
        id: this.generateReceiptId(),
        transactionId: transaction.id,
        type: transaction.type,
        timestamp: transaction.completedAt || transaction.createdAt,
        amount: transaction.amount,
        currency: transaction.currency,
        recipient: await this.getRecipientInfo(transaction),
        sender: await this.getSenderInfo(transaction),
        status: transaction.status,
        reference: transaction.reference,
        fees: transaction.fees || { transactionFee: 0, total: 0 },
        balance: transaction.balanceSnapshot || { before: 0, after: 0 },
        additionalInfo: transaction.additionalInfo
      };

      // Generate receipt document
      const receiptDocument = await this.generateReceiptDocument(receipt);
      
      // Deliver receipt via configured methods
      await this.deliverReceipt(receipt, receiptDocument);
      
      // Store receipt in local history
      await this.storeReceiptLocally(receipt);
      
      return receipt;
    } catch (error) {
      console.error('Error generating receipt:', error);
      throw new Error('Failed to generate receipt');
    }
  }

  /**
   * Generate HTML template for receipt
   */
  private generateHTMLReceipt(receipt: Receipt): string {
    const { branding } = this.config;
    const statusColor = receipt.status === 'successful' ? '#10B981' : 
                       receipt.status === 'failed' ? '#EF4444' : '#F59E0B';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Transaction Receipt - ${receipt.reference}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: ${branding.colors.text};
            background-color: ${branding.colors.background};
            margin: 0;
            padding: 20px;
          }
          .receipt-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: ${branding.colors.primary};
            color: white;
            padding: 30px;
            text-align: center;
          }
          .logo {
            width: 120px;
            height: auto;
            margin-bottom: 20px;
          }
          .company-name {
            font-size: 28px;
            font-weight: bold;
            margin: 0;
          }
          .receipt-title {
            font-size: 18px;
            margin: 10px 0 0 0;
            opacity: 0.9;
          }
          .content {
            padding: 30px;
          }
          .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 12px;
            background-color: ${statusColor};
            color: white;
            margin-bottom: 20px;
          }
          .transaction-info {
            background: ${branding.colors.background};
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #E5E7EB;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            font-weight: 600;
            color: ${branding.colors.text};
          }
          .info-value {
            font-weight: 500;
            color: ${branding.colors.secondary};
          }
          .amount {
            font-size: 24px;
            font-weight: bold;
            color: ${branding.colors.primary};
          }
          .fees-section {
            margin: 20px 0;
          }
          .fees-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: ${branding.colors.text};
          }
          .fee-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
          }
          .footer {
            background: ${branding.colors.background};
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #E5E7EB;
          }
          .footer-text {
            color: ${branding.colors.secondary};
            font-size: 14px;
            margin: 5px 0;
          }
          .qr-code {
            width: 80px;
            height: 80px;
            margin: 20px auto;
            display: block;
          }
          @media print {
            body { margin: 0; padding: 0; }
            .receipt-container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <img src="${branding.logo}" alt="Payde Logo" class="logo">
            <h1 class="company-name">${branding.companyInfo.name}</h1>
            <p class="receipt-title">Transaction Receipt</p>
          </div>
          
          <div class="content">
            <div class="status-badge">${receipt.status}</div>
            
            <div class="transaction-info">
              <div class="info-row">
                <span class="info-label">Amount</span>
                <span class="info-value amount">${receipt.currency} ${this.formatCurrency(receipt.amount)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Reference</span>
                <span class="info-value">${receipt.reference}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Transaction Type</span>
                <span class="info-value">${this.formatTransactionType(receipt.type)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date & Time</span>
                <span class="info-value">${this.formatDateTime(receipt.timestamp)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">From</span>
                <span class="info-value">${receipt.sender.name} (${receipt.sender.account})</span>
              </div>
              <div class="info-row">
                <span class="info-label">To</span>
                <span class="info-value">${receipt.recipient.name} ${receipt.recipient.account ? '(' + receipt.recipient.account + ')' : ''}</span>
              </div>
              ${receipt.recipient.bank ? `
              <div class="info-row">
                <span class="info-label">Bank</span>
                <span class="info-value">${receipt.recipient.bank}</span>
              </div>
              ` : ''}
            </div>

            ${this.generateFeesSection(receipt.fees)}
            
            <div class="transaction-info">
              <div class="info-row">
                <span class="info-label">Balance Before</span>
                <span class="info-value">${receipt.currency} ${this.formatCurrency(receipt.balance.before)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Balance After</span>
                <span class="info-value">${receipt.currency} ${this.formatCurrency(receipt.balance.after)}</span>
              </div>
            </div>

            ${this.generateAdditionalInfo(receipt.additionalInfo)}
          </div>
          
          <div class="footer">
            <p class="footer-text">${branding.companyInfo.name}</p>
            <p class="footer-text">${branding.companyInfo.address}</p>
            <p class="footer-text">Phone: ${branding.companyInfo.phone} | Email: ${branding.companyInfo.email}</p>
            <p class="footer-text">${branding.footer}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate PDF from HTML receipt
   */
  private async generatePDF(receipt: Receipt): Promise<string> {
    try {
      const htmlContent = this.generateHTMLReceipt(receipt);
      
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      // Create a more permanent location for the file
      const fileName = `receipt_${receipt.reference}_${Date.now()}.pdf`;
      const permanentUri = `${FileSystem.documentDirectory}receipts/${fileName}`;
      
      // Ensure receipts directory exists
      await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}receipts/`, { intermediates: true });
      
      // Move the file to permanent location
      await FileSystem.moveAsync({
        from: uri,
        to: permanentUri,
      });

      return permanentUri;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF receipt');
    }
  }

  /**
   * Generate receipt document based on config format
   */
  private async generateReceiptDocument(receipt: Receipt): Promise<string> {
    switch (this.config.format) {
      case 'pdf':
        return await this.generatePDF(receipt);
      case 'html':
        const htmlContent = this.generateHTMLReceipt(receipt);
        const htmlPath = `${FileSystem.documentDirectory}receipt_${receipt.reference}.html`;
        await FileSystem.writeAsStringAsync(htmlPath, htmlContent);
        return htmlPath;
      default:
        return await this.generatePDF(receipt);
    }
  }

  /**
   * Deliver receipt via configured methods
   */
  private async deliverReceipt(receipt: Receipt, documentPath: string): Promise<void> {
    const deliveryPromises = this.config.delivery.map(async (method) => {
      try {
        switch (method) {
          case 'email':
            await this.sendReceiptEmail(receipt, documentPath);
            break;
          case 'share':
            await this.shareReceipt(documentPath);
            break;
          case 'download':
            // File is already saved to permanent location
            break;
          case 'push':
            await this.sendReceiptNotification(receipt);
            break;
        }
      } catch (error) {
        console.error(`Error delivering receipt via ${method}:`, error);
      }
    });

    await Promise.allSettled(deliveryPromises);
  }

  /**
   * Send receipt via email
   */
  private async sendReceiptEmail(receipt: Receipt, attachmentPath: string): Promise<void> {
    try {
      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Mail composer not available');
      }

      await MailComposer.composeAsync({
        recipients: [receipt.sender.email],
        subject: `Transaction Receipt - ${receipt.reference}`,
        body: `
          Dear ${receipt.sender.name},
          
          Please find attached your transaction receipt for the ${this.formatTransactionType(receipt.type)} of ${receipt.currency} ${this.formatCurrency(receipt.amount)}.
          
          Transaction Details:
          - Reference: ${receipt.reference}
          - Date: ${this.formatDateTime(receipt.timestamp)}
          - Status: ${receipt.status}
          
          Thank you for using Payde.
          
          Best regards,
          Payde Team
        `,
        attachments: [attachmentPath],
      });
    } catch (error) {
      console.error('Error sending receipt email:', error);
      throw error;
    }
  }

  /**
   * Share receipt using native sharing
   */
  private async shareReceipt(documentPath: string): Promise<void> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Sharing not available');
      }

      await Sharing.shareAsync(documentPath, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Receipt',
      });
    } catch (error) {
      console.error('Error sharing receipt:', error);
      throw error;
    }
  }

  /**
   * Send push notification about receipt
   */
  private async sendReceiptNotification(receipt: Receipt): Promise<void> {
    // This would integrate with your push notification service
    // For now, just log the action
    console.log(`Receipt notification sent for transaction ${receipt.reference}`);
  }

  /**
   * Store receipt locally for history
   */
  private async storeReceiptLocally(receipt: Receipt): Promise<void> {
    try {
      const receiptsPath = `${FileSystem.documentDirectory}receipts_data.json`;
      let receipts: Receipt[] = [];

      // Load existing receipts
      try {
        const existingData = await FileSystem.readAsStringAsync(receiptsPath);
        receipts = JSON.parse(existingData);
      } catch {
        // File doesn't exist or is invalid, start with empty array
      }

      // Add new receipt
      receipts.unshift(receipt);

      // Keep only last 100 receipts
      receipts = receipts.slice(0, 100);

      // Save updated receipts
      await FileSystem.writeAsStringAsync(receiptsPath, JSON.stringify(receipts, null, 2));
    } catch (error) {
      console.error('Error storing receipt locally:', error);
    }
  }

  /**
   * Get stored receipts
   */
  async getStoredReceipts(): Promise<Receipt[]> {
    try {
      const receiptsPath = `${FileSystem.documentDirectory}receipts_data.json`;
      const data = await FileSystem.readAsStringAsync(receiptsPath);
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  /**
   * Helper methods
   */
  private generateReceiptId(): string {
    return `RCP${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }

  private async getRecipientInfo(transaction: any): Promise<ReceiptRecipient> {
    return {
      name: transaction.recipientName || 'N/A',
      account: transaction.recipientAccount,
      phone: transaction.recipientPhone,
      email: transaction.recipientEmail,
      bank: transaction.recipientBank,
    };
  }

  private async getSenderInfo(transaction: any): Promise<ReceiptSender> {
    return {
      id: transaction.senderId,
      name: transaction.senderName,
      account: transaction.senderAccount,
      phone: transaction.senderPhone,
      email: transaction.senderEmail,
    };
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  private formatDateTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  private formatTransactionType(type: string): string {
    const typeMap: Record<string, string> = {
      transfer: 'Money Transfer',
      bill_payment: 'Bill Payment',
      card_transaction: 'Card Transaction',
      airtime: 'Airtime Purchase',
      data_purchase: 'Data Purchase',
    };
    return typeMap[type] || type.replace('_', ' ').toUpperCase();
  }

  private generateFeesSection(fees: FeeBreakdown): string {
    if (!fees || fees.total === 0) return '';

    let feesHtml = '<div class="fees-section"><div class="fees-title">Fee Breakdown</div>';
    
    if (fees.transactionFee > 0) {
      feesHtml += `<div class="fee-item"><span>Transaction Fee</span><span>${this.formatCurrency(fees.transactionFee)}</span></div>`;
    }
    if (fees.exchangeFee && fees.exchangeFee > 0) {
      feesHtml += `<div class="fee-item"><span>Exchange Fee</span><span>${this.formatCurrency(fees.exchangeFee)}</span></div>`;
    }
    if (fees.processingFee && fees.processingFee > 0) {
      feesHtml += `<div class="fee-item"><span>Processing Fee</span><span>${this.formatCurrency(fees.processingFee)}</span></div>`;
    }
    
    feesHtml += `<div class="fee-item" style="border-top: 2px solid #E5E7EB; padding-top: 10px; margin-top: 10px; font-weight: bold;"><span>Total Fees</span><span>${this.formatCurrency(fees.total)}</span></div>`;
    feesHtml += '</div>';
    
    return feesHtml;
  }

  private generateAdditionalInfo(additionalInfo?: Record<string, any>): string {
    if (!additionalInfo || Object.keys(additionalInfo).length === 0) return '';

    let infoHtml = '<div class="transaction-info"><div class="fees-title">Additional Information</div>';
    
    Object.entries(additionalInfo).forEach(([key, value]) => {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      infoHtml += `<div class="info-row"><span class="info-label">${label}</span><span class="info-value">${value}</span></div>`;
    });
    
    infoHtml += '</div>';
    return infoHtml;
  }
}

export default ReceiptService;