// Student data stored directly in JavaScript
const rawData = [
  {
    "student_id": "LAW2023001",
    "name": "John Doe",
    "program": "Bachelor of Laws (LLB Honours)",
    "batch": "Spring 2023",
    "semester": "1",
    "course_code": "LLB101",
    "course_title": "Jurisprudence and Legal Theory",
    "credit_hours": 3,
    "grade": "A",
    "grade_point": 2.4
  },
  {
    "student_id": "LAW2023001",
    "name": "John Doe",
    "program": "Bachelor of Laws (LLB Honours)",
    "batch": "Spring 2023",
    "semester": "1",
    "course_code": "LLB102",
    "course_title": "Law of Contract and Partnership",
    "credit_hours": 3,
    "grade": "A-",
    "grade_point": 2.4
  },
  {
    "student_id": "LAW2023001",
    "name": "John Doe",
    "program": "Bachelor of Laws (LLB Honours)",
    "batch": "Spring 2023",
    "semester": "1",
    "course_code": "LLB103",
    "course_title": "Muslim Law-I",
    "credit_hours": 3,
    "grade": "B+",
    "grade_point": 3.0
  },
  {
    "student_id": "LAW2023001",
    "name": "John Doe",
    "program": "Bachelor of Laws (LLB Honours)",
    "batch": "Spring 2023",
    "semester": "1",
    "course_code": "LLB104",
    "course_title": "Legal System of Bangladesh",
    "credit_hours": 3,
    "grade": "B",
    "grade_point": 2.5
  }
];

// Process the raw data into a more usable format
let processedData = {};

rawData.forEach(record => {
    const semesterNum = parseInt(record.semester); // Convert semester to number
    
    if (!processedData[record.student_id]) {
        processedData[record.student_id] = {
            studentInfo: {
                name: record.name,
                program: record.program,
                batch: record.batch
            },
            results: {}
        };
    }

    if (!processedData[record.student_id].results[semesterNum]) {
        processedData[record.student_id].results[semesterNum] = [];
    }

    processedData[record.student_id].results[semesterNum].push({
        courseCode: record.course_code,
        courseTitle: record.course_title,
        creditHours: record.credit_hours,
        grade: record.grade,
        gradePoint: record.grade_point
    });
});

export default processedData;
