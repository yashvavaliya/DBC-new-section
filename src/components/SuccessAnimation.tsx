import React, { useEffect, useState } from 'react';
import { Check, Sparkles, Heart, Star } from 'lucide-react';
import confetti from 'canvas-confetti'; // <-- Add this import

export const SuccessAnimation: React.FC = () => {
  const [showConfetti, setShowConfetti] = useState(true);
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    size: number;
    rotation: number;
    velocity: { x: number; y: number };
  }>>([]);

  useEffect(() => {
    // Canvas-confetti fireworks animation
    const duration = 5000; // Slower animation
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    // Generate confetti particles (existing code)
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: -10,
      color: ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'][Math.floor(Math.random() * 5)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      velocity: {
        x: (Math.random() - 0.5) * 4,
        y: Math.random() * 3 + 2
      }
    }));
    setParticles(newParticles);

    // Hide confetti after animation
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000); // Slower hide

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Confetti Particles */}
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute animate-bounce"
              style={{
                left: `${particle.x}px`,
                top: `${particle.y}px`,
                backgroundColor: particle.color,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                borderRadius: '50%',
                transform: `rotate(${particle.rotation}deg)`,
                animation: `fall 5s ease-out forwards, rotate 5s linear infinite`, // Slower fall and rotate
              }}
            />
          ))}
        </div>
      )}

      {/* Success Message */}
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center transform animate-pulse">
          {/* Success Icon */}
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            {/* Floating Icons */}
            <div className="absolute -top-2 -right-2 animate-ping">
              <Sparkles className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="absolute -bottom-2 -left-2 animate-pulse">
              <Heart className="w-5 h-5 text-pink-500" />
            </div>
            <div className="absolute top-0 left-0 animate-bounce" style={{ animationDelay: '0.5s' }}>
              <Star className="w-4 h-4 text-blue-500" />
            </div>
          </div>

          {/* Success Message */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            🎉 Congratulations!
          </h2>
          <p className="text-gray-600 mb-4">
            Your digital business card is ready to share with the world!
          </p>

          {/* Progress Bar Animation */}
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full animate-pulse"
                style={{
                  width: '100%',
                  animation: 'progress 2s ease-out forwards'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};