import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  X, FileText, Check, AlertTriangle, ChevronRight, 
  ChevronLeft, Send, Mail, Download, Loader2
} from 'lucide-react';
import { format, isPast } from 'date-fns';
import { generateCarrierPackagePDF } from './pdfGenerator';

const canadianDocuments = [
  { id: 'nsc_certificate', name: 'NSC Certificate' },
  { id: 'cvor_abstract', name: 'CVOR Abstract' },
  { id: 'cargo_insurance_ca', name: 'Cargo Insurance Certificate (CA)' },
  { id: 'auto_liability_ca', name: 'Auto Liability Certificate (CA)' },
  { id: 'wsib_clearance', name: 'WSIB Clearance Certificate' },
  { id: 'gst_hst_registration', name: 'GST/HST Registration' },
  { id: 'void_cheque', name: 'Void Cheque or Bank Letter' },
];

const usDocuments = [
  { id: 'usdot_mc_authority', name: 'USDOT / MC Authority Letter' },
  { id: 'boc3_filing', name: 'BOC-3 Filing Confirmation' },
  { id: 'ucr_receipt', name: 'UCR Receipt' },
  { id: 'ifta_licence', name: 'IFTA Licence' },
  { id: 'cargo_insurance_us', name: 'Cargo Insurance Certificate (US)' },
  { id: 'auto_liability_us', name: 'Auto Liability Certificate (US)' },
  { id: 'w9_w8ben', name: 'W-9 or W-8BEN' },
];

