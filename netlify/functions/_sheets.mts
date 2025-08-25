import { google } from "googleapis";

export const SHEET_ID = Netlify.env.get("GOOGLE_SHEET_ID")!;
export const TAB_SUBMISSIONS = "Submissions";
export const TAB_MANAGERS = "Managers";

export const MANAGER_COLUMNS = [
  "id","name","club","division","type","points","games","avgPoints",
  "signature","story",
  "careerHighlights","favouriteFormation","tacticalPhilosophy",
  "memorableMoment","fearedOpponent","ambitions","imageUrl"
];

export const SUBMISSION_COLUMNS = [
  "Timestamp","Request ID","Manager Name","Club Name","Division","Type","Total Points","Games Played",
  "Favourite Formation","Tactical Philosophy","Most Memorable Moment","Most Feared Opponent","Career Highlights",
  "Future Ambitions","Story","Image URL","Status"
];

function parseServiceAccount() {
  const raw = Netlify.env.get("GOOGLE_SERVICE_ACCOUNT") || "";
  const json = raw.trim().startsWith("{")
    ? JSON.parse(raw)
    : JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
  return json;
}

export async function getSheets() {
  const creds = parseServiceAccount();
  const jwt = new google.auth.JWT(
    creds.client_email,
    undefined,
    creds.private_key,
    ["https://www.googleapis.com/auth/spreadsheets"]
  );
  return google.sheets({ version: "v4", auth: jwt });
}

export function corsHeaders(){
  return {
    "Access-Control-Allow-Origin":"*",
    "Access-Control-Allow-Methods":"GET,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers":"Content-Type,Authorization"
  };
}
export function okCors(){ return new Response(null,{status:200, headers:corsHeaders()}); }
export function json(status:number, body:any){
  return new Response(JSON.stringify(body), { status, headers:{ "Content-Type":"application/json", ...corsHeaders() }});
}

export function toRow(obj:Record<string,any>, cols:string[]){
  return cols.map(c => obj[c] ?? "");
}
export function mapRow(header:string[], row:string[]){
  const o:Record<string,string> = {};
  for (let i=0;i<header.length;i++) o[header[i]] = row[i] ?? "";
  return o;
}
export function colLetters(zeroBased:number){
  let s="", x=zeroBased+1;
  while(x>0){ const m=(x-1)%26; s=String.fromCharCode(65+m)+s; x=Math.floor((x-1)/26); }
  return s;
}