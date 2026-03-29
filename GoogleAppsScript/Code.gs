/*
 * Google Apps Script for FloridaLisPendens Form Submissions
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet (1CuIpv4ql1C0-KwmONjA5WagjH27WD4quLBCLkpdAzoU)
 * 2. Go to Extensions → Apps Script
 * 3. Delete any existing code and paste this entire file
 * 4. Save the project (Ctrl+S)
 * 5. Click "Deploy" → "New deployment"
 * 6. Type: Web app
 * 7. Execute as: Me
 * 8. Who has access: Anyone
 * 9. Click Deploy
 * 10. Copy the Web app URL (starts with https://script.google.com/macros/s/...)
 * 11. Update your HTML forms with this URL in the submitForm() functions
 */

// Sheet ID
const SHEET_ID = '1CuIpv4ql1C0-KwmONjA5WagjH27WD4quLBCLkpdAzoU';
const SHEET_NAME = 'FLP Form Submissions';

// Email recipients (add your own)
const EMAIL_RECIPIENTS = ['lars@my850.com', 'floridahotdeals@gmail.com'];

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  
  try {
    // Append to sheet
    const result = appendToSheet(data);
    
    // Send notification email
    sendNotificationEmail(data);
    
    // Return success
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Form submitted successfully',
      row: result.rowNumber
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('Error processing submission:', error);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'FloridaLisPendens Form Submission Endpoint'
  })).setMimeType(ContentService.MimeType.JSON);
}

function appendToSheet(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  // Map form data to sheet columns
  // Timestamp, Form_Type, Name, Email, Phone, Counties, Business_Type, Data_Format, Marketing_Volume, Property_County, Notes, Status
  const rowData = [
    data.timestamp || new Date().toISOString(),       // Timestamp
    data.formType,                                     // Form_Type
    data.name,                                         // Name
    data.email,                                        // Email
    data.phone || '',                                  // Phone (not collected in new forms yet)
    data.counties || data.primaryCounty + (data.additionalCounties ? ', ' + data.additionalCounties : ''), // Counties
    data.userType || data.business || '',                             // Business_Type
    data.format || data.dataFormat || '',                             // Data_Format
    data.marketingVolume || '',                        // Marketing_Volume
    data.propertyCounty || '',                         // Property_County
    data.notes || (data.additionalCounties ? 'Additional: ' + data.additionalCounties : ''), // Notes
    'New'                                              // Status
  ];
  
  const row = sheet.appendRow(rowData);
  return { rowNumber: row.getRow(), data: rowData };
}

function sendNotificationEmail(data) {
  const subject = `New ${data.formType} Subscription Request - FloridaLisPendens`;
  
  let body = `<h2>New Form Submission</h2>
    <p><strong>Form Type:</strong> ${data.formType}</p>
    <p><strong>Name:</strong> ${data.name}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    <p><strong>User Type:</strong> ${data.userType || data.business || 'N/A'}</p>
    <p><strong>Data Format:</strong> ${data.format || data.dataFormat || 'N/A'}</p>
    <p><strong>Counties:</strong> ${data.counties || data.primaryCounty + (data.additionalCounties ? ', ' + data.additionalCounties : '')}</p>
    ${data.additionalCounties ? `<p><strong>Additional Counties:</strong> ${data.additionalCounties}</p>` : ''}
    <p><strong>Timestamp:</strong> ${data.timestamp || new Date().toISOString()}</p>
    <br>
    <p><em>This is an automated notification. Please login to Google Sheets to review the submission.</em></p>
  `;
  
  if (data.formType === 'Gold') {
    body += `<p><strong>⚠️ GOLD SUBSCRIPTION - Consultation Required</strong></p>`;
  }
  
  // Send to each recipient
  EMAIL_RECIPIENTS.forEach(email => {
    GmailApp.sendEmail(email, subject, '', {
      htmlBody: body,
      name: 'FloridaLisPendens Notifications'
    });
  });
}

// Test function (run in Apps Script editor to test)
function testSubmission() {
  const testData = {
    formType: 'Bronze',
    timestamp: new Date().toISOString(),
    name: 'Test User',
    email: 'test@example.com',
    userType: 'investor',
    format: 'excel',
    primaryCounty: 'Broward',
    additionalCounties: 'Palm Beach, Miami-Dade'
  };
  
  appendToSheet(testData);
  sendNotificationEmail(testData);
  console.log('Test submission completed');
}

// Create the sheet headers (run once if needed)
function setupSheetHeaders() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = ['Timestamp', 'Form_Type', 'Name', 'Email', 'Phone', 'Counties', 'Business_Type', 'Data_Format', 'Marketing_Volume', 'Property_County', 'Notes', 'Status'];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#e3f2fd');
    console.log('Sheet created with headers');
  }
}
