import Head from "next/head";
import { useSession, signIn, signOut } from "next-auth/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot } from "@fortawesome/free-solid-svg-icons";
import { getServerSession } from "next-auth";


export default function Home() {
  const { data: session, status } = useSession();

  return (
    <>
      <Head>
        <title>Azure OpenAI chat demo - Login or Signup</title>
      </Head>
      
      <div className="flex justify-center items-center min-h-screen w-full bg-gray-800 text-white text-center">
        <div>
          <div>
            <FontAwesomeIcon icon={faRobot} className="text-emerald-200 text-6xl mb-2" />
          </div>
          <h1 className="text-4xl font-bold">
            Welcome to the Azure OpenAI chat demo
          </h1>
          <p className="text-lg mt-2">
            Log in with your account to get started
          </p>
          <div className="mt-4 flex justify-center gap-3">
            {status === 'unauthenticated' && (
              <>
                <button onClick={() => signIn("azure-ad", {callbackUrl: "/"})} className="btn">Login</button>
                <button onClick={() => signIn("azure-ad", null, {prompt: 'create'})} className="btn">Signup</button>
              </>
            )}
          </div>
        </div>
        <div>
        </div>
      </div>

    </>
  );
}

export const getServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res);

  // console.log("Session", JSON.stringify(session, null, 2))
  // if a user is logged in, redirect to chat page
  if(!!session){
    return {
      redirect: {
        destination: "/chat"
      },
    };
  }

  // if no user is logged in, return empty props
  return {
    props: {},
  }
}