// Carrier Profile API Service
// Integrates with backend at api.staging.integratedtech.ca

const API_BASE = process.env.REACT_APP_BACKEND_URL || 'https://api.staging.integratedtech.ca';

// Feature flag - set to true when backend is ready
const USE_BACKEND_API = false; // TODO: Set to true when backend endpoints are deployed

// Helper to get auth token
const getAuthToken = () => {
  return localStorage.getItem('auth_token') || localStorage.getItem('token');
};

// Helper for API calls
const apiCall = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    ...options.headers,
  };
  
  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || error.message || 'API request failed');
  }
  
  return response.json();
};

// Transform backend response to frontend format
const transformProfileFromBackend = (backendProfile) => {
  if (!backendProfile) return null;
  
  const companyInfo = backendProfile.company_info || {};
  const regulatory = backendProfile.regulatory || {};
  const fleet = backendProfile.fleet || {};
  const payment = backendProfile.payment || {};
  
  return {
    id: backendProfile._id || backendProfile.id,
    companyInfo: {
      legalName: companyInfo.legal_name || '',
      dbaName: companyInfo.dba_name || '',
      companyType: companyInfo.company_type || '',
      country: companyInfo.country || '',
      province: companyInfo.province || '',
      phone: companyInfo.phone || '',
      email: companyInfo.email || '',
      website: companyInfo.website || '',
      logo: null,
      logoPreview: companyInfo.logo_url || null,
    },
    documents: transformDocumentsFromBackend(backendProfile.documents || []),
    regulatory: {
      nscNumber: regulatory.nsc_number || '',
      nscSafetyRating: regulatory.nsc_safety_rating || '',
      cvorNumber: regulatory.cvor_number || '',
      cvorSafetyRating: regulatory.cvor_safety_rating || '',
      craBusinessNumber: regulatory.cra_business_number || '',
      gstHstNumber: regulatory.gst_hst_number || '',
      usdotNumber: regulatory.usdot_number || '',
      mcNumber: regulatory.mc_number || '',
      ein: regulatory.ein || '',
      iftaAccountNumber: regulatory.ifta_account_number || '',
      iftaBaseJurisdiction: regulatory.ifta_base_jurisdiction || '',
      crossBorderCapable: regulatory.cross_border_capable || false,
      fastCardEnrolled: regulatory.fast_card_enrolled || false,
    },
    fleet: {
      numberOfTrucks: fleet.number_of_trucks?.toString() || '',
      numberOfTrailers: fleet.number_of_trailers?.toString() || '',
      equipmentTypes: fleet.equipment_types || [],
      hazmatCapable: fleet.hazmat_capable || false,
      crossBorderCapable: fleet.cross_border_capable || false,
      eldProvider: fleet.eld_provider || '',
      preferredLanes: (fleet.preferred_lanes || []).map((lane, idx) => ({
        id: lane.id || idx,
        origin: lane.origin || '',
        destination: lane.destination || '',
        serviceType: lane.service_type || 'ftl',
      })),
      is24x7Dispatch: fleet.is_24x7_dispatch || false,
    },
    payment: {
      paymentMethod: payment.payment_method || '',
      factoringCompanyName: payment.factoring_company_name || '',
      noaDocument: payment.noa_document_url ? { fileData: payment.noa_document_url } : null,
      bankName: payment.bank_name || '',
      transitNumber: payment.has_transit_number ? '••••••' : '',
      abaRoutingNumber: payment.has_aba_routing_number ? '••••••' : '',
      institutionNumber: payment.has_institution_number ? '•••' : '',
      accountNumber: payment.account_number_masked || '',
      accountType: payment.account_type || '',
      currency: payment.currency || '',
      paymentTerms: payment.payment_terms || '',
      // Track which fields are set
      hasTransitNumber: payment.has_transit_number || false,
      hasAbaRoutingNumber: payment.has_aba_routing_number || false,
      hasInstitutionNumber: payment.has_institution_number || false,
      hasAccountNumber: !!payment.account_number_masked,
    },
    currentStep: backendProfile.current_step || 1,
    isComplete: backendProfile.is_complete || false,
    completedAt: backendProfile.completed_at || null,
    lastSaved: backendProfile.updated_at || null,
  };
};

// Transform documents array from backend
const transformDocumentsFromBackend = (backendDocs) => {
  const docs = {};
  (backendDocs || []).forEach(doc => {
    docs[doc.document_type] = {
      id: doc._id || doc.id,
      fileData: doc.file_url,
      fileName: doc.file_name,
      uploadedAt: doc.uploaded_at,
      expiryDate: doc.expiry_date,
      status: doc.status,
    };
  });
  return docs;
};

