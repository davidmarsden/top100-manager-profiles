import type { Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const { blobs } = context;
    const newManager = await req.json();
    
    // Validate required fields
    const requiredFields = ['id', 'name', 'club', 'division', 'type', 'points', 'games', 'avgPoints'];
    for (const field of requiredFields) {
      if (!newManager[field] && newManager[field] !== 0) {
        return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    
    // Validate field types and values
    if (typeof newManager.division !== 'number' || newManager.division < 1 || newManager.division > 5) {
      return new Response(JSON.stringify({ error: "Division must be a number between 1 and 5" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const validTypes = ['legend', 'elite', 'rising', 'veteran'];
    if (!validTypes.includes(newManager.type)) {
      return new Response(JSON.stringify({ error: `Type must be one of: ${validTypes.join(', ')}` }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    if (typeof newManager.points !== 'number' || newManager.points < 0) {
      return new Response(JSON.stringify({ error: "Points must be a non-negative number" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    if (typeof newManager.games !== 'number' || newManager.games < 0) {
      return new Response(JSON.stringify({ error: "Games must be a non-negative number" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    if (typeof newManager.avgPoints !== 'number' || newManager.avgPoints < 0) {
      return new Response(JSON.stringify({ error: "Average points must be a non-negative number" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Get existing managers
    let managersData = [];
    try {
      const data = await blobs.get("managers");
      if (data) {
        const text = await data.text();
        managersData = JSON.parse(text);
      }
    } catch (error) {
      console.log("No existing managers data found");
    }
    
    // Check if manager ID already exists
    const existingIndex = managersData.findIndex(m => m.id === newManager.id);
    
    if (existingIndex >= 0) {
      // Update existing manager
      managersData[existingIndex] = { ...managersData[existingIndex], ...newManager };
    } else {
      // Add new manager
      managersData.push(newManager);
    }
    
    // Save updated data
    await blobs.set("managers", JSON.stringify(managersData));
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: existingIndex >= 0 ? "Manager updated successfully" : "Manager added successfully",
      manager: newManager
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    console.error("Error in add-manager API:", error);
    return new Response(JSON.stringify({ error: "Failed to add/update manager" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const config = {
  path: "/api/add-manager"
};