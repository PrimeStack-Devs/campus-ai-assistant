# Parul Campus Assistant — Response Formatting Guide

This document shows exactly what the LLM produces for each query type,
and how it renders on each frontend.

---

## Query Type: Location
**Example query:** "Where is CV Raman Centre?"

### Markdown Output (Next.js)
```markdown
## 🏢 C.V. Raman Centre — A25

**Zone:** North-Central  |  **Floors:** 7

**What's here:**
- Parul Institute of Computer Application (BCA)
- Parul Institute of Engineering & Technology (BTech CS/IT)
- System Support Cell & Data Centre
- Tinkering Hub / FAB LAB

## 🗺️ Getting There
From the Main Gate, walk straight in past PU Circle and head north
along the main campus road. Pass C1 Admin Block, Watcher's Park, and
Greenzy Food Court. CV Raman Centre (A25) will be on your left — just
past Bhagat Singh Bhawan (A24).

**Walking time:** ~10 min (~820m from Main Gate)

**Nearby buildings:** A24 (N Block), A23 (SCB Bhawan), A26 (24 Frames Studio)
```

### Plain Text Output (React Native)
```
CV RAMAN CENTRE — A25

Zone: North-Central  |  Floors: 7

WHAT'S HERE
  • Parul Institute of Computer Application (BCA)
  • Parul Institute of Engineering & Technology (BTech CS/IT)
  • System Support Cell & Data Centre
  • Tinkering Hub / FAB LAB

GETTING THERE
From the Main Gate, walk straight in past PU Circle and head north
along the main campus road. Pass C1 Admin Block, Watcher's Park, and
Greenzy Food Court. CV Raman Centre (A25) will be on your left.

Walking time: ~10 min (~820m from Main Gate)
Nearby buildings: A24 (N Block), A23 (SCB Bhawan), A26 (24 Frames Studio)
```

---

## Query Type: Directions
**Example query:** "How do I get to the swimming pool?"

### Markdown Output (Next.js)
```markdown
## 🗺️ How to Reach the Swimming Pool (S1)

From the Main Gate, walk north along the main campus road past C1 and
the central academic zone. Continue east through the hostel area — the
pool is near Shakuntala Bhawan (H23) in the east zone.

| Detail | Info |
|--------|------|
| 🚶 Walking time | ~15 minutes |
| 📏 Distance | ~1,200 metres |
| 🏁 Starting point | Main Entry Gate |

**Landmarks along the way:** C1 Admin Block → A25 CV Raman → A12 Medical Sciences → S1 Swimming Pool

> 💡 Tip: Separate entry slots for boys and girls — check timings before heading there.
```

### Plain Text Output (React Native)
```
HOW TO REACH THE SWIMMING POOL (S1)

From the Main Gate, walk north along the main campus road past C1 and
the central academic zone. Continue east through the hostel area.

  Walking time  •  ~15 minutes
  Distance  •  ~1,200 metres
  Starting point  •  Main Entry Gate

Landmarks: C1 Admin Block → A25 CV Raman → A12 Medical Sciences → S1 Swimming Pool

⚠ Tip: Separate entry slots for boys and girls — check timings before heading there.
```

---

## Query Type: Person / Faculty
**Example query:** "Who is the HOD of MCA?"

### Markdown Output (Next.js)
```markdown
## 👤 Dr. Kavita Gupta

| Field | Details |
|-------|---------|
| **Designation** | Head of Department (HOD) |
| **Department** | Master of Computer Application (MCA) |
| **Building** | C.V. Raman Centre (A25) |
| **Floor & Room** | Floor 5, Room 501 |
| **Email** | hod.mca@paruluniversity.ac.in |
| **Phone** | 02668-260404 |

**Subjects Taught:** Advanced Java, Distributed Systems

> 📌 Office hours are typically Mon–Sat, 9:00 AM – 5:00 PM unless otherwise noted.
```

### Plain Text Output (React Native)
```
DR. KAVITA GUPTA

Designation  •  Head of Department (HOD)
Department  •  Master of Computer Application (MCA)
Building  •  C.V. Raman Centre (A25)
Floor & Room  •  Floor 5, Room 501
Email  •  hod.mca@paruluniversity.ac.in
Phone  •  02668-260404

Subjects Taught: Advanced Java, Distributed Systems

⚠ Office hours are typically Mon–Sat, 9:00 AM – 5:00 PM unless otherwise noted.
```

---

## Query Type: Service / Facility
**Example query:** "What are the library timings?"

