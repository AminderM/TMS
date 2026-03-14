import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Building2, FileText, Shield, Truck, CreditCard, 
  Check, Circle, ChevronLeft, ChevronRight, Save, LogOut,
  X
} from 'lucide-react';

// Step Components
import CompanyInfoStep from './steps/CompanyInfoStep';
import DocumentUploadStep from './steps/DocumentUploadStep';
import RegulatoryDetailsStep from './steps/RegulatoryDetailsStep';
import FleetLanesStep from './steps/FleetLanesStep';
import PaymentSetupStep from './steps/PaymentSetupStep';
import ProfileCompleteScreen from './ProfileCompleteScreen';
import SendPackageModal from './SendPackageModal';

const STORAGE_KEY = 'carrier_profile_data';

const steps = [
  { id: 1, name: 'Company Info', icon: Building2 },
  { id: 2, name: 'Documents', icon: FileText },
  { id: 3, name: 'Regulatory', icon: Shield },
  { id: 4, name: 'Fleet & Lanes', icon: Truck },
  { id: 5, name: 'Payment', icon: CreditCard },
];

const initialProfileData = {
  // Step 1 - Company Info
  companyInfo: {
    legalName: '',
    dbaName: '',
    companyType: '',
    country: '',
    province: '',
    phone: '',
    email: '',
    website: '',
    logo: null,
    logoPreview: null,
  },
  // Step 2 - Documents
  documents: {},
  // Step 3 - Regulatory Details
  regulatory: {
    // Canadian
    nscNumber: '',
    nscSafetyRating: '',
    cvorNumber: '',
    cvorSafetyRating: '',
    craBusinessNumber: '',
    gstHstNumber: '',
    // US
    usdotNumber: '',
    mcNumber: '',
    ein: '',
    iftaAccountNumber: '',
    iftaBaseJurisdiction: '',
    // Cross-Border
    crossBorderCapable: false,
    fastCardEnrolled: false,
  },
  // Step 4 - Fleet & Lanes
  fleet: {
    numberOfTrucks: '',
    numberOfTrailers: '',
    equipmentTypes: [],
    hazmatCapable: false,
    crossBorderCapable: false,
    eldProvider: '',
    preferredLanes: [],
    is24x7Dispatch: false,
  },
  // Step 5 - Payment
  payment: {
    paymentMethod: '',
    factoringCompanyName: '',
    noaDocument: null,
    bankName: '',
    transitNumber: '',
    abaRoutingNumber: '',
    institutionNumber: '',
    accountNumber: '',
    accountType: '',
    currency: '',
    paymentTerms: '',
  },
  // Meta
  currentStep: 1,
  isComplete: false,
  completedAt: null,
  lastSaved: null,
};

