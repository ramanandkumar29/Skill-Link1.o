/**
 * Skill-Link Worker KYC & 5-Tier Verification Service
 * Handles comprehensive artisan dossiers, document inspection,
 * checklist verification, audit timeline logging, and intelligent decision support.
 */

import { supabase, isSupabaseConfigured } from "./supabase";

export interface KycDocument {
  id: string;
  workerId: string;
  documentType: "aadhaar" | "skill_certificate" | "cooperative_card" | "address_proof";
  documentName: string;
  fileUrl: string;
  previewUrl: string;
  fileSize: string;
  fileType: "image/jpeg" | "application/pdf";
  status: "PENDING" | "VERIFIED" | "REJECTED" | "REQUIRES_REVIEW";
  rejectionReason?: string;
  verificationNotes?: string;
  uploadedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface KycChecklistItem {
  id: string;
  category: "IDENTITY" | "COOPERATIVE" | "SKILL" | "ADDRESS";
  label: string;
  title?: string;
  description?: string;
  status: "VERIFIED" | "PENDING" | "REQUIRES_REVIEW" | "REJECTED" | "MISSING";
  note?: string;
  lastUpdated?: string;
}

export interface KycAuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  details: string;
}

export interface DetailedKycWorker {
  id: string;
  workerId: string;
  workerName: string;
  occupation: string;
  category: string;
  profilePhoto?: string;
  mobile: string;
  email?: string;
  dob?: string;
  gender?: string;
  city: string;
  district: string;
  state: string;
  maskedAddress: string;

  // Identity
  aadhaarMasked: string;
  identityDocType: string;
  identityStatus: "VERIFIED" | "PENDING" | "REQUIRES_REVIEW" | "REJECTED";
  submittedDate: string;
  lastUpdatedDate: string;

  // Cooperative
  cooperativeSociety: string;
  societyReg: string;
  federation: string;
  districtOffice: string;
  membershipStatus: "ACTIVE" | "PENDING" | "PROVISIONAL";
  joiningDate: string;

  // Skill & Certification
  primaryProfession: string;
  skills: string[];
  experience: string;
  skillLevel: "Master Craftsman" | "Grade A Specialist" | "Certified Artisan" | "Apprentice";
  trainingInstitute?: string;
  certificationAuthority: string;
  certificateName: string;
  certificateId: string;
  certificateIssueDate: string;
  certificateExpiryDate?: string;
  skillVerificationStatus: "VERIFIED" | "PENDING" | "REQUIRES_REVIEW";

  pincode?: string;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH";
  recommendedDecision?: "APPROVE" | "NEEDS_REVIEW" | "REJECT";
  riskNote?: string;
  serviceRadius?: string;
  availability?: string;
  totalJobs?: number;
  rating?: number;
  languagesSpoken?: string[];
  secondarySkills?: string[];
  verificationLevels?: KycVerificationLevel[];
  intelligentFlags?: IntelligentKycFlag[];
  lexiSummary?: {
    identityStatus: string;
    membershipStatus: string;
    tradeStatus: string;
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    recommendation: string;
    keyObservation: string;
  };

  // Priority & Status
  priority: "HIGH" | "MEDIUM" | "NORMAL";
  priorityReason?: string;
  overallStatus: "PENDING" | "VERIFIED" | "REJECTED" | "REQUIRES_REVIEW";
  rejectionReason?: string;
  verifiedAt?: string;
  verifiedBy?: string;

  // Documents, Checklist, Audit
  documents: KycDocument[];
  checklist: KycChecklistItem[];
  auditTimeline: KycAuditLog[];
  warnings: string[];
}

export interface KycVerificationLevel {
  level: number;
  title: string;
  subtitle: string;
  status: "VERIFIED" | "PENDING" | "REQUIRES_REVIEW" | "REJECTED";
  verifiedBy?: string;
  date?: string;
  notes?: string;
  automatedCheck: string;
}

export interface IntelligentKycFlag {
  type: "GREEN" | "YELLOW" | "RED";
  label: string;
  details: string;
}

