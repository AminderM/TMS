import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, FileText, AlertTriangle, Send, Eye, X,
  Clock, Download, Mail, RefreshCw
} from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';

const ProfileCompleteScreen = ({ 
  profileData, 
  sentPackages, 
  onViewProfile, 
  onSendPackage,
  onSendReminder,
  onClose 
}) => {
  const { companyInfo, documents } = profileData;
  
  // Count documents
  const uploadedDocs = Object.keys(documents).filter(k => documents[k]?.fileData);
  const expiredDocs = uploadedDocs.filter(k => {
    const doc = documents[k];
    return doc?.expiryDate && isPast(new Date(doc.expiryDate));
  });
  const expiringDocs = uploadedDocs.filter(k => {
    const doc = documents[k];
    if (!doc?.expiryDate) return false;
    const days = differenceInDays(new Date(doc.expiryDate), new Date());
    return days > 0 && days <= 30;
  });

  // Total required documents based on country
  const getTotalRequired = () => {
    if (companyInfo.country === 'Canada') return 7;
    if (companyInfo.country === 'USA') return 7;
    if (companyInfo.country === 'Both') return 14;
    return 14;
  };

  const getInitials = () => {
    if (!companyInfo.legalName) return 'CP';
    const words = companyInfo.legalName.split(' ').filter(w => w.length > 0);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return words[0]?.substring(0, 2).toUpperCase() || 'CP';
  };

  const getPackageStatus = (pkg) => {
    if (pkg.downloaded) return { label: 'Downloaded', color: 'bg-green-500/20 text-green-400 border-green-500/30' };
    if (pkg.opened) return { label: 'Opened', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    return { label: 'Sent', color: 'bg-[#00D4FF]/20 text-[#00D4FF] border-[#00D4FF]/30' };
  };

  const shouldShowReminder = (pkg) => {
    if (pkg.opened || pkg.downloaded) return false;
    const daysSinceSent = differenceInDays(new Date(), new Date(pkg.dateSent));
    return daysSinceSent >= 3;
  };

  return (
    <div className="min-h-screen bg-[#0A1628] p-8" data-testid="profile-complete-screen">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Profile Complete</h1>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-[#8B9DB5] hover:text-white hover:bg-[#1B3A5A]"
            data-testid="close-complete-button"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Profile Summary Card */}
        <div className="bg-[#0D1B2A] rounded-xl border border-[#1B3A5A] p-8 mb-8">
          <div className="flex items-start gap-6">
            {/* Logo */}
            {companyInfo.logoPreview ? (
              <img 
                src={companyInfo.logoPreview} 
                alt="Company logo" 
                className="w-24 h-24 object-contain rounded-xl bg-white p-2"
              />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-[#00D4FF] to-[#0066FF] flex items-center justify-center">
                <span className="text-3xl font-bold text-white">{getInitials()}</span>
              </div>
            )}

            {/* Company Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-white">
                  {companyInfo.legalName || 'Company Name'}
                </h2>
                <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                  <Check className="w-3 h-3 mr-1" /> Verified
                </Badge>
              </div>
              {companyInfo.dbaName && (
                <p className="text-[#8B9DB5] mb-2">DBA: {companyInfo.dbaName}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-[#8B9DB5]">
                <span>{companyInfo.province}, {companyInfo.country}</span>
                <span>•</span>
                <span>{companyInfo.phone}</span>
                <span>•</span>
                <span>{companyInfo.email}</span>
              </div>
            </div>
          </div>

          {/* Document Stats */}
          <div className="mt-8 pt-6 border-t border-[#1B3A5A]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Uploaded */}
              <div className="bg-[#0A1628] rounded-lg p-4 border border-[#1B3A5A]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#00D4FF]/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#00D4FF]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {uploadedDocs.length} / {getTotalRequired()}
                    </div>
                    <div className="text-sm text-[#8B9DB5]">Documents Uploaded</div>
                  </div>
                </div>
              </div>

              {/* Expiring Soon */}
              <div className="bg-[#0A1628] rounded-lg p-4 border border-[#1B3A5A]">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    expiringDocs.length > 0 ? 'bg-amber-500/20' : 'bg-[#1B3A5A]'
                  }`}>
                    <Clock className={`w-5 h-5 ${
                      expiringDocs.length > 0 ? 'text-amber-400' : 'text-[#5A6B7D]'
                    }`} />
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${
                      expiringDocs.length > 0 ? 'text-amber-400' : 'text-white'
                    }`}>
                      {expiringDocs.length}
                    </div>
                    <div className="text-sm text-[#8B9DB5]">Expiring Soon</div>
                  </div>
                </div>
              </div>

              {/* Expired */}
              <div className="bg-[#0A1628] rounded-lg p-4 border border-[#1B3A5A]">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    expiredDocs.length > 0 ? 'bg-red-500/20' : 'bg-[#1B3A5A]'
                  }`}>
                    <AlertTriangle className={`w-5 h-5 ${
                      expiredDocs.length > 0 ? 'text-red-400' : 'text-[#5A6B7D]'
                    }`} />
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${
                      expiredDocs.length > 0 ? 'text-red-400' : 'text-white'
                    }`}>
                      {expiredDocs.length}
                    </div>
                    <div className="text-sm text-[#8B9DB5]">Expired</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-4">
            <Button
              variant="outline"
              onClick={onViewProfile}
              className="border-[#1B3A5A] text-[#8B9DB5] hover:bg-[#1B3A5A] hover:text-white"
              data-testid="view-profile-button"
            >
              <Eye className="w-4 h-4 mr-2" />
              View My Profile
            </Button>
            <Button
              onClick={onSendPackage}
              className="bg-[#00D4FF] text-[#0A1628] hover:bg-[#00B8E0] font-medium"
              data-testid="send-package-button"
            >
              <Send className="w-4 h-4 mr-2" />
              Send My Package
            </Button>
          </div>
        </div>

        {/* Sent Packages Tracking */}
        {sentPackages.length > 0 && (
          <div className="bg-[#0D1B2A] rounded-xl border border-[#1B3A5A] p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Sent Packages</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1B3A5A]">
                    <th className="text-left py-3 px-4 text-[#8B9DB5] font-medium text-sm">Recipient</th>
                    <th className="text-left py-3 px-4 text-[#8B9DB5] font-medium text-sm">Date Sent</th>
                    <th className="text-left py-3 px-4 text-[#8B9DB5] font-medium text-sm">Status</th>
                    <th className="text-left py-3 px-4 text-[#8B9DB5] font-medium text-sm">Last Opened</th>
                    <th className="text-right py-3 px-4 text-[#8B9DB5] font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sentPackages.map((pkg) => {
                    const status = getPackageStatus(pkg);
                    return (
                      <tr key={pkg.id} className="border-b border-[#1B3A5A]/50 hover:bg-[#0A1628]/50">
                        <td className="py-4 px-4">
                          <div className="text-white font-medium">{pkg.recipientName}</div>
                          <div className="text-[#8B9DB5] text-sm">{pkg.recipientCompany}</div>
                          <div className="text-[#5A6B7D] text-xs">{pkg.recipientEmail}</div>
                        </td>
                        <td className="py-4 px-4 text-[#8B9DB5]">
                          {format(new Date(pkg.dateSent), 'MMM d, yyyy')}
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={`${status.color} border`}>
                            {status.label}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-[#8B9DB5]">
                          {pkg.lastOpened 
                            ? format(new Date(pkg.lastOpened), 'MMM d, yyyy h:mm a')
                            : '—'
                          }
                        </td>
                        <td className="py-4 px-4 text-right">
                          {shouldShowReminder(pkg) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onSendReminder(pkg.id)}
                              className="text-[#00D4FF] hover:bg-[#00D4FF]/10"
                              data-testid={`reminder-${pkg.id}`}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Send Reminder
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileCompleteScreen;
