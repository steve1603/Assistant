// process-data.js - Script for processing and analyzing data
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    const command = process.argv[2] || '';
    const details = process.argv[3] || '';
    const issueNumber = process.argv[4] || '';
    
    console.log(`Processing data based on: ${command}`);
    
    // Create a temporary analysis file
    const analysisRequest = `
# Data Analysis Request

**Command:** ${command}
**Details:** ${details}

## Analysis Needed:
Please analyze any relevant data from the repository. The type of analysis needed appears to be:
${determineAnalysisType(command + ' ' + details)}

## Context:
This analysis was requested through the Butler AI Assistant.
    `;
    
    // Create a temporary file for the analysis request
    fs.writeFileSync('analysis-request.md', analysisRequest);
    
    // Request the analysis from the AI
    const analysis = await requestDataAnalysis(command + ' ' + details);
    
    // Generate a timestamp-based filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `data-analysis-${timestamp}.md`;
    const filePath = path.join('analysis', fileName);
    
    // Ensure the analysis directory exists
    if (!fs.existsSync('analysis')) {
      fs.mkdirSync('analysis', { recursive: true });
    }
    
    // Write the analysis to a file
    fs.writeFileSync(filePath, analysis);
    
    // Write the response to the standard response file
    fs.writeFileSync('response.md', `## Data Analysis Complete

I've processed your data analysis request. You can find the full analysis here: [${fileName}](${filePath})

### Analysis Preview

${analysis.substring(0, 500)}${analysis.length > 500 ? '...' : ''}

---
*Generated by Butler AI Assistant on ${new Date().toLocaleDateString()}*`);
    
    // Signal that we should commit changes
    fs.writeFileSync('commit_changes', 'true');
    
    console.log('Data analysis completed successfully');
  } catch (error) {
    console.error('Error processing data:', error);
    fs.writeFileSync('response.md', `## Butler AI Assistant Error

I apologize, but I encountered an error processing your data:

\`\`\`
${error.message}
\`\`\``);
  }
}

function determineAnalysisType(text) {
  // Look for common analysis keywords in the request
  const analysisTypes = [
    { keyword: /\bsummarize\b|\bsummary\b/i, type: 'Summary analysis of the data' },
    { keyword: /\btrend\b|\bpattern\b|\bover time\b/i, type: 'Trend analysis to identify patterns over time' },
    { keyword: /\bcompare\b|\bcomparison\b|\bversus\b|\bvs\b/i, type: 'Comparative analysis between different data sets or periods' },
    { keyword: /\bpredict\b|\bforecast\b|\bproject\b/i, type: 'Predictive analysis or forecasting future values' },
    { keyword: /\bstatistic\b|\baverage\b|\bmean\b|\bmedian\b|\bstd\b|\bdeviation\b/i, type: 'Statistical analysis' },
    { keyword: /\bcorrelation\b|\brelationship\b|\bcause\b|\beffect\b/i, type: 'Correlation analysis to identify relationships' },
    { keyword: /\bsegment\b|\bcluster\b|\bcategori\b|\bclassify\b/i, type: 'Segmentation or clustering analysis' },
    { keyword: /\banomaly\b|\boutlier\b|\bdeviation\b|\bunusual\b/i, type: 'Anomaly detection' }
  ];
  
  const matchedTypes = [];
  
  for (const { keyword, type } of analysisTypes) {
    if (keyword.test(text)) {
      matchedTypes.push(type);
    }
  }
  
  if (matchedTypes.length === 0) {
    return 'General data analysis and insights';
  }
  
  return matchedTypes.join('\n');
}

async function requestDataAnalysis(request) {
  // Try OpenAI first, fall back to Anthropic if needed
  try {
    return await analyzeDataWithOpenAI(request);
  } catch (error) {
    console.error('Error with OpenAI, falling back to Anthropic:', error.message);
    return await analyzeDataWithAnthropic(request);
  }
}

async function analyzeDataWithOpenAI(request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured');
  }
  
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are Butler, a sophisticated AI assistant that specializes in data analysis.
                   You speak formally and professionally, like a British butler.
                   You're analyzing data based on the provided request.
                   Provide a comprehensive analysis in Markdown format, including:
                   - A clear title and introduction
                   - Summary of the data assessed
                   - Key findings and insights
                   - Recommendations based on the analysis
                   - Any limitations of the analysis
                   
                   Since you don't have direct access to data files, make reasonable assumptions about 
                   what data might be available in a typical business context related to this request.
                   Be creative but realistic in your analysis.`
        },
        {
          role: 'user',
          content: `Please perform a data analysis based on this request: "${request}"`
        }
      ],
      temperature: 0.7,
      max_tokens: 2500
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    }
  );
  
  return response.data.choices[0].message.content;
}

async function analyzeDataWithAnthropic(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Anthropic API key is not configured');
  }
  
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-3-haiku-20240307',
      max_tokens: 2500,
      system: `You are Butler, a sophisticated AI assistant that specializes in data analysis.
              You speak formally and professionally, like a British butler.
              You're analyzing data based on the provided request.
              Provide a comprehensive analysis in Markdown format, including:
              - A clear title and introduction
              - Summary of the data assessed
              - Key findings and insights
              - Recommendations based on the analysis
              - Any limitations of the analysis
              
              Since you don't have direct access to data files, make reasonable assumptions about 
              what data might be available in a typical business context related to this request.
              Be creative but realistic in your analysis.`,
      messages: [
        {
          role: 'user',
          content: `Please perform a data analysis based on this request: "${request}"`
        }
      ]
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    }
  );
  
  return response.data.content[0].text;
}

main();