### Markdown Output (Next.js)
```markdown
## 🏢 Central Library

📍 **Location:** Administrative Block C1, Floor 1

## ⏰ Timings

| Day | Hours |
|-----|-------|
| Monday – Saturday | 7:00 AM – 8:00 PM |
| Sunday | 9:30 AM – 4:30 PM |
| National Holidays | Closed |

## ✅ What's Available
- 216,637+ books across all disciplines
- Digital resources, e-journals, NPTEL access
- Photocopying and printing services
- Dedicated reading rooms

## 📋 Rules & Requirements
> ⚠️ University ID card is mandatory for entry.
- Mobile phones must be on silent
- Food and beverages are not allowed inside
- Maximum 3 books can be borrowed at a time (15-day period)

📞 **Contact:** 02668-260510 | 📧 library@paruluniversity.ac.in
```

### Plain Text Output (React Native)
```
CENTRAL LIBRARY

📍 Location: Administrative Block C1, Floor 1

TIMINGS

Monday – Saturday  •  7:00 AM – 8:00 PM
Sunday  •  9:30 AM – 4:30 PM
National Holidays  •  Closed

WHAT'S AVAILABLE
  • 216,637+ books across all disciplines
  • Digital resources, e-journals, NPTEL access
  • Photocopying and printing services
  • Dedicated reading rooms

RULES & REQUIREMENTS
⚠ University ID card is mandatory for entry.
  • Mobile phones must be on silent
  • Food and beverages are not allowed inside
  • Maximum 3 books can be borrowed at a time (15-day period)

📞 Contact: 02668-260510 | 📧 library@paruluniversity.ac.in
```

---

## Query Type: Policy / Rules
**Example query:** "What is the attendance policy?"

### Markdown Output (Next.js)
```markdown
## 📋 Attendance Policy

> ⚠️ **Minimum 75% attendance is mandatory** in each subject to appear in semester exams.

### What This Means
Attendance is calculated subject-wise, not overall. Even if your overall
attendance is good, falling short in one subject gets you detained for
that specific exam.

### Consequences
- Below **75%** → Detained from that subject's exam
- Below **65%** → Not eligible for condonation at all

### Exceptions / Condonation Process
- Attendance between **65%–74%**: Apply for condonation with medical/valid documents
- Submit to your **HOD** + **Exam Section** within the notified deadline
- Condonation is not a right — granted at the university's discretion

### Where to Go
📍 **Exam Section** — Administrative Block C1, Floor 1
📞 02668-260502 | 📧 exam@paruluniversity.ac.in
```

### Plain Text Output (React Native)
```
ATTENDANCE POLICY

⚠ Minimum 75% attendance is mandatory in each subject to appear in semester exams.

WHAT THIS MEANS
Attendance is calculated subject-wise, not overall. Even if your overall
attendance is good, falling short in one subject gets you detained for that exam.

CONSEQUENCES
  • Below 75% → Detained from that subject's exam
  • Below 65% → Not eligible for condonation at all

EXCEPTIONS / CONDONATION PROCESS
  • Attendance between 65%–74%: Apply for condonation with medical/valid documents
  • Submit to your HOD + Exam Section within the notified deadline
  • Condonation is not a right — granted at the university's discretion

WHERE TO GO
📍 Exam Section — Administrative Block C1, Floor 1
📞 02668-260502 | 📧 exam@paruluniversity.ac.in
```

---

## API Response Shape

```json
{
  "success": true,
  "sessionId": "session_123",
  "reply": "## 👤 Dr. Kavita Gupta\n\n| Field | Details |\n...",
  "replyPlain": "DR. KAVITA GUPTA\n\nDesignation  •  HOD\n...",
  "data": { "type": "place_bundle", ... },
  "queryType": "person",
  "source": "local",
  "timestamp": "2026-03-30T12:00:00.000Z"
}
```

## Frontend Usage

### Next.js (Web)
```jsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // for tables

<ReactMarkdown remarkPlugins={[remarkGfm]}>
  {response.reply}
</ReactMarkdown>
```

### React Native (Mobile)
```jsx
// Use replyPlain directly in a Text component
<Text style={styles.message}>{response.replyPlain}</Text>

// Or use a library like react-native-marked for partial markdown support
```

---

## Notes for Developers

1. Always use `reply` for web, `replyPlain` for mobile.
2. Guardrail responses (`source: "guardrail"`) look the same in both — emoji + plain text.
3. If you add a new query type in `guardrails.js`, add a matching FORMAT_ template in `prompts.js`.
4. The `stripMarkdown` function in `formatResponse.js` is pure — no dependencies, easy to test.
