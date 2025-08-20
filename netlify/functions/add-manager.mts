import type { Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  console.log('Add Manager API called with method:', req.method);
  
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
  
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  try {
    console.log('Processing POST request...');
    const { blobs } = context;
    const newManager = await req.json();
    console.log('Received manager data:', newManager);
    
    // Validate required fields
    const requiredFields = ['id', 'name', 'club', 'division', 'type', 'points', 'games', 'avgPoints'];
    for (const field of requiredFields) {
      if (!newManager[field] && newManager[field] !== 0) {
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
    
    // Get existing managers
    let managersData = [];
    try {
      console.log('Getting existing managers...');
      const data = await blobs.get("managers");
      if (data) {
        const text = await data.text();
        managersData = JSON.parse(text);
        console.log('Found existing managers:', managersData.length);
      }
    } catch (error) {
      console.log("No existing managers data found, starting fresh");
    }
    
    // Check if manager ID already exists
    const existingIndex = managersData.findIndex(m => m.id === newManager.id);
    
    if (existingIndex >= 0) {
      console.log('Updating existing manager at index:', existingIndex);
      managersData[existingIndex] = { ...managersData[existingIndex], ...newManager };
    } else {
      console.log('Adding new manager');
      managersData.push(newManager);
    }
    
    try {
      // Save updated data
      console.log('Saving updated managers data...');
      await blobs.set("managers", JSON.stringify(managersData));
      console.log('Data saved successfully');
    } catch (saveError) {
      console.error('Error saving to blobs:', saveError);
      throw new Error('Failed to save manager data');
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: existingIndex >= 0 ? "Manager updated successfully" : "Manager added successfully",
      manager: newManager
    }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
    
  } catch (error) {
    console.error("Error in add-manager API:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to add/update manager",
      details: error.message 
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};

export const config = {
  path: "/api/add-manager"
};