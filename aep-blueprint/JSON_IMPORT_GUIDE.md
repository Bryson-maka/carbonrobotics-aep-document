# JSON Import/Export Feature Guide

## Overview
The JSON management feature allows you to efficiently create sections and questions by working with LLMs like ChatGPT or Claude. Instead of manually creating each section and question through the UI, you can generate them in bulk using JSON.

## Workflow

### 1. Starting a New Project
1. Navigate to `/admin` in your AEP Blueprint application
2. Scroll down to the **JSON Data Management** section
3. Click the **Template** tab
4. Click **Copy Template** to copy the JSON template to your clipboard

### 2. Working with an LLM
Share the template with your LLM along with your requirements. For example:

```
Using this JSON template, please create sections and questions for a Carbon Robotics LaserWeeder operations manual. Focus on performance metrics, system configuration, field operations, and data analysis.

[Paste the JSON template here]
```

### 3. Importing Generated Content
1. Once the LLM generates your JSON content, copy it
2. Go back to the admin page and click the **Import New** tab
3. Paste the generated JSON into the text area
4. Click **Import Sections**
5. You'll see a success toast notification, and your new sections will appear below

### 4. Viewing Current Project Data
- Click the **View Current** tab to see all your sections and questions in JSON format
- Use **Copy Current** to export your current project structure
- This is useful for:
  - Backing up your project structure
  - Sharing with team members
  - Using as a base for generating additional content

## JSON Structure

### Required Fields
- `sections` (array): Top-level array containing all sections
- `title` (string): Required for each section
- `questions` (array): Required for each section, must contain at least one question

### Optional Fields
- `description` (string): Optional description for each section

### Example Structure
```json
{
  "sections": [
    {
      "title": "Performance Metrics",
      "description": "Key performance indicators",
      "questions": [
        "What defines success?",
        "How do we measure efficiency?"
      ]
    }
  ]
}
```

## Features

### Validation
- The system validates your JSON before import
- Clear error messages guide you to fix any issues
- Prevents duplicate sections with the same title
- Ensures all required fields are present

### Ordering
- New sections are automatically added at the end of your current list
- Questions maintain the order they appear in the JSON
- You can reorder sections and questions later using the drag-and-drop interface

### Toast Notifications
- Success: Confirms successful import with section count
- Error: Provides details about what went wrong
- Copy: Confirms when content is copied to clipboard

## Best Practices

1. **Start Small**: Test with a few sections first before importing large datasets
2. **Review Before Import**: Always review the LLM-generated content for accuracy
3. **Use Descriptive Titles**: Section titles should be clear and unique
4. **Question Format**: Frame questions to elicit comprehensive answers
5. **Backup Regularly**: Use the "View Current" feature to backup your project

## Troubleshooting

### Common Issues
1. **"Invalid JSON format"**: Check for missing commas, brackets, or quotes
2. **"Section must have a title"**: Ensure every section has a non-empty title
3. **"Must have at least one question"**: Each section needs at least one question
4. **Import fails silently**: Check browser console for detailed error messages

### Tips for LLM Prompting
- Be specific about the domain and context
- Request a specific number of sections and questions
- Ask for questions that require detailed, actionable answers
- Specify if you want technical or high-level questions

## Sample LLM Prompt
```
Create a JSON structure for an Advanced Engineering & Performance blueprint for the Carbon Robotics LaserWeeder. 

Include 4-5 sections covering:
1. System performance metrics and KPIs
2. Configuration and calibration procedures  
3. Operational best practices
4. Data analysis and optimization
5. Maintenance and troubleshooting

Each section should have 4-6 thoughtful questions that would help engineers document critical knowledge about the system. Questions should be specific enough to elicit detailed, actionable answers.

Use this JSON template structure:
[Paste template here]
```

## Security Note
- All imported data goes through the same validation and security checks as manual input
- User permissions apply to imported content
- Audit trails track all imports with timestamps and user information