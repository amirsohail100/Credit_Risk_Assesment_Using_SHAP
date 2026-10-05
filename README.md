# Credit Ledger — Loan Risk Assessment

An underwriting desk for consumer loan applications. Credit Ledger takes an applicant's profile, loan request and credit bureau details, and returns the **probability that the applicant will default**, along with a clear **high / low risk verdict**.

The backend (API) and the frontend (UI) are served from the **same server**, so a single command is enough to run the whole app locally.

---

## Screenshots

### Landing view

The form the user sees when they open the website.

![Credit Ledger — input form](assets/ui/1.png)

### Prediction result

The result panel shown after the user clicks **Assess risk**.

![Credit Ledger — prediction result](assets/ui/2.png)

---

## Features

- **Default probability prediction** for a loan application, shown on an animated gauge.
- **High / Low risk verdict** with a stamp badge, a plain-language summary and a threshold meter.
- **Margin to threshold**: how many points the probability sits above or below the decision threshold.
- **Auto-calculated loan-to-income ratio** (can be manually overridden).
- **Interactive form**: number steppers, custom keyboard-friendly dropdowns, amount shown in Lakh / Crore, and inline validation.
- **Copy summary** button to copy the assessment result.
- **Live service status** indicator in the header.
- Responsive layout that works on desktop and mobile.

---