// Helper to load from localStorage
const loadFromStorage = (key, defaultValue) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const CarrierProfileWizard = ({ onClose }) => {
  const { user } = useAuth();
  
  // Initialize state from localStorage
  const [profileData, setProfileData] = useState(() => loadFromStorage(STORAGE_KEY, initialProfileData));
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = loadFromStorage(STORAGE_KEY, null);
    return saved?.currentStep || 1;
  });
  const [isComplete, setIsComplete] = useState(() => {
    const saved = loadFromStorage(STORAGE_KEY, null);
    return saved?.isComplete || false;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSendPackage, setShowSendPackage] = useState(false);
  const [sentPackages, setSentPackages] = useState(() => loadFromStorage('carrier_sent_packages', []));

  // Auto-save on data change
  const saveProgress = useCallback(() => {
    const dataToSave = {
      ...profileData,
      currentStep,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [profileData, currentStep]);

  // Calculate progress percentage
  const calculateProgress = () => {
    let completedSteps = 0;
    
    // Check Step 1
    const ci = profileData.companyInfo;
    if (ci.legalName && ci.companyType && ci.country && ci.phone && ci.email) {
      completedSteps++;
    }
    
    // Check Step 2 - at least some docs uploaded
    if (Object.keys(profileData.documents).length > 0) {
      completedSteps++;
    }
    
    // Check Step 3 - some regulatory info
    const reg = profileData.regulatory;
    if (reg.nscNumber || reg.usdotNumber || reg.cvorNumber || reg.mcNumber) {
      completedSteps++;
    }
    
    // Check Step 4 - fleet info
    const fl = profileData.fleet;
    if (fl.numberOfTrucks && fl.equipmentTypes.length > 0) {
      completedSteps++;
    }
    
    // Check Step 5 - payment info
    const pay = profileData.payment;
    if (pay.paymentMethod && pay.bankName) {
      completedSteps++;
    }
    
    return Math.round((completedSteps / 5) * 100);
  };

  const updateStepData = (stepKey, data) => {
    setProfileData(prev => ({
      ...prev,
      [stepKey]: { ...prev[stepKey], ...data },
    }));
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
      saveProgress();
    } else {
      // Complete the profile
      setProfileData(prev => ({
        ...prev,
        isComplete: true,
        completedAt: new Date().toISOString(),
      }));
      setIsComplete(true);
      saveProgress();
      toast.success('Profile completed successfully!');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSaveAndExit = () => {
    setIsSaving(true);
    saveProgress();
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Progress saved! You can return anytime to continue.');
      onClose();
    }, 500);
  };

  const handleSendPackage = (packageData) => {
    const newPackage = {
      id: Date.now().toString(),
      ...packageData,
      dateSent: new Date().toISOString(),
      status: 'sent',
      lastOpened: null,
    };
    const updatedPackages = [...sentPackages, newPackage];
    setSentPackages(updatedPackages);
    localStorage.setItem('carrier_sent_packages', JSON.stringify(updatedPackages));
    setShowSendPackage(false);
    toast.success(`Package sent to ${packageData.recipientEmail}!`);
  };

  const handleSendReminder = (packageId) => {
    setSentPackages(prev => 
      prev.map(pkg => 
        pkg.id === packageId 
          ? { ...pkg, reminderSent: new Date().toISOString() }
          : pkg
      )
    );
    toast.success('Reminder sent!');
  };

  const getStepStatus = (stepId) => {
    if (stepId < currentStep) return 'complete';
    if (stepId === currentStep) return 'current';
    return 'upcoming';
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <CompanyInfoStep
            data={profileData.companyInfo}
            onChange={(data) => updateStepData('companyInfo', data)}
          />
        );
      case 2:
        return (
          <DocumentUploadStep
            data={profileData.documents}
            country={profileData.companyInfo.country}
            onChange={(data) => updateStepData('documents', data)}
          />
        );
      case 3:
        return (
          <RegulatoryDetailsStep
            data={profileData.regulatory}
            country={profileData.companyInfo.country}
            documents={profileData.documents}
            onChange={(data) => updateStepData('regulatory', data)}
          />
        );
      case 4:
        return (
          <FleetLanesStep
            data={profileData.fleet}
            onChange={(data) => updateStepData('fleet', data)}
          />
        );
      case 5:
        return (
          <PaymentSetupStep
            data={profileData.payment}
            country={profileData.companyInfo.country}
            onChange={(data) => updateStepData('payment', data)}
          />
        );
      default:
        return null;
    }
  };

  // If profile is complete, show completion screen
  if (isComplete) {
    return (
      <div className="fixed inset-0 bg-[#0A1628] z-50 overflow-auto">
        <ProfileCompleteScreen
          profileData={profileData}
          sentPackages={sentPackages}
          onViewProfile={() => setIsComplete(false)}
          onSendPackage={() => setShowSendPackage(true)}
          onSendReminder={handleSendReminder}
          onClose={onClose}
        />
        {showSendPackage && (
          <SendPackageModal
            profileData={profileData}
            onSend={handleSendPackage}
            onClose={() => setShowSendPackage(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0A1628] z-50 flex" data-testid="carrier-profile-wizard">
      {/* Left Sidebar */}
      <div className="w-72 bg-[#0D1B2A] border-r border-[#1B3A5A] flex flex-col">
        {/* Logo Area */}
        <div className="p-6 border-b border-[#1B3A5A]">
          <h2 className="text-xl font-bold text-white">Carrier Profile</h2>
          <p className="text-sm text-[#8B9DB5] mt-1">Build your company profile</p>
        </div>

        {/* Steps */}
        <div className="flex-1 p-4">
          <nav className="space-y-2">
            {steps.map((step) => {
              const status = getStepStatus(step.id);
              const Icon = step.icon;
              return (
                <button
                  key={step.id}
                  onClick={() => status !== 'upcoming' && setCurrentStep(step.id)}
                  disabled={status === 'upcoming'}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    status === 'current'
                      ? 'bg-[#0A1628] border border-[#00D4FF] text-white'
                      : status === 'complete'
                      ? 'bg-[#0A1628]/50 text-[#00D4FF] hover:bg-[#0A1628]'
                      : 'text-[#5A6B7D] cursor-not-allowed'
                  }`}
                  data-testid={`step-${step.id}-button`}
                >
                  {/* Status Dot */}
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    status === 'complete' ? 'bg-[#00D4FF]' :
                    status === 'current' ? 'bg-[#0A1628] border-2 border-[#00D4FF]' :
                    'bg-[#2A3F55]'
                  }`}>
                    {status === 'complete' && (
                      <Check className="w-3 h-3 text-[#0A1628]" />
                    )}
                  </div>
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{step.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-[#1B3A5A]">
          <div className="flex items-center gap-3 text-sm text-[#8B9DB5]">
            <div className="w-8 h-8 rounded-full bg-[#1B3A5A] flex items-center justify-center">
              <span className="text-[#00D4FF] font-medium">
                {user?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="truncate">
              <div className="text-white font-medium truncate">{user?.full_name}</div>
              <div className="text-xs truncate">{user?.email}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-[#0D1B2A] border-b border-[#1B3A5A] px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-[#8B9DB5] text-sm">
                Step {currentStep} of 5
              </span>
              <Progress 
                value={calculateProgress()} 
                className="w-48 h-2 bg-[#1B3A5A]"
              />
              <span className="text-[#00D4FF] text-sm font-medium">
                {calculateProgress()}% Complete
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleSaveAndExit}
                disabled={isSaving}
                className="border-[#1B3A5A] text-[#8B9DB5] hover:bg-[#1B3A5A] hover:text-white"
                data-testid="save-exit-button"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save & Exit
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-[#8B9DB5] hover:text-white hover:bg-[#1B3A5A]"
                data-testid="close-wizard-button"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl mx-auto">
            {renderStepContent()}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="bg-[#0D1B2A] border-t border-[#1B3A5A] px-8 py-4">
          <div className="max-w-4xl mx-auto flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="border-[#1B3A5A] text-[#8B9DB5] hover:bg-[#1B3A5A] hover:text-white disabled:opacity-50"
              data-testid="previous-button"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              className="bg-[#00D4FF] text-[#0A1628] hover:bg-[#00B8E0] font-medium px-8"
              data-testid="next-button"
            >
              {currentStep === 5 ? 'Complete Profile' : 'Next'}
              {currentStep !== 5 && <ChevronRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarrierProfileWizard;
