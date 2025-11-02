/**
 * Parse CSV content into test case objects
 * @param {string} csvContent - Raw CSV content from the Python backend
 * @returns {Array} Array of test case objects
 */
export const parseCSVToTestCases = (csvContent) => {
  if (!csvContent) return [];

  try {
    const lines = csvContent.trim().split('\n');
    console.log('🔍 CSV Parser - Total lines:', lines.length);
    console.log('🔍 CSV Parser - First few lines:', lines.slice(0, 3));
    
    // Find header line
    const headerIndex = lines.findIndex(line => 
      line.toLowerCase().includes('testid') || 
      line.toLowerCase().includes('test id') || 
      line.toLowerCase().includes('title')
    );
    
    console.log('🔍 CSV Parser - Header index:', headerIndex);
    
    if (headerIndex === -1) {
      console.warn('No valid CSV header found');
      return [];
    }

    const headers = lines[headerIndex].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataLines = lines.slice(headerIndex + 1);
    
    console.log('🔍 CSV Parser - Headers:', headers);
    console.log('🔍 CSV Parser - Data lines count:', dataLines.length);
    
    const testCases = [];
    
    for (const line of dataLines) {
      // Skip empty lines or metadata lines
      if (!line.trim() || line.startsWith('---') || line.includes('METADATA')) {
        continue;
      }
      
      // Parse CSV line (handle quoted values)
      const values = parseCSVLine(line);
      
      if (values.length < headers.length) {
        continue; // Skip incomplete lines
      }
      
      // Map values to headers
      const testCase = {};
      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        // Map header names to standard property names
        switch (header.toLowerCase()) {
          case 'testid':
          case 'test id':
            testCase.id = value;
            break;
          case 'title':
            testCase.title = value;
            break;
          case 'steps':
            // Parse steps - could be numbered list or pipe-separated
            if (value.includes('|')) {
              testCase.steps = value.split('|').map(s => s.trim());
            } else if (value.includes('\n')) {
              testCase.steps = value.split('\n').map(s => s.trim().replace(/^\d+\.\s*/, ''));
            } else {
              testCase.steps = [value];
            }
            break;
          case 'expected result':
          case 'expected':
            testCase.expected = value;
            break;
          case 'priority':
            testCase.priority = value || 'Medium';
            break;
          case 'category':
            testCase.category = value || 'Functional';
            break;
          case 'type':
            testCase.type = value || 'Smoke';
            break;
          case 'quality score':
            // Extract numeric score from format like "7.5/10"
            const scoreMatch = value.match(/(\d+\.?\d*)/);
            testCase.qualityScore = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
            break;
          default:
            testCase[header.toLowerCase().replace(/\s+/g, '_')] = value;
        }
      });
      
      // Only add test cases with required fields
      if (testCase.id && testCase.title) {
        testCases.push(testCase);
        console.log('🔍 CSV Parser - Added test case:', { id: testCase.id, title: testCase.title });
      } else {
        console.log('🔍 CSV Parser - Skipped test case (missing id/title):', { id: testCase.id, title: testCase.title, rawValues: values });
      }
    }
    
    console.log('🔍 CSV Parser - Final test cases count:', testCases.length);
    return testCases;
    
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return [];
  }
};

/**
 * Parse a single CSV line handling quoted values
 * @param {string} line - CSV line to parse
 * @returns {Array} Array of field values
 */
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  
  return result;
};

/**
 * Generate sample test cases for testing UI
 * @returns {Array} Array of sample test case objects
 */
export const generateSampleTestCases = () => {
  return [
    {
      id: 'TC-001',
      title: 'User Login with Valid Credentials',
      steps: [
        'Navigate to login page',
        'Enter valid username',
        'Enter valid password',
        'Click login button'
      ],
      expected: 'User should be successfully logged in and redirected to dashboard',
      priority: 'High',
      category: 'Functional',
      type: 'Smoke',
      qualityScore: 8.5
    },
    {
      id: 'TC-002',
      title: 'User Login with Invalid Password',
      steps: [
        'Navigate to login page',
        'Enter valid username',
        'Enter invalid password',
        'Click login button'
      ],
      expected: 'Error message should be displayed indicating invalid credentials',
      priority: 'High',
      category: 'Functional',
      type: 'Sanity',
      qualityScore: 7.8
    },
    {
      id: 'TC-003',
      title: 'Password Reset Functionality',
      steps: [
        'Navigate to login page',
        'Click "Forgot Password" link',
        'Enter registered email address',
        'Click submit button',
        'Check email for reset instructions'
      ],
      expected: 'Password reset email should be sent with valid reset link',
      priority: 'Medium',
      category: 'Functional',
      type: 'Unit',
      qualityScore: 7.2
    }
  ];
};