// Transform frontend data to backend format for PATCH
const transformProfileToBackend = (frontendData, stepKey) => {
  const payload = {};
  
  if (stepKey === 'companyInfo' || !stepKey) {
    const ci = frontendData.companyInfo || frontendData;
    if (ci.legalName !== undefined) {
      payload.company_info = {
        legal_name: ci.legalName,
        dba_name: ci.dbaName,
        company_type: ci.companyType,
        country: ci.country,
        province: ci.province,
        phone: ci.phone,
        email: ci.email,
        website: ci.website,
      };
    }
  }
  
  if (stepKey === 'regulatory' || !stepKey) {
    const reg = frontendData.regulatory || frontendData;
    if (reg.nscNumber !== undefined || reg.usdotNumber !== undefined) {
      payload.regulatory = {
        nsc_number: reg.nscNumber,
        nsc_safety_rating: reg.nscSafetyRating,
        cvor_number: reg.cvorNumber,
        cvor_safety_rating: reg.cvorSafetyRating,
        cra_business_number: reg.craBusinessNumber,
        gst_hst_number: reg.gstHstNumber,
        usdot_number: reg.usdotNumber,
        mc_number: reg.mcNumber,
        ein: reg.ein,
        ifta_account_number: reg.iftaAccountNumber,
        ifta_base_jurisdiction: reg.iftaBaseJurisdiction,
        cross_border_capable: reg.crossBorderCapable,
        fast_card_enrolled: reg.fastCardEnrolled,
      };
    }
  }
  
  if (stepKey === 'fleet' || !stepKey) {
    const fl = frontendData.fleet || frontendData;
    if (fl.numberOfTrucks !== undefined || fl.equipmentTypes !== undefined) {
      payload.fleet = {
        number_of_trucks: fl.numberOfTrucks ? parseInt(fl.numberOfTrucks) : null,
        number_of_trailers: fl.numberOfTrailers ? parseInt(fl.numberOfTrailers) : null,
        equipment_types: fl.equipmentTypes,
        hazmat_capable: fl.hazmatCapable,
        cross_border_capable: fl.crossBorderCapable,
        eld_provider: fl.eldProvider,
        preferred_lanes: (fl.preferredLanes || []).map(lane => ({
          origin: lane.origin,
          destination: lane.destination,
          service_type: lane.serviceType,
        })),
        is_24x7_dispatch: fl.is24x7Dispatch,
      };
    }
  }
  
  if (stepKey === 'payment' || !stepKey) {
    const pay = frontendData.payment || frontendData;
    if (pay.paymentMethod !== undefined || pay.bankName !== undefined) {
      payload.payment = {
        payment_method: pay.paymentMethod,
        factoring_company_name: pay.factoringCompanyName,
        bank_name: pay.bankName,
        account_type: pay.accountType,
        currency: pay.currency,
        payment_terms: pay.paymentTerms,
      };
      // Only include sensitive fields if they're new values (not masked)
      if (pay.transitNumber && !pay.transitNumber.includes('•')) {
        payload.payment.transit_number = pay.transitNumber;
      }
      if (pay.institutionNumber && !pay.institutionNumber.includes('•')) {
        payload.payment.institution_number = pay.institutionNumber;
      }
      if (pay.abaRoutingNumber && !pay.abaRoutingNumber.includes('•')) {
        payload.payment.aba_routing_number = pay.abaRoutingNumber;
      }
      if (pay.accountNumber && !pay.accountNumber.includes('*') && !pay.accountNumber.includes('•')) {
        payload.payment.account_number = pay.accountNumber;
      }
    }
  }
  
  return payload;
};

// Local storage fallback functions
const STORAGE_KEY = 'carrier_profile_data';
const PACKAGES_KEY = 'carrier_sent_packages';

