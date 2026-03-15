import React, { useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  FileText, Upload, Check, AlertTriangle, X, 
  Calendar as CalendarIcon, Eye, Trash2, Loader2 
} from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';

const canadianDocuments = [
  { id: 'nsc_certificate', name: 'NSC Certificate', description: 'National Safety Code Certificate - Required for commercial carriers', required: true },
  { id: 'cvor_abstract', name: 'CVOR Abstract', description: 'Commercial Vehicle Operator\'s Registration - Ontario required', required: true },
  { id: 'cargo_insurance_ca', name: 'Cargo Insurance Certificate', description: 'Proof of cargo coverage for Canadian operations', required: true },
  { id: 'auto_liability_ca', name: 'Auto Liability Certificate', description: 'Vehicle liability insurance coverage', required: true },
  { id: 'wsib_clearance', name: 'WSIB Clearance Certificate', description: 'Workplace Safety and Insurance Board clearance', required: true },
  { id: 'gst_hst_registration', name: 'GST/HST Registration', description: 'Canada Revenue Agency registration', required: true },
  { id: 'void_cheque', name: 'Void Cheque or Bank Letter', description: 'For direct deposit setup', required: true },
];

const usDocuments = [
  { id: 'usdot_mc_authority', name: 'USDOT / MC Authority Letter', description: 'Federal Motor Carrier Safety Administration authority', required: true },
  { id: 'boc3_filing', name: 'BOC-3 Filing Confirmation', description: 'Blanket of Coverage process agent filing', required: true },
  { id: 'ucr_receipt', name: 'UCR Receipt', description: 'Unified Carrier Registration receipt', required: true },
  { id: 'ifta_licence', name: 'IFTA Licence', description: 'International Fuel Tax Agreement licence', required: true },
  { id: 'cargo_insurance_us', name: 'Cargo Insurance Certificate (US)', description: 'Proof of cargo coverage for US operations', required: true },
  { id: 'auto_liability_us', name: 'Auto Liability Certificate (US)', description: 'Vehicle liability insurance - US coverage', required: true },
  { id: 'w9_w8ben', name: 'W-9 or W-8BEN', description: 'Tax identification form', required: true },
];

