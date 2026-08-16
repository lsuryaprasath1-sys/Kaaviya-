"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// Local static fallbacks in case Supabase is not yet configured or tables are empty
const defaultPhotosConfig = [
  {
    url: "/assets/photos/photo1.jpg",
    videoUrl: "",
    caption: "That elegance ✨",
    message: "You look absolutely beautiful in this saree, Khaaviya! Every single detail of your presence brings a special touch of elegance and grace. ❤️"
  },
  {
    url: "/assets/photos/photo2.jpg",
    videoUrl: "",
    caption: "Happy Birthday vibes! 🎉",
    message: "Your birthday celebration is the highlight of the year! Seeing your glowing face next to your name in lights is the best sight ever. ✨"
  },
  {
    url: "/assets/photos/photo3.jpg",
    videoUrl: "",
    caption: "Together, always ❤️",
    message: "Every moment shared with you is a memory I keep close to my heart. Thank you for being my constant source of joy and laughter. 🥂"
  },
  {
    url: "/assets/photos/photo4.jpg",
    videoUrl: "",
    caption: "That beautiful smile 🌸",
    message: "No flower or balloon background can ever shine brighter than your smile. Never stop being the magical person that you are! 💫"
  }
];

const defaultSettings = {
  name: "Khaaviya",
  birthday_date: "2026-12-26T00:00:00.000Z",
  intro_title: "For someone very special...",
  intro_message: "Every second brings a new reason to smile, and a special moment is quietly making its way to you.",
  birthday_message: "Happy Birthday, Khaaviya! 🎂❤️",
  final_message: "Every picture has a story. Every memory has a feeling. And today is all about you, Khaaviya. ❤️",
  theme: "velvet",
  music_url: ""
};

