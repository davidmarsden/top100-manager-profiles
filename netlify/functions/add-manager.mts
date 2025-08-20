// netlify/functions/add-manager.mts
// API endpoint to add new managers
import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export default async (req: Request, context: Context) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const managerData = await req.json();
    
    // Validate required fields
    if (!managerData.id || !managerData.name) {
      return new Response(JSON.stringify({ 
        error: 'Manager ID and name are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const store = getStore("managers");
    
    // Get existing managers
    const existingData = await store.get("all-managers", { type: "json" }) || { 
      managers: [], 
      metadata: {} 
    };
    
    // Add timestamps
    const timestamp = new Date().toISOString();
    const managerWithTimestamp = {
      ...managerData,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    // Check if manager already exists
    const existingIndex = existingData.managers.findIndex(m => m.id === managerData.id);
    
    if (existingIndex >= 0) {
      // Update existing manager
      existingData.managers[existingIndex] = {
        ...existingData.managers[existingIndex],
        ...managerWithTimestamp,
        createdAt: existingData.managers[existingIndex].createdAt // Keep original creation date
      };
    } else {
      // Add new manager
      existingData.managers.push(managerWithTimestamp);
    }

    // Update metadata
    existingData.metadata = {
      totalManagers: existingData.managers.length,
      seasonsCompleted: 25,
      lastUpdated: timestamp
    };

    // Save back to blob storage
    await store.set("all-managers", JSON.stringify(existingData));

    return new Response(JSON.stringify({
      success: true,
      manager: managerWithTimestamp,
      message: existingIndex >= 0 ? 'Manager updated successfully' : 'Manager added successfully'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('Add manager error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to add/update manager',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config: Config = {
  path: "/api/add-manager"
};