const DocumentUploadStep = ({ data, country, onChange, onUpload, onDelete }) => {
  const fileInputRefs = useRef({});
  const [previewDoc, setPreviewDoc] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(null);

  const getDocumentList = () => {
    if (country === 'Canada') return canadianDocuments;
    if (country === 'USA') return usDocuments;
    if (country === 'Both') return [...canadianDocuments, ...usDocuments];
    return [...canadianDocuments, ...usDocuments];
  };

  const handleFileUpload = async (docId, file) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF, PNG, or JPG file');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // If onUpload prop exists, use API upload
    if (onUpload) {
      setUploadingDoc(docId);
      try {
        await onUpload(file, docId, null);
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        setUploadingDoc(null);
      }
      return;
    }

    // Fallback to local storage (for demo)
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange({
        ...data,
        [docId]: {
          ...data[docId],
          file: file,
          fileData: e.target.result,
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
          status: 'uploaded',
        },
      });
    };
    reader.readAsDataURL(file);
  };

  const handleExpiryChange = (docId, date) => {
    onChange({
      ...data,
      [docId]: {
        ...data[docId],
        expiryDate: date ? date.toISOString() : null,
        status: getDocumentStatus(data[docId]?.fileData, date),
      },
    });
  };

  const handleRemoveDocument = async (docId) => {
    const docData = data[docId];
    if (onDelete && docData?.id) {
      try {
        await onDelete(docId, docData.id);
      } catch (error) {
        console.error('Delete failed:', error);
      }
      return;
    }
    
    // Fallback to local removal
    const newData = { ...data };
    delete newData[docId];
    onChange(newData);
  };

  const getDocumentStatus = (fileData, expiryDate) => {
    if (!fileData) return 'not_uploaded';
    if (!expiryDate) return 'uploaded';
    
    const expiry = new Date(expiryDate);
    if (isPast(expiry)) return 'expired';
    if (differenceInDays(expiry, new Date()) <= 30) return 'expiring_soon';
    return 'uploaded';
  };

  const getStatusBadge = (docData) => {
    const status = docData?.status || getDocumentStatus(docData?.fileData, docData?.expiryDate);
    
    switch (status) {
      case 'uploaded':
        return (
          <Badge className="bg-primary/20 text-primary border border-primary/30">
            <Check className="w-3 h-3 mr-1" /> Uploaded
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-destructive/20 text-destructive border border-destructive/30">
            <AlertTriangle className="w-3 h-3 mr-1" /> Expired
          </Badge>
        );
      case 'expiring_soon':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" /> Expiring Soon
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground border border-border">
            Not Uploaded
          </Badge>
        );
    }
  };

  const documents = getDocumentList();
  const uploadedCount = Object.keys(data).filter(k => data[k]?.fileData).length;
  const requiredCount = documents.filter(d => d.required).length;

  return (
    <div className="space-y-6" data-testid="document-upload-step">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <FileText className="w-7 h-7 text-primary" />
          Document Upload
        </h2>
        <p className="text-muted-foreground mt-2">
          Upload your carrier documents. {uploadedCount} of {requiredCount} required documents uploaded.
        </p>
      </div>

      {/* Country Notice */}
      {!country && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          <p className="text-yellow-600 dark:text-yellow-400 text-sm">
            Please select your country in Step 1 to see the correct document requirements.
          </p>
        </div>
      )}

      {/* Document Cards */}
      <div className="space-y-4">
        {documents.map((doc) => {
          const docData = data[doc.id] || {};
          const isUploaded = !!docData.fileData;

          return (
            <div
              key={doc.id}
              className={`bg-card rounded-xl border transition-colors ${
                isUploaded ? 'border-primary/30' : 'border-border'
              }`}
              data-testid={`document-card-${doc.id}`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-foreground font-medium">{doc.name}</h3>
                      {doc.required && (
                        <span className="text-xs text-destructive">Required</span>
                      )}
                      {getStatusBadge(docData)}
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">{doc.description}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isUploaded ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewDoc(docData)}
                          className="text-primary hover:bg-primary/10"
                          data-testid={`view-${doc.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDocument(doc.id)}
                          className="text-destructive hover:bg-destructive/10"
                          data-testid={`remove-${doc.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRefs.current[doc.id]?.click()}
                        disabled={uploadingDoc === doc.id}
                        className="border-border text-primary hover:bg-muted"
                        data-testid={`upload-${doc.id}`}
                      >
                        {uploadingDoc === doc.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload
                          </>
                        )}
                      </Button>
                    )}
                    <input
                      ref={(el) => (fileInputRefs.current[doc.id] = el)}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => handleFileUpload(doc.id, e.target.files[0])}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Uploaded File Info & Expiry */}
                {isUploaded && (
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      <span className="truncate max-w-[200px]">{docData.fileName}</span>
                      <span className="text-muted-foreground/50">-</span>
                      <span>{format(new Date(docData.uploadedAt), 'MMM d, yyyy')}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-muted-foreground text-sm">Expiry Date:</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`border-border hover:bg-muted ${
                              docData.expiryDate ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                            data-testid={`expiry-${doc.id}`}
                          >
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            {docData.expiryDate 
                              ? format(new Date(docData.expiryDate), 'MMM d, yyyy')
                              : 'Set expiry'
                            }
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-popover border-border">
                          <Calendar
                            mode="single"
                            selected={docData.expiryDate ? new Date(docData.expiryDate) : undefined}
                            onSelect={(date) => handleExpiryChange(doc.id, date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-foreground font-medium">{previewDoc.fileName}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewDoc(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              {previewDoc.fileData?.startsWith('data:application/pdf') ? (
                <iframe
                  src={previewDoc.fileData}
                  className="w-full h-[70vh]"
                  title="Document Preview"
                />
              ) : (
                <img
                  src={previewDoc.fileData}
                  alt="Document Preview"
                  className="max-w-full h-auto mx-auto"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUploadStep;
