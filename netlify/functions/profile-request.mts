import type { Context } from "@netlify/functions";

// In-memory storage as backup
let profileRequests: any[] = [];

export default async (req: Request, context: Context) => {
  console.log('Profile Request API called with method:', req.method);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
  
  if (req.method === 'POST') {
    return handleProfileRequest(req, context);
  } else if (req.method === 'GET') {
    return getProfileRequests(req, context);
  } else {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};

async function saveToGoogleSheets(profileRequest: any) {
  try {
    // Get the Google Sheets webhook URL from environment variables
    const SHEETS_WEBHOOK_URL = Netlify.env.get("GOOGLE_SHEETS_WEBHOOK_URL");
    
    if (!SHEETS_WEBHOOK_URL) {
      console.log('No Google Sheets webhook URL configured, skipping sheets save');
      return false;
    }
    
    console.log('Attempting to save to Google Sheets...');
    
    // Prepare data for Google Sheets
    const sheetData = {
      timestamp: profileRequest.timestamp,
      id: profileRequest.id,
      managerName: profileRequest.managerName,
      clubName: profileRequest.clubName,
      division: profileRequest.division || '',
      contactInfo: profileRequest.contactInfo,
      achievements: profileRequest.achievements || '',
      story: profileRequest.story || '',
      status: profileRequest.status
    };
    
    const response = await fetch(SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sheetData)
    });
    
    if (response.ok) {
      console.log('Successfully saved to Google Sheets');
      return true;
    } else {
      console.log('Failed to save to Google Sheets:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    return false;
  }
}

async function handleProfileRequest(req: Request, context: Context) {
  try {
    console.log('Handling profile request submission...');
    const request = await req.json();
    console.log('Received request data:', request);
    
    // Validate required fields
    const requiredFields = ['managerName', 'clubName', 'contactInfo'];
    for (const field of requiredFields) {
      if (!request[field]) {
        console.log('Missing required field:', field);
        return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    }
    
    // Create profile request object
    const profileRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      managerName: request.managerName,
      clubName: request.clubName,
      contactInfo: request.contactInfo,
      division: request.division || null,
      achievements: request.achievements || '',
      story: request.story || '',
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    
    console.log('Created profile request:', profileRequest);
    
    // Store in memory (immediate availability for admin dashboard)
    profileRequests.push(profileRequest);
    console.log('Request stored in memory. Total requests:', profileRequests.length);
    
    // Try to save to Google Sheets for persistence
    const savedToSheets = await saveToGoogleSheets(profileRequest);
    
    // Detailed logging for manual collection
    console.log('=== PROFILE REQUEST FOR MANUAL COLLECTION ===');
    console.log('Manager:', profileRequest.managerName);
    console.log('Club:', profileRequest.clubName);
    console.log('Division:', profileRequest.division || 'Not specified');
    console.log('Contact:', profileRequest.contactInfo);
    console.log('Achievements:', profileRequest.achievements || 'None provided');
    console.log('Story:', profileRequest.story || 'None provided');
    console.log('Submitted:', profileRequest.timestamp);
    console.log('Request ID:', profileRequest.id);
    console.log('Saved to Google Sheets:', savedToSheets);
    console.log('=== END PROFILE REQUEST ===');
    
    let message = "Profile request submitted successfully";
    if (savedToSheets) {
      message += " and saved to Google Sheets";
    } else {
      message += " (stored temporarily - check function logs)";
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: message,
      requestId: profileRequest.id,
      savedToSheets: savedToSheets
    }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
    
  } catch (error) {
    console.error("Error submitting profile request:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to submit profile request",
      details: error.message 
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}

async function getProfileRequests(req: Request, context: Context) {
  try {
    console.log('Getting profile requests...');
    console.log('Current requests in memory:', profileRequests.length);
    
    // Sort by timestamp (newest first)
    const sortedRequests = [...profileRequests].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return new Response(JSON.stringify(sortedRequests), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
    
  } catch (error) {
    console.error("Error fetching profile requests:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to fetch profile requests",
      details: error.message 
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}

export const config = {
  path: "/api/profile-request"
};