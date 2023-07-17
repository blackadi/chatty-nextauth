import NextAuth  from "next-auth"
import AzureADProvider from "next-auth/providers/azure-ad"

export const authOptions = {
  // Configure one or more authentication providers
  providers: [
    AzureADProvider({
        clientId: process.env.AZURE_AD_CLIENT_ID,
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
        tenantId: process.env.AZURE_AD_TENANT_ID,
        authorization:{
            params:{
                scope: 'openid profile email offline_access User.Read'
            }
        },
        userinfo: {
            url: 'https://graph.microsoft.com/oidc/userinfo',
        },
        profile(profile) {
            return {
                id: profile.sub,
                name: profile.name,
                email: profile.email,
                image: profile.picture,
            }
        }
    }),
    // ...add more providers here
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token, user }) {
      const profilePicture = await fetch(
        `https://graph.microsoft.com/v1.0/me/photos/48x48/$value`,
        {
          headers: {
            Authorization: `Bearer ${token.accessToken}`,
          },
        }
      )
      
      if (profilePicture.ok) {
        session.user.id = token.sub;
        const pictureBuffer = await profilePicture.arrayBuffer()
        const pictureBase64 = Buffer.from(pictureBuffer).toString("base64")
        session.user.profilePicture = `data:image/jpeg;base64, ${pictureBase64}`;
        return session;
      }else{
        session.user.id = token.sub;
        return session;
      }
      
    },
    async jwt({ token, account }) {
      // IMPORTANT: Persist the access_token to the token right after sign in
      if (account) {
        // token.idToken = account.id_token;
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
}

export default NextAuth(authOptions)