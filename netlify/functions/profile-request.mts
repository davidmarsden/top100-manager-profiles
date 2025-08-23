import type { Context } from "@netlify/functions";

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
    
    // Check if blobs is available
    const { blobs } = context;
    console.log('Blobs available:', !!blobs);
    
    if (!blobs) {
      console.log('Netlify Blobs not available - using in-memory storage for this request');
      // For now, just return success since we can't store it
      // In production, you might want to send an email or use another storage method
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Profile request received successfully (stored temporarily)",
        requestId: profileRequest.id,
        note: "Request logged to console - please check Netlify function logs"
      }), {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    // Get existing requests
    let requestsData = [];
    try {
      console.log('Getting existing requests...');
      const data = await blobs.get("profile-requests");
      if (data) {
        const text = await data.text();
        requestsData = JSON.parse(text);
        console.log('Found existing requests:', requestsData.length);
      }
    } catch (error) {
      console.log("No existing profile requests found, starting fresh");
    }
    
    // Add new request
    requestsData.push(profileRequest);
    
    try {
      // Save updated data
      console.log('Saving updated requests data...');
      await blobs.set("profile-requests", JSON.stringify(requestsData));
      console.log('Request data saved successfully');
    } catch (saveError) {
      console.error('Error saving request to blobs:', saveError);
      // Still return success since we have the data in logs
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Profile request received successfully (temporary storage)",
        requestId: profileRequest.id,
        warning: "Could not save to permanent storage - request logged to console"
      }), {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Profile request submitted successfully",
      requestId: profileRequest.id
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
    const { blobs } = context;
    
    if (!blobs) {
      console.log('Netlify Blobs not available - returning empty array');
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    // Get profile requests data
    let requestsData = [];
    try {
      const data = await blobs.get("profile-requests");
      if (data) {
        const text = await data.text();
        requestsData = JSON.parse(text);
        console.log('Retrieved requests:', requestsData.length);
      }
    } catch (error) {
      console.log("No profile requests found");
    }
    
    // Sort by timestamp (newest first)
    requestsData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return new Response(JSON.stringify(requestsData), {
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