import React, { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Image, Building2, X } from 'lucide-react';

const canadianProvinces = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 
  'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia',
  'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon'
];

const usStates = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming'
];

const CompanyInfoStep = ({ data, onChange }) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleInputChange = (field, value) => {
    onChange({ [field]: value });
  };

  const handleLogoUpload = (file) => {
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PNG, JPG, or SVG file');
      return;
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      onChange({
        logo: file,
        logoPreview: e.target.result,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoUpload(e.dataTransfer.files[0]);
    }
  };

  const removeLogo = () => {
    onChange({ logo: null, logoPreview: null });
  };

  const getInitials = () => {
    if (!data.legalName) return 'CP';
    const words = data.legalName.split(' ').filter(w => w.length > 0);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return words[0]?.substring(0, 2).toUpperCase() || 'CP';
  };

  const getProvinceOptions = () => {
    if (data.country === 'Canada') return canadianProvinces;
    if (data.country === 'USA') return usStates;
    if (data.country === 'Both') return [...canadianProvinces, ...usStates].sort();
    return [];
  };

  return (
    <div className="space-y-8" data-testid="company-info-step">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Building2 className="w-7 h-7 text-[#00D4FF]" />
          Company Information
        </h2>
        <p className="text-[#8B9DB5] mt-2">
          Enter your company details and upload your logo
        </p>
      </div>

      {/* Logo Upload */}
      <div className="bg-[#0D1B2A] rounded-xl p-6 border border-[#1B3A5A]">
        <Label className="text-white font-medium mb-4 block">Company Logo</Label>
        <div className="flex items-start gap-6">
          {/* Logo Preview */}
          <div className="flex-shrink-0">
            {data.logoPreview ? (
              <div className="relative">
                <img 
                  src={data.logoPreview} 
                  alt="Company logo" 
                  className="w-24 h-24 object-contain rounded-lg bg-white p-2"
                  data-testid="logo-preview"
                />
                <button
                  onClick={removeLogo}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                  data-testid="remove-logo-button"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div 
                className="w-24 h-24 rounded-lg bg-gradient-to-br from-[#00D4FF] to-[#0066FF] flex items-center justify-center"
                data-testid="initials-avatar"
              >
                <span className="text-2xl font-bold text-white">{getInitials()}</span>
              </div>
            )}
          </div>

          {/* Upload Zone */}
          <div 
            className={`flex-1 border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer ${
              dragActive 
                ? 'border-[#00D4FF] bg-[#00D4FF]/10' 
                : 'border-[#1B3A5A] hover:border-[#00D4FF]/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            data-testid="logo-upload-zone"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.svg"
              onChange={(e) => handleLogoUpload(e.target.files[0])}
              className="hidden"
              data-testid="logo-file-input"
            />
            <div className="text-center">
              <Upload className="w-10 h-10 text-[#00D4FF] mx-auto mb-3" />
              <p className="text-white font-medium">
                Drag and drop your logo here
              </p>
              <p className="text-[#8B9DB5] text-sm mt-1">
                or click to browse
              </p>
              <p className="text-[#5A6B7D] text-xs mt-3">
                PNG, JPG, SVG • Max 5MB
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Company Details Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Legal Company Name */}
        <div className="md:col-span-2">
          <Label htmlFor="legalName" className="text-white font-medium">
            Legal Company Name <span className="text-red-400">*</span>
          </Label>
          <Input
            id="legalName"
            value={data.legalName}
            onChange={(e) => handleInputChange('legalName', e.target.value)}
            placeholder="Enter your legal company name"
            className="mt-2 bg-[#0D1B2A] border-[#1B3A5A] text-white placeholder:text-[#5A6B7D] focus:border-[#00D4FF]"
            data-testid="legal-name-input"
          />
        </div>

        {/* DBA Name */}
        <div className="md:col-span-2">
          <Label htmlFor="dbaName" className="text-white font-medium">
            Operating/DBA Name <span className="text-[#5A6B7D] text-sm">(if different)</span>
          </Label>
          <Input
            id="dbaName"
            value={data.dbaName}
            onChange={(e) => handleInputChange('dbaName', e.target.value)}
            placeholder="Enter operating or DBA name"
            className="mt-2 bg-[#0D1B2A] border-[#1B3A5A] text-white placeholder:text-[#5A6B7D] focus:border-[#00D4FF]"
            data-testid="dba-name-input"
          />
        </div>

        {/* Company Type */}
        <div>
          <Label className="text-white font-medium">
            Company Type <span className="text-red-400">*</span>
          </Label>
          <Select 
            value={data.companyType} 
            onValueChange={(value) => handleInputChange('companyType', value)}
          >
            <SelectTrigger 
              className="mt-2 bg-[#0D1B2A] border-[#1B3A5A] text-white focus:border-[#00D4FF]"
              data-testid="company-type-select"
            >
              <SelectValue placeholder="Select company type" />
            </SelectTrigger>
            <SelectContent className="bg-[#0D1B2A] border-[#1B3A5A]">
              <SelectItem value="trucking_company" className="text-white hover:bg-[#1B3A5A]">
                Trucking Company
              </SelectItem>
              <SelectItem value="owner_operator" className="text-white hover:bg-[#1B3A5A]">
                Owner-Operator
              </SelectItem>
              <SelectItem value="both" className="text-white hover:bg-[#1B3A5A]">
                Both
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Country */}
        <div>
          <Label className="text-white font-medium">
            Country <span className="text-red-400">*</span>
          </Label>
          <Select 
            value={data.country} 
            onValueChange={(value) => {
              handleInputChange('country', value);
              handleInputChange('province', ''); // Reset province when country changes
            }}
          >
            <SelectTrigger 
              className="mt-2 bg-[#0D1B2A] border-[#1B3A5A] text-white focus:border-[#00D4FF]"
              data-testid="country-select"
            >
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent className="bg-[#0D1B2A] border-[#1B3A5A]">
              <SelectItem value="Canada" className="text-white hover:bg-[#1B3A5A]">
                Canada
              </SelectItem>
              <SelectItem value="USA" className="text-white hover:bg-[#1B3A5A]">
                USA
              </SelectItem>
              <SelectItem value="Both" className="text-white hover:bg-[#1B3A5A]">
                Both (Cross-Border)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Province/State */}
        <div>
          <Label className="text-white font-medium">
            {data.country === 'USA' ? 'State' : 'Province/State'}
          </Label>
          <Select 
            value={data.province} 
            onValueChange={(value) => handleInputChange('province', value)}
            disabled={!data.country}
          >
            <SelectTrigger 
              className="mt-2 bg-[#0D1B2A] border-[#1B3A5A] text-white focus:border-[#00D4FF] disabled:opacity-50"
              data-testid="province-select"
            >
              <SelectValue placeholder={data.country ? "Select province/state" : "Select country first"} />
            </SelectTrigger>
            <SelectContent className="bg-[#0D1B2A] border-[#1B3A5A] max-h-60">
              {getProvinceOptions().map((prov) => (
                <SelectItem key={prov} value={prov} className="text-white hover:bg-[#1B3A5A]">
                  {prov}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="phone" className="text-white font-medium">
            Phone <span className="text-red-400">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            value={data.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="(555) 123-4567"
            className="mt-2 bg-[#0D1B2A] border-[#1B3A5A] text-white placeholder:text-[#5A6B7D] focus:border-[#00D4FF]"
            data-testid="phone-input"
          />
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email" className="text-white font-medium">
            Email <span className="text-red-400">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="contact@company.com"
            className="mt-2 bg-[#0D1B2A] border-[#1B3A5A] text-white placeholder:text-[#5A6B7D] focus:border-[#00D4FF]"
            data-testid="email-input"
          />
        </div>

        {/* Website */}
        <div>
          <Label htmlFor="website" className="text-white font-medium">
            Website
          </Label>
          <Input
            id="website"
            type="url"
            value={data.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            placeholder="https://www.company.com"
            className="mt-2 bg-[#0D1B2A] border-[#1B3A5A] text-white placeholder:text-[#5A6B7D] focus:border-[#00D4FF]"
            data-testid="website-input"
          />
        </div>
      </div>
    </div>
  );
};

export default CompanyInfoStep;