const localStorageAPI = {
  getProfile: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },
  
  saveProfile: (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...data,
      lastSaved: new Date().toISOString(),
    }));
    return data;
  },
  
  getPackages: () => {
    try {
      const saved = localStorage.getItem(PACKAGES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },
  
  savePackage: (pkg) => {
    const packages = localStorageAPI.getPackages();
    const newPackage = {
      ...pkg,
      id: Date.now().toString(),
      dateSent: new Date().toISOString(),
      status: 'sent',
    };
    packages.unshift(newPackage);
    localStorage.setItem(PACKAGES_KEY, JSON.stringify(packages));
    return newPackage;
  },
};

// API Functions
export const carrierProfileAPI = {
  // Get current user's profile
  getProfile: async () => {
    // Use localStorage when backend not ready
    if (!USE_BACKEND_API) {
      return localStorageAPI.getProfile();
    }
    
    try {
      const response = await apiCall('/api/carrier-profiles/me');
      return transformProfileFromBackend(response);
    } catch (error) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        return null;
      }
      // Fallback to localStorage on error
      console.warn('API error, using localStorage:', error.message);
      return localStorageAPI.getProfile();
    }
  },
  
  // Create new profile
  createProfile: async (data) => {
    if (!USE_BACKEND_API) {
      return localStorageAPI.saveProfile({ companyInfo: data, currentStep: 1 });
    }
    
    const payload = transformProfileToBackend({ companyInfo: data }, 'companyInfo');
    const response = await apiCall('/api/carrier-profiles', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return transformProfileFromBackend(response);
  },
  
  // Update profile (partial update)
  updateProfile: async (stepKey, data, currentStep) => {
    if (!USE_BACKEND_API) {
      const current = localStorageAPI.getProfile() || {};
      const updated = {
        ...current,
        [stepKey]: { ...(current[stepKey] || {}), ...data },
        currentStep: currentStep || current.currentStep,
      };
      return localStorageAPI.saveProfile(updated);
    }
    
    const payload = transformProfileToBackend({ [stepKey]: data }, stepKey);
    if (currentStep) {
      payload.current_step = currentStep;
    }
    const response = await apiCall('/api/carrier-profiles/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return transformProfileFromBackend(response);
  },
  
  // Complete profile
  completeProfile: async () => {
    if (!USE_BACKEND_API) {
      const current = localStorageAPI.getProfile() || {};
      return localStorageAPI.saveProfile({
        ...current,
        isComplete: true,
        completedAt: new Date().toISOString(),
      });
    }
    
    const response = await apiCall('/api/carrier-profiles/me/complete', {
      method: 'POST',
    });
    return response;
  },
  
  // Upload logo
  uploadLogo: async (file) => {
    if (!USE_BACKEND_API) {
      // For localStorage mode, convert to data URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const current = localStorageAPI.getProfile() || {};
          localStorageAPI.saveProfile({
            ...current,
            companyInfo: { ...(current.companyInfo || {}), logoPreview: e.target.result },
          });
          resolve(e.target.result);
        };
        reader.readAsDataURL(file);
      });
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiCall('/api/carrier-profiles/me/logo', {
      method: 'POST',
      body: formData,
    });
    return response.logo_url;
  },
  
  // Upload document
  uploadDocument: async (file, documentType, expiryDate) => {
    if (!USE_BACKEND_API) {
      // For localStorage mode, convert to data URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const doc = {
            id: Date.now().toString(),
            fileData: e.target.result,
            fileName: file.name,
            uploadedAt: new Date().toISOString(),
            expiryDate: expiryDate || null,
            status: 'uploaded',
          };
          const current = localStorageAPI.getProfile() || {};
          localStorageAPI.saveProfile({
            ...current,
            documents: { ...(current.documents || {}), [documentType]: doc },
          });
          resolve(doc);
        };
        reader.readAsDataURL(file);
      });
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    if (expiryDate) {
      formData.append('expiry_date', expiryDate);
    }
    
    const response = await apiCall('/api/carrier-profiles/me/documents', {
      method: 'POST',
      body: formData,
    });
    return {
      id: response._id || response.id,
      fileData: response.file_url,
      fileName: response.file_name,
      uploadedAt: response.uploaded_at,
      expiryDate: response.expiry_date,
      status: response.status,
    };
  },
  
  // Delete document
  deleteDocument: async (documentId) => {
    if (!USE_BACKEND_API) {
      // localStorage doesn't need document deletion API
      return;
    }
    
    await apiCall(`/api/carrier-profiles/me/documents/${documentId}`, {
      method: 'DELETE',
    });
  },
  
  // Update document expiry
  updateDocumentExpiry: async (documentId, expiryDate) => {
    if (!USE_BACKEND_API) {
      return;
    }
    
    const response = await apiCall(`/api/carrier-profiles/me/documents/${documentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ expiry_date: expiryDate }),
    });
    return response;
  },
  
  // Get sent packages
  getPackages: async () => {
    if (!USE_BACKEND_API) {
      return localStorageAPI.getPackages();
    }
    
    const response = await apiCall('/api/carrier-profiles/me/packages');
    return response.map(pkg => ({
      id: pkg._id || pkg.id,
      recipientName: pkg.recipient_name,
      recipientCompany: pkg.recipient_company,
      recipientEmail: pkg.recipient_email,
      documentsIncluded: pkg.documents_included,
      dateSent: pkg.date_sent,
      status: pkg.status,
      lastOpened: pkg.last_opened,
      publicToken: pkg.public_token,
      publicUrl: pkg.public_url,
    }));
  },
  
  // Send package
  sendPackage: async (data) => {
    if (!USE_BACKEND_API) {
      return localStorageAPI.savePackage({
        recipientName: data.recipientName,
        recipientCompany: data.recipientCompany,
        recipientEmail: data.recipientEmail,
        message: data.message,
        documentsIncluded: data.documentsIncluded || [],
      });
    }
    
    const response = await apiCall('/api/carrier-profiles/me/packages', {
      method: 'POST',
      body: JSON.stringify({
        recipient_name: data.recipientName,
        recipient_company: data.recipientCompany,
        recipient_email: data.recipientEmail,
        message: data.message,
        document_ids: data.documentIds,
      }),
    });
    return {
      id: response._id || response.id,
      publicToken: response.public_token,
      publicUrl: response.public_url,
      pdfUrl: response.pdf_url,
      dateSent: response.date_sent,
      status: response.status,
    };
  },
  
  // Send reminder
  sendReminder: async (packageId) => {
    if (!USE_BACKEND_API) {
      return { message: 'Reminder sent (demo mode)', reminder_sent_at: new Date().toISOString() };
    }
    
    const response = await apiCall(`/api/carrier-profiles/me/packages/${packageId}/reminder`, {
      method: 'POST',
    });
    return response;
  },
};

export default carrierProfileAPI;
