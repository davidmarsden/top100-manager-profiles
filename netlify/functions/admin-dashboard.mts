// netlify/functions/admin-dashboard.mts
// Simple admin dashboard to view requests and add managers
import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export default async (req: Request, context: Context) => {
  try {
    const store = getStore("profile-requests");
    const managersStore = getStore("managers");
    
    // Get all profile requests
    const requestsData = await store.get("all-requests", { type: "json" }) || { requests: [] };
    
    // Get manager count
    const managersData = await managersStore.get("all-managers", { type: "json" }) || { managers: [] };

    // Simple HTML dashboard
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Top 100 Manager Profiles - Admin Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
                max-width: 1200px; 
                margin: 0 auto; 
                padding: 20px;
                background: #f8fafc;
            }
            .header { 
                background: white; 
                padding: 20px; 
                border-radius: 10px; 
                margin-bottom: 20px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .stats { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                gap: 20px; 
                margin-bottom: 30px; 
            }
            .stat-card { 
                background: white; 
                padding: 20px; 
                border-radius: 10px; 
                text-align: center;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .stat-number { 
                font-size: 2rem; 
                font-weight: bold; 
                color: #3b82f6; 
            }
            .requests { 
                background: white; 
                border-radius: 10px; 
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .request { 
                padding: 15px; 
                border-bottom: 1px solid #e5e7eb; 
                display: grid;
                grid-template-columns: 1fr 1fr 2fr auto;
                gap: 15px;
                align-items: center;
            }
            .request:last-child { border-bottom: none; }
            .status { 
                padding: 4px 12px; 
                border-radius: 20px; 
                font-size: 12px; 
                font-weight: 600;
            }
            .status.pending { background: #fef3c7; color: #92400e; }
            .button { 
                padding: 8px 16px; 
                background: #3b82f6; 
                color: white; 
                border: none; 
                border-radius: 6px; 
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
                font-size: 14px;
            }
            .button:hover { background: #2563eb; }
            @media (max-width: 768px) {
                .request { grid-template-columns: 1fr; text-align: center; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🏆 Top 100 Manager Profiles - Admin Dashboard</h1>
            <p>Manage profile requests and add new managers</p>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${managersData.managers.length}</div>
                <div>Total Managers</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${requestsData.requests.length}</div>
                <div>Profile Requests</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${requestsData.requests.filter(r => r.status === 'pending').length}</div>
                <div>Pending Requests</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">25</div>
                <div>Seasons</div>
            </div>
        </div>

        <div class="requests">
            <div style="padding: 20px; border-bottom: 2px solid #e5e7eb; background: #f8fafc;">
                <h2 style="margin: 0;">Recent Profile Requests</h2>
            </div>
            ${requestsData.requests.slice(0, 10).map(request => `
                <div class="request">
                    <div>
                        <strong>${request.requestedManager}</strong><br>
                        <small>by ${request.requesterName}</small>
                    </div>
                    <div>
                        <span class="status ${request.status}">${request.status}</span>
                    </div>
                    <div>
                        ${request.reason}
                    </div>
                    <div>
                        <small>${new Date(request.createdAt).toLocaleDateString()}</small>
                    </div>
                </div>
            `).join('')}
            
            ${requestsData.requests.length === 0 ? `
                <div style="padding: 40px; text-align: center; color: #6b7280;">
                    No profile requests yet. Share your site with the Top 100 community!
                </div>
            ` : ''}
        </div>

        <div style="margin-top: 30px; text-align: center;">
            <a href="/" class="button">← Back to Manager Profiles</a>
            <a href="/api/managers" class="button" style="margin-left: 10px;">View API Data</a>
        </div>
    </body>
    </html>
    `;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return new Response(`
      <html>
        <body style="font-family: sans-serif; padding: 20px;">
          <h1>Error Loading Dashboard</h1>
          <p>Details: ${error.message}</p>
          <a href="/">← Back to Manager Profiles</a>
        </body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
};

export const config: Config = {
  path: "/admin"
};