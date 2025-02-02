// Global variable to store student data
let processedData = null;

// Load and process data
async function loadStudentData() {
    try {
        if (processedData) return true; // Return cached data if available
        
        processedData = await IsakhaData.loadData();
        if (processedData && Object.keys(processedData).length > 0) {
            console.log('Data loaded successfully');
            console.log('Available Student IDs:', Object.keys(processedData));
            return true;
        }
        throw new Error('No student data available');
    } catch (error) {
        console.error('Error in loadStudentData:', error);
        throw error;
    }
}

// Helper function to calculate semester GPA
function calculateSemesterGPA(results) {
    let totalPoints = 0;
    let totalCredits = 0;

    results.forEach(result => {
        totalPoints += result.gradePoint * result.creditHours;
        totalCredits += result.creditHours;
    });

    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
}

// Helper function to get grade information
function getGradeInfo(gpa) {
    const gpaNum = parseFloat(gpa);
    
    // Handle ranges from highest to lowest
    if (gpaNum >= 4.0) return { grade: 'A+', description: 'Outstanding' };
    if (gpaNum >= 3.75 && gpaNum < 4.0) return { grade: 'A', description: 'Excellent' };
    if (gpaNum >= 3.5 && gpaNum < 3.75) return { grade: 'A-', description: 'Very Good' };
    if (gpaNum >= 3.25 && gpaNum < 3.5) return { grade: 'B+', description: 'Good' };
    if (gpaNum >= 3.0 && gpaNum < 3.25) return { grade: 'B', description: 'Above Average' };
    if (gpaNum >= 2.75 && gpaNum < 3.0) return { grade: 'B-', description: 'Average' };
    if (gpaNum >= 2.5 && gpaNum < 2.75) return { grade: 'C+', description: 'Below Average' };
    if (gpaNum >= 2.25 && gpaNum < 2.5) return { grade: 'C', description: 'Poor' };
    if (gpaNum >= 2.0 && gpaNum < 2.25) return { grade: 'D', description: 'Passing' };
    return { grade: 'F', description: 'Fail' };
}

// Helper function to get color based on GPA
function getGPAColor(gpa) {
    const gpaNum = parseFloat(gpa);
    if (gpaNum >= 3.75) return '#2ecc71';  // Green for A+ and A
    if (gpaNum >= 3.25) return '#27ae60';  // Darker green for A- and B+
    if (gpaNum >= 2.75) return '#f1c40f';  // Yellow for B and B-
    if (gpaNum >= 2.25) return '#e67e22';  // Orange for C+ and C
    if (gpaNum >= 2.0) return '#d35400';   // Dark orange for D
    return '#e74c3c';                      // Red for F
}

// Helper function to get color based on grade
function getGradeColor(grade) {
    switch (grade) {
        case 'A+': return '#2ecc71';
        case 'A': return '#2ecc71';
        case 'A-': return '#27ae60';
        case 'B+': return '#27ae60';
        case 'B': return '#f1c40f';
        case 'B-': return '#f1c40f';
        case 'C+': return '#e67e22';
        case 'C': return '#e67e22';
        case 'D': return '#d35400';
        case 'F': return '#e74c3c';
        default: return '#7f8c8d';
    }
}

// Helper function to calculate CGPA
function calculateCGPA(student, currentSemester) {
    let totalPoints = 0;
    let totalCredits = 0;

    // Calculate for all semesters up to and including current semester
    for (let sem = 1; sem <= currentSemester; sem++) {
        if (student.results[sem]) {
            student.results[sem].forEach(result => {
                totalPoints += result.gradePoint * result.creditHours;
                totalCredits += result.creditHours;
            });
        }
    }

    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
}

// Helper function to show errors
function showError(message) {
    clearErrors();
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    const searchContainer = document.querySelector('.search-container');
    const searchForm = searchContainer.querySelector('.search-form');
    searchForm.insertAdjacentElement('afterend', errorDiv);
}

