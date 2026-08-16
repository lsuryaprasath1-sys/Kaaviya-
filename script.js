/**
 * Khaaviya's Birthday Surprise Website
 * Core Logic & Interactive Animations
 */

// ==========================================================================
// 1. CONFIGURATION & PHOTO DATA
// ==========================================================================
// Feel free to replace these image URLs with real photos of Khaaviya!
// You can also add more photos, change the captions, or adjust the emotional messages.
const photosConfig = [
  {
    url: 'assets/photos/photo1.jpg',
    caption: 'That elegance ✨',
    message: 'You look absolutely beautiful in this saree, Khaaviya! Every single detail of your presence brings a special touch of elegance and grace. ❤️'
  },
  {
    url: 'assets/photos/photo2.jpg',
    caption: 'Happy Birthday vibes! 🎉',
    message: 'Your birthday celebration is the highlight of the year! Seeing your glowing face next to your name in lights is the best sight ever. ✨'
  },
  {
    url: 'assets/photos/photo3.jpg',
    caption: 'Together, always ❤️',
    message: 'Every moment shared with you is a memory I keep close to my heart. Thank you for being my constant source of joy and laughter. 🥂'
  },
  {
    url: 'assets/photos/photo4.jpg',
    caption: 'That beautiful smile 🌸',
    message: 'No flower or balloon background can ever shine brighter than your smile. Never stop being the magical person that you are! 💫'
  }
];


// Slideshow settings
const SLIDE_DURATION = 4500; // Change photo every 4.5 seconds
let currentIndex = 0;
let slideshowInterval = null;
let progressInterval = null;
let progressPercent = 0;
let isSlideshowPaused = false;
let typewriterInterval = null;

// Audio state
let isMusicPlaying = false;

// ==========================================================================
// 2. ERROR HANDLING (GRACEFUL FALLBACK)
// ==========================================================================
// This function is called if a photo fails to load (e.g. if the file is missing).
// It adds a class that hides the image and shows an elegant romantic card fallback.
window.handleImageError = function(img) {
  console.warn(`Photo not found at: ${img.src}. Gracefully showing romantic placeholder.`);
  const card = img.closest('.gallery-card, .wall-card, .modal-image-wrapper');
  if (card) {
    card.classList.add('img-error');
  }
};

// ==========================================================================
// 3. INTRO MYSTERY & SOUND EFFECTS
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  const introSection = document.getElementById('introSection');
  const mainContainer = document.getElementById('mainContainer');
  const enterBtn = document.getElementById('enterBtn');
  const bgMusic = document.getElementById('bgMusic');
  const musicToggle = document.getElementById('musicToggle');

  // Load and setup elements
  setupMobileCarousel();
  createDots();
  updateSlideshow();
  startSlideshowTimer();
  startParticlesGenerator();

  // Enter Button Interaction
  enterBtn.addEventListener('click', () => {
    // Fade out intro, show main page
    introSection.classList.add('fade-out');
    mainContainer.classList.remove('hidden');
    
    // Tiny delay to ensure element is visible before adding class for smooth transition
    setTimeout(() => {
      mainContainer.classList.add('show');
      // Play background music (most browsers allow it now since user clicked a button)
      playMusic();
    }, 50);

    // Initialize Countdown Timer
    startCountdown();
  });

  // Music controls
  musicToggle.addEventListener('click', () => {
    if (isMusicPlaying) {
      pauseMusic();
    } else {
      playMusic();
    }
  });

  function playMusic() {
    bgMusic.play().then(() => {
      isMusicPlaying = true;
      musicToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
      musicToggle.classList.add('playing');
    }).catch(err => {
      console.log("Music autoplay prevented. Waiting for more user interaction.");
    });
  }

  function pauseMusic() {
    bgMusic.pause();
    isMusicPlaying = false;
    musicToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
    musicToggle.classList.remove('playing');
  }

  // Check URL query parameters for test/reveal mode
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('reveal') === 'true' || urlParams.get('test') === 'true') {
    // Enable rapid testing of the December 26 transition
    document.getElementById('secretTrigger').addEventListener('click', () => {
      triggerCelebration();
    });
    // Visual cue for testers
    document.getElementById('secretTrigger').style.color = '#ff5277';
  } else {
    // Still bind the secret trigger button in footer for a hidden dev preview!
    document.getElementById('secretTrigger').addEventListener('click', () => {
      triggerCelebration();
    });
  }
});

