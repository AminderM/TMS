import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Building2, FileText, Shield, Truck, CreditCard, 
  Check, ChevronLeft, ChevronRight, Save, X, Moon, Sun, Loader2
} from 'lucide-react';

// Step Components
import CompanyInfoStep from './steps/CompanyInfoStep';
import DocumentUploadStep from './steps/DocumentUploadStep';
import RegulatoryDetailsStep from './steps/RegulatoryDetailsStep';
import FleetLanesStep from './steps/FleetLanesStep';
import PaymentSetupStep from './steps/PaymentSetupStep';
import ProfileCompleteScreen from './ProfileCompleteScreen';
import SendPackageModal from './SendPackageModal';

// API Service
import { carrierProfileAPI } from './carrierProfileAPI';

const steps = [
  { id: 1, name: 'Company Info', icon: Building2 },
  { id: 2, name: 'Documents', icon: FileText },
  { id: 3, name: 'Regulatory', icon: Shield },
  { id: 4, name: 'Fleet & Lanes', icon: Truck },
  { id: 5, name: 'Payment', icon: CreditCard },
];

const initialProfileData = {
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
  documents: {},
  regulatory: {
    nscNumber: '',
    nscSafetyRating: '',
    cvorNumber: '',
    cvorSafetyRating: '',
    craBusinessNumber: '',
    gstHstNumber: '',
    usdotNumber: '',
    mcNumber: '',
    ein: '',
    iftaAccountNumber: '',
    iftaBaseJurisdiction: '',
    crossBorderCapable: false,
    fastCardEnrolled: false,
  },
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
  currentStep: 1,
  isComplete: false,
  completedAt: null,
  lastSaved: null,
};

