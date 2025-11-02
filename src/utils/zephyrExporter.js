/**
 * Convert test cases to Zephyr CSV format
 * Based on the example Zephyr CSV structure provided
 */

/**
 * Convert test case data to Zephyr CSV format
 * @param {Array} testCases - Array of test case objects
 * @returns {string} CSV content in Zephyr format
 */
export const convertToZephyrCSV = (testCases) => {
  // Zephyr CSV columns based on the example
  const zephyrHeaders = [
    'Name',
    'Status', 
    'Precondition',
    'Objective',
    'Folder',
    'Priority',
    'Component',
    'Labels',
    'Owner',
    'Estimated Time',
    'Coverage (Issues)',
    'Coverage (Pages)',
    'Test Script (Step-by-Step) - Step',
    'Test Script (Step-by-Step) - Test Data',
    'Test Script (Step-by-Step) - Expected Result',
    'Test Script (Plain Text)',
    'Test Script (BDD)'
  ];

  // Convert test cases to Zephyr format
  const zephyrRows = testCases.map(testCase => {
    // Combine steps into a single string with numbering
    const stepText = Array.isArray(testCase.steps) 
      ? testCase.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')
      : testCase.steps || '';

    // Convert test data if available (placeholder for now)
    const testData = testCase.testData || '';

    // Expected result
    const expectedResult = testCase.expected || '';

    // Create plain text script combining steps and expected result
    const plainTextScript = `Steps:\n${stepText}\n\nExpected Result:\n${expectedResult}`;

    // Generate BDD format (basic Gherkin structure)
    const bddScript = generateBDDScript(testCase);

    return [
      escapeCSVField(testCase.title || ''), // Name
      'Approved', // Status - default to Approved
      '', // Precondition - could be mapped from test case if available
      escapeCSVField(testCase.title || ''), // Objective - use title as objective
      '/Test Cases', // Folder - default folder
      testCase.priority || 'Medium', // Priority
      testCase.category || 'Functional', // Component
      formatLabels(testCase), // Labels
      '', // Owner - empty for now
      estimateTime(testCase), // Estimated Time
      '', // Coverage (Issues) - empty for now
      '', // Coverage (Pages) - empty for now
      escapeCSVField(stepText), // Test Script (Step-by-Step) - Step
      escapeCSVField(testData), // Test Script (Step-by-Step) - Test Data
      escapeCSVField(expectedResult), // Test Script (Step-by-Step) - Expected Result
      escapeCSVField(plainTextScript), // Test Script (Plain Text)
      escapeCSVField(bddScript) // Test Script (BDD)
    ];
  });

  // Combine headers and rows
  const csvContent = [
    zephyrHeaders.join(','),
    ...zephyrRows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
};

/**
 * Escape CSV field values to handle commas, quotes, and newlines
 * @param {string} field - Field value to escape
 * @returns {string} Escaped field value
 */
const escapeCSVField = (field) => {
  if (!field) return '';
  
  const stringField = String(field);
  
  // If field contains comma, newline, or quotes, wrap in quotes and escape internal quotes
  if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  
  return stringField;
};

/**
 * Format labels from test case properties
 * @param {Object} testCase - Test case object
 * @returns {string} Formatted labels
 */
const formatLabels = (testCase) => {
  const labels = [];
  
  if (testCase.category) {
    labels.push(testCase.category);
  }
  
  if (testCase.type) {
    labels.push(testCase.type);
  }
  
  return labels.join(', ');
};

/**
 * Estimate time based on test case complexity
 * @param {Object} testCase - Test case object
 * @returns {string} Estimated time
 */
const estimateTime = (testCase) => {
  if (!testCase.steps) return '';
  
  const stepCount = Array.isArray(testCase.steps) ? testCase.steps.length : 1;
  
  // Basic estimation: 2 minutes per step, minimum 5 minutes
  const estimatedMinutes = Math.max(stepCount * 2, 5);
  
  if (estimatedMinutes >= 60) {
    const hours = Math.floor(estimatedMinutes / 60);
    const minutes = estimatedMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  
  return `${estimatedMinutes}m`;
};

/**
 * Generate BDD (Behavior Driven Development) script in Gherkin format
 * @param {Object} testCase - Test case object
 * @returns {string} BDD script in Gherkin format
 */
const generateBDDScript = (testCase) => {
  if (!testCase.steps || !Array.isArray(testCase.steps)) {
    return '';
  }

  const scenario = `Scenario: ${testCase.title || 'Test Scenario'}\n`;
  
  let bddSteps = '';
  
  testCase.steps.forEach((step, index) => {
    const stepText = step.trim();
    let keyword = 'And ';
    
    // Determine BDD keyword based on step content
    if (index === 0) {
      keyword = 'Given ';
    } else if (stepText.toLowerCase().includes('click') || 
               stepText.toLowerCase().includes('enter') || 
               stepText.toLowerCase().includes('select') ||
               stepText.toLowerCase().includes('submit')) {
      keyword = 'When ';
    } else if (stepText.toLowerCase().includes('verify') || 
               stepText.toLowerCase().includes('should') ||
               stepText.toLowerCase().includes('check')) {
      keyword = 'Then ';
    }
    
    bddSteps += `  ${keyword}${stepText}\n`;
  });
  
  // Add expected result as final Then step
  if (testCase.expected) {
    bddSteps += `  Then ${testCase.expected}\n`;
  }
  
  return scenario + bddSteps;
};

/**
 * Download CSV file with proper filename
 * @param {string} csvContent - CSV content to download
 * @param {string} filename - Optional filename
 */
export const downloadZephyrCSV = (csvContent, filename = null) => {
  const defaultFilename = `testcases-zephyr-${new Date().toISOString().split('T')[0]}.csv`;
  const finalFilename = filename || defaultFilename;
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', finalFilename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};