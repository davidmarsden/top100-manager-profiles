// netlify/functions/profile-request.mts
// API endpoint for community profile requests
import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const requestData = await req.json();
    const { requestedManager, requesterName, reason, priority } = requestData;
    
    // Validate required fields
    if (!requestedManager || !requesterName) {
      return new Response(JSON.stringify({ 
        error: 'Manager name and requester name are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const store = getStore("profile-requests");
    
    // Get existing requests
    const existingRequests = await store.get("all-requests", { type: "json" }) || { 
      requests: [] 
    };
    
    // Create new request
    const newRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      requestedManager: requestedManager.trim(),
      requesterName: requesterName.trim(),
      reason: reason?.trim() || 'No reason provided',
      priority: priority || 'normal',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    // Add to existing requests
    existingRequests.requests.unshift(newRequest); // Add to beginning for newest first
    
    // Keep only the latest 100 requests to prevent unlimited growth
    if (existingRequests.requests.length > 100) {
      existingRequests.requests = existingRequests.requests.slice(0, 100);
    }
    
    // Save updated requests
    await store.set("all-requests", JSON.stringify(existingRequests));

    return new Response(JSON.stringify({
      success: true,
      requestId: newRequest.id,
      message: 'Profile request submitted successfully',
      estimatedCompletion: '3-5 days'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('Profile request error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to submit profile request',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config: Config = {
  path: "/api/profile-request"
};
