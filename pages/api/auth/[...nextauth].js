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
                scope: 'openid profile email offline_access user.Read'
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
  prompt: "create",
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
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