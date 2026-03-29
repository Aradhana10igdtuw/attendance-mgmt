import { db } from "./firebase"
import { collection, addDoc } from "firebase/firestore"

export const marksData = [
  {
    studentId: "test@igdtuw.ac.in",
    subjectCode: "BCS201",
    subjectName: "Design and Analysis of Algorithms",
    midSem: 11,
    midSemMax: 15,
    internals: 8,
    internalsMax: 10,
    practicals: 12,
    practicalsMax: 15,
    endTerm: null,
    endTermMax: 60,
  },
  {
    studentId: "test@igdtuw.ac.in",
    subjectCode: "BIT204",
    subjectName: "Operating Systems",
    midSem: 13,
    midSemMax: 15,
    internals: 9,
    internalsMax: 10,
    practicals: 14,
    practicalsMax: 15,
    endTerm: null,
    endTermMax: 60,
  },
  {
    studentId: "test@igdtuw.ac.in",
    subjectCode: "BIT205",
    subjectName: "Software Engineering",
    midSem: 10,
    midSemMax: 15,
    internals: 7,
    internalsMax: 10,
    practicals: 11,
    practicalsMax: 15,
    endTerm: null,
    endTermMax: 60,
  },
  {
    studentId: "test@igdtuw.ac.in",
    subjectCode: "BIT206",
    subjectName: "Statistical Modeling",
    midSem: 9,
    midSemMax: 15,
    internals: 6,
    internalsMax: 10,
    practicals: 10,
    practicalsMax: 15,
    endTerm: null,
    endTermMax: 60,
  },
  {
    studentId: "test@igdtuw.ac.in",
    subjectCode: "BIT208",
    subjectName: "Fundamentals of DevOps",
    midSem: 14,
    midSemMax: 15,
    internals: 10,
    internalsMax: 10,
    practicals: 15,
    practicalsMax: 15,
    endTerm: null,
    endTermMax: 60,
  },
]

export async function seedMarks() {
  console.log("Seeding marks...")
  for (const record of marksData) {
    await addDoc(collection(db, "marks"), record)
  }
  console.log("Marks seeded!")
}