// ==========================================================================
// 4. REAL-TIME DECEMBER 26 COUNTDOWN TIMER
// ==========================================================================
function getCountdownTarget() {
  const now = new Date();
  const currentYear = now.getFullYear();
  let targetDate = new Date(`December 26, ${currentYear} 00:00:00`);
  
  // If we are already past December 26 in the current year, target next year
  if (now > targetDate) {
    targetDate = new Date(`December 26, ${currentYear + 1} 00:00:00`);
  }
  return targetDate;
}

function startCountdown() {
  const target = getCountdownTarget();

  function updateTimer() {
    const now = new Date().getTime();
    const distance = target.getTime() - now;

    // Check if birthday has arrived!
    if (distance <= 0) {
      clearInterval(countdownInterval);
      triggerCelebration();
      return;
    }

    // Time calculations
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Render numbers on page
    document.getElementById('days').innerText = String(days).padStart(2, '0');
    document.getElementById('hours').innerText = String(hours).padStart(2, '0');
    document.getElementById('minutes').innerText = String(minutes).padStart(2, '0');
    document.getElementById('seconds').innerText = String(seconds).padStart(2, '0');
  }

  // Run immediately then tick every second
  updateTimer();
  const countdownInterval = setInterval(updateTimer, 1000);
}

// ==========================================================================
// 5. PHOTO SLIDESHOW ROTATOR ENGINE (DESKTOP & MOBILE)
// ==========================================================================

// Build mobile carousel track
function setupMobileCarousel() {
  const track = document.getElementById('mobileTrack');
  track.innerHTML = '';
  
  photosConfig.forEach((photo, idx) => {
    const slide = document.createElement('div');
    slide.className = 'mobile-carousel-item';
    
    slide.innerHTML = `
      <div class="gallery-card" data-index="${idx}">
        <div class="image-fallback">
          <i class="fas fa-heart"></i>
          <span>Memory #${idx + 1}</span>
        </div>
        <img src="${photo.url}" alt="${photo.caption}" class="gallery-img" onerror="handleImageError(this)">
      </div>
    `;
    track.appendChild(slide);
  });

  // Swipe support logic
  let startX = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;
  let isDragging = false;

  track.addEventListener('touchstart', (e) => {
    pauseSlideshow();
    startX = e.touches[0].clientX;
    isDragging = true;
  });

  track.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diffX = currentX - startX;
    // visual feedback of drag
    const width = track.clientWidth;
    const offset = -currentIndex * width + diffX;
    track.style.transition = 'none';
    track.style.transform = `translateX(${offset}px)`;
  });

  track.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;
    const endX = e.changedTouches[0].clientX;
    const diffX = endX - startX;
    const threshold = 50; // threshold in pixels

    track.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';

    if (diffX < -threshold && currentIndex < photosConfig.length - 1) {
      // swipe left -> next slide
      currentIndex++;
    } else if (diffX > threshold && currentIndex > 0) {
      // swipe right -> previous slide
      currentIndex--;
    }
    
    updateSlideshow();
    resumeSlideshow();
  });
}

// Draw Dots Navigation
function createDots() {
  const dotsContainer = document.getElementById('indicatorDots');
  dotsContainer.innerHTML = '';
  
  photosConfig.forEach((_, idx) => {
    const dot = document.createElement('div');
    dot.className = `dot ${idx === 0 ? 'active' : ''}`;
    dot.addEventListener('click', () => {
      currentIndex = idx;
      updateSlideshow();
      resetSlideshowTimer();
    });
    dotsContainer.appendChild(dot);
  });
}

