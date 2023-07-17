//https://learnjsx.com/category/4/posts/nextjs-tailwind-spinner#google_vignette

export default function Spinner() {
    return (
      <span className="flex justify-center items-center text-white/50 font-bold">
        Generating Response&#160;
        <span className="animate-bounce relative flex h-3 w-3 rounded-sm bg-emerald-400 opacity-75"></span>&#160;
        <span className="animate-bounce-slow relative flex h-3 w-3 rounded-sm bg-emerald-400 opacity-25"></span>&#160;
        <span className="animate-bounce relative flex h-3 w-3 rounded-sm bg-emerald-400 opacity-75"></span>
      </span>
    );
  }