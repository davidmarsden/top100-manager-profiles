import type { Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  console.log('Managers API called');
  
  try {
    // Get managers data from Netlify Blobs
    const { blobs } = context;
    
    let managersData = [];
    
    try {
      console.log('Attempting to get managers from blobs...');
      const data = await blobs.get("managers");
      if (data) {
        const text = await data.text();
        managersData = JSON.parse(text);
        console.log('Retrieved managers from blobs:', managersData.length);
      } else {
        console.log('No managers data found in blobs, using sample data');
        throw new Error('No data found');
      }
    } catch (blobError) {
      console.log('Error getting from blobs or no data exists, creating sample data:', blobError.message);
      
      // No sample data - start with empty array for clean slate
managersData = [];

console.log('No existing managers data found, starting with empty array');
      
      try {
        // Store the sample data for future use
        console.log('Storing sample data to blobs...');
        await blobs.set("managers", JSON.stringify(managersData));
        console.log('Sample data stored successfully');
      } catch (storeError) {
        console.log('Warning: Could not store sample data to blobs:', storeError.message);
        // Continue anyway with the sample data
      }
    }
    
    console.log('Returning managers data:', managersData.length, 'managers');
    
    return new Response(JSON.stringify(managersData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
    
  } catch (error) {
    console.error("Critical error in managers API:", error);
    
    // Return minimal sample data as absolute fallback
    const fallbackData = [
      {
        id: "sample-manager",
        name: "Sample Manager",
        club: "Sample FC",
        division: 1,
        type: "legend",
        points: 2000,
        games: 800,
        avgPoints: 2.5,
        signature: "A sample manager for testing",
        story: "This is sample data while we fix the API."
      }
    ];
    
    return new Response(JSON.stringify(fallbackData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};

export const config = {
  path: "/api/managers"
};