// Convert flat data structure into organized student data

// Initialize the data namespace if it doesn't exist
window.IsakhaData = window.IsakhaData || {};

// Performance monitoring
window.IsakhaData.performance = {
    loadStartTime: 0,
    loadEndTime: 0,
    processingStartTime: 0,
    processingEndTime: 0,
    recordCount: 0
};

// UI Elements
let loadingOverlay;
let progressBar;
let recordsLoaded;
let memoryUsage;
let loadingTime;

// Initialize UI elements
function initializeUI() {
    loadingOverlay = document.querySelector('.loading-overlay');
    progressBar = document.querySelector('.progress-fill');
    recordsLoaded = document.querySelector('.records-loaded');
    memoryUsage = document.querySelector('.memory-usage');
    loadingTime = document.querySelector('.loading-time');
}

// Update loading UI
function updateLoadingUI(loaded, total, currentMemory, elapsedTime) {
    if (!loadingOverlay) initializeUI();
    
    const progress = (loaded / total) * 100;
    progressBar.style.width = `${progress}%`;
    recordsLoaded.textContent = `Records loaded: ${loaded} of ${total}`;
    memoryUsage.textContent = `Memory usage: ${currentMemory.toFixed(2)} MB`;
    loadingTime.textContent = `Loading time: ${elapsedTime.toFixed(0)} ms`;
}

// Show/hide loading overlay
function toggleLoadingOverlay(show) {
    if (!loadingOverlay) initializeUI();
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

// Check if cached data is still valid (less than 1 hour old)
function isCacheValid() {
    const cacheTimestamp = localStorage.getItem('studentDataTimestamp');
    if (!cacheTimestamp) return false;
    
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
    return (Date.now() - parseInt(cacheTimestamp)) < oneHour;
}

// Load and process the student data
async function loadData() {
    try {
        // Check cache first
        if (isCacheValid()) {
            const cachedData = localStorage.getItem('studentData');
            if (cachedData) {
                console.log('Using cached data');
                IsakhaData.processedData = JSON.parse(cachedData);
                return IsakhaData.processedData;
            }
        }

        // Start timing and show loading UI
        IsakhaData.performance.loadStartTime = performance.now();
        toggleLoadingOverlay(true);
        
        console.log('Starting data load...');
        const response = await fetch('../data/student-data.json');
        if (!response.ok) {
            throw new Error('Failed to load student data');
        }

        const reader = response.body.getReader();
        const contentLength = +response.headers.get('Content-Length');

        let receivedLength = 0;
        let chunks = [];
        
        while(true) {
            const {done, value} = await reader.read();
            
            if (done) {
                break;
            }
            
            chunks.push(value);
            receivedLength += value.length;
            
            // Update progress
            const currentTime = performance.now();
            const elapsedTime = currentTime - IsakhaData.performance.loadStartTime;
            updateLoadingUI(
                receivedLength,
                contentLength,
                receivedLength / (1024 * 1024),
                elapsedTime
            );
        }
        
        // Combine chunks and parse JSON
        const chunksAll = new Uint8Array(receivedLength);
        let position = 0;
        for(let chunk of chunks) {
            chunksAll.set(chunk, position);
            position += chunk.length;
        }
        
        const rawData = JSON.parse(new TextDecoder().decode(chunksAll));
        IsakhaData.performance.loadEndTime = performance.now();
        IsakhaData.performance.recordCount = rawData.length;
        
        console.log(`Data loaded: ${rawData.length} records`);
        console.log(`Load time: ${(IsakhaData.performance.loadEndTime - IsakhaData.performance.loadStartTime).toFixed(2)}ms`);
        
        // Start processing
        console.log('Processing data...');
        IsakhaData.performance.processingStartTime = performance.now();
        
        // Process the raw data into a more usable format
        IsakhaData.processedData = {};
        
        // Process in chunks of 1000 records
        const chunkSize = 1000;
        for(let i = 0; i < rawData.length; i += chunkSize) {
            const chunk = rawData.slice(i, i + chunkSize);
            
            await new Promise(resolve => {
                setTimeout(() => {
                    chunk.forEach(record => {
                        const studentId = record.student_id;
                        const semesterNum = parseInt(record.semester);
                        
                        if (!IsakhaData.processedData[studentId]) {
                            IsakhaData.processedData[studentId] = {
                                studentInfo: {
                                    name: record.name,
                                    program: record.program,
                                    batch: record.batch
                                },
                                results: {}
                            };
                        }

                        if (!IsakhaData.processedData[studentId].results[semesterNum]) {
                            IsakhaData.processedData[studentId].results[semesterNum] = [];
                        }

                        // Check if course already exists for this semester
                        const existingCourse = IsakhaData.processedData[studentId].results[semesterNum].find(
                            course => course.courseCode === record.course_code
                        );

                        // Only add if course doesn't exist
                        if (!existingCourse) {
                            IsakhaData.processedData[studentId].results[semesterNum].push({
                                courseCode: record.course_code,
                                courseTitle: record.course_title,
                                creditHours: record.credit_hours,
                                grade: record.grade,
                                gradePoint: record.grade_point
                            });
                        }
                    });
                    
                    // Update progress
                    const currentTime = performance.now();
                    const elapsedTime = currentTime - IsakhaData.performance.loadStartTime;
                    const processedCount = Math.min(i + chunkSize, rawData.length);
                    updateLoadingUI(
                        processedCount,
                        rawData.length,
                        JSON.stringify(IsakhaData.processedData).length / (1024 * 1024),
                        elapsedTime
                    );
                    
                    resolve();
                }, 0);
            });
        }
        
        IsakhaData.performance.processingEndTime = performance.now();
        
        const loadTime = IsakhaData.performance.loadEndTime - IsakhaData.performance.loadStartTime;
        const processTime = IsakhaData.performance.processingEndTime - IsakhaData.performance.processingStartTime;
        const totalTime = loadTime + processTime;
        
        console.log('Performance Summary:');
        console.log(`Total records: ${IsakhaData.performance.recordCount}`);
        console.log(`Load time: ${loadTime.toFixed(2)}ms`);
        console.log(`Process time: ${processTime.toFixed(2)}ms`);
        console.log(`Total time: ${totalTime.toFixed(2)}ms`);
        console.log(`Memory used: ~${(JSON.stringify(IsakhaData.processedData).length / 1024 / 1024).toFixed(2)}MB`);
        
        // Cache the processed data
        try {
            localStorage.setItem('studentData', JSON.stringify(IsakhaData.processedData));
            localStorage.setItem('studentDataTimestamp', Date.now().toString());
            console.log('Data cached successfully');
        } catch (e) {
            console.warn('Failed to cache data:', e);
        }
        
        // Hide loading overlay
        toggleLoadingOverlay(false);
        
        return IsakhaData.processedData;
    } catch (error) {
        console.error('Error loading student data:', error);
        toggleLoadingOverlay(false);
        throw error;
    }
}

// Export the load function
window.IsakhaData.loadData = loadData;
