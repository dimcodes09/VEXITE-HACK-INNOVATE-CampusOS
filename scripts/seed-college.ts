import "dotenv/config";
import { config } from "dotenv";
import mongoose from "mongoose";
import { resolve } from "node:path";
import { connectToDatabase } from "../lib/db";
import { CollegeModel } from "../models/College";

config({ path: resolve(process.cwd(), ".env.local") });

const collegeName = "Demo Institute of Technology";

const policyChunks = [
  {
    section: "Attendance & Exam Eligibility",
    text:
      "Students must maintain at least 75% attendance in each registered course to be eligible for the end-semester examination. Attendance is calculated course-wise, not as a semester average, and is frozen 14 calendar days before the first end-semester examination. A student with 65% to 74% attendance may apply once per semester for condonation with documented medical or official-event evidence. Attendance below 65% in any course results in detention from that course's end-semester examination."
  },
  {
    section: "Hackathon/Event Participation",
    text:
      "Participation in an external hackathon, competition, or technical event during teaching days requires written approval from the faculty mentor and Head of Department at least 7 calendar days before departure. Approved institute-representative participation may receive attendance credit for a maximum of 2 teaching days per semester, provided the student submits the participation certificate within 3 working days of return. Absences beyond the approved period are counted as regular absences and do not receive attendance credit."
  },
  {
    section: "Assignment Submission",
    text:
      "Assignments must be submitted through the designated course portal by 11:59 PM on the published due date. Submissions made within 24 hours after the deadline incur a 10% deduction from the awarded marks; submissions made between 24 and 48 hours late incur a 25% deduction. Work submitted more than 48 hours late receives zero marks unless a documented medical emergency is approved by the course instructor before grading begins."
  },
  {
    section: "Internal Exam Rules",
    text:
      "Each theory course has two internal assessments worth 20 marks each. Students must attempt both assessments and score at least 16 out of the combined 40 internal marks to remain eligible for the end-semester examination. An absence is recorded as zero. A make-up assessment is permitted only for hospitalization, bereavement, or an officially approved institute event when supporting documents are submitted within 3 working days; the make-up must be completed within 7 days of the original assessment."
  }
];

async function seedCollege() {
  try {
    await connectToDatabase();

    const college = await CollegeModel.findOneAndUpdate(
      { name: collegeName },
      {
        $setOnInsert: {
          name: collegeName,
          policyChunks,
          createdAt: new Date()
        }
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    console.log(`Demo college _id: ${college._id.toString()}`);
  } finally {
    await mongoose.disconnect();
  }
}

seedCollege().catch((error: unknown) => {
  console.error("Failed to seed demo college:", error);
  process.exitCode = 1;
});
