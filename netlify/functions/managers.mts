// netlify/functions/managers.mts
// API endpoint to get all managers
import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export default async (req: Request, context: Context) => {
  try {
    const store = getStore("managers");
    
    // Try to get managers from blob storage
    let managersData = await store.get("all-managers", { type: "json" });
    
    if (!managersData) {
      // Initialize with sample data if no data exists
      managersData = {
        managers: [
          {
            id: "scott-mckenzie",
            name: "Scott McKenzie",
            club: "São Paulo FC",
            division: 1,
            type: "legend",
            avatar: "SM",
            titles: 9,
            points: 2667,
            games: 1094,
            avgPoints: 2.44,
            joinedSeason: 2,
            currentSeason: 25,
            specialties: ["Division 1 Champion", "The GOAT", "Four-peat Legend"],
            signature: "Unprecedented eight Division 1 titles and remarkable four-peat (S9-S12)",
            story: "In the annals of Top 100 history, no name commands more respect than Scott McKenzie.",
            achievements: [
              {
                type: "title",
                competition: "Division 1",
                count: 8,
                seasons: ["S2", "S3", "S6", "S7", "S9", "S10", "S11", "S12"],
                description: "Unprecedented Division 1 dominance"
              }
            ]
          },
          {
            id: "glen-mullan",
            name: "Glen Mullan",
            club: "RCD Espanyol",
            division: 1,
            type: "pillar",
            avatar: "GM",
            titles: 0,
            points: 1200,
            games: 300,
            avgPoints: 1.85,
            joinedSeason: 16,
            currentSeason: 25,
            specialties: ["Standard Bearer", "300+ Games", "Survival Specialist"],
            signature: "The community pillar who embodies everything Top 100 stands for",
            story: "Glen Mullan represents the heart of what makes Top 100 special.",
            achievements: [
              {
                type: "milestone",
                name: "300 Games Milestone",
                description: "Longest serving Espanyol manager in Top 100 history"
              }
            ]
          },
          {
            id: "david-marsden",
            name: "David Marsden",
            club: "Administrator",
            division: "Admin",
            type: "admin",
            avatar: "DM",
            titles: "∞",
            points: "∞",
            games: "∞",
            avgPoints: "N/A",
            joinedSeason: 1,
            currentSeason: 25,
            specialties: ["Rule Enforcement", "Youth Cup Authority", "Transfer Admin"],
            signature: "The administrator-manager ensuring fair play across Top 100",
            story: "David Marsden holds a unique position in Top 100 history.",
            achievements: [
              {
                type: "admin",
                name: "S25 Youth Cup Crackdown",
                description: "Led administrative action against five clubs for squad eligibility violations"
              }
            ]
          },
          {
            id: "andre-libras-boas",
            name: "André Libras-Boas",
            club: "Hellas Verona",
            division: 1,
            type: "dynasty",
            avatar: "AL",
            titles: 9,
            points: 2274,
            games: 1063,
            avgPoints: 2.14,
            joinedSeason: 4,
            currentSeason: 25,
            specialties: ["Modern Dynasty", "Multi-Competition Master", "Current Champion"],
            signature: "Building the modern Hellas Verona dynasty with 4 titles in 5 seasons",
            story: "André Libras-Boas represents the new face of Top 100 excellence.",
            achievements: [
              {
                type: "title",
                competition: "Division 1",
                count: 4,
                seasons: ["S20", "S22", "S23", "S24"],
                description: "Modern Division 1 dominance"
              }
            ]
          }
        ],
        metadata: {
          totalManagers: 4,
          seasonsCompleted: 25,
          lastUpdated: new Date().toISOString()
        }
      };

      // Save the initial data
      await store.set("all-managers", JSON.stringify(managersData));
    }

    return new Response(JSON.stringify(managersData), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('Managers API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch managers',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config: Config = {
  path: "/api/managers"
};
