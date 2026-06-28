import React, { useState } from 'react';
import { 
    FileText, 
    Share2, 
    CheckCircle, 
    ExternalLink, 
    User, 
    Briefcase, 
    ShieldCheck, 
    MapPin, 
    Phone, 
    CreditCard, 
    Layers,
    BadgeCheck,
    Printer
} from 'lucide-react';
import porterProfiles from '@data/porter_staff_profiles.json';
import logo from '@/assets/englabs_logo.png';


interface PorterProfile {
    porterName: string;
    joiningDate?: string;
    salary: number;
    ratePerKm: number;
    photo?: string;
    personalDetails: {
        fullName: string;
        fatherName: string;
        dob: string;
        gender: string;
        mobile: string;
        email: string;
        maritalStatus: string;
        bloodGroup: string;
        organDonor: string;
        permanentAddress: string;
        currentAddress: string;
    };
    documents: {
        aadhaarNumber: string;
        panCardNumber: string;
        drivingLicenseNumber: string;
        drivingLicenseValidity: string;
        drivingLicenseClasses: string[];
    };
    bankDetails: {
        accountNumber: string;
        ifscCode: string;
        bankName: string;
        micrCode: string;
        swiftCode: string;
        accountType: string;
    };
    education: Array<{
        qualification: string;
        board: string;
        passingYear: number;
        school: string;
        grade: string;
    }>;
    experience: string[];
}