const CarrierProfileWizard = ({ onClose }) => {
  const { user } = useAuth();
  
  // State
  const [profileData, setProfileData] = useState(initialProfileData);
  const [currentStep, setCurrentStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSendPackage, setShowSendPackage] = useState(false);
  const [sentPackages, setSentPackages] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Theme state
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  // Load profile from backend on mount
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const profile = await carrierProfileAPI.getProfile();
        if (profile) {
          setProfileData(profile);
          setCurrentStep(profile.currentStep || 1);
          setIsComplete(profile.isComplete || false);
        }
        
        // Load sent packages
        try {
          const packages = await carrierProfileAPI.getPackages();
          setSentPackages(packages);
        } catch (e) {
          console.log('No packages found');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile. Using local data.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfile();
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  // Save step data to backend
  const saveStepData = useCallback(async (stepKey, data, nextStep) => {
    setIsSaving(true);
    try {
      await carrierProfileAPI.updateProfile(stepKey, data, nextStep);
      setHasUnsavedChanges(false);
      return true;
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save. Please try again.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Calculate progress percentage
  const calculateProgress = () => {
    let completedSteps = 0;
    
    const ci = profileData.companyInfo;
    if (ci.legalName && ci.companyType && ci.country && ci.phone && ci.email) {
      completedSteps++;
    }
    
    if (Object.keys(profileData.documents).length > 0) {
      completedSteps++;
    }
    
    const reg = profileData.regulatory;
    if (reg.nscNumber || reg.usdotNumber || reg.cvorNumber || reg.mcNumber) {
      completedSteps++;
    }
    
    const fl = profileData.fleet;
    if (fl.numberOfTrucks && fl.equipmentTypes.length > 0) {
      completedSteps++;
    }
    
    const pay = profileData.payment;
    if (pay.paymentMethod && pay.bankName) {
      completedSteps++;
    }
    
    return Math.round((completedSteps / 5) * 100);
  };

  // Update step data locally and mark as unsaved
  const updateStepData = (stepKey, data) => {
    setProfileData(prev => ({
      ...prev,
      [stepKey]: { ...prev[stepKey], ...data },
    }));
    setHasUnsavedChanges(true);
  };

  // Get step key from step number
  const getStepKey = (step) => {
    const keys = ['companyInfo', 'documents', 'regulatory', 'fleet', 'payment'];
    return keys[step - 1];
  };

  // Handle Next button
  const handleNext = async () => {
    const stepKey = getStepKey(currentStep);
    
    // Save current step data
    const saved = await saveStepData(stepKey, profileData[stepKey], currentStep + 1);
    if (!saved) return;
    
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Complete the profile
      try {
        await carrierProfileAPI.completeProfile();
        setProfileData(prev => ({
          ...prev,
          isComplete: true,
          completedAt: new Date().toISOString(),
        }));
        setIsComplete(true);
        toast.success('Profile completed successfully!');
      } catch (error) {
        toast.error('Failed to complete profile');
      }
    }
  };

  // Handle Previous button
  const handlePrevious = async () => {
    if (hasUnsavedChanges) {
      const stepKey = getStepKey(currentStep);
      await saveStepData(stepKey, profileData[stepKey], currentStep - 1);
    }
    
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Handle Save & Exit
  const handleSaveAndExit = async () => {
    setIsSaving(true);
    try {
      const stepKey = getStepKey(currentStep);
      await saveStepData(stepKey, profileData[stepKey], currentStep);
      toast.success('Progress saved! You can return anytime to continue.');
      onClose();
    } catch (error) {
      toast.error('Failed to save progress');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle logo upload
  const handleLogoUpload = async (file) => {
    try {
      const logoUrl = await carrierProfileAPI.uploadLogo(file);
      setProfileData(prev => ({
        ...prev,
        companyInfo: {
          ...prev.companyInfo,
          logoPreview: logoUrl,
        },
      }));
      toast.success('Logo uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload logo');
      throw error;
    }
  };

  // Handle document upload
  const handleDocumentUpload = async (file, documentType, expiryDate) => {
    try {
      const doc = await carrierProfileAPI.uploadDocument(file, documentType, expiryDate);
      setProfileData(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          [documentType]: doc,
        },
      }));
      toast.success('Document uploaded successfully!');
      return doc;
    } catch (error) {
      toast.error('Failed to upload document');
      throw error;
    }
  };

  // Handle document delete
  const handleDocumentDelete = async (documentType, documentId) => {
    try {
      await carrierProfileAPI.deleteDocument(documentId);
      setProfileData(prev => {
        const newDocs = { ...prev.documents };
        delete newDocs[documentType];
        return { ...prev, documents: newDocs };
      });
      toast.success('Document deleted');
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  // Handle send package
  const handleSendPackage = async (packageData) => {
    try {
      const result = await carrierProfileAPI.sendPackage(packageData);
      setSentPackages(prev => [result, ...prev]);
      setShowSendPackage(false);
      toast.success(`Package sent to ${packageData.recipientEmail}!`);
      return result;
    } catch (error) {
      toast.error('Failed to send package');
      throw error;
    }
  };

  // Handle send reminder
  const handleSendReminder = async (packageId) => {
    try {
      await carrierProfileAPI.sendReminder(packageId);
      toast.success('Reminder sent!');
    } catch (error) {
      toast.error('Failed to send reminder');
    }
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
            onLogoUpload={handleLogoUpload}
          />
        );
      case 2:
        return (
          <DocumentUploadStep
            data={profileData.documents}
            country={profileData.companyInfo.country}
            onChange={(data) => updateStepData('documents', data)}
            onUpload={handleDocumentUpload}
            onDelete={handleDocumentDelete}
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

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Complete screen
  if (isComplete) {
    return (
      <div className="fixed inset-0 bg-background z-50 overflow-auto">
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
    <div className="fixed inset-0 bg-background z-50 flex" data-testid="carrier-profile-wizard">
      {/* Left Sidebar */}
      <div className="w-72 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Carrier Profile</h2>
          <p className="text-sm text-muted-foreground mt-1">Build your company profile</p>
        </div>

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
                      ? 'bg-primary/10 border border-primary text-foreground'
                      : status === 'complete'
                      ? 'bg-muted/50 text-primary hover:bg-muted'
                      : 'text-muted-foreground cursor-not-allowed'
                  }`}
                  data-testid={`step-${step.id}-button`}
                >
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 flex items-center justify-center ${
                    status === 'complete' ? 'bg-primary' :
                    status === 'current' ? 'bg-background border-2 border-primary' :
                    'bg-muted'
                  }`}>
                    {status === 'complete' && (
                      <Check className="w-2 h-2 text-primary-foreground" />
                    )}
                  </div>
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{step.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-primary font-medium">
                {user?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="truncate">
              <div className="text-foreground font-medium truncate">{user?.full_name}</div>
              <div className="text-xs truncate">{user?.email}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="bg-card border-b border-border px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground text-sm">
                Step {currentStep} of 5
              </span>
              <Progress 
                value={calculateProgress()} 
                className="w-48 h-2 bg-muted"
              />
              <span className="text-primary text-sm font-medium">
                {calculateProgress()}% Complete
              </span>
              {hasUnsavedChanges && (
                <span className="text-yellow-500 text-xs">• Unsaved changes</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="border-border"
                data-testid="theme-toggle"
              >
                {isDark ? (
                  <Sun className="h-4 w-4 text-yellow-400" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleSaveAndExit}
                disabled={isSaving}
                className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                data-testid="save-exit-button"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
                className="text-muted-foreground hover:text-foreground hover:bg-muted"
                data-testid="close-wizard-button"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8 bg-background">
          <div className="max-w-4xl mx-auto">
            {renderStepContent()}
          </div>
        </div>

        <div className="bg-card border-t border-border px-8 py-4">
          <div className="max-w-4xl mx-auto flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || isSaving}
              className="border-border text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
              data-testid="previous-button"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={isSaving}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-8"
              data-testid="next-button"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : currentStep === 5 ? (
                'Complete Profile'
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarrierProfileWizard;
