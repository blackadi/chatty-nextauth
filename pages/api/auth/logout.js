import { getSession } from "next-auth/react";

export default async function handler (req, res) {
    
    const session = await getSession({ req });
  
    let path = `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(process.env.NEXTAUTH_URL)}`;
  
  if(session?.id_token) {
    path = path + `&id_token_hint=${session.id_token}`
  } else {
    path = path + `&client_id=${process.env.AZURE_AD_CLIENT_ID}`
  }
  
    res.status(200).json({ path });
};