export function generateLexiKycAuditSummary(worker: DetailedKycWorker) {
  const verifiedDocs = worker.documents.filter((d) => d.status === "VERIFIED").length;
  const totalDocs = worker.documents.length || 1;
  const verifiedChecks = worker.checklist.filter((c) => c.status === "VERIFIED").length;
  const totalChecks = worker.checklist.length || 1;
  const progress = Math.round((verifiedChecks / totalChecks) * 100);

  let riskLevel: "LOW" | "MEDIUM" | "HIGH" = worker.riskLevel || "LOW";
  if (worker.membershipStatus === "PROVISIONAL" || worker.checklist.some((c) => c.status === "REQUIRES_REVIEW")) {
    riskLevel = "MEDIUM";
  }
  if (worker.documents.some((d) => d.status === "REJECTED")) {
    riskLevel = "HIGH";
  }

  let recommendation = "Request verification of trade certificate and society ledger before Tier-5 approval.";
  if (progress === 100 && verifiedDocs === totalDocs) {
    recommendation = "All 5-tier verification criteria satisfied. Ready for Tier-5 Cooperative Approval.";
  } else if (riskLevel === "HIGH") {
    recommendation = "Reject or request re-upload of flagged documentation.";
  } else if (worker.skillVerificationStatus === "PENDING") {
    recommendation = `Manually inspect ${worker.certificationAuthority} registry records before final Tier-5 approval.`;
  }

  return {
    identityStatus: worker.identityStatus === "VERIFIED" ? "Verified (Aadhaar token and photo match physical society roster)" : "Pending Identity Check",
    membershipStatus: worker.membershipStatus === "ACTIVE" ? `Verified (${worker.cooperativeSociety})` : "Provisional Membership (Confirmation Needed)",
    tradeStatus: worker.skillVerificationStatus === "VERIFIED" ? "Verified Trade Credentials" : `Manual Verification Required (${worker.certificateName})`,
    riskLevel,
    recommendation,
    keyObservation: `${worker.experience} experience in ${worker.occupation}. ${verifiedDocs}/${totalDocs} supporting documents verified.`,
  };
}

export const REJECTION_REASONS = [
  "Document is blurry or illegible",
  "Certificate has expired or nearing expiry",
  "Information mismatch with Society Roster",
  "Invalid registration or roll number",
  "Wrong document uploaded for category",
  "Photocopy unclear - original scan required",
  "Address proof does not match jurisdiction",
];

