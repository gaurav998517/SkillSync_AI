# Codebase Audit & Security Assessment - SkillSync AI

This document details the codebase audit of the backend, classifying findings by severity and detailing implemented or recommended remediations.

---

## 1. Summary of Findings

| ID | Finding | Severity | Component | Status |
| :--- | :--- | :--- | :--- | :--- |
| **AUD-01** | Plaintext Password Storage | **CRITICAL** | User Management | **FIXED** (Bcrypt Hashing & Legacy Auto-Migration) |
| **AUD-02** | Missing Route Authentication & JWT validation | **HIGH** | Routing / Security | **FIXED** (authMiddleware.js integrated) |
| **AUD-03** | Missing Resource Ownership Check | **HIGH** | Authorization | **FIXED** (ownerMiddleware.js integrated) |
| **AUD-04** | Vulnerable File Upload (Path/MIME/Executable Tricks) | **HIGH** | Upload Handling | **FIXED** (Magic number header verification) |
| **AUD-05** | Firestore Serial Query Querying in loops | **HIGH** | Database / Scale | **RECOMMENDED REMEDIATION** (Parallelize queries) |
| **AUD-06** | Cold-Start Model Latency | **MEDIUM** | Model Serving | **FIXED** (Preloading & warm-up inference) |
| **AUD-07** | Memory Leak Risk in Embedding Cache Map | **MEDIUM** | Model Serving | **FIXED** (Bound cache size with clean limit) |
| **AUD-08** | Global Rate Limiting and Endpoint Abuse | **MEDIUM** | Security / DDoS | **FIXED** (Helmet + rate limiter added) |

---

## 2. Detailed Breakdown & Remediations

### AUD-01: Plaintext Password Storage
- **Severity**: **CRITICAL**
- **Vulnerability**: Passwords were saved exactly as sent by the client. Any compromise of the Firestore database would leak all user passwords.
- **Remediation**: Reconfigured `authController.js` to hash all user passwords using `bcryptjs` with salt round 10. Added auto-upgrade logic during login to securely hash plaintext legacy passwords without lockouts.

### AUD-02: Missing Route Authentication
- **Severity**: **HIGH**
- **Vulnerability**: Sensitive routes under `/api/users/*`, `/api/resume/*`, and `/api/match/*` were completely open and accessible without validating any JWT tokens.
- **Remediation**: Implemented `verifyToken` middleware in `authMiddleware.js` which verifies the token via `jsonwebtoken` against `JWT_SECRET`. Applied this middleware across all protected endpoints.

### AUD-03: Resource Ownership Check (Bypassing Authorization)
- **Severity**: **HIGH**
- **Vulnerability**: Even if a token was validated, a user (e.g. `userA`) could request endpoints of `userB` (like `/api/users/userB/profile`) and read or modify private profiles and saved jobs.
- **Remediation**: Created `ownerMiddleware.js` to match the authenticated user's ID (`req.user._id`) against the parameter target ID (`req.params.userId`). Restricted resume evaluation to matching owners, unless the actor has a `recruiter` role.

### AUD-04: Vulnerable File Upload Handler
- **Severity**: **HIGH**
- **Vulnerability**: Uploads were validated solely on file extension. A malicious attacker could rename an executable (`payload.exe` -> `payload.pdf`) or use a double extension (`payload.pdf.exe`) to bypass filters and execute scripts.
- **Remediation**: Developed `uploadValidator.js` which reads the first 4 bytes of files (magic numbers) to verify actual file signatures (`%PDF` for PDFs and `PK\x03\x04` for DOCX). Rejected double extensions and deleted offending files immediately from local storage.

### AUD-05: Firestore Serial Querying in Loops
- **Severity**: **HIGH**
- **Vulnerability**: Inside `userController.js:53` (retrieving saved jobs list):
  ```javascript
  const savedJobs = [];
  for (const jobId of (user.savedJobs || [])) {
      const job = await Job.findById(jobId); // Serial, blocking await
      if (job) savedJobs.push(job);
  }
  ```
  This performs blocking network roundtrips one by one. If a user has 30 saved jobs, this requires 30 sequential HTTP calls, causing severe database bottlenecks.
- **Remediation (Recommended)**: Refactor to execute queries concurrently using `Promise.all`:
  ```javascript
  const jobPromises = (user.savedJobs || []).map(jobId => Job.findById(jobId));
  const results = await Promise.all(jobPromises);
  const savedJobs = results.filter(Boolean);
  ```

### AUD-06 & AUD-07: Model Latency and Cache Memory Leaks
- **Severity**: **MEDIUM**
- **Vulnerability**: Embedding computation suffered from cold-starts, causing latency spikes on the first user request. Further, the in-memory cache grew boundlessly, presenting a denial-of-service memory-exhaustion vector.
- **Remediation**: Added a `preloadModel` routine to load and run a warm-up inference of the pipeline model during Express startup. Enforced a cache size limit of 2000 unique records; exceeding this bound triggers cache clearance to reclaim memory.