// Update Slideshow positions and elements
function updateSlideshow() {
  const len = photosConfig.length;
  const currentPhoto = photosConfig[currentIndex];

  // Update Blurred Background behind slideshow
  const blurBg = document.getElementById('slideshowBlurBg');
  blurBg.style.backgroundImage = `url('${currentPhoto.url}')`;

  // --- DESKTOP GALLERY UPDATE ---
  const leftCard = document.getElementById('leftCard');
  const mainCard = document.getElementById('mainCard');
  const rightCard = document.getElementById('rightCard');

  const leftIndex = (currentIndex - 1 + len) % len;
  const rightIndex = (currentIndex + 1) % len;

  // Clear animations momentarily to reset scaling zoom
  const mainImg = mainCard.querySelector('img');
  mainImg.classList.remove('ken-burns');
  
  // Set images and error resets
  leftCard.className = 'gallery-card secondary-card left';
  leftCard.querySelector('img').src = photosConfig[leftIndex].url;
  
  mainCard.className = 'gallery-card main-card';
  mainImg.src = currentPhoto.url;
  
  rightCard.className = 'gallery-card secondary-card right';
  rightCard.querySelector('img').src = photosConfig[rightIndex].url;

  // Re-trigger Ken Burns animation
  void mainImg.offsetWidth; // Trigger browser reflow
  mainImg.classList.add('ken-burns');

  // --- MOBILE GALLERY UPDATE ---
  const track = document.getElementById('mobileTrack');
  track.style.transform = `translateX(-${currentIndex * 100}%)`;

  // --- INTERACTIVE METADATA UPDATE ---
  // Update Caption
  const caption = document.getElementById('photoCaption');
  caption.style.animation = 'none';
  void caption.offsetWidth; // Reflow
  caption.innerText = currentPhoto.caption;
  caption.style.animation = 'captionFade 0.6s ease-out forwards';

  // Update Dots
  const dots = document.querySelectorAll('.dot');
  dots.forEach((dot, idx) => {
    if (idx === currentIndex) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}

// Timer management
function startSlideshowTimer() {
  if (isSlideshowPaused) return;
  
  progressPercent = 0;
  const stepTime = 50; // increment every 50ms
  const steps = SLIDE_DURATION / stepTime;
  const progressIncrement = 100 / steps;

  progressInterval = setInterval(() => {
    progressPercent += progressIncrement;
    document.getElementById('progressBar').style.width = `${progressPercent}%`;

    if (progressPercent >= 100) {
      clearInterval(progressInterval);
      currentIndex = (currentIndex + 1) % photosConfig.length;
      updateSlideshow();
      startSlideshowTimer();
    }
  }, stepTime);
}

function resetSlideshowTimer() {
  clearInterval(progressInterval);
  document.getElementById('progressBar').style.width = '0%';
  startSlideshowTimer();
}

function pauseSlideshow() {
  isSlideshowPaused = true;
  clearInterval(progressInterval);
  document.getElementById('progressBar').style.width = '0%';
}

function resumeSlideshow() {
  isSlideshowPaused = false;
  startSlideshowTimer();
}

// ==========================================================================
// 6. SPECIAL INTERACTION: OPEN A MEMORY MODAL (POPUP)
// ==========================================================================
const openMemoryBtn = document.getElementById('openMemoryBtn');
const memoryModal = document.getElementById('memoryModal');
const closeModal = document.getElementById('closeModal');
const modalImg = document.getElementById('modalImg');
const modalBlurBg = document.getElementById('modalBlurBg');
const modalMessage = document.getElementById('modalMessage');

openMemoryBtn.addEventListener('click', () => {
  // Pause the main slideshow when looking at a details card
  pauseSlideshow();
  
  const currentPhoto = photosConfig[currentIndex];
  
  // Set modal details
  modalImg.className = ''; // remove error classes
  modalImg.src = currentPhoto.url;
  modalBlurBg.style.backgroundImage = `url('${currentPhoto.url}')`;
  
  // Open modal screen
  memoryModal.classList.remove('hidden');
  setTimeout(() => {
    memoryModal.classList.add('show');
    // Typewrite the emotional quote message
    typeMessage(modalMessage, currentPhoto.message);
  }, 50);

  // Auto-close after 8 seconds of inactivity
  window.modalAutoCloseTimer = setTimeout(() => {
    dismissMemoryModal();
  }, 8500);
});

// Close interactions
closeModal.addEventListener('click', () => {
  dismissMemoryModal();
});

memoryModal.addEventListener('click', (e) => {
  if (e.target === memoryModal) {
    dismissMemoryModal();
  }
});

function dismissMemoryModal() {
  // Clear any running timers
  clearTimeout(window.modalAutoCloseTimer);
  clearInterval(typewriterInterval);
  
  memoryModal.classList.remove('show');
  setTimeout(() => {
    memoryModal.classList.add('hidden');
    // Resume slideshow
    resumeSlideshow();
  }, 500);
}

// Typewriter text display effect
function typeMessage(element, text) {
  element.innerHTML = '';
  let index = 0;
  
  clearInterval(typewriterInterval);
  typewriterInterval = setInterval(() => {
    if (index < text.length) {
      element.innerHTML += text.charAt(index);
      index++;
    } else {
      clearInterval(typewriterInterval);
    }
  }, 35); // 35ms per character
}

// ==========================================================================
// 7. DECORATIVE FLOATING HEARTS PARTICLES
// ==========================================================================
function startParticlesGenerator() {
  const container = document.getElementById('particlesContainer');
  
  // Spawn a heart every 650ms inside the frame
  setInterval(() => {
    if (document.hidden) return; // don't spawn if tab is inactive
    
    const heart = document.createElement('div');
    heart.className = 'floating-heart';
    heart.innerHTML = '<i class="fas fa-heart"></i>';
    
    // Random position and animation variables
    const startX = Math.random() * 100; // 0% to 100% width
    const size = Math.random() * 12 + 10; // 10px to 22px
    const duration = Math.random() * 3 + 4; // 4s to 7s
    const opacity = Math.random() * 0.4 + 0.3; // 0.3 to 0.7
    const oscillation = (Math.random() - 0.5) * 80; // swing left-right width
    
    heart.style.left = `${startX}%`;
    heart.style.setProperty('--heart-size', `${size}px`);
    heart.style.setProperty('--float-duration', `${duration}s`);
    heart.style.setProperty('--heart-opacity', opacity);
    heart.style.setProperty('--oscillation', `${oscillation}px`);
    heart.style.setProperty('--rotation', `${Math.random() * 360}deg`);
    
    container.appendChild(heart);
    
    // Remove element from DOM after it floats away
    setTimeout(() => {
      heart.remove();
    }, duration * 1000);
  }, 650);
}

// ==========================================================================
// 8. DECEMBER 26 CELEBRATION SHOWROOM
// ==========================================================================
function triggerCelebration() {
  // Stop existing slideshows/intervals
  pauseSlideshow();
  clearInterval(progressInterval);
  
  const mainContainer = document.getElementById('mainContainer');
  const celebrationSection = document.getElementById('celebrationSection');
  
  // Play celebration soundtrack if possible (restart the music player)
  const bgMusic = document.getElementById('bgMusic');
  bgMusic.src = 'assets/audio/celebration.mp3';
  bgMusic.onerror = function() {
    bgMusic.onerror = null;
    bgMusic.src = 'https://assets.mixkit.co/music/preview/mixkit-bright-future-lullaby-584.mp3'; // cheerful upbeat music
    bgMusic.load();
    bgMusic.play().catch(() => {});
  };
  bgMusic.load();
  bgMusic.play().catch(() => {});

  // Fade out main page
  mainContainer.style.opacity = '0';
  mainContainer.style.transform = 'scale(0.95)';
  
  setTimeout(() => {
    mainContainer.classList.add('hidden');
    
    // Show celebration layout
    celebrationSection.classList.remove('hidden');
    celebrationSection.classList.add('active');
    
    // Launch Fireworks engine
    startFireworks();
    
    // Launch Balloons engine
    startBalloonsSpawning();

    // Stage 1 (Happy Birthday text) will show for 6 seconds, then fade to Stage 2
    setTimeout(() => {
      transitionToMemoryWall();
    }, 6000);
    
  }, 1200);
}

// Transition from name reveal to the staggered memory wall
function transitionToMemoryWall() {
  const stage1 = document.getElementById('revealStage1');
  const stage2 = document.getElementById('revealStage2');
  
  // Fade out stage 1 text
  stage1.style.transition = 'opacity 1s ease';
  stage1.style.opacity = '0';
  
  setTimeout(() => {
    stage1.classList.add('hidden');
    
    // Fade in Stage 2 (wall grid & card)
    stage2.classList.remove('hidden');
    stage2.style.opacity = '0';
    void stage2.offsetWidth;
    stage2.style.transition = 'opacity 1.5s ease';
    stage2.style.opacity = '1';
    
    // Construct Grid
    buildMemoryWallGrid();
  }, 1000);
}

// Build grid elements for Memory Wall
function buildMemoryWallGrid() {
  const wall = document.getElementById('memoryWall');
  wall.innerHTML = '';
  
  photosConfig.forEach((photo, idx) => {
    const card = document.createElement('div');
    card.className = 'wall-card';
    card.innerHTML = `
      <div class="image-fallback">
        <i class="fas fa-heart"></i>
        <span>Memory #${idx + 1}</span>
      </div>
      <img src="${photo.url}" alt="${photo.caption}" onerror="handleImageError(this)">
      <div class="wall-card-overlay">${photo.caption}</div>
    `;
    wall.appendChild(card);
    
    // Staggered layout entrance (fade-in sequence)
    setTimeout(() => {
      card.classList.add('fade-in');
    }, idx * 350); // 350ms offset per card
  });
}

// Spawns balloons floating up
function startBalloonsSpawning() {
  const container = document.getElementById('balloonContainer');
  const colors = ['#ff5277', '#ffd700', '#ffccd5', '#ff85a2', '#ffb3c6', '#d41442', '#ffe3a0'];
  
  function spawn() {
    if (!document.getElementById('celebrationSection').classList.contains('active')) return;
    
    const balloon = document.createElement('div');
    balloon.className = 'balloon';
    
    // Triangle connector piece
    const triangle = document.createElement('div');
    triangle.className = 'balloon-triangle';
    balloon.appendChild(triangle);
    
    const startX = Math.random() * 95; // left percentage
    const scale = Math.random() * 0.4 + 0.8; // scaling size
    const color = colors[Math.floor(Math.random() * colors.length)];
    const duration = Math.random() * 6 + 10; // slow float 10s to 16s
    
    balloon.style.left = `${startX}%`;
    balloon.style.transform = `scale(${scale})`;
    balloon.style.setProperty('--balloon-color', color);
    balloon.style.setProperty('animation-duration', `${duration}s`);
    
    // Set custom triangle border color matching balloon body
    triangle.style.borderBottomColor = color;

    container.appendChild(balloon);
    
    setTimeout(() => {
      balloon.remove();
    }, duration * 1000);
  }
  
  // Spawn initially and then every 750ms
  for (let i = 0; i < 6; i++) {
    setTimeout(spawn, i * 400);
  }
  setInterval(spawn, 750);
}

// ==========================================================================
// 9. HIGH-QUALITY FIREWORKS & CONFETTI ENGINE (HTML5 CANVAS)
// ==========================================================================
function startFireworks() {
  const canvas = document.getElementById('fireworksCanvas');
  const ctx = canvas.getContext('2d');
  
  // Set dimensions
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);
  
  const fireworks = [];
  const particles = [];
  const confetti = [];
  
  const colors = [
    '#ff5277', // Rose Pink
    '#ffd700', // Gold
    '#ffccd5', // Light Pink
    '#ff85a2', // Magenta
    '#e5a9b4', // Rose Gold
    '#ffffff'  // Pure White sparkle
  ];

  // Confetti colors
  const confettiColors = ['#ff5277', '#ffd700', '#ffccd5', '#e5a9b4', '#00f0ff', '#ff00ff'];

  class ConfettiPiece {
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
      
      // Reset if off bottom
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

  class FireworkRocket {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = canvas.height;
      this.tx = this.x + (Math.random() * 100 - 50); // slight arc
      this.ty = Math.random() * (canvas.height * 0.4) + canvas.height * 0.15; // explode top area
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
    
    update(index) {
      this.coordinates.pop();
      this.coordinates.unshift([this.x, this.y]);
      
      const vx = Math.cos(this.angle) * this.speed;
      const vy = Math.sin(this.angle) * this.speed;
      
      this.x += vx;
      this.y += vy;
      this.distanceTraveled = Math.hypot(this.x - this.coordinates[this.coordinates.length - 1][0], this.y - this.coordinates[this.coordinates.length - 1][1]);
      
      if (this.y <= this.ty || this.distanceTraveled >= this.distanceToTarget) {
        // Create Explosion
        createExplosion(this.tx, this.ty);
        fireworks.splice(index, 1);
      }
    }
    
    draw() {
      ctx.beginPath();
      ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
      ctx.lineTo(this.x, this.y);
      ctx.strokeStyle = '#ffd700'; // Golden streak trail
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  class FireworkParticle {
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
    
    update(index) {
      this.coordinates.pop();
      this.coordinates.unshift([this.x, this.y]);
      
      this.speed *= this.friction;
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed + this.gravity;
      this.opacity -= this.fade;
      
      if (this.opacity <= 0) {
        particles.splice(index, 1);
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
      ctx.globalAlpha = 1.0; // reset
    }
  }

  function createExplosion(x, y) {
    const particleCount = Math.floor(Math.random() * 40) + 40;
    const color = colors[Math.floor(Math.random() * colors.length)];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new FireworkParticle(x, y, color));
    }
  }

  // Populate initial confetti pieces
  for (let i = 0; i < 90; i++) {
    confetti.push(new ConfettiPiece());
  }

  // Spawner triggers
  let rocketTimer = 0;
  
  function animLoop() {
    if (!document.getElementById('celebrationSection').classList.contains('active')) return;
    requestAnimationFrame(animLoop);
    
    // Clear canvas with trace tail effect (translucent black layer)
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(4, 1, 3, 0.18)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.globalCompositeOperation = 'source-over';
    
    // Rocket Spawning Logic
    if (rocketTimer % 22 === 0) {
      if (fireworks.length < 8) {
        fireworks.push(new FireworkRocket());
      }
    }
    rocketTimer++;
    
    // Update & Draw Rockets
    let i = fireworks.length;
    while (i--) {
      fireworks[i].update(i);
      if (fireworks[i]) fireworks[i].draw();
    }
    
    // Update & Draw Particles
    let j = particles.length;
    while (j--) {
      particles[j].update(j);
      if (particles[j]) particles[j].draw();
    }
    
    // Update & Draw Confetti
    let k = confetti.length;
    while (k--) {
      confetti[k].update();
      confetti[k].draw();
    }
  }

  animLoop();
}