const INITIAL_KYC_WORKERS: DetailedKycWorker[] = [
  {
    id: "kyc-101",
    workerId: "WRK-EL-2024-512",
    workerName: "Dharmendra Yadav",
    occupation: "Master Electrician",
    category: "electrician",
    profilePhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    mobile: "+91 98765 41234",
    email: "dharmendra.electrician@gmail.com",
    dob: "14-Aug-1988",
    gender: "Male",
    city: "Mohali",
    district: "SAS Nagar",
    state: "Punjab",
    maskedAddress: "Phase 7 Industrial Area, Sector 70 (Full details protected)",
    pincode: "160071",
    riskLevel: "LOW",
    recommendedDecision: "NEEDS_REVIEW",
    riskNote: "⚠ Certification requires manual verification. ITI registration number could not be automatically verified against online portal.",
    serviceRadius: "12 km radius (Mohali & Chandigarh Sector 17-70)",
    availability: "Active / Available for Dispatches",
    totalJobs: 142,
    rating: 4.92,
    languagesSpoken: ["Hindi", "Punjabi", "English (Basic)"],
    secondarySkills: ["Inverter Battery Setup", "Heavy MCB Replacement", "Solar Inverter Maintenance"],
    intelligentFlags: [
      {
        type: "GREEN",
        label: "Identity & Society Roster Matched",
        details: "Masked Aadhaar token and live photograph match verified physical cooperative society ledger."
      },
      {
        type: "YELLOW",
        label: "Manual Certification Review Recommended",
        details: "ITI Trade Certificate uploaded requires cross-verification with NCVT portal or Punjab Board records."
      },
      {
        type: "GREEN",
        label: "Clean Dispute & Safety History",
        details: "Zero customer safety disputes or complaints recorded over 142 completed jobs."
      }
    ],
    verificationLevels: [
      {
        level: 1,
        title: "Identity Verification",
        subtitle: "Aadhaar Consistency & Photo Match",
        status: "VERIFIED",
        verifiedBy: "Coop Inspector Balwinder Singh",
        date: "Today, 10:20 AM",
        notes: "Masked Aadhaar matches society membership identity token.",
        automatedCheck: "Document consistency check completed successfully."
      },
      {
        level: 2,
        title: "Personal Information Verification",
        subtitle: "Phone, Residence & Jurisdiction",
        status: "VERIFIED",
        verifiedBy: "Inspector Balwinder Singh",
        date: "Today, 10:20 AM",
        notes: "Residential address is within Mohali Phase 7 cooperative jurisdiction.",
        automatedCheck: "Pincode jurisdiction consistency validated."
      },
      {
        level: 3,
        title: "Cooperative Membership Verification",
        subtitle: "Active Society Registration",
        status: "VERIFIED",
        verifiedBy: "Society Registrar J. S. Dhillon",
        date: "Today, 10:20 AM",
        notes: "Active member in TLCS-2024-512 since Jan 2022.",
        automatedCheck: "Society registration number TLCS-2024-512 confirmed."
      },
      {
        level: 4,
        title: "Trade Skill & Certification",
        subtitle: "NCVT National Trade Certificate",
        status: "REQUIRES_REVIEW",
        verifiedBy: "Pending Technical Inspector",
        date: "Today, 10:20 AM",
        notes: "Requires manual roll number check against state ITI directory.",
        automatedCheck: "Certificate image format & metadata verified."
      },
      {
        level: 5,
        title: "Final Cooperative Approval",
        subtitle: "Cooperative Admin Physical Sign-Off",
        status: "PENDING",
        verifiedBy: "Authorized Cooperative Admin",
        date: "Awaiting Level 4 clearance",
        notes: "Tier-5 marketplace badge will activate upon final admin approval.",
        automatedCheck: "Human cooperative administrator approval required."
      }
    ],

    aadhaarMasked: "XXXX-XXXX-4912",
    identityDocType: "Government Aadhaar Card (Masked)",
    identityStatus: "VERIFIED",
    submittedDate: "Today, 10:15 AM",
    lastUpdatedDate: "Today, 10:20 AM",

    cooperativeSociety: "Tricity Labour & Household Services Cooperative Society Ltd.",
    societyReg: "TLCS-2024-512",
    federation: "Punjab State Cooperative Labour Federation",
    districtOffice: "Sector 17 District Labour Office",
    membershipStatus: "ACTIVE",
    joiningDate: "12-Jan-2022",

    primaryProfession: "Electrical Maintenance & Industrial Rewiring",
    skills: [
      "Heavy Load MCB Replacement",
      "Single/3-Phase Inverter Setup",
      "Short Circuit Diagnosis",
      "Appliance Circuit Board Repair",
      "Concealed Copper Conduit Wiring",
    ],
    experience: "8+ Years",
    skillLevel: "Master Craftsman",
    trainingInstitute: "Government Industrial Training Institute (ITI), Sector 28",
    certificationAuthority: "National Council for Vocational Training (NCVT)",
    certificateName: "National Trade Certificate - Electrician Trade",
    certificateId: "NCVT-EL-8891-PB",
    certificateIssueDate: "15-Jul-2016",
    certificateExpiryDate: "Lifetime / Permanent Credential",
    skillVerificationStatus: "PENDING",

    priority: "HIGH",
    priorityReason: "High local household demand surge for electricians; pending manual NCVT check",
    overallStatus: "PENDING",

    documents: [
      {
        id: "doc-101-1",
        workerId: "kyc-101",
        documentType: "skill_certificate",
        documentName: "NCVT ITI National Trade Certificate",
        fileUrl: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=900&auto=format&fit=crop&q=80",
        previewUrl: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=900&auto=format&fit=crop&q=80",
        fileSize: "1.8 MB",
        fileType: "image/jpeg",
        status: "PENDING",
        uploadedAt: "Today, 10:15 AM",
      },
      {
        id: "doc-101-2",
        workerId: "kyc-101",
        documentType: "aadhaar",
        documentName: "UIDAI Masked Aadhaar Card (Front/Back)",
        fileUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=900&auto=format&fit=crop&q=80",
        previewUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=900&auto=format&fit=crop&q=80",
        fileSize: "1.2 MB",
        fileType: "image/jpeg",
        status: "VERIFIED",
        uploadedAt: "Today, 10:15 AM",
        verifiedAt: "Today, 10:20 AM",
        verifiedBy: "Coop Inspector Balwinder Singh",
      },
      {
        id: "doc-101-3",
        workerId: "kyc-101",
        documentType: "cooperative_card",
        documentName: "Society Member Passbook & ID Card",
        fileUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=900&auto=format&fit=crop&q=80",
        previewUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=900&auto=format&fit=crop&q=80",
        fileSize: "950 KB",
        fileType: "image/jpeg",
        status: "VERIFIED",
        uploadedAt: "Today, 10:16 AM",
        verifiedAt: "Today, 10:20 AM",
        verifiedBy: "Coop Secretary",
      },
      {
        id: "doc-101-4",
        workerId: "kyc-101",
        documentType: "address_proof",
        documentName: "Electricity Utility Bill Residence Proof",
        fileUrl: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=900&auto=format&fit=crop&q=80",
        previewUrl: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=900&auto=format&fit=crop&q=80",
        fileSize: "840 KB",
        fileType: "application/pdf",
        status: "PENDING",
        uploadedAt: "Today, 10:17 AM",
      },
    ],

    checklist: [
      { id: "chk-1", category: "IDENTITY", label: "Aadhaar Card Submitted & Masked", status: "VERIFIED", note: "UIDAI 4-digit token matched" },
      { id: "chk-2", category: "IDENTITY", label: "Identity & Photo Verification", status: "VERIFIED", note: "Facial match confirmed" },
      { id: "chk-3", category: "COOPERATIVE", label: "Cooperative Society Membership", status: "VERIFIED", note: "TLCS-2024-512 active member" },
      { id: "chk-4", category: "SKILL", label: "ITI/NCVT Certificate Authenticity", status: "PENDING", note: "Verify roll number in registry" },
      { id: "chk-5", category: "ADDRESS", label: "Residence Jurisdiction Check", status: "PENDING", note: "Verify SAS Nagar utility bill" },
    ],

    auditTimeline: [
      { id: "log-1", timestamp: "Today, 10:15 AM", adminName: "System", action: "SUBMITTED", details: "Worker submitted online KYC tier verification dossier" },
      { id: "log-2", timestamp: "Today, 10:16 AM", adminName: "System", action: "UPLOAD", details: "Uploaded 4 supporting verification credentials" },
      { id: "log-3", timestamp: "Today, 10:20 AM", adminName: "Admin Balwinder Singh", action: "DOC_APPROVED", details: "Aadhaar Identity & Society Passbook verified against physical society records" },
    ],

    warnings: [
      "⚠ Manual verification note: Check ITI roll number against Punjab State Technical Board records.",
      "ℹ Cooperative Welfare Card valid up to Dec 2026 under PM Suraksha Bima Yojana.",
    ],
  },
  {
    id: "kyc-102",
    workerId: "WRK-CG-2024-119",
    workerName: "Anita Sharma",
    occupation: "Certified Home Nurse & Caregiver",
    category: "caregiver",
    profilePhoto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
    mobile: "+91 98140 88210",
    email: "anita.sharma.care@gmail.com",
    dob: "22-Nov-1991",
    gender: "Female",
    city: "Chandigarh",
    district: "Chandigarh UT",
    state: "Chandigarh",
    maskedAddress: "Sector 44-C Housing Board (Full details protected)",
    pincode: "160044",
    riskLevel: "LOW",
    recommendedDecision: "NEEDS_REVIEW",
    riskNote: "⚠ Address certificate is a photographed rent agreement; society secretary physical confirmation recommended.",
    serviceRadius: "15 km radius (Chandigarh Tricity & Panchkula)",
    availability: "Available / Ready for Assignment",
    totalJobs: 89,
    rating: 4.96,
    languagesSpoken: ["Hindi", "English", "Punjabi"],
    secondarySkills: ["Blood Sugar & BP Tracking", "Post-Op Mobility Support", "CPR & First Aid"],
    intelligentFlags: [
      {
        type: "GREEN",
        label: "HSSC Healthcare Diploma Verified",
        details: "General Duty Assistant Diploma verified valid through October 2026."
      },
      {
        type: "YELLOW",
        label: "Address Proof Confirmation",
        details: "Photo copy of residential lease agreement requires secretary signature verification."
      }
    ],
    verificationLevels: [
      {
        level: 1,
        title: "Identity Verification",
        subtitle: "Aadhaar Match & Token Authenticated",
        status: "VERIFIED",
        verifiedBy: "Inspector Balwinder Singh",
        date: "Yesterday, 05:00 PM",
        notes: "Identity token matches Punjab Caregivers registry.",
        automatedCheck: "Document consistency check completed successfully."
      },
      {
        level: 2,
        title: "Personal Information Verification",
        subtitle: "Phone & Residential Verification",
        status: "REQUIRES_REVIEW",
        verifiedBy: "Inspector Balwinder Singh",
        date: "Yesterday, 05:00 PM",
        notes: "Lease agreement requires physical center stamp verification.",
        automatedCheck: "Address scan quality verified."
      },
      {
        level: 3,
        title: "Cooperative Membership Verification",
        subtitle: "Caregivers Cooperative Union PTCU-2024-119",
        status: "VERIFIED",
        verifiedBy: "Union Secretary R. K. Sood",
        date: "Yesterday, 05:00 PM",
        notes: "Active registered union member in good standing.",
        automatedCheck: "Union ledger entry verified."
      },
      {
        level: 4,
        title: "Trade Skill & Certification",
        subtitle: "Healthcare Sector Skill Council (HSSC)",
        status: "VERIFIED",
        verifiedBy: "Medical Council Auditor",
        date: "Yesterday, 05:00 PM",
        notes: "GDA Healthcare diploma accredited and current.",
        automatedCheck: "Accreditation roll ID validated."
      },
      {
        level: 5,
        title: "Final Cooperative Approval",
        subtitle: "Cooperative Admin Physical Sign-Off",
        status: "PENDING",
        verifiedBy: "Authorized Cooperative Admin",
        date: "Pending Level 2 lease clearance",
        notes: "Ready for Tier-5 badge upon residential clearance.",
        automatedCheck: "Human cooperative administrator approval required."
      }
    ],

    aadhaarMasked: "XXXX-XXXX-8821",
    identityDocType: "Government Aadhaar Card (Masked)",
    identityStatus: "VERIFIED",
    submittedDate: "Yesterday, 04:30 PM",
    lastUpdatedDate: "Yesterday, 05:00 PM",

    cooperativeSociety: "Punjab & Tricity Caregivers Cooperative Union",
    societyReg: "PTCU-2024-119",
    federation: "National Cooperative Union of India (NCUI)",
    districtOffice: "Sector 19 UT Cooperative Center",
    membershipStatus: "ACTIVE",
    joiningDate: "10-Feb-2023",

    primaryProfession: "Elderly Bedside Care & Post-Op Physical Assistance",
    skills: [
      "Post-Surgical Patient Monitoring",
      "Elderly Mobility Assistance",
      "Blood Pressure & Vitals Tracking",
      "Medication Regimen Supervision",
      "First-Aid & CPR Certified",
    ],
    experience: "5+ Years",
    skillLevel: "Grade A Specialist",
    trainingInstitute: "Healthcare Sector Skill Council Accredited Institute",
    certificationAuthority: "Healthcare Sector Skill Council (HSSC)",
    certificateName: "General Duty Assistant (GDA) Healthcare Diploma",
    certificateId: "HSSC-GDA-4421-UT",
    certificateIssueDate: "10-Oct-2021",
    certificateExpiryDate: "09-Oct-2026",
    skillVerificationStatus: "PENDING",

    priority: "MEDIUM",
    priorityReason: "Certificate valid; requires manual background verification check",
    overallStatus: "PENDING",

    documents: [
      {
        id: "doc-102-1",
        workerId: "kyc-102",
        documentType: "skill_certificate",
        documentName: "HSSC Healthcare Skill Council Diploma",
        fileUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=900&auto=format&fit=crop&q=80",
        previewUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=900&auto=format&fit=crop&q=80",
        fileSize: "2.1 MB",
        fileType: "image/jpeg",
        status: "PENDING",
        uploadedAt: "Yesterday, 04:30 PM",
      },
      {
        id: "doc-102-2",
        workerId: "kyc-102",
        documentType: "aadhaar",
        documentName: "UIDAI Masked Aadhaar Card",
        fileUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=900&auto=format&fit=crop&q=80",
        previewUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=900&auto=format&fit=crop&q=80",
        fileSize: "1.4 MB",
        fileType: "image/jpeg",
        status: "VERIFIED",
        uploadedAt: "Yesterday, 04:30 PM",
        verifiedAt: "Yesterday, 05:00 PM",
        verifiedBy: "Coop Admin Ravinder Kaur",
      },
      {
        id: "doc-102-3",
        workerId: "kyc-102",
        documentType: "cooperative_card",
        documentName: "PTCU Caregiver Union Card",
        fileUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=900&auto=format&fit=crop&q=80",
        previewUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=900&auto=format&fit=crop&q=80",
        fileSize: "880 KB",
        fileType: "image/jpeg",
        status: "VERIFIED",
        uploadedAt: "Yesterday, 04:31 PM",
        verifiedAt: "Yesterday, 05:00 PM",
        verifiedBy: "Coop Admin Ravinder Kaur",
      },
    ],

    checklist: [
      { id: "chk-102-1", category: "IDENTITY", label: "Aadhaar Card Submitted & Masked", status: "VERIFIED" },
      { id: "chk-102-2", category: "IDENTITY", label: "Identity & Photo Verification", status: "VERIFIED" },
      { id: "chk-102-3", category: "COOPERATIVE", label: "Cooperative Union Membership", status: "VERIFIED" },
      { id: "chk-102-4", category: "SKILL", label: "HSSC Nursing Diploma Inspection", status: "PENDING" },
      { id: "chk-102-5", category: "ADDRESS", label: "Chandigarh Residence Verification", status: "REQUIRES_REVIEW" },
    ],

    auditTimeline: [
      { id: "log-102-1", timestamp: "Yesterday, 04:30 PM", adminName: "System", action: "SUBMITTED", details: "Worker registered under Caregiver trade category" },
      { id: "log-102-2", timestamp: "Yesterday, 05:00 PM", adminName: "Admin Ravinder Kaur", action: "DOC_APPROVED", details: "Aadhaar and union membership verified" },
    ],

    warnings: [
      "⚠ Address certificate was uploaded as photo of rent agreement; manual address verification check required.",
    ],
  },
  {
    id: "kyc-103",
    workerId: "WRK-MS-2024-411",
    workerName: "Harnek Singh",
    occupation: "Civil Mason & Tiling Pro",
    category: "mason",
    profilePhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    mobile: "+91 94172 19801",
    email: "harnek.singh.mason@gmail.com",
    dob: "05-Mar-1983",
    gender: "Male",
    city: "Panchkula",
    district: "Panchkula",
    state: "Haryana",
    maskedAddress: "Sector 14 Industrial Colony (Full details protected)",
    pincode: "134109",
    riskLevel: "MEDIUM",
    recommendedDecision: "NEEDS_REVIEW",
    riskNote: "⚠ Provisional cooperative membership: Confirmation letter from society president required.",
    serviceRadius: "10 km radius (Panchkula & Zirakpur)",
    availability: "Available for Site Visits",
    totalJobs: 174,
    rating: 4.88,
    languagesSpoken: ["Punjabi", "Hindi"],
    secondarySkills: ["Granite Countertops", "Terrace Waterproofing", "Vitrified Tile Repair"],
    intelligentFlags: [
      {
        type: "YELLOW",
        label: "Provisional Membership Confirmation Needed",
        details: "Requires signed letter from Panchkula Cooperative Sub-Center president."
      },
      {
        type: "GREEN",
        label: "CSDCI Masonry Certificate Valid",
        details: "Construction Skill Development Council certificate valid until August 2027."
      }
    ],
    verificationLevels: [
      {
        level: 1,
        title: "Identity Verification",
        subtitle: "Aadhaar Match & Verification",
        status: "PENDING",
        verifiedBy: "Pending Inspector Review",
        date: "Yesterday, 02:00 PM",
        notes: "Identity card uploaded; photo match pending inspection.",
        automatedCheck: "Document consistency check completed successfully."
      },
      {
        level: 2,
        title: "Personal Information Verification",
        subtitle: "Address & Mobile Verification",
        status: "VERIFIED",
        verifiedBy: "Inspector Balwinder Singh",
        date: "Yesterday, 02:00 PM",
        notes: "Address is within Panchkula cooperative sector.",
        automatedCheck: "Pincode jurisdiction validated."
      },
      {
        level: 3,
        title: "Cooperative Membership Verification",
        subtitle: "Provisional Membership Status",
        status: "REQUIRES_REVIEW",
        verifiedBy: "Pending Sub-Center President",
        date: "Yesterday, 02:00 PM",
        notes: "Official confirmation letter from society president required.",
        automatedCheck: "Provisional society ID recorded."
      },
      {
        level: 4,
        title: "Trade Skill & Certification",
        subtitle: "CSDCI Level 2 Masonry Certificate",
        status: "PENDING",
        verifiedBy: "Technical Evaluator",
        date: "Yesterday, 02:00 PM",
        notes: "Certificate uploaded; practical experience verified over 12+ years.",
        automatedCheck: "CSDCI certification format validated."
      },
      {
        level: 5,
        title: "Final Cooperative Approval",
        subtitle: "Cooperative Admin Physical Sign-Off",
        status: "PENDING",
        verifiedBy: "Authorized Cooperative Admin",
        date: "Awaiting Levels 1, 3, 4",
        notes: "Final Tier-5 approval pending clearance.",
        automatedCheck: "Human cooperative administrator approval required."
      }
    ],

    aadhaarMasked: "XXXX-XXXX-1980",
    identityDocType: "Government Aadhaar Card (Masked)",
    identityStatus: "PENDING",
    submittedDate: "Yesterday, 02:00 PM",
    lastUpdatedDate: "Yesterday, 02:00 PM",

    cooperativeSociety: "Tricity Labour & Household Services Cooperative Society Ltd.",
    societyReg: "TLCS-2024-411",
    federation: "Punjab State Cooperative Labour Federation",
    districtOffice: "Panchkula Cooperative Sub-Center",
    membershipStatus: "PROVISIONAL",
    joiningDate: "15-May-2024",

    primaryProfession: "Masonry, Waterproof Plaster & Vitrified Tile Fitting",
    skills: [
      "Precision Laser Level Tiling",
      "Structural Wall Putty & Brick Masonry",
      "Basement Concrete Waterproofing",
      "Kitchen Granite Slab Installation",
      "Terrace Sloping & Grouting",
    ],
    experience: "12+ Years",
    skillLevel: "Master Craftsman",
    trainingInstitute: "Construction Skill Development Council of India Center",
    certificationAuthority: "Construction Skill Development Council of India (CSDCI)",
    certificateName: "CSDCI Construction Skill Council Level 2 Certified Mason",
    certificateId: "CSDCI-MS-9982-HR",
    certificateIssueDate: "12-Aug-2022",
    certificateExpiryDate: "11-Aug-2027",
    skillVerificationStatus: "PENDING",

    priority: "NORMAL",
    priorityReason: "Standard queue processing",
    overallStatus: "PENDING",

    documents: [
      {
        id: "doc-103-1",
        workerId: "kyc-103",
        documentType: "skill_certificate",
        documentName: "CSDCI Level 2 Masonry Certificate",
        fileUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&auto=format&fit=crop&q=80",
        previewUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&auto=format&fit=crop&q=80",
        fileSize: "1.6 MB",
        fileType: "image/jpeg",
        status: "PENDING",
        uploadedAt: "Yesterday, 02:00 PM",
      },
      {
        id: "doc-103-2",
        workerId: "kyc-103",
        documentType: "aadhaar",
        documentName: "UIDAI Masked Aadhaar Card",
        fileUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=900&auto=format&fit=crop&q=80",
        previewUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=900&auto=format&fit=crop&q=80",
        fileSize: "1.1 MB",
        fileType: "image/jpeg",
        status: "PENDING",
        uploadedAt: "Yesterday, 02:00 PM",
      },
    ],

    checklist: [
      { id: "chk-103-1", category: "IDENTITY", label: "Aadhaar Card Submitted & Masked", status: "PENDING" },
      { id: "chk-103-2", category: "IDENTITY", label: "Identity & Photo Verification", status: "PENDING" },
      { id: "chk-103-3", category: "COOPERATIVE", label: "Cooperative Society Membership", status: "PENDING" },
      { id: "chk-103-4", category: "SKILL", label: "CSDCI Masonry Certificate", status: "PENDING" },
      { id: "chk-103-5", category: "ADDRESS", label: "Residence Jurisdiction Check", status: "PENDING" },
    ],

    auditTimeline: [
      { id: "log-103-1", timestamp: "Yesterday, 02:00 PM", adminName: "System", action: "SUBMITTED", details: "Worker registration dossier submitted online" },
    ],

    warnings: [
      "ℹ Provisional cooperative membership: Confirmation letter from society president required.",
    ],
  },
];

