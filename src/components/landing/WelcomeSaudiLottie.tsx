import { motion } from "framer-motion";
import Lottie from "lottie-react";
import { useEffect, useState } from "react";
import { AnimatedSaudiCharacter } from "./AnimatedSaudiCharacter";

type Props = {
  animationData?: unknown; // if you import local json
  animationUrl?: string; // if you load from URL
  title?: string;
  subtitle?: string;
};

export function WelcomeSaudiLottie({
  animationData,
  animationUrl,
  title = "مرحباً بك في كون",
  subtitle = "جاهز تبني متجرك الإلكتروني؟",
}: Props) {
  return (
    <div className="relative w-full">
      <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
        {/* Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/25 via-sky-500/15 to-indigo-500/25 blur-2xl" />

        <div className="relative p-6 sm:p-8 flex flex-col items-center text-center gap-5">
          {/* Animated character */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-[360px] flex justify-center"
          >
            {animationData ? (
              <Lottie animationData={animationData} loop autoplay />
            ) : (
              <RemoteLottie url={animationUrl} />
            )}
          </motion.div>

          {/* Welcome text */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-2"
          >
            <h3 className="text-2xl sm:text-3xl font-black bg-gradient-to-l from-sky-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              {title}
            </h3>
            <p className="text-gray-300 text-base sm:text-lg">{subtitle}</p>

            {/* Subtle "wave" hint */}
            <div className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-full bg-black/40 border border-white/10">
              <span className="text-cyan-300 font-bold">أهلاً وسهلاً</span>
              <motion.span
                animate={{ rotate: [0, 14, -10, 14, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 2 }}
                className="text-xl"
              >
                👋
              </motion.span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function RemoteLottie({ url }: { url?: string }) {
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      return;
    }
    let cancelled = false;
    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load Lottie");
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (error || !url) {
    // Return SVG fallback if error or no URL
    return <AnimatedSaudiCharacter />;
  }

  if (!data) {
    return (
      <div className="w-full aspect-square animate-pulse rounded-2xl bg-white/5 border border-white/10" />
    );
  }

  return <Lottie animationData={data} loop autoplay />;
}
