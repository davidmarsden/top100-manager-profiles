import type { Context } from "@netlify/functions";

// In-memory storage for this session (will reset on function restart)
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
    
    // Store in memory (simple solution)
    profileRequests.push(profileRequest);
    console.log('Request stored. Total requests in memory:', profileRequests.length);
    
    // Also log detailed request for manual collection
    console.log('=== PROFILE REQUEST FOR MANUAL COLLECTION ===');
    console.log('Manager:', profileRequest.managerName);
    console.log('Club:', profileRequest.clubName);
    console.log('Division:', profileRequest.division || 'Not specified');
    console.log('Contact:', profileRequest.contactInfo);
    console.log('Achievements:', profileRequest.achievements || 'None provided');
    console.log('Story:', profileRequest.story || 'None provided');
    console.log('Submitted:', profileRequest.timestamp);
    console.log('Request ID:', profileRequest.id);
    console.log('=== END PROFILE REQUEST ===');
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Profile request submitted successfully",
      requestId: profileRequest.id,
      note: "Request stored temporarily and logged for manual collection"
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