const LOCAL_KYC_KEY = "skill_link_kyc_workers_v1";

export function getKycWorkers(): DetailedKycWorker[] {
  if (typeof window === "undefined") return INITIAL_KYC_WORKERS;
  try {
    const raw = localStorage.getItem(LOCAL_KYC_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_KYC_KEY, JSON.stringify(INITIAL_KYC_WORKERS));
      return INITIAL_KYC_WORKERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_KYC_WORKERS;
  }
}

export function saveKycWorkers(workers: DetailedKycWorker[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_KYC_KEY, JSON.stringify(workers));
  } catch {}
}

export function getKycWorkerById(id: string): DetailedKycWorker | undefined {
  const list = getKycWorkers();
  return list.find((w) => w.id === id || w.workerId === id);
}

export function updateDocumentStatus(
  workerId: string,
  docId: string,
  status: "VERIFIED" | "REJECTED" | "REQUIRES_REVIEW",
  rejectionReason?: string,
  adminName: string = "Cooperative Admin"
): DetailedKycWorker | null {
  const list = getKycWorkers();
  const worker = list.find((w) => w.id === workerId);
  if (!worker) return null;

  const doc = worker.documents.find((d) => d.id === docId);
  if (doc) {
    doc.status = status;
    doc.rejectionReason = rejectionReason;
    doc.verifiedAt = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    doc.verifiedBy = adminName;
  }

  // Add audit log
  worker.auditTimeline.unshift({
    id: `log-${Date.now()}`,
    timestamp: "Just now",
    adminName,
    action: status === "VERIFIED" ? "DOC_APPROVED" : "DOC_REJECTED",
    details: `${doc?.documentName || "Document"} marked as ${status}${rejectionReason ? `: "${rejectionReason}"` : ""}`,
  });

  saveKycWorkers(list);
  return worker;
}

