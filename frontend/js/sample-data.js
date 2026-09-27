/**
 * sample-data.js
 * ---------------------------------------------------------------
 * Bundled demo dataset so the frontend works with zero backend setup
 * (open index.html directly). Mirrors backend/data/tasks.json exactly —
 * all 4 hand-curated tasks — so api.js behaves the same in demo mode
 * as it would talking to a live server.
 * ---------------------------------------------------------------
 */
window.SAMPLE_TASKS = [
  {
    "id": "register-small-business-in",
    "title": "Register a small business",
    "location": "India",
    "summary": "The path from an idea to a legally registered small business, covering entity registration, tax IDs, and local licenses. Steps in the same column can be done in any order or in parallel.",
    "steps": [
      {
        "id": "choose-entity-type",
        "title": "Choose a business structure",
        "office": "Not a filing step — a decision",
        "description": "Decide between sole proprietorship, partnership, LLP, or private limited company. This choice determines which forms you'll file next, so it comes first.",
        "documentsNeeded": [],
        "fee": "No fee",
        "estimatedTime": "Varies",
        "eligibility": "Everyone starting a business",
        "sourceUrl": "https://www.startupindia.gov.in/content/sih/en/registration.html",
        "lastVerifiedAt": "2026-08-01",
        "dependsOn": [],
        "status": "published"
      },
      {
        "id": "name-approval",
        "title": "Reserve your business name",
        "office": "Ministry of Corporate Affairs (MCA), via RUN/SPICe+ Part A",
        "description": "Reserve a unique entity name so no one else can register it while you complete the rest of the process. Required for LLPs and companies; sole proprietorships can skip to GST/Udyam.",
        "documentsNeeded": [
          "2 proposed names, ranked",
          "Identity proof of applicant(s)"
        ],
        "fee": "₹1,000",
        "estimatedTime": "1–2 working days",
        "eligibility": "Required for LLP / Pvt Ltd. Not required for sole proprietorship.",
        "sourceUrl": "https://www.mca.gov.in/content/mca/global/en/mca/fo-llp-services/spice-plus.html",
        "lastVerifiedAt": "2026-07-15",
        "dependsOn": [
          "choose-entity-type"
        ],
        "status": "published"
      },
      {
        "id": "pan-application",
        "title": "Apply for a business PAN",
        "office": "Income Tax Department (via NSDL/Protean)",
        "description": "A Permanent Account Number for the business entity, required before opening a bank account or registering for GST.",
        "documentsNeeded": [
          "Certificate of incorporation (if LLP/company)",
          "Identity & address proof of proprietor/partners"
        ],
        "fee": "₹107",
        "estimatedTime": "3–5 working days",
        "eligibility": "All business types",
        "sourceUrl": "https://www.protean-tinpan.com/services/pan/pan-index.html",
        "lastVerifiedAt": "2026-08-10",
        "dependsOn": [
          "name-approval"
        ],
        "status": "published"
      },
      {
        "id": "udyam-registration",
        "title": "Register on Udyam (MSME)",
        "office": "Ministry of Micro, Small & Medium Enterprises",
        "description": "Free self-declaration registration that unlocks MSME benefits: collateral-free loans, delayed-payment protection, and tender preferences.",
        "documentsNeeded": [
          "Aadhaar of proprietor/authorised signatory",
          "PAN of the business"
        ],
        "fee": "No fee",
        "estimatedTime": "Same day (online)",
        "eligibility": "Micro, small, and medium enterprises as defined by investment/turnover limits",
        "sourceUrl": "https://udyamregistration.gov.in/",
        "lastVerifiedAt": "2026-09-01",
        "dependsOn": [
          "pan-application"
        ],
        "status": "published"
      },
      {
        "id": "bank-account",
        "title": "Open a current bank account",
        "office": "Any scheduled bank",
        "description": "A business current account is typically required before GST registration, since GST asks for bank account proof.",
        "documentsNeeded": [
          "Business PAN",
          "Certificate of incorporation or Udyam certificate",
          "Address proof"
        ],
        "fee": "Varies by bank",
        "estimatedTime": "1–3 working days",
        "eligibility": "All business types",
        "sourceUrl": "https://www.rbi.org.in/",
        "lastVerifiedAt": "2026-06-20",
        "dependsOn": [
          "pan-application"
        ],
        "status": "published"
      },
      {
        "id": "gst-registration",
        "title": "Register for GST",
        "office": "Goods and Services Tax Network (GSTN)",
        "description": "Mandatory once annual turnover crosses the threshold (₹40 lakh for goods, ₹20 lakh for services in most states), or voluntarily to claim input tax credit.",
        "documentsNeeded": [
          "PAN",
          "Bank account proof",
          "Proof of business address",
          "Photograph of proprietor/partners"
        ],
        "fee": "No fee",
        "estimatedTime": "3–7 working days",
        "eligibility": "Turnover above threshold, or voluntary registration",
        "sourceUrl": "https://www.gst.gov.in/",
        "lastVerifiedAt": "2026-08-25",
        "dependsOn": [
          "bank-account"
        ],
        "status": "published"
      },
      {
        "id": "shop-establishment-license",
        "title": "Shop & Establishment registration",
        "office": "State Labour Department / local municipal corporation",
        "description": "Required for any physical business premises (shop, office, or warehouse) within 30 days of starting operations. Rules and portals vary by state.",
        "documentsNeeded": [
          "PAN",
          "Address proof of premises",
          "Photo of the establishment"
        ],
        "fee": "₹500–₹5,000 depending on state and employee count",
        "estimatedTime": "5–10 working days",
        "eligibility": "Any business with a physical premises",
        "sourceUrl": "https://labour.gov.in/",
        "lastVerifiedAt": "2026-05-30",
        "dependsOn": [
          "pan-application"
        ],
        "status": "published"
      },
      {
        "id": "professional-tax",
        "title": "Register for Professional Tax",
        "office": "State Commercial Tax Department",
        "description": "A state-level tax on trades and professions, applicable in most but not all states (not applicable e.g. in Delhi). Needed if you plan to hire employees.",
        "documentsNeeded": [
          "PAN",
          "Shop & Establishment certificate"
        ],
        "fee": "Varies by state",
        "estimatedTime": "3–5 working days",
        "eligibility": "Applicable states only; required if hiring employees",
        "sourceUrl": "https://www.mca.gov.in/",
        "lastVerifiedAt": "2026-05-30",
        "dependsOn": [
          "shop-establishment-license"
        ],
        "status": "published"
      },
      {
        "id": "trade-license",
        "title": "Municipal trade license",
        "office": "Local municipal corporation",
        "description": "Local permission to operate a specific type of trade at your premises (separate from Shop & Establishment). Often needed for food, health, or manufacturing businesses.",
        "documentsNeeded": [
          "Shop & Establishment certificate",
          "Property tax receipt or rent agreement",
          "NOC from fire department (for some trades)"
        ],
        "fee": "₹500–₹10,000 depending on trade and city",
        "estimatedTime": "7–15 working days",
        "eligibility": "Trade-dependent — check with local municipal corporation",
        "sourceUrl": "https://www.india.gov.in/topics/business/starting-and-running-business",
        "lastVerifiedAt": "2026-04-18",
        "dependsOn": [
          "shop-establishment-license"
        ],
        "status": "published"
      }
    ]
  },
  {
    "id": "apply-passport-in",
    "title": "Apply for a passport",
    "location": "India",
    "summary": "Apply for a fresh or reissue ordinary passport through Passport Seva, including online application, fee payment, appointment scheduling, and the required visit to a Passport Seva Kendra.",
    "steps": [
      {
        "id": "passport-register",
        "title": "Register on Passport Seva",
        "office": "Passport Seva, Ministry of External Affairs",
        "description": "Create an account on the Passport Seva Online Portal and verify your registered email address.",
        "documentsNeeded": [],
        "fee": "No fee for registration",
        "estimatedTime": "Usually a few minutes",
        "eligibility": "Indian citizens applying for passport services",
        "sourceUrl": "https://passportindia.gov.in/",
        "lastVerifiedAt": "2026-09-27",
        "dependsOn": [],
        "status": "published"
      },
      {
        "id": "passport-application",
        "title": "Fill and submit passport application",
        "office": "Passport Seva Online Portal",
        "description": "Select Fresh Passport or Re-issue and complete the required applicant, family, address, emergency contact, and other details before submitting the application.",
        "documentsNeeded": [
          "Proof of present address",
          "Proof of date of birth",
          "Other documents depending on the applicant's circumstances"
        ],
        "fee": "Applicable passport service fee",
        "estimatedTime": "Varies",
        "eligibility": "Applicant must meet the requirements for the selected passport service",
        "sourceUrl": "https://passportindia.gov.in/psp/apply",
        "lastVerifiedAt": "2026-09-27",
        "dependsOn": [
          "passport-register"
        ],
        "status": "published"
      },
      {
        "id": "passport-payment",
        "title": "Pay the passport fee",
        "office": "Passport Seva Online Portal",
        "description": "After submitting the application, pay the applicable passport service fee before scheduling the appointment.",
        "documentsNeeded": [],
        "fee": "Depends on passport service and applicant category",
        "estimatedTime": "Usually a few minutes",
        "eligibility": "Submitted passport application",
        "sourceUrl": "https://passportindia.gov.in/",
        "lastVerifiedAt": "2026-09-27",
        "dependsOn": [
          "passport-application"
        ],
        "status": "published"
      },
      {
        "id": "passport-appointment",
        "title": "Schedule a Passport Seva Kendra appointment",
        "office": "Passport Seva Kendra (PSK) / Post Office Passport Seva Kendra (POPSK)",
        "description": "Choose an available appointment after payment and select the preferred Passport Seva Kendra.",
        "documentsNeeded": [
          "Application documents",
          "Appointment confirmation"
        ],
        "fee": "Included in applicable passport service fee",
        "estimatedTime": "Depends on appointment availability",
        "eligibility": "Application submitted and applicable fee paid",
        "sourceUrl": "https://passportindia.gov.in/psp/apply",
        "lastVerifiedAt": "2026-09-27",
        "dependsOn": [
          "passport-payment"
        ],
        "status": "published"
      },
      {
        "id": "passport-visit",
        "title": "Visit the Passport Seva Kendra",
        "office": "Passport Seva Kendra / POPSK",
        "description": "Attend the scheduled appointment with the required original documents. The application is processed according to Passport Seva requirements.",
        "documentsNeeded": [
          "Original supporting documents",
          "Appointment details"
        ],
        "fee": "No additional standard application fee beyond applicable service charges",
        "estimatedTime": "Depends on appointment and verification",
        "eligibility": "Applicant with a scheduled appointment",
        "sourceUrl": "https://passportindia.gov.in/psp/apply",
        "lastVerifiedAt": "2026-09-27",
        "dependsOn": [
          "passport-appointment"
        ],
        "status": "published"
      }
    ]
  },
  {
    "id": "apply-pan-in",
    "title": "Apply for a PAN card",
    "location": "India",
    "summary": "Apply for a Permanent Account Number (PAN) through an authorised PAN service provider.",
    "steps": [
      {
        "id": "pan-application",
        "title": "Submit a PAN application",
        "office": "Income Tax Department / authorised PAN service provider",
        "description": "Complete the PAN application with the required personal details and submit the required identity, address, and date-of-birth information.",
        "documentsNeeded": [
          "Proof of identity",
          "Proof of address",
          "Proof of date of birth",
          "Recent photograph where applicable"
        ],
        "fee": "Applicable PAN application fee",
        "estimatedTime": "Varies",
        "eligibility": "Individuals and eligible entities requiring a PAN",
        "sourceUrl": "https://www.incometax.gov.in/",
        "lastVerifiedAt": "2026-09-27",
        "dependsOn": [],
        "status": "published"
      }
    ]
  },
  {
    "id": "apply-driving-license-in",
    "title": "Apply for a driving licence",
    "location": "India",
    "summary": "Apply for a learner's licence and permanent driving licence through the transport department.",
    "steps": [
      {
        "id": "dl-learner-application",
        "title": "Apply for a learner's licence",
        "office": "Regional Transport Office (RTO) / Parivahan",
        "description": "Submit an application for a learner's licence through the Parivahan portal and complete the required process.",
        "documentsNeeded": [
          "Proof of identity",
          "Proof of address",
          "Proof of date of birth"
        ],
        "fee": "Applicable government fee",
        "estimatedTime": "Varies",
        "eligibility": "Applicant must meet the applicable age and eligibility requirements",
        "sourceUrl": "https://parivahan.gov.in/",
        "lastVerifiedAt": "2026-09-27",
        "dependsOn": [],
        "status": "published"
      },
      {
        "id": "dl-learner-test",
        "title": "Complete the learner's licence test",
        "office": "Regional Transport Office (RTO) / Parivahan",
        "description": "Complete the required learner's licence test according to the applicable transport department procedure.",
        "documentsNeeded": [
          "Application details",
          "Required identification documents"
        ],
        "fee": "Included in applicable licence fees",
        "estimatedTime": "Varies",
        "eligibility": "Submitted learner's licence application",
        "sourceUrl": "https://parivahan.gov.in/",
        "lastVerifiedAt": "2026-09-27",
        "dependsOn": [
          "dl-learner-application"
        ],
        "status": "published"
      },
      {
        "id": "dl-permanent-application",
        "title": "Apply for a permanent driving licence",
        "office": "Regional Transport Office (RTO) / Parivahan",
        "description": "After completing the required learner's licence period, apply for the permanent driving licence and schedule the driving test.",
        "documentsNeeded": [
          "Learner's licence",
          "Required application documents"
        ],
        "fee": "Applicable government fee",
        "estimatedTime": "Varies",
        "eligibility": "Applicant must hold a valid learner's licence and meet applicable requirements",
        "sourceUrl": "https://parivahan.gov.in/",
        "lastVerifiedAt": "2026-09-27",
        "dependsOn": [
          "dl-learner-test"
        ],
        "status": "published"
      },
      {
        "id": "dl-driving-test",
        "title": "Take the driving test",
        "office": "Regional Transport Office (RTO)",
        "description": "Attend the scheduled driving test at the designated RTO and complete the required driving assessment.",
        "documentsNeeded": [
          "Learner's licence",
          "Appointment details"
        ],
        "fee": "Applicable test fee",
        "estimatedTime": "Depends on appointment availability",
        "eligibility": "Applicant with a valid learner's licence and scheduled test",
        "sourceUrl": "https://parivahan.gov.in/",
        "lastVerifiedAt": "2026-09-27",
        "dependsOn": [
          "dl-permanent-application"
        ],
        "status": "published"
      }
    ]
  }
];
