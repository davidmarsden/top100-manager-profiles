import type { Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  if (req.method === 'POST') {
    return handleProfileRequest(req, context);
  } else if (req.method === 'GET') {
    return getProfileRequests(req, context);
  } else {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }
};

async function handleProfileRequest(req: Request, context: Context) {
  try {
    const { blobs } = context;
    const request = await req.json();
    
    // Validate required fields
    const requiredFields = ['managerName', 'clubName', 'contactInfo'];
    for (const field of requiredFields) {
      if (!request[field]) {
        return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
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
    
    // Get existing requests
    let requestsData = [];
    try {
      const data = await blobs.get("profile-requests");
      if (data) {
        const text = await data.text();
        requestsData = JSON.parse(text);
      }
    } catch (error) {
      console.log("No existing profile requests found");
    }
    
    // Add new request
    requestsData.push(profileRequest);
    
    // Save updated data
    await blobs.set("profile-requests", JSON.stringify(requestsData));
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Profile request submitted successfully",
      requestId: profileRequest.id
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    console.error("Error submitting profile request:", error);
    return new Response(JSON.stringify({ error: "Failed to submit profile request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

async function getProfileRequests(req: Request, context: Context) {
  try {
    const { blobs } = context;
    
    // Get profile requests data
    let requestsData = [];
    try {
      const data = await blobs.get("profile-requests");
      if (data) {
        const text = await data.text();
        requestsData = JSON.parse(text);
      }
    } catch (error) {
      console.log("No profile requests found");
    }
    
    // Sort by timestamp (newest first)
    requestsData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return new Response(JSON.stringify(requestsData), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    console.error("Error fetching profile requests:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch profile requests" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}