import React from "react";
import { useAuth } from "../hooks/useAuth.js";

/**
 * Renders glowing, floating custom SVG shapes in the background 
 * matching the user's personality onboarding choice (Circle, Triangle, Square, Hexagon, Star).
 */
export default function FloatingShapes() {
  const { user } = useAuth();
  
  // Fallback to "star" if onboarding favoriteShape is not yet selected
  const shape = (user?.favoriteShape || "star").toLowerCase();

  const renderShapeElement = (className: string, size = 120) => {
    switch (shape) {
      case "circle":
        return (
          <svg className={className} width={size} height={size} viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="40" stroke="url(#circle-grad)" strokeWidth="2" strokeLinecap="round" strokeDasharray="10 5" />
            <defs>
              <linearGradient id="circle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#c084fc" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        );
      case "triangle":
        return (
          <svg className={className} width={size} height={size} viewBox="0 0 100 100" fill="none">
            <polygon points="50,15 90,85 10,85" stroke="url(#tri-grad)" strokeWidth="2" strokeLinejoin="round" strokeDasharray="15 5" />
            <defs>
              <linearGradient id="tri-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f472b6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        );
      case "square":
        return (
          <svg className={className} width={size} height={size} viewBox="0 0 100 100" fill="none">
            <rect x="15" y="15" width="70" height="70" rx="8" stroke="url(#sq-grad)" strokeWidth="2" strokeDasharray="12 4" />
            <defs>
              <linearGradient id="sq-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        );
      case "hexagon":
        return (
          <svg className={className} width={size} height={size} viewBox="0 0 100 100" fill="none">
            <polygon points="50,10 88,32 88,78 50,100 12,78 12,32" stroke="url(#hex-grad)" strokeWidth="2" strokeLinejoin="round" strokeDasharray="8 4" />
            <defs>
              <linearGradient id="hex-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        );
      case "star":
      default:
        return (
          <svg className={className} width={size} height={size} viewBox="0 0 100 100" fill="none">
            <polygon points="50,5 64,36 98,36 70,57 81,91 50,70 19,91 30,57 2,36 36,36" stroke="url(#star-grad)" strokeWidth="1.5" strokeLinejoin="round" strokeDasharray="10 5" />
            <defs>
              <linearGradient id="star-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#f472b6" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        );
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Glow Blur Spots */}
      <div className="absolute top-[10%] left-[5%] h-72 w-72 rounded-full bg-indigo-500/5 blur-[120px]" />
      <div className="absolute bottom-[15%] right-[5%] h-96 w-96 rounded-full bg-purple-500/5 blur-[160px]" />

      {/* Floating Animated Vectors */}
      {renderShapeElement(
        "absolute top-[12%] right-[10%] opacity-40 animate-[spin_40s_linear_infinite_glowing_float] filter drop-shadow-[0_0_15px_rgba(168,85,247,0.15)]",
        180
      )}
      {renderShapeElement(
        "absolute bottom-[20%] left-[8%] opacity-35 animate-[spin_60s_linear_infinite_reverse] filter drop-shadow-[0_0_20px_rgba(59,130,246,0.12)]",
        220
      )}
      {renderShapeElement(
        "absolute top-[45%] right-[40%] opacity-20 animate-[pulse_8s_ease-in-out_infinite]",
        90
      )}

      {/* Embedded CSS for keyframes since standard Tailwind may not define float dynamics */}
      <style>{`
        @keyframes glowing_float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(180deg); }
          100% { transform: translateY(0px) rotate(360deg); }
        }
        .animate-glowing_float {
          animation: glowing_float 25s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