// Helper function to clear errors
function clearErrors() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(error => error.remove());
}

async function checkResult() {
    try {
        // Clear any existing errors and results
        clearErrors();
        const resultContainer = document.getElementById('result-container');
        resultContainer.classList.add('hidden');

        const studentId = document.getElementById('studentId').value.trim();
        const batch = document.getElementById('batch').value;
        const semester = parseInt(document.getElementById('semester').value);

        // Step 1: Validate required fields
        if (!studentId || !batch || !semester) {
            showError('Please fill in all fields (Student ID, Batch, and Semester)');
            return;
        }

        // Step 2: Load student data if needed
        if (!processedData) {
            try {
                // Show loading indicator
                const loadingDiv = document.createElement('div');
                loadingDiv.className = 'loading-message';
                loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading student data...';
                document.querySelector('.search-container').appendChild(loadingDiv);
                
                await loadStudentData();
                loadingDiv.remove();
            } catch (error) {
                showError('Failed to load student data. Please refresh the page and try again.');
                return;
            }
        }

        // Step 3: Find student (direct object lookup - O(1) operation)
        const student = processedData[studentId];
        if (!student) {
            showError('No student found with the given Student ID');
            return;
        }

        // Step 4: Validate batch (direct string comparison - O(1) operation)
        if (student.studentInfo.batch !== batch) {
            showError(`This ID belongs to batch ${student.studentInfo.batch}. Please select the correct batch.`);
            return;
        }

        // Step 5: Check if semester exists and has results (direct array access - O(1) operation)
        if (!student.results[semester] || student.results[semester].length === 0) {
            showError(`No results found for semester ${semester}`);
            return;
        }

        // All validations passed - Show Results
        resultContainer.classList.remove('hidden');

        // Calculate semester GPA (single pass through results - O(n) where n is number of courses)
        const semesterGPA = calculateSemesterGPA(student.results[semester]);
        const { grade, description } = getGradeInfo(semesterGPA);

        // Display student information (template literal - single operation)
        const studentDetails = document.getElementById('student-details');
        studentDetails.innerHTML = `
            <div class="info-grid">
                <div class="info-item">
                    <h3>Name</h3>
                    <p>${student.studentInfo.name}</p>
                </div>
                <div class="info-item">
                    <h3>Student ID</h3>
                    <p>${studentId}</p>
                </div>
                <div class="info-item">
                    <h3>Program</h3>
                    <p>${student.studentInfo.program}</p>
                </div>
                <div class="info-item">
                    <h3>Batch</h3>
                    <p>${student.studentInfo.batch}</p>
                </div>
            </div>
        `;

        // Sort results by course code (single sort operation)
        const sortedResults = [...student.results[semester]].sort((a, b) => 
            a.courseCode.localeCompare(b.courseCode)
        );

        // Calculate total credit hours (single reduce operation)
        const totalCreditHours = sortedResults.reduce((sum, result) => sum + result.creditHours, 0);

        // Build results HTML in memory before inserting into DOM
        const resultHTML = `
            <div class="semester-info">
                <div class="results-table-wrapper">
                    <table class="results-table">
                        <thead>
                            <tr>
                                <th>Course Code</th>
                                <th>Course Title</th>
                                <th>Credit Hours</th>
                                <th>Grade</th>
                                <th>Grade Point</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sortedResults.map(result => `
                                <tr>
                                    <td>${result.courseCode}</td>
                                    <td>${result.courseTitle}</td>
                                    <td>${result.creditHours}</td>
                                    <td><span class="grade" style="color: ${getGradeColor(result.grade)}">${result.grade}</span></td>
                                    <td>${result.gradePoint.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="semester-summary">
                    <div class="summary-grid">
                        <div class="summary-item">
                            <h4>Total Courses</h4>
                            <p>${sortedResults.length}</p>
                        </div>
                        <div class="summary-item">
                            <h4>Total Credit Hours</h4>
                            <p>${totalCreditHours}</p>
                        </div>
                        <div class="summary-item">
                            <h4>CGPA</h4>
                            <p style="color: ${getGPAColor(calculateCGPA(student, semester))}">${calculateCGPA(student, semester)}</p>
                        </div>
                        <div class="summary-item">
                            <h4>Grade</h4>
                            <p style="color: ${getGPAColor(calculateCGPA(student, semester))}">${getGradeInfo(calculateCGPA(student, semester)).grade}</p>
                        </div>
                    </div>
                    <div class="grade-description">
                        <p><strong>Performance:</strong> ${getGradeInfo(calculateCGPA(student, semester)).description}</p>
                    </div>
                </div>
            </div>
        `;

        // Single DOM update
        const resultBody = document.getElementById('result-body');
        resultBody.innerHTML = resultHTML;

        // Make result container visible and scroll to it
        resultContainer.style.display = 'block';
        resultContainer.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Error in checkResult:', error);
        showError('An unexpected error occurred while checking results. Please try again.');
    }
}

// Function to handle printing
function handlePrint() {
    const printButton = document.getElementById('printBtn');
    const originalContent = printButton.innerHTML;
    
    printButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Printing...';
    window.print();
    
    // Reset button text after printing
    setTimeout(() => {
        printButton.innerHTML = originalContent;
    }, 800);
}

// Initialize the application
function initializeApp() {
    // Load student data when the page loads
    loadStudentData().catch(error => {
        console.error('Failed to load student data:', error);
        showError('Failed to load student data. Please refresh the page and try again.');
    });

    // Add event listener for the search button
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', checkResult);
    }
}

// Test function for grade calculations
function testGradeCalculations() {
    const testCases = [
        // Test boundary values
        { gpa: 4.0, expected: 'A+' },
        { gpa: 3.99, expected: 'A' },
        { gpa: 3.75, expected: 'A' },
        { gpa: 3.74, expected: 'A-' },
        { gpa: 3.5, expected: 'A-' },
        { gpa: 3.49, expected: 'B+' },
        { gpa: 3.25, expected: 'B+' },
        { gpa: 3.24, expected: 'B' },
        { gpa: 3.0, expected: 'B' },
        { gpa: 2.99, expected: 'B-' },
        { gpa: 2.75, expected: 'B-' },
        { gpa: 2.74, expected: 'C+' },
        { gpa: 2.5, expected: 'C+' },
        { gpa: 2.49, expected: 'C' },
        { gpa: 2.25, expected: 'C' },
        { gpa: 2.24, expected: 'D' },
        { gpa: 2.0, expected: 'D' },
        { gpa: 1.99, expected: 'F' },
        { gpa: 0.0, expected: 'F' },
        
        // Test additional values within ranges
        { gpa: 4.1, expected: 'A+' },
        { gpa: 3.85, expected: 'A' },
        { gpa: 3.6, expected: 'A-' },
        { gpa: 3.4, expected: 'B+' },
        { gpa: 3.1, expected: 'B' },
        { gpa: 2.9, expected: 'B-' },
        { gpa: 2.6, expected: 'C+' },
        { gpa: 2.4, expected: 'C' },
        { gpa: 2.1, expected: 'D' },
        { gpa: 1.5, expected: 'F' }
    ];

    let hasErrors = false;
    
    testCases.forEach(test => {
        const result = getGradeInfo(test.gpa);
        if (result.grade !== test.expected) {
            console.error(
                `Grade Calculation Error - GPA: ${test.gpa.toFixed(2)} | ` +
                `Expected: ${test.expected} | ` +
                `Got: ${result.grade}`
            );
            hasErrors = true;
        }
    });
    
    if (!hasErrors) {
        console.log('✓ All grade calculations are correct');
    }
}

// Run tests when document is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeApp();
        testGradeCalculations();
    });
} else {
    initializeApp();
    testGradeCalculations();
}
