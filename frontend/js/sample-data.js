
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
        "documentsNeeded": ["2 proposed names, ranked", "Identity proof of applicant(s)"],
        "fee": "₹1,000",
        "estimatedTime": "1–2 working days",
        "eligibility": "Required for LLP / Pvt Ltd. Not required for sole proprietorship.",
        "sourceUrl": "https://www.mca.gov.in/content/mca/global/en/mca/fo-llp-services/spice-plus.html",
        "lastVerifiedAt": "2026-07-15",
        "dependsOn": ["choose-entity-type"],
        "status": "published"
      },
      {
        "id": "pan-application",
        "title": "Apply for a business PAN",
        "office": "Income Tax Department (via NSDL/Protean)",
        "description": "A Permanent Account Number for the business entity, required before opening a bank account or registering for GST.",
        "documentsNeeded": ["Certificate of incorporation (if LLP/company)", "Identity & address proof of proprietor/partners"],
        "fee": "₹107",
        "estimatedTime": "3–5 working days",
        "eligibility": "All business types",
        "sourceUrl": "https://www.protean-tinpan.com/services/pan/pan-index.html",
        "lastVerifiedAt": "2026-08-10",
        "dependsOn": ["name-approval"],
        "status": "published"
      },
      {
        "id": "udyam-registration",
        "title": "Register on Udyam (MSME)",
        "office": "Ministry of Micro, Small & Medium Enterprises",
        "description": "Free self-declaration registration that unlocks MSME benefits: collateral-free loans, delayed-payment protection, and tender preferences.",
        "documentsNeeded": ["Aadhaar of proprietor/authorised signatory", "PAN of the business"],
        "fee": "No fee",
        "estimatedTime": "Same day (online)",
        "eligibility": "Micro, small, and medium enterprises as defined by investment/turnover limits",
        "sourceUrl": "https://udyamregistration.gov.in/",
        "lastVerifiedAt": "2026-09-01",
        "dependsOn": ["pan-application"],
        "status": "published"
      },
      {
        "id": "bank-account",
        "title": "Open a current bank account",
        "office": "Any scheduled bank",
        "description": "A business current account is typically required before GST registration, since GST asks for bank account proof.",
        "documentsNeeded": ["Business PAN", "Certificate of incorporation or Udyam certificate", "Address proof"],
        "fee": "Varies by bank",
        "estimatedTime": "1–3 working days",
        "eligibility": "All business types",
        "sourceUrl": "https://www.rbi.org.in/",
        "lastVerifiedAt": "2026-06-20",
        "dependsOn": ["pan-application"],
        "status": "published"
      },
      {
        "id": "gst-registration",
        "title": "Register for GST",
        "office": "Goods and Services Tax Network (GSTN)",
        "description": "Mandatory once annual turnover crosses the threshold (₹40 lakh for goods, ₹20 lakh for services in most states), or voluntarily to claim input tax credit.",
        "documentsNeeded": ["PAN", "Bank account proof", "Proof of business address", "Photograph of proprietor/partners"],
        "fee": "No fee",
        "estimatedTime": "3–7 working days",
        "eligibility": "Turnover above threshold, or voluntary registration",
        "sourceUrl": "https://www.gst.gov.in/",
        "lastVerifiedAt": "2026-08-25",
        "dependsOn": ["bank-account"],
        "status": "published"
      },
      {
        "id": "shop-establishment-license",
        "title": "Shop & Establishment registration",
        "office": "State Labour Department / local municipal corporation",
        "description": "Required for any physical business premises (shop, office, or warehouse) within 30 days of starting operations. Rules and portals vary by state.",
        "documentsNeeded": ["PAN", "Address proof of premises", "Photo of the establishment"],
        "fee": "₹500–₹5,000 depending on state and employee count",
        "estimatedTime": "5–10 working days",
        "eligibility": "Any business with a physical premises",
        "sourceUrl": "https://labour.gov.in/",
        "lastVerifiedAt": "2026-05-30",
        "dependsOn": ["pan-application"],
        "status": "published"
      },
      {
        "id": "professional-tax",
        "title": "Register for Professional Tax",
        "office": "State Commercial Tax Department",
        "description": "A state-level tax on trades and professions, applicable in most but not all states (not applicable e.g. in Delhi). Needed if you plan to hire employees.",
        "documentsNeeded": ["PAN", "Shop & Establishment certificate"],
        "fee": "Varies by state",
        "estimatedTime": "3–5 working days",
        "eligibility": "Applicable states only; required if hiring employees",
        "sourceUrl": "https://www.mca.gov.in/",
        "lastVerifiedAt": "2026-05-30",
        "dependsOn": ["shop-establishment-license"],
        "status": "published"
      },
      {
        "id": "trade-license",
        "title": "Municipal trade license",
        "office": "Local municipal corporation",
        "description": "Local permission to operate a specific type of trade at your premises (separate from Shop & Establishment). Often needed for food, health, or manufacturing businesses.",
        "documentsNeeded": ["Shop & Establishment certificate", "Property tax receipt or rent agreement", "NOC from fire department (for some trades)"],
        "fee": "₹500–₹10,000 depending on trade and city",
        "estimatedTime": "7–15 working days",
        "eligibility": "Trade-dependent — check with local municipal corporation",
        "sourceUrl": "https://www.india.gov.in/topics/business/starting-and-running-business",
        "lastVerifiedAt": "2026-04-18",
        "dependsOn": ["shop-establishment-license"],
        "status": "published"
      }
    ]
  }
]
  ;
