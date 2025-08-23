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
        "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
  
  if (req.method === 'POST') {
    return handleProfileSubmission(req, context);
  } else if (req.method === 'GET') {
    return getProfileRequests(req, context);
  } else if (req.method === 'PUT') {
    return handleApprovalAction(req, context);
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
    const SHEETS_WEBHOOK_URL = Netlify.env.get("GOOGLE_SHEETS_WEBHOOK_URL");
    
    if (!SHEETS_WEBHOOK_URL) {
      console.log('No Google Sheets webhook URL configured, skipping sheets save');
      return false;
    }
    
    console.log('Attempting to save to Google Sheets...');
    
    const sheetData = {
      timestamp: profileRequest.timestamp,
      id: profileRequest.id,
      managerName: profileRequest.managerName,
      clubName: profileRequest.clubName,
      division: profileRequest.division || '',
      points: profileRequest.points || '',
      games: profileRequest.games || '',
      avgPoints: profileRequest.avgPoints || '',
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

async function addManagerProfile(profileData: any) {
  try {
    console.log('Attempting to add manager profile automatically...');
    
    // Build signature from available content
    let signature = '';
    if (profileData.careerHighlights) {
      signature = profileData.careerHighlights.substring(0, 150);
    } else if (profileData.tactics) {
      signature = profileData.tactics.substring(0, 150);
    } else if (profileData.memorableMoment) {
      signature = profileData.memorableMoment.substring(0, 150);
    } else {
      signature = `${profileData.managerType || 'Rising'} manager from ${profileData.clubName}`;
    }
    
    // Build comprehensive story
    let fullStory = '';
    if (profileData.story) {
      fullStory += profileData.story + '\n\n';
    }
    if (profileData.careerHighlights) {
      fullStory += `Career Highlights: ${profileData.careerHighlights}\n\n`;
    }
    if (profileData.tactics) {
      fullStory += `Tactical Philosophy: ${profileData.tactics}\n\n`;
    }
    if (profileData.formation) {
      fullStory += `Favourite Formation: ${profileData.formation}\n\n`;
    }
    if (profileData.memorableMoment) {
      fullStory += `Most Memorable Moment: ${profileData.memorableMoment}\n\n`;
    }
    if (profileData.fearedOpponent) {
      fullStory += `Most Feared Opponent: ${profileData.fearedOpponent}\n\n`;
    }
    if (profileData.ambitions) {
      fullStory += `Future Ambitions: ${profileData.ambitions}`;
    }
    
    if (!fullStory.trim()) {
      fullStory = `${profileData.managerName} manages ${profileData.clubName} in Top 100. A dedicated manager contributing to the community's rich 25-season history.`;
    }
    
    // Call the add-manager API to publish the profile
    const response = await fetch('/api/add-manager', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: profileData.managerName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
        name: profileData.managerName,
        club: profileData.clubName,
        division: profileData.division || 5,
        type: profileData.managerType || 'rising',
        points: profileData.points || 1000,
        games: profileData.games || 100,
        avgPoints: profileData.avgPoints || ((profileData.points || 1000) / (profileData.games || 100)),
        signature: signature,
        story: fullStory.trim()
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Successfully added manager profile:', result);
      return true;
    } else {
      console.log('Failed to add manager profile:', response.status);
      return false;
    }
  } catch (error) {
    console.error('Error adding manager profile:', error);
    return false;
  }
}

async function handleProfileSubmission(req: Request, context: Context) {
  try {
    console.log('Handling profile submission...');
    const request = await req.json();
    console.log('Received submission data:', request);
    
    // Validate required fields (removed contactInfo)
    const requiredFields = ['managerName', 'clubName'];
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
    
    // Create profile submission object
    const profileSubmission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      managerName: request.managerName,
      clubName: request.clubName,
      division: request.division || null,
      points: request.points || null,
      games: request.games || null,
      avgPoints: request.avgPoints || null,
      achievements: request.achievements || '',
      story: request.story || '',
      timestamp: new Date().toISOString(),
      status: 'pending',
      autoPublished: false
    };
    
    console.log('Created profile submission:', profileSubmission);
    
    // Store in memory
    profileRequests.push(profileSubmission);
    console.log('Submission stored in memory. Total submissions:', profileRequests.length);
    
    // Try to auto-publish the profile
    const published = await addManagerProfile(profileSubmission);
    
    if (published) {
      profileSubmission.status = 'approved';
      profileSubmission.autoPublished = true;
      console.log('Profile auto-published successfully');
    }
    
    // Save to Google Sheets
    const savedToSheets = await saveToGoogleSheets(profileSubmission);
    
    // Detailed logging
    console.log('=== PROFILE SUBMISSION FOR REVIEW ===');
    console.log('Manager:', profileSubmission.managerName);
    console.log('Club:', profileSubmission.clubName);
    console.log('Division:', profileSubmission.division || 'Not specified');
    console.log('Points:', profileSubmission.points || 'Not specified');
    console.log('Games:', profileSubmission.games || 'Not specified');
    console.log('Achievements:', profileSubmission.achievements || 'None provided');
    console.log('Story:', profileSubmission.story || 'None provided');
    console.log('Status:', profileSubmission.status);
    console.log('Auto-published:', profileSubmission.autoPublished);
    console.log('Submitted:', profileSubmission.timestamp);
    console.log('Submission ID:', profileSubmission.id);
    console.log('=== END PROFILE SUBMISSION ===');
    
    let message = published 
      ? "Profile submitted and published successfully! It's now live on the site."
      : "Profile submitted successfully and pending review.";
    
    if (savedToSheets) {
      message += " Saved to tracking sheet.";
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: message,
      submissionId: profileSubmission.id,
      published: published,
      savedToSheets: savedToSheets
    }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
    
  } catch (error) {
    console.error("Error handling profile submission:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to submit profile",
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

async function handleApprovalAction(req: Request, context: Context) {
  try {
    const { action, submissionId } = await req.json();
    console.log('Handling approval action:', action, 'for submission:', submissionId);
    
    const submission = profileRequests.find(s => s.id === submissionId);
    if (!submission) {
      return new Response(JSON.stringify({ error: "Submission not found" }), {
        status: 404,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    if (action === 'approve' && submission.status === 'pending') {
      const published = await addManagerProfile(submission);
      
      if (published) {
        submission.status = 'approved';
        submission.autoPublished = true;
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: "Profile approved and published successfully!"
        }), {
          status: 200,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } else {
        return new Response(JSON.stringify({ 
          success: false, 
          message: "Failed to publish profile"
        }), {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    } else if (action === 'reject') {
      submission.status = 'rejected';
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Profile submission rejected"
      }), {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    return new Response(JSON.stringify({ error: "Invalid action or submission already processed" }), {
      status: 400,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
    
  } catch (error) {
    console.error("Error handling approval action:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to process approval action",
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
    console.log('Getting profile submissions...');
    console.log('Current submissions in memory:', profileRequests.length);
    
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
    console.error("Error fetching profile submissions:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to fetch profile submissions",
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