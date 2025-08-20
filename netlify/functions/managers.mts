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
      
      // Sample data for initial setup
      managersData = [
        {
          id: "scott-mckenzie",
          name: "Scott McKenzie",
          clubs: "FC Barcelona, São Paulo",
          division: 1,
          type: "legend",
          points: 2671,
          games: 1096,
          avgPoints: 2.44,
          signature: "The master tactician who redefined what it means to be a champion in Soccer Manager Worlds",
          story: "Scott McKenzie's journey to legendary status began in Season 2 with his first Division 1 title. What followed was an unprecedented display of tactical mastery and consistency that has never been matched.\n\nThe Barcelona legend achieved the impossible - eight Division 1 titles including a remarkable four-peat from Seasons 9-12. His tactical innovations revolutionized the game, introducing formation flexibility and squad rotation techniques that became the gold standard.\n\nBeyond the titles, Scott's mentorship of younger managers and his contributions to tactical discussions have shaped an entire generation of Top 100 players. His legacy extends far beyond trophies - he elevated the entire standard of competition."
        },
        {
          id: "glen-mullan",
          name: "Glen Mullan",
          clubs: "Napoli, Espanyol",
          division: 1,
          type: "elite",
          points: 994,
          games: 555,
          avgPoints: 1.79,
          signature: "The tactical perfectionist known for meticulous preparation and never settling for second best",
          story: "Glen Mullan represents the modern era of Soccer Manager Worlds excellence. His Esoanyol project has been a masterclass in building sustainable success through careful planning and tactical evolution.\n\nKnown for his analytical approach, Glen revolutionized the way managers approach squad building and tactical preparation. His detailed pre-match analysis and in-game adjustments have become legendary within the Top 100 community.\n\nWhile trophies tell part of the story, Glen's influence on raising tactical standards across all divisions cannot be overstated. His willingness to share knowledge and mentor newer managers exemplifies the spirit of the Top 100 community."
        },
        {
          id: "david-marsden",
          name: "David Marsden",
          club: "Hamburger SV",
          division: 2,
          type: "veteran",
          points: 1830,
          games: 1015,
          avgPoints: 1.80,
          signature: "The community builder who transformed Top 100 from a competition into a family",
          story: "David Marsden's contribution to Top 100 extends far beyond the pitch. As one of the founding members of the modern Top 100 structure, David has been instrumental in building the community that makes our competition special. His Hamburger SV project has been a testament to consistency and passion for the beautiful game. Through 25 seasons, David has maintained competitive standards while focusing on the bigger picture - ensuring Top 100 remains a welcoming, competitive environment for all. David's work behind the scenes in organizing events, maintaining community standards, and preserving the history of our competition has been invaluable. His dedication to documenting our stories and achievements ensures that future generations will understand the rich heritage of Top 100."
        },
        {
          id: "andre-libras-boas",
          name: "Luis André Libras-Boas",
          club: "Hellas Verona",
          division: 1,
          type: "rising",
          points: 2279,
          games: 1066,
          avgPoints: 2.14
          signature: "The modern maestro leading Hellas Verona's unprecedented rise to championship contention",
          story: "Luis André Libras-Boas represents the new generation of Top 100 excellence. His Hellas Verona project has become the most exciting story in modern Soccer Manager Worlds, transforming an underdog club into championship contenders.\n\nWith four titles in five seasons and currently leading Season 25, Luis André has brought fresh tactical innovations and an infectious winning mentality. His multi-competition mastery across all formats showcases a complete understanding of modern football management.\n\nWhat sets Luis André apart is his ability to inspire teammates and elevate the performance of those around him. His rise from promising newcomer to championship leader exemplifies the opportunities that Top 100 provides for dedicated managers willing to push boundaries."
        }
      ];
      
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