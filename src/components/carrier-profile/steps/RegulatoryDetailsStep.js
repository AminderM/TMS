import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Shield, Info } from 'lucide-react';

const safetyRatings = ['Satisfactory', 'Conditional', 'Unsatisfactory', 'Unrated'];

const RegulatoryDetailsStep = ({ data, country, documents, onChange }) => {
  const handleInputChange = (field, value) => {
    onChange({ [field]: value });
  };

  const showCanadian = country === 'Canada' || country === 'Both' || !country;
  const showUS = country === 'USA' || country === 'Both' || !country;

  return (
    <div className="space-y-8" data-testid="regulatory-details-step">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Shield className="w-7 h-7 text-[#00D4FF]" />
          Regulatory Details
        </h2>
        <p className="text-[#8B9DB5] mt-2">
          Enter your regulatory information. Some fields may be pre-filled from uploaded documents.
        </p>
      </div>

      {/* Canadian Section */}
      {showCanadian && (
        <div className="bg-[#0D1B2A] rounded-xl p-6 border border-[#1B3A5A]">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
              <span className="text-lg">🇨🇦</span>
            </div>
            <h3 className="text-lg font-semibold text-white">Canadian Regulatory</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* NSC Number */}
            <div>
              <Label htmlFor="nscNumber" className="text-white font-medium">
                NSC Number
              </Label>
              <Input
                id="nscNumber"
                value={data.nscNumber}
                onChange={(e) => handleInputChange('nscNumber', e.target.value)}
                placeholder="Enter NSC number"
                className="mt-2 bg-[#0A1628] border-[#1B3A5A] text-white placeholder:text-[#5A6B7D] focus:border-[#00D4FF]"
                data-testid="nsc-number-input"
              />
            </div>

            {/* NSC Safety Rating */}
            <div>
              <Label className="text-white font-medium">NSC Safety Rating</Label>
              <Select 
                value={data.nscSafetyRating} 
                onValueChange={(value) => handleInputChange('nscSafetyRating', value)}
              >
                <SelectTrigger 
                  className="mt-2 bg-[#0A1628] border-[#1B3A5A] text-white focus:border-[#00D4FF]"
                  data-testid="nsc-rating-select"
                >
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent className="bg-[#0D1B2A] border-[#1B3A5A]">
                  {safetyRatings.map((rating) => (
                    <SelectItem key={rating} value={rating} className="text-white hover:bg-[#1B3A5A]">
                      {rating}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* CVOR Number */}
            <div>
              <Label htmlFor="cvorNumber" className="text-white font-medium">
                CVOR Number
              </Label>
              <Input
                id="cvorNumber"
                value={data.cvorNumber}
                onChange={(e) => handleInputChange('cvorNumber', e.target.value)}
                placeholder="Enter CVOR number"
                className="mt-2 bg-[#0A1628] border-[#1B3A5A] text-white placeholder:text-[#5A6B7D] focus:border-[#00D4FF]"
                data-testid="cvor-number-input"
              />
            </div>

            {/* CVOR Safety Rating */}
            <div>
              <Label className="text-white font-medium">CVOR Safety Rating</Label>
              <Select 
                value={data.cvorSafetyRating} 
                onValueChange={(value) => handleInputChange('cvorSafetyRating', value)}
              >
                <SelectTrigger 
                  className="mt-2 bg-[#0A1628] border-[#1B3A5A] text-white focus:border-[#00D4FF]"
                  data-testid="cvor-rating-select"
                >
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent className="bg-[#0D1B2A] border-[#1B3A5A]">
                  {safetyRatings.map((rating) => (
                    <SelectItem key={rating} value={rating} className="text-white hover:bg-[#1B3A5A]">
                      {rating}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* CRA Business Number */}
            <div>
              <Label htmlFor="craBusinessNumber" className="text-white font-medium">
                CRA Business Number
              </Label>
              <Input
                id="craBusinessNumber"
                value={data.craBusinessNumber}
                onChange={(e) => handleInputChange('craBusinessNumber', e.target.value)}
                placeholder="123456789RC0001"
                className="mt-2 bg-[#0A1628] border-[#1B3A5A] text-white placeholder:text-[#5A6B7D] focus:border-[#00D4FF]"
                data-testid="cra-number-input"
              />
            </div>

            {/* GST/HST Number */}
            <div>
              <Label htmlFor="gstHstNumber" className="text-white font-medium">
                GST/HST Number
              </Label>
              <Input
                id="gstHstNumber"
                value={data.gstHstNumber}
                onChange={(e) => handleInputChange('gstHstNumber', e.target.value)}
                placeholder="123456789RT0001"
                className="mt-2 bg-[#0A1628] border-[#1B3A5A] text-white placeholder:text-[#5A6B7D] focus:border-[#00D4FF]"
                data-testid="gst-hst-number-input"
              />
            </div>
          </div>
        </div>
      )}

      {/* US Section */}
      {showUS && (
        <div className="bg-[#0D1B2A] rounded-xl p-6 border border-[#1B3A5A]">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <span className="text-lg">🇺🇸</span>
            </div>
            <h3 className="text-lg font-semibold text-white">US Regulatory</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* USDOT Number */}
            <div>
              <Label htmlFor="usdotNumber" className="text-white font-medium">
                USDOT Number
              </Label>
              <Input
                id="usdotNumber"
                value={data.usdotNumber}
                onChange={(e) => handleInputChange('usdotNumber', e.target.value)}
                placeholder="Enter USDOT number"
                className="mt-2 bg-[#0A1628] border-[#1B3A5A] text-white placeholder:text-[#5A6B7D] focus:border-[#00D4FF]"
                data-testid="usdot-number-input"
              />
            </div>

            {/* MC Number */}
            <div>
              <Label htmlFor="mcNumber" className="text-white font-medium">
                MC Number
              </Label>
              <Input
                id="mcNumber"
                value={data.mcNumber}
                onChange={(e) => handleInputChange('mcNumber', e.target.value)}
                placeholder="MC-123456"
                className="mt-2 bg-[#0A1628] border-[#1B3A5A] text-white placeholder:text-[#5A6B7D] focus:border-[#00D4FF]"
                data-testid="mc-number-input"
              />
            </div>

            {/* EIN */}
            <div>
              <Label htmlFor="ein" className="text-white font-medium">
                EIN (Employer Identification Number)
              </Label>
              <Input
                id="ein"
                value={data.ein}
                onChange={(e) => handleInputChange('ein', e.target.value)}
                placeholder="XX-XXXXXXX"
                className="mt-2 bg-[#0A1628] border-[#1B3A5A] text-white placeholder:text-[#5A6B7D] focus:border-[#00D4FF]"
                data-testid="ein-input"
              />
            </div>

            {/* IFTA Account Number */}
            <div>
              <Label htmlFor="iftaAccountNumber" className="text-white font-medium">
                IFTA Account Number
              </Label>
              <Input
                id="iftaAccountNumber"
                value={data.iftaAccountNumber}
                onChange={(e) => handleInputChange('iftaAccountNumber', e.target.value)}
                placeholder="Enter IFTA account number"
                className="mt-2 bg-[#0A1628] border-[#1B3A5A] text-white placeholder:text-[#5A6B7D] focus:border-[#00D4FF]"
                data-testid="ifta-account-input"
              />
            </div>

            {/* IFTA Base Jurisdiction */}
            <div className="md:col-span-2">
              <Label htmlFor="iftaBaseJurisdiction" className="text-white font-medium">
                IFTA Base Jurisdiction
              </Label>
              <Input
                id="iftaBaseJurisdiction"
                value={data.iftaBaseJurisdiction}
                onChange={(e) => handleInputChange('iftaBaseJurisdiction', e.target.value)}
                placeholder="e.g., Texas, California"
                className="mt-2 bg-[#0A1628] border-[#1B3A5A] text-white placeholder:text-[#5A6B7D] focus:border-[#00D4FF]"
                data-testid="ifta-jurisdiction-input"
              />
            </div>
          </div>
        </div>
      )}

      {/* Cross-Border Section */}
      <div className="bg-[#0D1B2A] rounded-xl p-6 border border-[#1B3A5A]">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[#00D4FF]/20 flex items-center justify-center">
            <span className="text-lg">🌎</span>
          </div>
          <h3 className="text-lg font-semibold text-white">Cross-Border Operations</h3>
        </div>

        <div className="space-y-6">
          {/* Cross-border capable */}
          <div className="flex items-center justify-between p-4 bg-[#0A1628] rounded-lg border border-[#1B3A5A]">
            <div>
              <Label className="text-white font-medium">Cross-border Capable?</Label>
              <p className="text-[#8B9DB5] text-sm mt-1">
                Can your fleet operate across the US-Canada border?
              </p>
            </div>
            <Switch
              checked={data.crossBorderCapable}
              onCheckedChange={(checked) => handleInputChange('crossBorderCapable', checked)}
              className="data-[state=checked]:bg-[#00D4FF]"
              data-testid="cross-border-switch"
            />
          </div>

          {/* FAST Card Enrolled */}
          <div className="flex items-center justify-between p-4 bg-[#0A1628] rounded-lg border border-[#1B3A5A]">
            <div>
              <Label className="text-white font-medium">FAST Card Enrolled?</Label>
              <p className="text-[#8B9DB5] text-sm mt-1">
                Free and Secure Trade program enrollment
              </p>
            </div>
            <Switch
              checked={data.fastCardEnrolled}
              onCheckedChange={(checked) => handleInputChange('fastCardEnrolled', checked)}
              className="data-[state=checked]:bg-[#00D4FF]"
              data-testid="fast-card-switch"
            />
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="flex items-start gap-3 p-4 bg-[#00D4FF]/5 border border-[#00D4FF]/20 rounded-lg">
        <Info className="w-5 h-5 text-[#00D4FF] flex-shrink-0 mt-0.5" />
        <p className="text-[#8B9DB5] text-sm">
          Regulatory information helps shippers and brokers verify your carrier authority. 
          Keep these numbers updated to maintain compliance.
        </p>
      </div>
    </div>
  );
};

export default RegulatoryDetailsStep;