const SendPackageModal = ({ profileData, onSend, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDocs, setSelectedDocs] = useState({});
  const [recipientInfo, setRecipientInfo] = useState({
    name: '',
    company: '',
    email: '',
    message: '',
  });
  const [isSending, setIsSending] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);

  const { companyInfo, documents } = profileData;

  const getDocumentList = () => {
    if (companyInfo.country === 'Canada') return canadianDocuments;
    if (companyInfo.country === 'USA') return usDocuments;
    return [...canadianDocuments, ...usDocuments];
  };

  const isDocExpired = (docId) => {
    const doc = documents[docId];
    if (!doc?.expiryDate) return false;
    return isPast(new Date(doc.expiryDate));
  };

  const isDocUploaded = (docId) => {
    return !!documents[docId]?.fileData;
  };

  const handleToggleDoc = (docId) => {
    if (isDocExpired(docId)) return;
    setSelectedDocs(prev => ({
      ...prev,
      [docId]: !prev[docId],
    }));
  };

  const handleSelectAll = () => {
    const allDocs = {};
    getDocumentList().forEach(doc => {
      if (isDocUploaded(doc.id) && !isDocExpired(doc.id)) {
        allDocs[doc.id] = true;
      }
    });
    setSelectedDocs(allDocs);
  };

  const handleDeselectAll = () => {
    setSelectedDocs({});
  };

  const selectedCount = Object.values(selectedDocs).filter(Boolean).length;

  const handleSend = async () => {
    setIsSending(true);
    
    try {
      // Generate PDF
      const selectedDocsList = getDocumentList()
        .filter(doc => selectedDocs[doc.id])
        .map(doc => ({
          ...doc,
          ...documents[doc.id],
        }));

      await generateCarrierPackagePDF({
        companyInfo,
        documents: selectedDocsList,
        recipient: recipientInfo,
      });

      setPdfGenerated(true);

      // Prepare email
      const subject = encodeURIComponent(`Carrier Document Package - ${companyInfo.legalName}`);
      const body = encodeURIComponent(
        `Hi ${recipientInfo.name},\n\n` +
        `Please find attached the carrier document package for ${companyInfo.legalName}.\n\n` +
        (recipientInfo.message ? `${recipientInfo.message}\n\n` : '') +
        `Documents included:\n` +
        selectedDocsList.map(doc => `- ${doc.name}`).join('\n') +
        `\n\nBest regards,\n${companyInfo.legalName}`
      );

      // Open email client
      window.location.href = `mailto:${recipientInfo.email}?subject=${subject}&body=${body}`;

      // Record the sent package
      setTimeout(() => {
        onSend({
          recipientName: recipientInfo.name,
          recipientCompany: recipientInfo.company,
          recipientEmail: recipientInfo.email,
          message: recipientInfo.message,
          documentsIncluded: selectedDocsList.map(d => d.name),
        });
      }, 1000);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Select Documents</h3>
        <p className="text-[#8B9DB5] text-sm">
          Choose which documents to include in your package
        </p>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-[#8B9DB5] text-sm">{selectedCount} documents selected</span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            className="text-[#00D4FF] hover:bg-[#00D4FF]/10"
          >
            Select All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeselectAll}
            className="text-[#8B9DB5] hover:bg-[#1B3A5A]"
          >
            Deselect All
          </Button>
        </div>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {getDocumentList().map((doc) => {
          const isUploaded = isDocUploaded(doc.id);
          const isExpired = isDocExpired(doc.id);
          const isSelected = selectedDocs[doc.id];

          return (
            <div
              key={doc.id}
              onClick={() => isUploaded && handleToggleDoc(doc.id)}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                !isUploaded
                  ? 'border-[#1B3A5A] bg-[#0A1628]/50 opacity-50 cursor-not-allowed'
                  : isExpired
                  ? 'border-red-500/30 bg-red-500/5 cursor-not-allowed'
                  : isSelected
                  ? 'border-[#00D4FF] bg-[#00D4FF]/10 cursor-pointer'
                  : 'border-[#1B3A5A] bg-[#0A1628] cursor-pointer hover:border-[#2A4A6A]'
              }`}
              data-testid={`select-doc-${doc.id}`}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                isSelected
                  ? 'border-[#00D4FF] bg-[#00D4FF]'
                  : 'border-[#5A6B7D]'
              }`}>
                {isSelected && <Check className="w-3 h-3 text-[#0A1628]" />}
              </div>
              <FileText className={`w-5 h-5 ${
                isExpired ? 'text-red-400' : isSelected ? 'text-[#00D4FF]' : 'text-[#5A6B7D]'
              }`} />
              <span className={`flex-1 ${
                isExpired ? 'text-red-400' : 'text-white'
              }`}>
                {doc.name}
              </span>
              {!isUploaded && (
                <Badge className="bg-[#1B3A5A] text-[#5A6B7D] text-xs">
                  Not Uploaded
                </Badge>
              )}
              {isExpired && (
                <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" /> Expired
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Recipient Information</h3>
        <p className="text-[#8B9DB5] text-sm">
          Enter the recipient&apos;s details
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="recipientName" className="text-white font-medium">
            Recipient Name <span className="text-red-400">*</span>
          </Label>
          <Input
            id="recipientName"
            value={recipientInfo.name}
            onChange={(e) => setRecipientInfo(prev => ({ ...prev, name: e.target.value }))}
            placeholder="John Smith"
            className="mt-2 bg-[#0A1628] border-[#1B3A5A] text-white placeholder:text-[#5A6B7D] focus:border-[#00D4FF]"
            data-testid="recipient-name-input"
          />
        </div>

        <div>
          <Label htmlFor="recipientCompany" className="text-white font-medium">
            Company <span className="text-red-400">*</span>
          </Label>
          <Input
            id="recipientCompany"
            value={recipientInfo.company}
            onChange={(e) => setRecipientInfo(prev => ({ ...prev, company: e.target.value }))}
            placeholder="ABC Logistics"
            className="mt-2 bg-[#0A1628] border-[#1B3A5A] text-white placeholder:text-[#5A6B7D] focus:border-[#00D4FF]"
            data-testid="recipient-company-input"
          />
        </div>

        <div>
          <Label htmlFor="recipientEmail" className="text-white font-medium">
            Email <span className="text-red-400">*</span>
          </Label>
          <Input
            id="recipientEmail"
            type="email"
            value={recipientInfo.email}
            onChange={(e) => setRecipientInfo(prev => ({ ...prev, email: e.target.value }))}
            placeholder="john@abclogistics.com"
            className="mt-2 bg-[#0A1628] border-[#1B3A5A] text-white placeholder:text-[#5A6B7D] focus:border-[#00D4FF]"
            data-testid="recipient-email-input"
          />
        </div>

        <div>
          <Label htmlFor="recipientMessage" className="text-white font-medium">
            Message <span className="text-[#5A6B7D] text-sm">(optional, max 200 chars)</span>
          </Label>
          <Textarea
            id="recipientMessage"
            value={recipientInfo.message}
            onChange={(e) => setRecipientInfo(prev => ({ 
              ...prev, 
              message: e.target.value.slice(0, 200) 
            }))}
            placeholder="Add a personal message..."
            maxLength={200}
            className="mt-2 bg-[#0A1628] border-[#1B3A5A] text-white placeholder:text-[#5A6B7D] focus:border-[#00D4FF] resize-none h-24"
            data-testid="recipient-message-input"
          />
          <div className="text-right text-[#5A6B7D] text-xs mt-1">
            {recipientInfo.message.length}/200
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Review & Send</h3>
        <p className="text-[#8B9DB5] text-sm">
          Review your package before sending
        </p>
      </div>

      {/* Summary */}
      <div className="bg-[#0A1628] rounded-lg p-4 border border-[#1B3A5A]">
        <h4 className="text-white font-medium mb-4">Package Summary</h4>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[#8B9DB5]">From:</span>
            <span className="text-white">{companyInfo.legalName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8B9DB5]">To:</span>
            <span className="text-white">{recipientInfo.name} ({recipientInfo.company})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8B9DB5]">Email:</span>
            <span className="text-white">{recipientInfo.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8B9DB5]">Documents:</span>
            <span className="text-[#00D4FF]">{selectedCount} files</span>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-[#0A1628] rounded-lg p-4 border border-[#1B3A5A]">
        <h4 className="text-white font-medium mb-3">Included Documents</h4>
        <div className="space-y-2">
          {getDocumentList()
            .filter(doc => selectedDocs[doc.id])
            .map(doc => (
              <div key={doc.id} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-[#00D4FF]" />
                <span className="text-[#8B9DB5]">{doc.name}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Message Preview */}
      {recipientInfo.message && (
        <div className="bg-[#0A1628] rounded-lg p-4 border border-[#1B3A5A]">
          <h4 className="text-white font-medium mb-2">Personal Message</h4>
          <p className="text-[#8B9DB5] text-sm italic">&ldquo;{recipientInfo.message}&rdquo;</p>
        </div>
      )}

      {/* Info Note */}
      <div className="flex items-start gap-3 p-4 bg-[#00D4FF]/5 border border-[#00D4FF]/20 rounded-lg">
        <Mail className="w-5 h-5 text-[#00D4FF] flex-shrink-0 mt-0.5" />
        <p className="text-[#8B9DB5] text-sm">
          Clicking &ldquo;Send Package&rdquo; will generate a PDF and open your email client with
          the recipient&apos;s email pre-filled. Attach the downloaded PDF to complete sending.
        </p>
      </div>
    </div>
  );

  const canProceed = () => {
    if (currentStep === 1) return selectedCount > 0;
    if (currentStep === 2) {
      return recipientInfo.name && recipientInfo.company && recipientInfo.email;
    }
    return true;
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0D1B2A] rounded-xl max-w-lg w-full border border-[#1B3A5A] overflow-hidden" data-testid="send-package-modal">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1B3A5A]">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-[#00D4FF]" />
            <h2 className="text-lg font-semibold text-white">Send Document Package</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-[#8B9DB5] hover:text-white hover:bg-[#1B3A5A]"
            data-testid="close-modal-button"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Step Indicator */}
        <div className="px-4 py-3 border-b border-[#1B3A5A]">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === currentStep
                    ? 'bg-[#00D4FF] text-[#0A1628]'
                    : step < currentStep
                    ? 'bg-[#00D4FF]/20 text-[#00D4FF]'
                    : 'bg-[#1B3A5A] text-[#5A6B7D]'
                }`}>
                  {step < currentStep ? <Check className="w-4 h-4" /> : step}
                </div>
                {step < 3 && (
                  <div className={`flex-1 h-0.5 ${
                    step < currentStep ? 'bg-[#00D4FF]' : 'bg-[#1B3A5A]'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-[#8B9DB5]">
            <span>Select Docs</span>
            <span>Recipient</span>
            <span>Send</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        {/* Footer */}
        <div className="flex justify-between p-4 border-t border-[#1B3A5A]">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={currentStep === 1}
            className="border-[#1B3A5A] text-[#8B9DB5] hover:bg-[#1B3A5A] hover:text-white disabled:opacity-50"
            data-testid="modal-previous-button"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep < 3 ? (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!canProceed()}
              className="bg-[#00D4FF] text-[#0A1628] hover:bg-[#00B8E0] disabled:opacity-50"
              data-testid="modal-next-button"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={isSending}
              className="bg-[#00D4FF] text-[#0A1628] hover:bg-[#00B8E0] disabled:opacity-50"
              data-testid="modal-send-button"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate & Send
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SendPackageModal;
