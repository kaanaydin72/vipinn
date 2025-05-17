import { useEffect, useState, useRef } from 'react';
import { ThemeType } from '@shared/themes';
import { useTranslation } from 'react-i18next';

interface SplashScreenProps {
  onAnimationComplete: () => void;
  theme: ThemeType;
}

export default function SplashScreen({ onAnimationComplete, theme }: SplashScreenProps) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [scale, setScale] = useState(1);
  const particlesRef = useRef<HTMLDivElement>(null);
  
  // Rastgele parçacıklar oluştur
  useEffect(() => {
    if (!particlesRef.current) return;
    
    const container = particlesRef.current;
    container.innerHTML = '';
    
    // Rastgele altın parçacıklar ekle
    for (let i = 0; i < 25; i++) {
      const particle = document.createElement('div');
      
      // Rastgele boyut, pozisyon ve animasyon
      const size = Math.random() * 6 + 2;
      const left = Math.random() * 100;
      const delay = Math.random() * 3;
      const duration = Math.random() * 4 + 6;
      
      particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: radial-gradient(circle, rgba(255,215,0,0.8) 0%, rgba(255,215,0,0.2) 70%);
        border-radius: 50%;
        left: ${left}%;
        top: 110%;
        opacity: ${Math.random() * 0.7 + 0.3};
        animation: float-up ${duration}s ${delay}s infinite cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 0 ${size*2}px rgba(255,215,0,0.4);
      `;
      
      container.appendChild(particle);
    }
  }, []);
  
  // Yüklenme animasyonu ve tamamlanma
  useEffect(() => {
    // Yükleme çubuğu animasyonu
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const nextProgress = prev + (Math.random() * 2.5);
        return nextProgress >= 100 ? 100 : nextProgress;
      });
    }, 150);
    
    // Ölçek animasyonuyla ufak bir 'bounce' hareketi
    const scaleInterval = setInterval(() => {
      setScale(prev => prev === 1 ? 0.97 : 1);
    }, 2000);

    // Splash screen'i 6 saniye sonra kaldır
    const timer = setTimeout(() => {
      clearInterval(progressInterval);
      clearInterval(scaleInterval);
      setProgress(100);
      
      // Küçülerek kaybolma animasyonu için
      const shrinkStart = setTimeout(() => {
        setScale(0.8);
        setTimeout(() => {
          setScale(0);
          setTimeout(onAnimationComplete, 300);
        }, 200);
      }, 500);
      
      return () => clearTimeout(shrinkStart);
    }, 6000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
      clearInterval(scaleInterval);
    };
  }, [onAnimationComplete]);

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ opacity: scale === 0 ? 0 : 1, transition: 'all 0.3s ease-out' }}
    >
      {/* Arka plan */}
      <div 
        className="absolute inset-0 z-0" 
        style={{
          background: 'linear-gradient(135deg, #FFA000 0%, #FF8F00 30%, #FF6F00 60%, #E65100 100%)',
          boxShadow: 'inset 0 0 100px rgba(255, 255, 255, 0.2)'
        }}
      />
      
      {/* Parçacıklar container */}
      <div 
        ref={particlesRef}
        className="absolute inset-0 z-0 overflow-hidden"
      />
      
      {/* Arka plan ışık efektleri */}
      <div 
        className="absolute inset-0 z-0 opacity-30" 
        style={{
          backgroundImage: `
            radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4) 0%, transparent 35%), 
            radial-gradient(circle at 70% 60%, rgba(255, 255, 255, 0.4) 0%, transparent 25%)
          `,
          animation: 'pulse-bg 8s infinite alternate ease-in-out'
        }}
      />
      
      {/* Altın çizgiler */}
      <div className="absolute inset-0 z-0">
        {/* Üst çizgi */}
        <div 
          className="absolute left-0 right-0 top-1/4 h-[0.5px] z-0 opacity-30" 
          style={{
            background: 'linear-gradient(90deg, transparent 0%, #FFD700 50%, transparent 100%)',
            animation: 'slide-right 8s infinite linear',
            transform: 'skewY(-5deg)'
          }}
        />
        
        {/* Alt çizgi */}
        <div 
          className="absolute left-0 right-0 bottom-1/4 h-[0.5px] z-0 opacity-30" 
          style={{
            background: 'linear-gradient(90deg, transparent 0%, #FFD700 50%, transparent 100%)',
            animation: 'slide-left 7s infinite linear',
            transform: 'skewY(5deg)'
          }}
        />
        
        {/* Çapraz çizgi 1 */}
        <div 
          className="absolute left-0 right-0 top-1/2 h-[0.5px] z-0 opacity-20" 
          style={{
            background: 'linear-gradient(90deg, transparent 0%, #FFD700 50%, transparent 100%)',
            animation: 'slide-right 12s infinite linear',
            transform: 'rotate(-15deg)'
          }}
        />
        
        {/* Çapraz çizgi 2 */}
        <div 
          className="absolute left-0 right-0 top-1/2 h-[0.5px] z-0 opacity-20" 
          style={{
            background: 'linear-gradient(90deg, transparent 0%, #FFD700 50%, transparent 100%)',
            animation: 'slide-left 10s infinite linear',
            transform: 'rotate(15deg)'
          }}
        />
      </div>
      
      {/* Logo ve içerik bölümü - daha kompakt */}
      <div 
        className="z-10 text-center transform-gpu transition-transform duration-500 ease-in-out"
        style={{ 
          transform: `scale(${scale}) perspective(1000px) rotateX(5deg)`,
          transformOrigin: 'center center' 
        }}
      >
        {/* Logo arkası parlak daire */}
        <div 
          className="absolute w-52 h-52 md:w-64 md:h-64 -mt-20 rounded-full z-0 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
          style={{
            background: 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, rgba(255,140,0,0) 70%)',
            animation: 'pulse-glow 3s infinite alternate ease-in-out'
          }}
        />
        
        {/* Logo */}
        <div 
          className="text-6xl md:text-7xl font-bold text-white relative z-10 text-shadow-gold animate-float"
          style={{
            textShadow: '0 4px 8px rgba(0,0,0,0.3), 0 0 20px rgba(255,215,0,0.6)',
            WebkitTextStroke: '1.5px #FFD700',
            fontFamily: 'Georgia, serif',
            letterSpacing: '0.05em',
          }}
        >
          <span className="inline-block animate-char-1">V</span>
          <span className="inline-block animate-char-2">I</span>
          <span className="inline-block animate-char-3">P</span>
          <span className="inline-block animate-char-4">I</span>
          <span className="inline-block animate-char-5">N</span>
          <span className="inline-block animate-char-6">N</span>
        </div>
        
        <div 
          className="text-xl md:text-2xl font-semibold tracking-[0.5em] pl-2 mt-0"
          style={{
            color: '#FFD700',
            textShadow: '0 2px 8px rgba(0,0,0,0.4), 0 0 10px rgba(255,215,0,0.3)',
            fontFamily: 'Arial, sans-serif',
            animation: 'slide-in-right 0.8s ease-out'
          }}
        >
          HOTELS
        </div>
      </div>
      
      {/* Yükleniyor bölümü */}
      <div 
        className="relative z-10 flex flex-col items-center w-48 mt-10"
        style={{ 
          transform: `scale(${scale})`,
          transition: 'transform 0.5s ease-in-out'
        }}
      >
        <div className="w-full h-1.5 md:h-2 bg-black/10 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 rounded-full relative"
            style={{
              width: `${progress}%`,
              transition: 'width 0.3s ease-in-out',
              boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
            }}
          >
            {/* Parlama efekti */}
            <div 
              className="absolute top-0 bottom-0 right-0 w-4 bg-white/60"
              style={{ 
                filter: 'blur(2px)',
                display: progress > 10 ? 'block' : 'none'
              }}
            />
          </div>
        </div>
        
        <div 
          className="mt-3 text-xs font-medium tracking-wide flex items-center"
          style={{
            color: '#FFFFFF',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
          }}
        >
          <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-2 animate-pulse-fast"></div>
          {t('splash_loading', 'YÜKLENİYOR...')} {Math.floor(progress)}%
        </div>
      </div>
      
      {/* Tüm animasyonlar */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1) translate(-50%, -50%); }
          50% { opacity: 0.5; transform: scale(1.2) translate(-40%, -40%); }
        }
        
        @keyframes pulse-bg {
          0% { background-position: 0% 0%; }
          100% { background-position: 100% 100%; }
        }
        
        @keyframes pulse-fast {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        
        @keyframes slide-right {
          from { transform: translateX(-100%) skewY(-5deg); }
          to { transform: translateX(100%) skewY(-5deg); }
        }
        
        @keyframes slide-left {
          from { transform: translateX(100%) skewY(5deg); }
          to { transform: translateX(-100%) skewY(5deg); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes slide-in-right {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes float-up {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          70% { opacity: 0.7; }
          100% { transform: translateY(-100vh); opacity: 0; }
        }
        
        @keyframes char-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        
        .animate-pulse-fast {
          animation: pulse-fast 1s infinite ease-in-out;
        }
        
        .animate-char-1 { animation: char-float 3s 0.1s infinite ease-in-out; }
        .animate-char-2 { animation: char-float 3s 0.2s infinite ease-in-out; }
        .animate-char-3 { animation: char-float 3s 0.3s infinite ease-in-out; }
        .animate-char-4 { animation: char-float 3s 0.4s infinite ease-in-out; }
        .animate-char-5 { animation: char-float 3s 0.5s infinite ease-in-out; }
        .animate-char-6 { animation: char-float 3s 0.6s infinite ease-in-out; }
        
        .text-shadow-gold {
          text-shadow: 0 4px 8px rgba(0,0,0,0.3), 0 0 20px rgba(255,215,0,0.6);
        }
      `}} />
    </div>
  );
}