// ── ID Card print helper ──────────────────────────────────────────────────────
const printIDCard = (profile: PorterProfile) => {
    const joining = profile.joiningDate
        ? new Date(profile.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
        : 'N/A';

    const html = `<!DOCTYPE html>
<html>
<head>
<base href="${window.location.origin}">
<meta charset="UTF-8"/>
<title>ID Card – ${profile.personalDetails.fullName}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#f1f5f9; display:flex; justify-content:center; align-items:center; min-height:100vh; font-family: 'Segoe UI', Arial, sans-serif; }
  .card-wrap { display:flex; flex-direction:column; gap:32px; align-items:center; padding:40px; }
  .label { font-size:12px; color:#475569; text-transform:uppercase; letter-spacing:.15em; font-weight:800; display:flex; align-items:center; gap:6px; }
  .label::before { content:''; display:inline-block; width:8px; height:8px; background:#0f172a; border-radius:50%; }
  
  /* ── COMMON CARD STYLE ── */
  .card { 
    width: 340px; 
    height: 520px; 
    border-radius: 20px; 
    overflow: hidden; 
    box-shadow: 0 20px 45px rgba(9, 42, 66, 0.15); 
    border: 1px solid #cbd5e1;
    position: relative;
    display: flex;
    flex-direction: column;
    background: #ffffff;
  }
  
  /* ── FRONT ── */
  .card-front {
    color: #1e293b;
  }
  
  /* Blue curved wave background */
  .top-wave {
    position: absolute;
    top: 0;
    right: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
  }
  
  /* Logo positioned on the blue wave */
  .logo-container {
    position: absolute;
    top: 22px;
    right: 22px;
    display: flex;
    align-items: center;
    z-index: 2;
  }
  .logo-text {
    color: #ffffff;
    font-family: 'Outfit', sans-serif;
    font-weight: 700;
    font-size: 16px;
    letter-spacing: -0.3px;
  }
  
  /* Circle Photo with blue border */
  .photo-circle-container {
    position: absolute;
    top: 52px;
    right: 35px;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 4px solid #0c548a;
    overflow: hidden;
    background: #ffffff;
    z-index: 3;
    box-shadow: 0 4px 10px rgba(9, 42, 66, 0.12);
  }
  .photo-circle-container img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .photo-placeholder {
    width: 100%;
    height: 100%;
    background: #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    color: #cbd5e1;
  }
  
  /* Name bar - horizontal green tag under photo */
  .name-bar {
    position: absolute;
    top: 150px;
    left: 25px;
    width: 215px;
    height: 38px;
    background: #a7f3d0; /* Mint green */
    border: 1.5px solid #0c548a;
    border-radius: 4px;
    display: flex;
    align-items: center;
    padding-left: 14px;
    z-index: 2; /* Behind the overlapping photo circle */
    box-shadow: 0 2px 4px rgba(9, 42, 66, 0.06);
  }
  .name-text {
    font-size: 15px;
    font-weight: 800;
    color: #0c548a;
    font-family: 'Outfit', 'Inter', sans-serif;
    text-transform: capitalize;
  }
  
  /* Details Section */
  .details-section {
    position: absolute;
    top: 210px;
    left: 35px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    color: #0c548a;
    font-family: 'Inter', sans-serif;
    z-index: 1;
  }
  .details-row {
    font-size: 11.5px;
    display: flex;
    align-items: center;
  }
  .details-key {
    font-weight: 800;
    width: 95px;
  }
  .details-val {
    font-weight: 700;
  }
  
  /* Footer Info (Bottom Left) */
  .footer-info {
    position: absolute;
    bottom: 30px;
    left: 35px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    color: #0c548a;
    font-family: 'Inter', sans-serif;
    z-index: 1;
  }
  .footer-row {
    font-size: 8.5px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .footer-icon {
    width: 10px;
    height: 10px;
    color: #0c548a;
    flex-shrink: 0;
  }
  
  /* Signature Section (Bottom Right) */
  .signature-section {
    position: absolute;
    bottom: 30px;
    right: 35px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 1;
  }
  .sig-img {
    font-family: 'Brush Script MT', cursive, sans-serif;
    font-size: 24px;
    color: #0d568c;
    font-weight: 500;
    margin-bottom: 2px;
    height: 28px;
    line-height: 28px;
  }
  .sig-label {
    font-size: 6.5px;
    font-weight: 800;
    color: #64748b;
    letter-spacing: 0.05em;
    border-top: 1px solid #cbd5e1;
    padding-top: 3px;
    width: 90px;
    text-transform: uppercase;
  }
  
  /* ── BACK ── */
  .card-back { 
    background: #ffffff; 
    color: #1e293b; 
  }
  .mag-stripe {
    width: 100%;
    height: 38px;
    background: #1e293b;
    margin-top: 14px;
  }
  .back-body { 
    padding: 20px 24px; 
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .back-title {
    font-size: 10px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #0e4368;
    margin-bottom: 12px;
    border-bottom: 2px solid #f1f5f9;
    padding-bottom: 6px;
  }
  .field { 
    margin-bottom: 10px; 
  }
  .field .lbl { 
    font-size: 8px; 
    font-weight: 900; 
    text-transform: uppercase; 
    letter-spacing: 0.05em; 
    color: #64748b; 
    margin-bottom: 2px; 
  }
  .field .val { 
    font-size: 10.5px; 
    font-weight: 800; 
    color: #0f172a; 
  }
  .signature-strip {
    background: repeating-linear-gradient(45deg, #f8fafc, #f8fafc 10px, #f1f5f9 10px, #f1f5f9 20px);
    border: 1px solid #cbd5e1;
    height: 40px;
    border-radius: 6px;
    margin: 8px 0;
    position: relative;
    display: flex;
    align-items: center;
    padding: 0 10px;
  }
  .signature-label {
    position: absolute;
    right: 10px;
    bottom: 2px;
    font-size: 6.5px;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
  }
  .sig-text {
    font-family: 'Brush Script MT', cursive, sans-serif;
    font-size: 18px;
    color: #1e3a8a;
    font-weight: 500;
    opacity: 0.8;
  }
  .emergency { 
    background: #fef2f2; 
    border-radius: 10px; 
    padding: 8px 12px; 
    border: 1px solid #fee2e2;
    margin-top: auto;
  }
  .emergency .etitle { 
    font-size: 8px; 
    font-weight: 900; 
    text-transform: uppercase; 
    color: #dc2626; 
    letter-spacing: 0.05em; 
    margin-bottom: 4px; 
  }
  .emergency .eval { 
    font-size: 10px; 
    font-weight: 800; 
    color: #1e293b; 
  }
  .back-footer { 
    background: #0a2d4a; 
    padding: 12px 24px; 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    color: #fff;
  }
  .back-footer .bf-text { 
    font-size: 8px; 
    color: rgba(255,255,255,0.6); 
    font-weight: 600; 
    line-height: 1.3;
  }
  .back-footer .bf-bold { 
    font-size: 8.5px; 
    color: #fff; 
    font-weight: 900; 
    margin-bottom: 2px;
  }
  
  /* Print styling */
  @media print {
    body { background:#fff; }
    .card-wrap { padding:0; flex-direction:row !important; gap:20px; }
    .no-print { display:none !important; }
    .card { box-shadow:none; border:1px solid #cbd5e1; page-break-inside:avoid; }
    .label { display:none !important; }
  }
</style>
</head>
<body>
<div class="card-wrap">

  <!-- FRONT -->
  <div class="label">🪪 Employee ID Card — Front</div>
  <div class="card card-front">
    <!-- SVG curved blue background pattern -->
    <svg class="top-wave" viewBox="0 0 340 520">
      <path d="M 175 0 C 215 55, 235 110, 340 185 L 340 0 Z" fill="#0c548a" />
    </svg>
    
    <!-- Logo next to the wave curve -->
    <div class="logo-container" style="top: 16px; right: 16px;">
      <img src="${logo}" alt="Englabs" style="height: 38px; width: auto; object-fit: contain; filter: brightness(0) invert(1);" />
    </div>
    
    <!-- Circle Employee Photo -->
    <div class="photo-circle-container">
      <img src="/api/staff/photo" alt="${profile.personalDetails.fullName}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
      <div class="photo-placeholder" style="display:none;">👤</div>
    </div>
    
    <!-- Mint green name bar bar overlapping photo bottom -->
    <div class="name-bar">
      <span class="name-text">${profile.personalDetails.fullName.toLowerCase()}</span>
    </div>
    
    <!-- Smart Card Gold SIM Chip -->
    <div class="sim-chip" style="width:34px; height:28px; background:linear-gradient(135deg, #d4af37 0%, #f3e5ab 50%, #aa7c11 100%); border-radius:4px; position:absolute; top:90px; left:25px; border:1px solid #aa7c11; box-shadow:inset 0 1px 3px rgba(255,255,255,0.4); display:grid; grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr 1fr; padding:1px; gap:2px; z-index:2;">
      <div style="border-right:1px solid rgba(0,0,0,0.2); border-bottom:1px solid rgba(0,0,0,0.2);"></div>
      <div style="border-bottom:1px solid rgba(0,0,0,0.2);"></div>
      <div style="border-right:1px solid rgba(0,0,0,0.2); border-bottom:1px solid rgba(0,0,0,0.2);"></div>
      <div style="border-bottom:1px solid rgba(0,0,0,0.2);"></div>
      <div style="border-right:1px solid rgba(0,0,0,0.2);"></div>
      <div></div>
    </div>
    
    <!-- Left-aligned Details Section -->
    <div class="details-section" style="top: 202px; left: 25px; gap: 5px;">
      <div class="details-row">
        <span class="details-key">Employee ID :</span>
        <span class="details-val">${profile.personalDetails.fullName.toLowerCase().includes('gurpreet') ? 'EL/PT/2026/001' : 'EL514'}</span>
      </div>
      <div class="details-row">
        <span class="details-key">Designation :</span>
        <span class="details-val">Logistics Associate</span>
      </div>
      <div class="details-row">
        <span class="details-key">Contact No. :</span>
        <span class="details-val">${profile.personalDetails.mobile.replace('+91-', '')}</span>
      </div>
      <div class="details-row">
        <span class="details-key">Blood Group :</span>
        <span class="details-val">${profile.personalDetails.bloodGroup || 'B+VE'}</span>
      </div>
    </div>
    
    <!-- Contactless Wave / RFID secure icon -->
    <div class="rfid-icon" style="position:absolute; bottom:148px; right:20px; opacity:0.6; color:#0c548a; display:flex; align-items:center; gap:2px; z-index:2;">
      <svg viewBox="0 0 24 24" style="width:12px; height:12px; fill:none; stroke:currentColor; stroke-width:2.5; stroke-linecap:round;">
        <path d="M5 8a8.2 8.2 0 0 1 0 8M8 10a5.2 5.2 0 0 1 0 4M11 12h.01" />
      </svg>
      <span style="font-size:6.5px; font-family:'Outfit', sans-serif; font-weight:800; letter-spacing:0.3px;">RFID ACTIVE</span>
    </div>
    
    <!-- Bottom Left Contact Info with Icons -->
    <div class="footer-info">
      <div class="footer-row">
        <svg class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        <span>Second Floor, Disha Arcade, Sec-4, MDC, Panchkula</span>
      </div>
      <div class="footer-row">
        <svg class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
        </svg>
        <span>info@englabs.co.in</span>
      </div>
      <div class="footer-row">
        <svg class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
        <span>09876457934</span>
      </div>
      <div class="footer-row">
        <svg class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span>www.englabs.co.in</span>
      </div>
    </div>
    
    <!-- Bottom Right Authorised Signature -->
    <div class="signature-section">
      <div class="sig-img">Bharat</div>
      <div class="sig-label">Authorised Signature</div>
    </div>
  </div>

  <!-- BACK -->
  <div class="label">🪪 Employee ID Card — Back</div>
  <div class="card card-back">
    <div class="clip-slot" style="background:rgba(0,0,0,0.1); box-shadow:inset 0 1px 3px rgba(0,0,0,0.2); border-color:rgba(0,0,0,0.1); margin-bottom: 8px;"></div>
    <div class="mag-stripe"></div>
    
    <div class="back-body" style="padding: 10px 14px; display:flex; flex-direction:column; gap:4px; margin-top:2px;">
      <div class="back-title" style="margin-bottom: 2px;">Cardholder Info &amp; Access</div>
      
      <!-- Main Content Grid: Left Details, Right QR/Barcode -->
      <div style="display:grid; grid-template-columns: 2.1fr 1fr; gap:10px; align-items: start;">
        
        <!-- Left Side: Core Info Columns -->
        <div style="display:flex; flex-direction:column; gap:4px;">
          <div class="field">
            <div class="lbl">Aadhaar Number</div>
            <div class="val" style="font-size:9.5px; font-weight:700;">${profile.documents.aadhaarNumber}</div>
          </div>
          <div class="field">
            <div class="lbl">Driving License</div>
            <div class="val" style="font-size:9.5px; font-weight:700;">${profile.documents.drivingLicenseNumber}</div>
          </div>
          <div class="field">
            <div class="lbl">PAN Card Number</div>
            <div class="val" style="font-size:9.5px; font-weight:700; text-transform:uppercase;">${profile.documents.panCardNumber || 'N/A'}</div>
          </div>
          <div class="field">
            <div class="lbl">Bank Settlement</div>
            <div class="val" style="font-size:9.5px; font-weight:700;">${profile.bankDetails.bankName} | A/C: ******${profile.bankDetails.accountNumber.slice(-4)}</div>
          </div>
        </div>
        
        <!-- Right Side: QR Code + Barcode -->
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px;">
          <!-- Custom SVG QR Code -->
          <svg viewBox="0 0 100 100" style="width: 62px; height: 62px; background: white; padding: 4px; border-radius: 6px; border: 1.5px solid #0c548a; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <rect x="0" y="0" width="30" height="30" fill="#0c548a" />
            <rect x="5" y="5" width="20" height="20" fill="white" />
            <rect x="10" y="10" width="10" height="10" fill="#0c548a" />
            
            <rect x="70" y="0" width="30" height="30" fill="#0c548a" />
            <rect x="75" y="5" width="20" height="20" fill="white" />
            <rect x="80" y="10" width="10" height="10" fill="#0c548a" />
            
            <rect x="0" y="70" width="30" height="30" fill="#0c548a" />
            <rect x="5" y="75" width="20" height="20" fill="white" />
            <rect x="10" y="80" width="10" height="10" fill="#0c548a" />
            
            <rect x="40" y="10" width="8" height="8" fill="#0c548a" />
            <rect x="50" y="0" width="8" height="8" fill="#0c548a" />
            <rect x="40" y="40" width="8" height="8" fill="#0c548a" />
            <rect x="10" y="45" width="8" height="8" fill="#0c548a" />
            <rect x="25" y="55" width="8" height="8" fill="#0c548a" />
            <rect x="55" y="50" width="8" height="8" fill="#0c548a" />
            <rect x="75" y="45" width="8" height="8" fill="#0c548a" />
            <rect x="85" y="55" width="8" height="8" fill="#0c548a" />
            <rect x="45" y="75" width="8" height="8" fill="#0c548a" />
            <rect x="55" y="85" width="8" height="8" fill="#0c548a" />
            <rect x="80" y="80" width="8" height="8" fill="#0c548a" />
            <rect x="90" y="70" width="8" height="8" fill="#0c548a" />
          </svg>
          <div style="font-size: 6px; font-weight: 800; color: #0c548a; font-family:'Outfit',sans-serif; text-transform:uppercase;">EAT Scan Verify</div>
        </div>
        
      </div>
      
      <!-- Permanent Address full width -->
      <div class="field" style="margin-top: 2px;">
        <div class="lbl">Permanent Address</div>
        <div class="val" style="font-size:9px; line-height:1.2; color:#334155;">${profile.personalDetails.permanentAddress}</div>
      </div>
      
      <!-- Signature Strip & Validity info -->
      <div style="display:grid; grid-template-columns: 1.5fr 1fr; gap:10px; align-items: center; margin-top:2px;">
        <div class="field">
          <div class="lbl">Signature Verification</div>
          <div class="signature-strip" style="height:26px; margin:2px 0; padding:2px;">
            <span class="sig-text" style="font-size:12px; line-height:1;">${profile.personalDetails.fullName.toLowerCase()}</span>
            <span class="signature-label" style="font-size:5px;">Employee Signature</span>
          </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:2px;">
          <div style="font-size: 6.5px; font-weight: 800; color: #64748b; text-transform: uppercase;">Joining Date</div>
          <div style="font-size: 8px; font-weight: 800; color: #0f172a;">14-May-2026</div>
          <div style="font-size: 6.5px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-top: 1px;">Card Validity</div>
          <div style="font-size: 8px; font-weight: 800; color: #10b981;">13-May-2028</div>
        </div>
      </div>
      
      <!-- Emergency & Barcode row -->
      <div style="display:grid; grid-template-columns: 1.5fr 1fr; gap:10px; align-items: center; margin-top:2px;">
        <div class="emergency" style="padding:4px 8px; margin:0; height:32px; display:flex; flex-direction:column; justify-content:center;">
          <div class="etitle" style="font-size:6.5px; font-weight:800; margin-bottom:1px;">⚠ Emergency Contact</div>
          <div class="eval" style="font-size:8px; line-height:1.1;">Sh. Balvir Singh (Father)<br/>+91-8894-825152</div>
        </div>
        
        <!-- CSS Barcode -->
        <div style="display:flex; flex-direction:column; align-items:center; gap:1px;">
          <div style="display:flex; height:18px; align-items:stretch;">
            <div style="width:2px; background:black; margin-right:1px;"></div>
            <div style="width:1px; background:black; margin-right:2px;"></div>
            <div style="width:3px; background:black; margin-right:1px;"></div>
            <div style="width:1px; background:black; margin-right:1px;"></div>
            <div style="width:2px; background:black; margin-right:2px;"></div>
            <div style="width:1px; background:black; margin-right:1px;"></div>
            <div style="width:3px; background:black; margin-right:1px;"></div>
            <div style="width:2px; background:black; margin-right:1px;"></div>
            <div style="width:1px; background:black; margin-right:2px;"></div>
            <div style="width:3px; background:black; margin-right:1px;"></div>
            <div style="width:1px; background:black; margin-right:1px;"></div>
            <div style="width:2px; background:black; margin-right:1px;"></div>
          </div>
          <span style="font-size:6px; font-family:monospace; font-weight:800; color:#334155;">*EL602*</span>
        </div>
      </div>
    </div>
    
    <div class="back-footer">
      <div>
        <div class="bf-bold">ENGLABS INDIA PVT LTD</div>
        <div class="bf-text">1021-1022, Second Floor, Disha Arcade,<br>MDC Sector 4, Panchkula, Haryana 134114</div>
      </div>
      <div style="text-align:right;">
        <div class="bf-text" style="margin-bottom:2px;">If found, return to HR</div>
        <div class="bf-bold">info@englabs.co.in</div>
      </div>
    </div>
  </div>

  <button class="no-print" onclick="window.print()" style="margin-top:12px; padding:12px 36px; background:#0e4368; color:#fff; border:none; border-radius:12px; font-size:14px; font-weight:900; cursor:pointer; letter-spacing:.05em; box-shadow: 0 4px 12px rgba(14,67,104,0.2); transition:all 0.2s;">🖨️  Print ID Card</button>
</div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=480,height=900');
    if (win) {
        win.document.write(html);
        win.document.close();
    }
};

export const HRDocuments: React.FC = () => {
    const profiles = porterProfiles as unknown as PorterProfile[];
    const [selectedIdx, setSelectedIdx] = useState(0);
    const profile = profiles[selectedIdx];

    if (!profile) {
        return (
            <div className="p-8 text-center text-slate-500 font-bold">
                No Porter staff profiles found.
            </div>
        );
    }

    const joiningFormatted = profile.joiningDate
        ? new Date(profile.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
        : 'May 14, 2026';

    const shareOnWhatsApp = (type: 'appointment' | 'joining') => {
        let text = '';
        if (type === 'appointment') {
            text = `*Englabs India Private Limited - Appointment Letter*\n\n` +
                   `• *Employee Name:* ${profile.personalDetails.fullName}\n` +
                   `• *Designation:* Logistics Associate (Porter Team)\n` +
                   `• *Compensation:* ₹${profile.salary}/month + ₹${profile.ratePerKm}/km Allowance\n` +
                   `• *Date of Joining:* ${joiningFormatted}\n\n` +
                   `View / Download PDF Letter: http://localhost:3001/api/staff/pdf?type=appointment`;
        } else {
            text = `*Englabs India Private Limited - Joining Report*\n\n` +
                   `• *Employee Name:* ${profile.personalDetails.fullName}\n` +
                   `• *Designation:* Logistics Associate (Porter Team)\n` +
                   `• *Reporting Date:* ${joiningFormatted} (Forenoon)\n` +
                   `• *Status:* Verified & Joined\n\n` +
                   `View / Download PDF Report: http://localhost:3001/api/staff/pdf?type=joining`;
        }
        
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="space-y-10">
            {/* Staff Selector Row */}
            <div className="flex items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Logistics Staff:</span>
                <div className="flex gap-2 flex-wrap">
                    {profiles.map((p, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedIdx(idx)}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                                selectedIdx === idx
                                    ? 'bg-[#0e4368] text-white border-transparent shadow-md'
                                    : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
                            }`}
                        >
                            {p.porterName}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main 3D Styled Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Photo & Base Info */}
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.01)] flex flex-col items-center text-center">
                    <div className="relative group w-44 h-44 mb-6">
                        {/* 3D Border Effect */}
                        <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-emerald-500 to-teal-400 p-[3px] shadow-lg shadow-emerald-500/10">
                            <div className="w-full h-full bg-white rounded-[2.3rem] overflow-hidden">
                                {profile.photo ? (
                                    <img 
                                        src="/api/staff/photo" 
                                        alt={profile.porterName} 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                                        <User className="w-16 h-16 text-slate-300" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{profile.personalDetails.fullName}</h2>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-500/10">
                        Logistics Associate
                    </p>

                    <div className="w-full border-t border-slate-50 my-6"></div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 w-full">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Base Salary</span>
                            <span className="text-base font-black text-[#0e4368]">₹{profile.salary.toLocaleString()}/mo</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Porter Allowance</span>
                            <span className="text-base font-black text-[#0e4368]">₹{profile.ratePerKm}/km</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left col-span-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Date of Joining</span>
                            <span className="text-sm font-black text-emerald-600">{joiningFormatted}</span>
                        </div>
                    </div>
                </div>

                {/* Middle Column: Personal & Contact Details */}
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.01)] flex flex-col gap-6 lg:col-span-2">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2.5 border-b border-slate-50 pb-4">
                        <Briefcase className="w-5 h-5 text-emerald-500" /> Profile & Document Verification
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Personal info fields */}
                        <div className="space-y-4">
                            <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Father's Name</span>
                                <span className="text-sm font-bold text-slate-800">{profile.personalDetails.fatherName}</span>
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Date of Birth</span>
                                <span className="text-sm font-bold text-slate-800">{profile.personalDetails.dob}</span>
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1"><Phone className="w-3 h-3"/>Contact Number</span>
                                <span className="text-sm font-bold text-slate-800">{profile.personalDetails.mobile}</span>
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1"><CreditCard className="w-3 h-3"/> Bank Account Details</span>
                                <span className="text-sm font-bold text-slate-800">
                                    {profile.bankDetails.bankName}<br/>
                                    A/C: {profile.bankDetails.accountNumber} ({profile.bankDetails.accountType})<br/>
                                    IFSC: {profile.bankDetails.ifscCode}
                                </span>
                            </div>
                        </div>

                        {/* Address & Verified Documents checklist */}
                        <div className="space-y-4">
                            <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> Addresses</span>
                                <span className="text-xs font-bold text-slate-800 block mb-1">
                                    <span className="text-slate-400 font-black">Current:</span> {profile.personalDetails.currentAddress}
                                </span>
                                <span className="text-xs font-bold text-slate-800 block">
                                    <span className="text-slate-400 font-black">Permanent:</span> {profile.personalDetails.permanentAddress}
                                </span>
                            </div>

                            <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Document Verification Checklist</span>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100/50 px-3 py-2 rounded-xl">
                                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <div>
                                            <span className="text-[9px] font-bold text-slate-400 block">Aadhaar Card</span>
                                            <span className="text-[10px] font-black text-slate-700 block truncate max-w-[120px]">{profile.documents.aadhaarNumber}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100/50 px-3 py-2 rounded-xl">
                                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <div>
                                            <span className="text-[9px] font-bold text-slate-400 block">PAN Card</span>
                                            <span className="text-[10px] font-black text-slate-700 block truncate max-w-[120px]">{profile.documents.panCardNumber}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100/50 px-3 py-2 rounded-xl">
                                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <div>
                                            <span className="text-[9px] font-bold text-slate-400 block">Driving License</span>
                                            <span className="text-[10px] font-black text-slate-700 block truncate max-w-[120px]">{profile.documents.drivingLicenseNumber}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100/50 px-3 py-2 rounded-xl">
                                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <div>
                                            <span className="text-[9px] font-bold text-slate-400 block">Education Docs</span>
                                            <span className="text-[10px] font-black text-slate-700 block">PSEB Matric/12th</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Letters + ID Card Generation Center */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.01)]">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2.5 border-b border-slate-50 pb-4 mb-6">
                    <Layers className="w-5 h-5 text-emerald-500" /> HR Documents Generation & Sharing
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Appointment Letter Action Card */}
                    <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl relative overflow-hidden group hover:border-[#0e4368]/30 transition-all flex flex-col justify-between min-h-[180px]">
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-500/10">ACTIVE LETTER</span>
                            </div>
                            <h4 className="text-lg font-black text-slate-900">Appointment Letter</h4>
                            <p className="text-xs font-bold text-slate-500 mt-1">Official letter outlining terms, salary, kilometer allowance, duties, and acceptance clause.</p>
                            <p className="text-[10px] font-black text-emerald-600 mt-2">Joining: {joiningFormatted}</p>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <a 
                                href="/api/staff/pdf?type=appointment" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer text-center"
                            >
                                <ExternalLink className="w-4 h-4" /> View PDF
                            </a>
                            <button
                                onClick={() => shareOnWhatsApp('appointment')}
                                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer border-transparent"
                            >
                                <Share2 className="w-4 h-4" /> Share WhatsApp
                            </button>
                        </div>
                    </div>

                    {/* Joining Letter Action Card */}
                    <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl relative overflow-hidden group hover:border-[#0e4368]/30 transition-all flex flex-col justify-between min-h-[180px]">
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-500/10">ACTIVE LETTER</span>
                            </div>
                            <h4 className="text-lg font-black text-slate-900">Joining Report</h4>
                            <p className="text-xs font-bold text-slate-500 mt-1">Formal joining report stating acceptance of offer, date, forenoon reporting, and office verification.</p>
                            <p className="text-[10px] font-black text-emerald-600 mt-2">Reported: {joiningFormatted} (FN)</p>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <a 
                                href="/api/staff/pdf?type=joining" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer text-center"
                            >
                                <ExternalLink className="w-4 h-4" /> View PDF
                            </a>
                            <button
                                onClick={() => shareOnWhatsApp('joining')}
                                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer border-transparent"
                            >
                                <Share2 className="w-4 h-4" /> Share WhatsApp
                            </button>
                        </div>
                    </div>

                    {/* ID Card Action Card */}
                    <div className="bg-gradient-to-br from-[#0a2d4a] to-[#1a6ea8] border border-[#0e4368]/50 p-6 rounded-3xl relative overflow-hidden group hover:shadow-xl hover:shadow-[#0e4368]/20 transition-all flex flex-col justify-between min-h-[180px]">
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-3 bg-white/10 text-white rounded-2xl">
                                    <BadgeCheck className="w-6 h-6" />
                                </div>
                                <span className="text-[9px] font-black text-white/80 bg-white/10 px-2 py-0.5 rounded-md border border-white/15">PRINTABLE</span>
                            </div>
                            <h4 className="text-lg font-black text-white">Employee ID Card</h4>
                            <p className="text-xs font-bold text-white/60 mt-1">Professional dual-sided ID card with photo, details, blood group, emergency contact. Ready to print.</p>
                            <p className="text-[10px] font-black text-emerald-300 mt-2">EL/PT/2026/001 · {joiningFormatted}</p>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => printIDCard(profile)}
                                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-100 text-[#0e4368] rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer border-transparent"
                            >
                                <Printer className="w-4 h-4" /> Print / Save PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