export function updateChecklistItem(
  workerId: string,
  checklistId: string,
  status: "VERIFIED" | "PENDING" | "REQUIRES_REVIEW" | "REJECTED"
): DetailedKycWorker | null {
  const list = getKycWorkers();
  const worker = list.find((w) => w.id === workerId);
  if (!worker) return null;

  const item = worker.checklist.find((c) => c.id === checklistId);
  if (item) {
    item.status = status;
  }

  saveKycWorkers(list);
  return worker;
}

export function finalizeWorkerKycDecision(
  workerId: string,
  decision: "VERIFIED" | "REJECTED" | "REQUIRES_REVIEW",
  notes?: string,
  adminName: string = "Cooperative Admin"
): DetailedKycWorker | null {
  const list = getKycWorkers();
  const worker = list.find((w) => w.id === workerId);
  if (!worker) return null;

  worker.overallStatus = decision;
  worker.verifiedAt = new Date().toLocaleString("en-IN");
  worker.verifiedBy = adminName;
  if (decision === "REJECTED") {
    worker.rejectionReason = notes;
  }

  if (decision === "VERIFIED") {
    worker.identityStatus = "VERIFIED";
    worker.skillVerificationStatus = "VERIFIED";
    worker.checklist.forEach((c) => (c.status = "VERIFIED"));
  }

  worker.auditTimeline.unshift({
    id: `log-${Date.now()}`,
    timestamp: "Just now",
    adminName,
    action: decision === "VERIFIED" ? "APPLICATION_APPROVED" : "APPLICATION_REJECTED",
    details: `Application ${decision}${notes ? `: ${notes}` : " following cooperative 5-tier verification guidelines"}`,
  });

  // Persist to Supabase if configured
  if (isSupabaseConfigured() && supabase) {
    Promise.resolve(
      supabase
        .from("workers")
        .update({
          verification_status: decision,
          kyc_status: decision,
          kyc_reviewed_at: new Date().toISOString(),
        })
        .eq("phone", worker.mobile.replace(/[^0-9]/g, ""))
    ).catch((e: any) => console.warn("Supabase worker update notice:", e));
  }

  saveKycWorkers(list);
  return worker;
}