export default function Home() {
  // App States
  const [settings, setSettings] = useState(defaultSettings);
  const [memories, setMemories] = useState(defaultPhotosConfig);
  
  const [stage, setStage] = useState("intro"); // "intro" | "main" | "celebration"
  const [celebrationStage, setCelebrationStage] = useState(1); // 1: Big Wishes, 2: Memory Wall
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  
  // Timer progress states
  const [progressPercent, setProgressPercent] = useState(0);
  const [isSlideshowPaused, setIsSlideshowPaused] = useState(false);
  
  // Countdown states
  const [countdown, setCountdown] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTypewriterText, setModalTypewriterText] = useState("");
  
  // Refs
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);
  const particlesContainerRef = useRef(null);
  const balloonContainerRef = useRef(null);
  const typewriterIntervalRef = useRef(null);
  
  const slideDuration = 4500; // 4.5s slide

  // 1. Fetch Birthday settings & files from Supabase
  const fetchData = async () => {
    try {
      // Fetch settings
      const { data: dbSettings, error: settingsError } = await supabase
        .from("birthday_settings")
        .select("*")
        .single();
      
      if (dbSettings && !settingsError) {
        setSettings(dbSettings);
      }
      
      // Fetch files designated for the gallery slideshow
      const { data: dbFiles, error: filesError } = await supabase
        .from("files")
        .select("*")
        .eq("is_gallery_photo", true)
        .order("sort_order", { ascending: true });
        
      if (dbFiles && dbFiles.length > 0 && !filesError) {
        const formattedMemories = dbFiles.map(file => ({
          url: file.public_url,
          videoUrl: file.file_type === "video" ? file.public_url : "",
          caption: file.caption || "A beautiful memory ❤️",
          message: file.caption || "Every moment shared with you is a memory I keep close to my heart. ❤️"
        }));
        setMemories(formattedMemories);
      }
    } catch (e) {
      console.warn("Database fetch failed or not yet initialized. Using local fallbacks.", e);
    }
  };

  useEffect(() => {
    fetchData();

    // 2. Realtime Subscriptions setup
    const settingsSubscription = supabase
      .channel("public:birthday_settings")
      .on("postgres_changes", { event: "*", schema: "public", table: "birthday_settings" }, (payload) => {
        if (payload.new) {
          setSettings(prev => ({ ...prev, ...payload.new }));
        }
      })
      .subscribe();

    const filesSubscription = supabase
      .channel("public:files")
      .on("postgres_changes", { event: "*", schema: "public", table: "files" }, () => {
        fetchData(); // Refetch database files when additions/deletions occur
      })
      .subscribe();

    return () => {
      supabase.removeChannel(settingsSubscription);
      supabase.removeChannel(filesSubscription);
    };
  }, []);

  // Theme variable toggler handler
  useEffect(() => {
    document.body.className = `theme-${settings.theme || "velvet"}`;
  }, [settings.theme]);

  // 3. Countdown timer logic
  useEffect(() => {
    if (stage === "intro") return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const targetTime = new Date(settings.birthday_date).getTime();
      const distance = targetTime - now;

      if (distance <= 0) {
        clearInterval(timer);
        triggerCelebration();
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown({
        days: String(days).padStart(2, "0"),
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0")
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, settings.birthday_date]);

  // 4. Auto-playing slideshow interval engine
  useEffect(() => {
    if (stage !== "main" || isSlideshowPaused || memories.length === 0) return;

    setProgressPercent(0);
    const stepTime = 50;
    const stepsCount = slideDuration / stepTime;
    const increment = 100 / stepsCount;

    const progressTimer = setInterval(() => {
      setProgressPercent(prev => {
        if (prev >= 100) {
          setCurrentIndex(current => (current + 1) % memories.length);
          return 0;
        }
        return prev + increment;
      });
    }, stepTime);

    return () => clearInterval(progressTimer);
  }, [stage, isSlideshowPaused, currentIndex, memories.length]);

  // 5. Floating heart particle generator loop
  useEffect(() => {
    if (stage !== "main") return;

    const interval = setInterval(() => {
      if (document.hidden || !particlesContainerRef.current) return;

      const heart = document.createElement("div");
      heart.className = "floating-heart";
      heart.innerHTML = '<i class="fas fa-heart"></i>';

      const startX = Math.random() * 100;
      const size = Math.random() * 12 + 10;
      const duration = Math.random() * 3 + 4;
      const opacity = Math.random() * 0.4 + 0.3;
      const oscillation = (Math.random() - 0.5) * 80;

      heart.style.left = `${startX}%`;
      heart.style.setProperty("--heart-size", `${size}px`);
      heart.style.setProperty("--float-duration", `${duration}s`);
      heart.style.setProperty("--heart-opacity", opacity);
      heart.style.setProperty("--oscillation", `${oscillation}px`);
      heart.style.setProperty("--rotation", `${Math.random() * 360}deg`);

      particlesContainerRef.current.appendChild(heart);

      setTimeout(() => {
        heart.remove();
      }, duration * 1000);
    }, 650);

    return () => clearInterval(interval);
  }, [stage]);

  // 6. Enter button gate trigger
  const enterSurprise = () => {
    setStage("main");
    playMusic();
  };

  const playMusic = () => {
    if (audioRef.current) {
      // Dynamic music setup
      const audioSource = settings.music_url || "/music.mp3.mp3";
      if (audioRef.current.src !== audioSource) {
        audioRef.current.src = audioSource;
      }
      
      audioRef.current.play().then(() => {
        setIsMusicPlaying(true);
      }).catch(() => {
        console.warn("Autoplay block. Volume settings are muted.");
      });
    }
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
        setIsMusicPlaying(false);
      } else {
        audioRef.current.play();
        setIsMusicPlaying(true);
      }
    }
  };

  // 7. Special modal "Open a Memory" typewriter engine
  const openMemory = () => {
    setIsSlideshowPaused(true);
    setIsModalOpen(true);
    
    const text = memories[currentIndex]?.message || "";
    setModalTypewriterText("");
    
    let idx = 0;
    if (typewriterIntervalRef.current) clearInterval(typewriterIntervalRef.current);
    
    typewriterIntervalRef.current = setInterval(() => {
      if (idx < text.length) {
        setModalTypewriterText(prev => prev + text.charAt(idx));
        idx++;
      } else {
        clearInterval(typewriterIntervalRef.current);
      }
    }, 35);
  };

  const closeMemoryModal = () => {
    if (typewriterIntervalRef.current) clearInterval(typewriterIntervalRef.current);
    setIsModalOpen(false);
    setIsSlideshowPaused(false);
  };

  // 8. Celebration Mode Trigger
  const triggerCelebration = () => {
    setIsSlideshowPaused(true);
    setStage("celebration");
    
    // Upbeat music change on celebration launch
    if (audioRef.current) {
      audioRef.current.src = "https://assets.mixkit.co/music/preview/mixkit-bright-future-lullaby-584.mp3";
      audioRef.current.load();
      audioRef.current.play().catch(() => {});
      setIsMusicPlaying(true);
    }

    // Launch visual effects loops
    setTimeout(() => {
      startCanvasEffects();
      startBalloonsSpawning();
    }, 100);

    // Stagger transition from big titles (Stage 1) to Memory Wall (Stage 2)
    setTimeout(() => {
      setCelebrationStage(2);
    }, 6000);
  };

  // 9. Floating Balloons Generator inside celebration
  const startBalloonsSpawning = () => {
    const colors = ["#ff5277", "#ffd700", "#ffccd5", "#ff85a2", "#ffb3c6", "#d41442", "#ffe3a0"];
    
    const spawnBalloon = () => {
      if (!balloonContainerRef.current) return;

      const balloon = document.createElement("div");
      balloon.className = "balloon";
      
      const triangle = document.createElement("div");
      triangle.className = "balloon-triangle";
      balloon.appendChild(triangle);

      const startX = Math.random() * 95;
      const scale = Math.random() * 0.4 + 0.8;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const duration = Math.random() * 6 + 10;

      balloon.style.left = `${startX}%`;
      balloon.style.transform = `scale(${scale})`;
      balloon.style.setProperty("--balloon-color", color);
      balloon.style.setProperty("animation-duration", `${duration}s`);
      triangle.style.borderBottomColor = color;

      balloonContainerRef.current.appendChild(balloon);

      setTimeout(() => {
        balloon.remove();
      }, duration * 1000);
    };

    // Spawn initial balloons
    for (let i = 0; i < 6; i++) {
      setTimeout(spawnBalloon, i * 400);
    }
    
    const interval = setInterval(spawnBalloon, 750);
    return () => clearInterval(interval);
  };

  // 10. High-Quality HTML5 Canvas Fireworks & Confetti loop
  const startCanvasEffects = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const fireworks = [];
    const particles = [];
    const confetti = [];

    const colors = ["#ff5277", "#ffd700", "#ffccd5", "#ff85a2", "#e5a9b4", "#ffffff"];
    const confettiColors = ["#ff5277", "#ffd700", "#ffccd5", "#e5a9b4", "#00f0ff", "#ff00ff"];

    class Confetti {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * -canvas.height;
        this.size = Math.random() * 8 + 5;
        this.color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        this.speedY = Math.random() * 3 + 2;
        this.speedX = Math.random() * 2 - 1;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 4 - 2;
      }
      update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.rotation += this.rotationSpeed;
        if (this.y > canvas.height) {
          this.y = -20;
          this.x = Math.random() * canvas.width;
        }
      }
      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        ctx.restore();
      }
    }

    class Firework {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height;
        this.tx = this.x + (Math.random() * 100 - 50);
        this.ty = Math.random() * (canvas.height * 0.4) + canvas.height * 0.15;
        this.speed = Math.random() * 3 + 4;
        this.angle = Math.atan2(this.ty - this.y, this.tx - this.x);
        this.distanceToTarget = Math.hypot(this.tx - this.x, this.ty - this.y);
        this.distanceTraveled = 0;
        this.coordinates = [];
        this.coordinateCount = 3;
        while (this.coordinateCount--) {
          this.coordinates.push([this.x, this.y]);
        }
      }
      update(idx) {
        this.coordinates.pop();
        this.coordinates.unshift([this.x, this.y]);
        const vx = Math.cos(this.angle) * this.speed;
        const vy = Math.sin(this.angle) * this.speed;
        this.x += vx;
        this.y += vy;
        this.distanceTraveled = Math.hypot(this.x - this.coordinates[this.coordinates.length-1][0], this.y - this.coordinates[this.coordinates.length-1][1]);
        if (this.y <= this.ty || this.distanceTraveled >= this.distanceToTarget) {
          explode(this.tx, this.ty);
          fireworks.splice(idx, 1);
        }
      }
      draw() {
        ctx.beginPath();
        ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = "#ffd700";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    class Spark {
      constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = Math.random() * 6 + 2;
        this.friction = 0.95;
        this.gravity = 0.15;
        this.opacity = 1;
        this.fade = Math.random() * 0.015 + 0.01;
        this.coordinates = [];
        this.coordinateCount = 5;
        while (this.coordinateCount--) {
          this.coordinates.push([this.x, this.y]);
        }
      }
      update(idx) {
        this.coordinates.pop();
        this.coordinates.unshift([this.x, this.y]);
        this.speed *= this.friction;
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed + this.gravity;
        this.opacity -= this.fade;
        if (this.opacity <= 0) {
          particles.splice(idx, 1);
        }
      }
      draw() {
        ctx.beginPath();
        ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.lineWidth = Math.random() * 2 + 1;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }
    }

    const explode = (x, y) => {
      const sparkles = Math.floor(Math.random() * 40) + 40;
      const color = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < sparkles; i++) {
        particles.push(new Spark(x, y, color));
      }
    };

    // Populate initial confetti pieces
    for (let i = 0; i < 90; i++) {
      confetti.push(new Confetti());
    }

    let rocketTimer = 0;

    const loop = () => {
      if (!canvasRef.current) return;
      animationFrameId.current = requestAnimationFrame(loop);

      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(4, 1, 3, 0.18)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalCompositeOperation = "source-over";

      if (rocketTimer % 22 === 0 && fireworks.length < 8) {
        fireworks.push(new Firework());
      }
      rocketTimer++;

      let i = fireworks.length;
      while (i--) {
        fireworks[i].update(i);
        if (fireworks[i]) fireworks[i].draw();
      }

      let j = particles.length;
      while (j--) {
        particles[j].update(j);
        if (particles[j]) particles[j].draw();
      }

      let k = confetti.length;
      while (k--) {
        confetti[k].update();
        confetti[k].draw();
      }
    };

    loop();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  };

  // Helper handles image errors gracefully by hiding error states
  const handleImgError = (e) => {
    const card = e.target.closest(".gallery-card, .wall-card, .modal-image-wrapper");
    if (card) {
      card.classList.add("img-error");
    }
  };

  const getMediaElement = (photo, isMain = false) => {
    if (photo.videoUrl) {
      return (
        <video 
          src={photo.videoUrl} 
          autoPlay 
          loop 
          muted 
          playsInline 
          className={`gallery-img ${isMain ? "ken-burns" : ""}`}
          onError={handleImgError}
        />
      );
    }
    return (
      <img 
        src={photo.url} 
        alt={photo.caption} 
        className={`gallery-img ${isMain ? "ken-burns" : ""}`} 
        onError={handleImgError}
      />
    );
  };

  // Calculations for offset photo slots (left, main, right)
  const total = memories.length;
  const leftPhoto = memories[(currentIndex - 1 + total) % total];
  const mainPhoto = memories[currentIndex];
  const rightPhoto = memories[(currentIndex + 1) % total];

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Background Audio */}
      <audio ref={audioRef} loop />

      {/* Music Control Toggle Button */}
      <div className="top-nav-buttons">
        <button className="music-toggle" onClick={toggleMusic} aria-label="Toggle Music">
          <i className={isMusicPlaying ? "fas fa-volume-up" : "fas fa-volume-mute"}></i>
        </button>
        <Link href="/admin" className="admin-toggle" aria-label="Admin settings">
          <i className="fas fa-lock"></i>
        </Link>
      </div>

      {/* STAGE 1: MYSTERY INTRO GATE */}
      {stage === "intro" && (
        <section className="intro-section active">
          <div className="intro-card glass-panel">
            <div className="heart-icon-wrapper">
              <i className="fas fa-heart pulse"></i>
            </div>
            <h1 className="intro-title">{settings.intro_title}</h1>
            <p className="intro-text">{settings.intro_message}</p>
            <button className="btn btn-primary" onClick={enterSurprise}>
              <span>Reveal the Surprise</span> <i className="fas fa-sparkles"></i>
            </button>
          </div>
        </section>
      )}

      {/* STAGE 2: MAIN COUNTDOWN & MEMORIES PORTAL */}
      {stage === "main" && (
        <main className="main-container show">
          <header className="main-header">
            <h1>Something Special Is Waiting For You, {settings.name} ❤️</h1>
            <p className="subtitle">Your special day is getting closer...</p>
          </header>

          {/* Countdown Clock */}
          <section className="countdown-section">
            <div className="countdown-grid">
              <div className="countdown-card glass-panel">
                <span className="countdown-num">{countdown.days}</span>
                <span className="countdown-label">DAYS</span>
              </div>
              <div className="countdown-card glass-panel">
                <span className="countdown-num">{countdown.hours}</span>
                <span className="countdown-label">HOURS</span>
              </div>
              <div className="countdown-card glass-panel">
                <span className="countdown-num">{countdown.minutes}</span>
                <span className="countdown-label">MINUTES</span>
              </div>
              <div className="countdown-card glass-panel">
                <span className="countdown-num">{countdown.seconds}</span>
                <span className="countdown-label">SECONDS</span>
              </div>
            </div>
          </section>

          {/* Memories Slideshow Section */}
          <section className="memories-section">
            <div className="section-divider">
              <p>While you wait... here's a few memories ❤️</p>
            </div>
            <h2 className="gallery-title">Little Memories ❤️</h2>

            <div className="slideshow-frame">
              {/* Blurred Backdrop */}
              <div 
                className="slideshow-blur-bg" 
                style={{ backgroundImage: mainPhoto ? `url('${mainPhoto.url}')` : 'none' }}
              />
              <div className="particles-container" ref={particlesContainerRef} />

              {/* Desktop 3-Card Layout */}
              {memories.length > 0 && (
                <div className="desktop-gallery">
                  {/* Left Angled Photo */}
                  <div className="gallery-card secondary-card left">
                    <div className="image-fallback"><i className="fas fa-heart"></i></div>
                    {leftPhoto && getMediaElement(leftPhoto, false)}
                  </div>

                  {/* Active Main Center Photo */}
                  <div className="gallery-card main-card">
                    <div className="image-fallback">
                      <i className="fas fa-heart"></i>
                      <span>Loading...</span>
                    </div>
                    {mainPhoto && getMediaElement(mainPhoto, true)}
                    <div className="glow-border"></div>
                  </div>

                  {/* Right Angled Photo */}
                  <div className="gallery-card secondary-card right">
                    <div className="image-fallback"><i className="fas fa-heart"></i></div>
                    {rightPhoto && getMediaElement(rightPhoto, false)}
                  </div>
                </div>
              )}

              {/* Mobile Swipeable carousel */}
              {memories.length > 0 && (
                <div className="mobile-gallery">
                  <div 
                    className="mobile-carousel-track"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                  >
                    {memories.map((photo, idx) => (
                      <div className="mobile-carousel-item" key={idx}>
                        <div className="gallery-card">
                          <div className="image-fallback"><i className="fas fa-heart"></i></div>
                          {getMediaElement(photo, false)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Slideshow progress and navigations */}
            <div className="slideshow-controls">
              <p className="photo-caption">{mainPhoto?.caption || "One beautiful memory ❤️"}</p>
              
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
              </div>
              
              <div className="indicator-dots">
                {memories.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`dot ${idx === currentIndex ? "active" : ""}`}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setProgressPercent(0);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Trigger modal click */}
            <div className="interaction-area">
              <button className="btn btn-secondary" onClick={openMemory}>
                <i className="fas fa-heart"></i> Open a Memory ❤️
              </button>
            </div>
          </section>

          {/* Footer secret trigger */}
          <footer className="main-footer">
            <p>Made with love for Khaaviya &bull; <span className="secret-trigger" onClick={triggerCelebration}><i className="fas fa-heart-pulse"></i></span></p>
          </footer>
        </main>
      )}

      {/* STAGE 3: DECEMBER 26 BIRTHDAY REVEAL */}
      {stage === "celebration" && (
        <section className="celebration-section active">
          {/* Canvas visual effects */}
          <canvas ref={canvasRef} className="fireworks-canvas" />
          <div ref={balloonContainerRef} className="balloon-container" />

          <div className="celebration-content">
            {/* Stage 1: Big wishes */}
            {celebrationStage === 1 && (
              <div className="reveal-stage active">
                <h1 className="hbd-title text-grow">🎉 HAPPY BIRTHDAY 🎉</h1>
                <h2 className="khaaviya-title text-glow">{settings.name.toUpperCase()} ❤️</h2>
              </div>
            )}

            {/* Stage 2: Memory wall grid */}
            {celebrationStage === 2 && (
              <div className="reveal-stage active">
                <h2 className="stage-title">Your Memories, Today & Always</h2>
                
                <div className="memory-wall">
                  {memories.map((photo, idx) => (
                    <div 
                      key={idx} 
                      className="wall-card fade-in"
                      style={{ animationDelay: `${idx * 0.35}s` }}
                    >
                      <div className="image-fallback"><i className="fas fa-heart"></i></div>
                      {photo.videoUrl ? (
                        <video src={photo.videoUrl} autoPlay loop muted playsinline onError={handleImgError} />
                      ) : (
                        <img src={photo.url} alt={photo.caption} onError={handleImgError} />
                      )}
                      <div className="wall-card-overlay">{photo.caption}</div>
                    </div>
                  ))}
                </div>

                <div className="birthday-card glass-panel fade-in-up">
                  <p className="final-quote" dangerouslySetInnerHTML={{ __html: settings.final_message.replace(/\n/g, '<br />') }} />
                  <h3 className="final-wishes">{settings.birthday_message}</h3>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* POPUP MEMORY MODAL */}
      {isModalOpen && memories[currentIndex] && (
        <div className="memory-modal show">
          <div className="modal-content glass-panel">
            <button className="close-modal" onClick={closeMemoryModal}>&times;</button>
            <div 
              className="modal-blur-bg" 
              style={{ backgroundImage: `url('${memories[currentIndex].url}')` }}
            />
            
            <div className="modal-image-wrapper">
              <div className="image-fallback"><i className="fas fa-heart"></i></div>
              {memories[currentIndex].videoUrl ? (
                <video src={memories[currentIndex].videoUrl} autoPlay loop muted playsinline onError={handleImgError} />
              ) : (
                <img src={memories[currentIndex].url} alt="Active Memory" onError={handleImgError} />
              )}
              <div className="glow-border"></div>
            </div>

            <div className="modal-text-wrapper">
              <p className="modal-message">{modalTypewriterText}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
