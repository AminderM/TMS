import React, { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Shield, Upload, FileText, Eye, X, AlertTriangle } from 'lucide-react';

const paymentMethods = [
  { value: 'eft', label: 'EFT (Electronic Funds Transfer)' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'wire', label: 'Wire Transfer' },
  { value: 'factoring', label: 'Factoring Company' },
];

const accountTypes = [
  { value: 'chequing', label: 'Chequing' },
  { value: 'savings', label: 'Savings' },
];

const currencies = [
  { value: 'CAD', label: 'CAD (Canadian Dollar)' },
  { value: 'USD', label: 'USD (US Dollar)' },
  { value: 'Both', label: 'Both CAD & USD' },
];

const paymentTerms = [
  { value: 'quick_pay', label: 'Quick Pay (1-3 days)' },
  { value: 'net_15', label: 'Net 15' },
  { value: 'net_30', label: 'Net 30' },
  { value: 'net_45', label: 'Net 45' },
];

const PaymentSetupStep = ({ data, country, onChange }) => {
  const noaInputRef = useRef(null);
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  const handleInputChange = (field, value) => {
    onChange({ [field]: value });
  };

  const handleNoaUpload = (file) => {
    if (!file) return;

    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF, PNG, or JPG file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      onChange({
        noaDocument: {
          file: file,
          fileData: e.target.result,
          fileName: file.name,
        },
      });
    };
    reader.readAsDataURL(file);
  };

  const removeNoaDocument = () => {
    onChange({ noaDocument: null });
  };

  const maskAccountNumber = (number) => {
    if (!number || showAccountNumber) return number;
    if (number.length <= 4) return '****';
    return '****' + number.slice(-4);
  };

  const showCanadian = country === 'Canada' || country === 'Both' || !country;
  const showUS = country === 'USA' || country === 'Both' || !country;

  return (
    <div className="space-y-8" data-testid="payment-setup-step">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <CreditCard className="w-7 h-7 text-[#00D4FF]" />
          Payment Setup
        </h2>
        <p className="text-[#8B9DB5] mt-2">
          Configure your payment preferences and banking information
        </p>
      </div>

      {/* Security Notice */}
      <div className="flex items-start gap-3 p-4 bg-[#00D4FF]/5 border border-[#00D4FF]/20 rounded-lg">
        <Shield className="w-5 h-5 text-[#00D4FF] flex-shrink-0 mt-0.5" />
        <p className="text-[#8B9DB5] text-sm">
          <span className="text-[#00D4FF] font-medium">Your data is secure.</span>{' '}
          Banking details are encrypted and never shared with brokers or shippers.
        </p>
      </div>

      {/* Payment Method */}
      <div className="bg-[#0D1B2A] rounded-xl p-6 border border-[#1B3A5A]">
        <h3 className="text-lg font-semibold text-white mb-6">Payment Method</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-white font-medium">
              Preferred Payment Method <span className="text-red-400">*</span>
            </Label>
            <Select 
              value={data.paymentMethod} 
              onValueChange={(value) => handleInputChange('paymentMethod', value)}
            >
              <SelectTrigger 
                className="mt-2 bg-[#0A1628] border-[#1B3A5A] text-white focus:border-[#00D4FF]"
                data-testid="payment-method-select"
              >
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent className="bg-[#0D1B2A] border-[#1B3A5A]">
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value} className="text-white hover:bg-[#1B3A5A]">
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white font-medium">Payment Terms</Label>
            <Select 
              value={data.paymentTerms} 
              onValueChange={(value) => handleInputChange('paymentTerms', value)}
            >
              <SelectTrigger 
                className="mt-2 bg-[#0A1628] border-[#1B3A5A] text-white focus:border-[#00D4FF]"
                data-testid="payment-terms-select"
              >
                <SelectValue placeholder="Select payment terms" />
              </SelectTrigger>
              <SelectContent className="bg-[#0D1B2A] border-[#1B3A5A]">
                {paymentTerms.map((term) => (
                  <SelectItem key={term.value} value={term.value} className="text-white hover:bg-[#1B3A5A]">
                    {term.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Factoring Company Details */}
        {data.paymentMethod === 'factoring' && (
          <div className="mt-6 pt-6 border-t border-[#1B3A5A]">
            <h4 className="text-white font-medium mb-4">Factoring Company Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="factoringCompanyName" className="text-white font-medium">
                  Factoring Company Name
                </Label>
                <Input
                  id="factoringCompanyName"
                  value={data.factoringCompanyName}
                  onChange={(e) => handleInputChange('factoringCompanyName', e.target.value)}
                  placeholder="Enter factoring company name"
                  className="mt-2 bg-[#0A1628] border-[#1B3A5A] text-white placeholder:text-[#5A6B7D] focus:border-[#00D4FF]"
                  data-testid="factoring-company-input"
                />
              </div>

              <div>
                <Label className="text-white font-medium">NOA Document</Label>
                {data.noaDocument ? (
                  <div className="mt-2 flex items-center gap-3 p-3 bg-[#0A1628] rounded-lg border border-[#1B3A5A]">
                    <FileText className="w-5 h-5 text-[#00D4FF]" />
                    <span className="text-white text-sm truncate flex-1">
                      {data.noaDocument.fileName}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeNoaDocument}
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => noaInputRef.current?.click()}
                    className="mt-2 w-full border-[#1B3A5A] text-[#8B9DB5] hover:bg-[#1B3A5A] hover:text-white"
                    data-testid="upload-noa-button"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload NOA Document
                  </Button>
                )}
                <input
                  ref={noaInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => handleNoaUpload(e.target.files[0])}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Banking Information */}
      <div className="bg-[#0D1B2A] rounded-xl p-6 border border-[#1B3A5A]">
        <h3 className="text-lg font-semibold text-white mb-6">Banking Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bank Name */}
          <div className="md:col-span-2">
            <Label htmlFor="bankName" className="text-white font-medium">
              Bank Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="bankName"
              value={data.bankName}
              onChange={(e) => handleInputChange('bankName', e.target.value)}
              placeholder="Enter bank name"
              className="mt-2 bg-[#0A1628] border-[#1B3A5A] text-white placeholder:text-[#5A6B7D] focus:border-[#00D4FF]"
              data-testid="bank-name-input"
            />
          </div>

          {/* Transit Number (Canada) */}
          {showCanadian && (
            <div>
              <Label htmlFor="transitNumber" className="text-white font-medium">
                Transit Number <span className="text-[#5A6B7D] text-sm">(Canada)</span>
              </Label>
              <Input
                id="transitNumber"
                value={data.transitNumber}
                onChange={(e) => handleInputChange('transitNumber', e.target.value)}
                placeholder="5-digit transit number"
                maxLength={5}
                className="mt-2 bg-[#0A1628] border-[#1B3A5A] text-white placeholder:text-[#5A6B7D] focus:border-[#00D4FF]"
                data-testid="transit-number-input"
              />
            </div>
          )}

          {/* Institution Number (Canada) */}
          {showCanadian && (
            <div>
              <Label htmlFor="institutionNumber" className="text-white font-medium">
                Institution Number <span className="text-[#5A6B7D] text-sm">(Canada)</span>
              </Label>
              <Input
                id="institutionNumber"
                value={data.institutionNumber}
                onChange={(e) => handleInputChange('institutionNumber', e.target.value)}
                placeholder="3-digit institution number"
                maxLength={3}
                className="mt-2 bg-[#0A1628] border-[#1B3A5A] text-white placeholder:text-[#5A6B7D] focus:border-[#00D4FF]"
                data-testid="institution-number-input"
              />
            </div>
          )}

          {/* ABA Routing Number (US) */}
          {showUS && (
            <div>
              <Label htmlFor="abaRoutingNumber" className="text-white font-medium">
                ABA Routing Number <span className="text-[#5A6B7D] text-sm">(US)</span>
              </Label>
              <Input
                id="abaRoutingNumber"
                value={data.abaRoutingNumber}
                onChange={(e) => handleInputChange('abaRoutingNumber', e.target.value)}
                placeholder="9-digit routing number"
                maxLength={9}
                className="mt-2 bg-[#0A1628] border-[#1B3A5A] text-white placeholder:text-[#5A6B7D] focus:border-[#00D4FF]"
                data-testid="aba-routing-input"
              />
            </div>
          )}

          {/* Account Number */}
          <div>
            <Label htmlFor="accountNumber" className="text-white font-medium">
              Account Number <span className="text-red-400">*</span>
            </Label>
            <div className="relative mt-2">
              <Input
                id="accountNumber"
                type={showAccountNumber ? 'text' : 'password'}
                value={data.accountNumber}
                onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                placeholder="Enter account number"
                className="bg-[#0A1628] border-[#1B3A5A] text-white placeholder:text-[#5A6B7D] focus:border-[#00D4FF] pr-10"
                data-testid="account-number-input"
              />
              <button
                type="button"
                onClick={() => setShowAccountNumber(!showAccountNumber)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6B7D] hover:text-[#8B9DB5]"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Account Type */}
          <div>
            <Label className="text-white font-medium">Account Type</Label>
            <Select 
              value={data.accountType} 
              onValueChange={(value) => handleInputChange('accountType', value)}
            >
              <SelectTrigger 
                className="mt-2 bg-[#0A1628] border-[#1B3A5A] text-white focus:border-[#00D4FF]"
                data-testid="account-type-select"
              >
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent className="bg-[#0D1B2A] border-[#1B3A5A]">
                {accountTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-white hover:bg-[#1B3A5A]">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Currency */}
          <div>
            <Label className="text-white font-medium">Currency</Label>
            <Select 
              value={data.currency} 
              onValueChange={(value) => handleInputChange('currency', value)}
            >
              <SelectTrigger 
                className="mt-2 bg-[#0A1628] border-[#1B3A5A] text-white focus:border-[#00D4FF]"
                data-testid="currency-select"
              >
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent className="bg-[#0D1B2A] border-[#1B3A5A]">
                {currencies.map((curr) => (
                  <SelectItem key={curr.value} value={curr.value} className="text-white hover:bg-[#1B3A5A]">
                    {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Warning for incomplete info */}
      {(!data.bankName || !data.accountNumber || !data.paymentMethod) && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-amber-400 text-sm">
            Please complete all required fields to enable payment processing.
          </p>
        </div>
      )}
    </div>
  );
};

export default PaymentSetupStep;
