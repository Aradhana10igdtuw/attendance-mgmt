import { db } from "./firebase"
import { collection, addDoc } from "firebase/firestore"

const subjects = [
  { name: "Design and Analysis of Algorithms", code: "BCS201", teacher: "Prof. Sweta" },
  { name: "Operating Systems", code: "BIT204", teacher: "Prof. Kalpana" },
  { name: "Software Engineering", code: "BIT205", teacher: "Prof. R.K Singh" },
  { name: "Cloud Computing", code: "BIT207", teacher: "Prof. Deepika" },
  { name: "Fundamentals of DevOps", code: "BIT208", teacher: "Dr. Praveen" },
]

const attendance = [
  // BCS201 - 4/6 = 67% (red)
  { studentId: "test@igdtuw.ac.in", subjectCode: "BCS201", date: "2024-01-15", present: true },
  { studentId: "test@igdtuw.ac.in", subjectCode: "BCS201", date: "2024-01-17", present: true },
  { studentId: "test@igdtuw.ac.in", subjectCode: "BCS201", date: "2024-01-19", present: false },
  { studentId: "test@igdtuw.ac.in", subjectCode: "BCS201", date: "2024-01-22", present: true },
  { studentId: "test@igdtuw.ac.in", subjectCode: "BCS201", date: "2024-01-24", present: false },
  { studentId: "test@igdtuw.ac.in", subjectCode: "BCS201", date: "2024-01-26", present: true },
  // BIT204 - 4/4 = 100% (green)
  { studentId: "test@igdtuw.ac.in", subjectCode: "BIT204", date: "2024-01-15", present: true },
  { studentId: "test@igdtuw.ac.in", subjectCode: "BIT204", date: "2024-01-17", present: true },
  { studentId: "test@igdtuw.ac.in", subjectCode: "BIT204", date: "2024-01-19", present: true },
  { studentId: "test@igdtuw.ac.in", subjectCode: "BIT204", date: "2024-01-22", present: true },
  // BIT205 - 3/4 = 75% (green)
  { studentId: "test@igdtuw.ac.in", subjectCode: "BIT205", date: "2024-01-15", present: true },
  { studentId: "test@igdtuw.ac.in", subjectCode: "BIT205", date: "2024-01-17", present: false },
  { studentId: "test@igdtuw.ac.in", subjectCode: "BIT205", date: "2024-01-19", present: true },
  { studentId: "test@igdtuw.ac.in", subjectCode: "BIT205", date: "2024-01-22", present: true },
  // BIT206 - 2/4 = 50% (red)
  { studentId: "test@igdtuw.ac.in", subjectCode: "BIT207", date: "2024-01-15", present: false },
  { studentId: "test@igdtuw.ac.in", subjectCode: "BIT207", date: "2024-01-17", present: false },
  { studentId: "test@igdtuw.ac.in", subjectCode: "BIT207", date: "2024-01-19", present: true },
  { studentId: "test@igdtuw.ac.in", subjectCode: "BIT207", date: "2024-01-22", present: true },
  // BIT208 - 5/5 = 100% (green)
  { studentId: "test@igdtuw.ac.in", subjectCode: "BIT208", date: "2024-01-15", present: true },
  { studentId: "test@igdtuw.ac.in", subjectCode: "BIT208", date: "2024-01-17", present: true },
  { studentId: "test@igdtuw.ac.in", subjectCode: "BIT208", date: "2024-01-19", present: true },
  { studentId: "test@igdtuw.ac.in", subjectCode: "BIT208", date: "2024-01-22", present: true },
  { studentId: "test@igdtuw.ac.in", subjectCode: "BIT208", date: "2024-01-24", present: true },
]

export async function seedDatabase() {
  console.log("Seeding subjects...")
  for (const subject of subjects) {
    await addDoc(collection(db, "subjects"), subject)
  }
  console.log("Seeding attendance...")
  for (const record of attendance) {
    await addDoc(collection(db, "attendance"), record)
  }
  console.log("Done! All data seeded.")
}