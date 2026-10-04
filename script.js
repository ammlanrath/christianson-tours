/**
 * Christianson Tours — Unified Hero Scroll & Canvas Animation Engine
 * Controls:
 * 1. Frame-by-frame WEBP canvas background animation
 * 2. Opening brand title fade & exit
 * 3. Sequential curved card trajectory (RIGHT -> LEFT/CENTER -> UPPER-LEFT)
 * 4. Waypoint navigation stage indicator
 * 
 * All driven by a single normalized progress (0.0 to 1.0) derived strictly from #hero-scroll-section.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. WEBP Scroll Frame Animation Engine ---
    const canvas = document.getElementById("animation-canvas");
    const context = canvas ? canvas.getContext("2d") : null;
    const frameCount = 240;
    const currentFrame = index => (
      `pics.wepg/ezgif-frame-${(index + 1).toString().padStart(3, '0')}_wepg.webp`
    );

    const images = [];
    function preloadImages() {
      for (let i = 0; i < frameCount; i++) {
        const imgObj = new Image();
        imgObj.src = currentFrame(i);
        images.push(imgObj);
      }
    }
    preloadImages();

    function drawFrame(index) {
        if (!canvas || !context) return;
        const img = images[index];
        if (img && img.complete) {
            drawImageScaled(img, context);
        }
    }

    function drawImageScaled(img, ctx) {
        var c = ctx.canvas;
        var hRatio = c.width / img.width;
        var vRatio = c.height / img.height;
        var ratio = Math.max(hRatio, vRatio);
        var centerShift_x = (c.width - img.width * ratio) / 2;
        var centerShift_y = (c.height - img.height * ratio) / 2;  
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, img.width, img.height,
                           centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);  
    }

    function resizeCanvas() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', () => {
        resizeCanvas();
        updateHero();
    });

    resizeCanvas();
    if (images[0]) {
        images[0].onload = () => {
            resizeCanvas();
            drawFrame(0);
        };
    }

    // --- 2. Hero Elements & Waypoint Setup ---
    const heroSection = document.getElementById('hero-scroll-section');
    const heroCenterTitle = document.getElementById('hero-center-title');
    const heroWaypointBar = document.getElementById('hero-waypoint-bar');
    const heroProgressBar = document.getElementById('hero-progress-bar');
    const activeWaypoint = document.getElementById('active-waypoint-indicator');
    
    const pins = {
        vegas: { pin: document.getElementById('pin-vegas'), text: document.getElementById('text-vegas') },
        hoover: { pin: document.getElementById('pin-hoover'), text: document.getElementById('text-hoover') },
        canyon: { pin: document.getElementById('pin-canyon'), text: document.getElementById('text-canyon') }
    };

    window.scrollToDestination = function(destIndex) {
        if (!heroSection) return;
        const rect = heroSection.getBoundingClientRect();
        const heroStart = window.scrollY + rect.top;
        const heroHeight = heroSection.offsetHeight - window.innerHeight;
        const targetProgress = destIndex === 0 ? 0.25 : (destIndex === 1 ? 0.52 : 0.78);
        const targetScroll = heroStart + (heroHeight * targetProgress);
        
        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    };

    // --- 3. Normalized Hero Scroll Progress Calculator (0 to 1) ---
    function calculateHeroProgress() {
        if (!heroSection) return 0;
        const rect = heroSection.getBoundingClientRect();
        const heroStart = window.scrollY + rect.top;
        const heroHeight = heroSection.offsetHeight - window.innerHeight;
        if (heroHeight <= 0) return 0;
        const heroProgress = (window.scrollY - heroStart) / heroHeight;
        return Math.max(0, Math.min(1, heroProgress));
    }

    // --- 4. Background Canvas Controller ---
    function updateBackgroundCanvas(heroProgress) {
        const frameIndex = Math.min(frameCount - 1, Math.floor(heroProgress * frameCount));
        drawFrame(frameIndex);
    }

    // --- 5. Hero Title Controller ---
    function updateHeroTitle(heroProgress) {
        if (!heroCenterTitle) return;
        // Title visible 0% to 15%, fades out and drifts upward
        if (heroProgress <= 0.15) {
            const titleFraction = heroProgress / 0.15;
            const opacity = 1 - titleFraction;
            const translateY = -titleFraction * 70;
            const scale = 1 - titleFraction * 0.05;
            
            heroCenterTitle.style.opacity = opacity.toString();
            heroCenterTitle.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
            heroCenterTitle.style.visibility = 'visible';
            heroCenterTitle.style.pointerEvents = opacity > 0.05 ? 'auto' : 'none';
        } else {
            heroCenterTitle.style.opacity = '0';
            heroCenterTitle.style.visibility = 'hidden';
            heroCenterTitle.style.pointerEvents = 'none';
        }
    }

    // --- 6. Curved Upward Diagonal Card Trajectory Engine ---
    /**
     * Card Movement Trajectory:
     * RIGHT (+105vw) -> LEFT/CENTER (-3vw, 0vh) -> UPPER-LEFT (-65vw, -48vh)
     * Driven by heroProgress between startP and endP.
     */
    function updateCardTrajectory(cardId, heroProgress, startP, endP, wavePhaseOffset = 0) {
        const card = document.getElementById(cardId);
        if (!card) return;

        if (heroProgress < startP || heroProgress > endP) {
            card.style.opacity = '0';
            card.style.visibility = 'hidden';
            card.style.pointerEvents = 'none';
            card.style.transform = `translate3d(120vw, 15vh, 0)`;
            return;
        }

        card.style.visibility = 'visible';
        
        // Normalized progress t inside [0, 1] for this specific card
        const t = (heroProgress - startP) / (endP - startP);
        
        const vw = window.innerWidth / 100;
        const vh = window.innerHeight / 100;

        let translateX = 0;
        let translateY = 0;
        let opacity = 0;

        if (t <= 0.42) {
            // PHASE 1: Entrance from RIGHT (+105vw) curving down/left into CENTER/LEFT (-3vw, 0vh)
            const p = t / 0.42; // 0 to 1
            const easeP = Math.sin(p * Math.PI / 2); // Smooth ease into focus center
            
            translateX = (1 - easeP) * 105 * vw - 3 * vw;
            translateY = (1 - easeP) * 18 * vh + Math.sin(p * Math.PI + wavePhaseOffset) * (-4 * vh);
            
            opacity = Math.min(1, p * 2.2);
        } else {
            // PHASE 2: Exit from CENTER/LEFT (-3vw, 0vh) traveling UP & LEFT toward UPPER-LEFT (-65vw, -48vh)
            const p = (t - 0.42) / 0.58; // 0 to 1
            const easeP = p * p; // Smooth acceleration towards upper-left
            
            translateX = -3 * vw - easeP * 62 * vw;
            translateY = 0 - easeP * 48 * vh + Math.sin(p * Math.PI * 0.8) * (-3 * vh);
            
            opacity = 1 - Math.max(0, (p - 0.4) / 0.6);
        }

        card.style.opacity = opacity.toString();
        card.style.pointerEvents = opacity > 0.4 ? 'auto' : 'none';
        card.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
    }

    // --- 7. Waypoint Navigation Bar Update ---
    function updateWaypointIndicator(heroProgress) {
        if (heroWaypointBar) {
            const wpOpacity = Math.max(0, Math.min(1, (heroProgress - 0.10) / 0.08));
            heroWaypointBar.style.opacity = wpOpacity.toString();
            heroWaypointBar.style.pointerEvents = wpOpacity > 0.1 ? 'auto' : 'none';
        }

        let activeDest = 0;
        if (heroProgress > 0.65) activeDest = 2;
        else if (heroProgress > 0.40) activeDest = 1;

        Object.values(pins).forEach(p => {
            if (p.pin) p.pin.className = 'w-3 h-3 rounded-full bg-white/30 transition-all cursor-pointer';
            if (p.text) p.text.className = 'text-xs text-brand-sand/70 transition-colors';
        });

        if (activeDest === 0) {
            if (pins.vegas.pin) pins.vegas.pin.className = 'w-3.5 h-3.5 rounded-full bg-brand-ochre ring-4 ring-brand-ochre/30 transition-all cursor-pointer';
            if (pins.vegas.text) pins.vegas.text.className = 'text-xs font-bold text-white transition-colors';
            if (activeWaypoint) activeWaypoint.innerHTML = '01 / 03 - Las Vegas Departure';
        } else if (activeDest === 1) {
            if (pins.hoover.pin) pins.hoover.pin.className = 'w-3.5 h-3.5 rounded-full bg-brand-turquoise ring-4 ring-brand-turquoise/30 transition-all cursor-pointer';
            if (pins.hoover.text) pins.hoover.text.className = 'text-xs font-semibold text-white transition-colors';
            if (activeWaypoint) activeWaypoint.innerHTML = '02 / 03 - Hoover Dam Highlights';
        } else {
            if (pins.canyon.pin) pins.canyon.pin.className = 'w-3.5 h-3.5 rounded-full bg-brand-terracotta ring-4 ring-brand-terracotta/30 transition-all cursor-pointer';
            if (pins.canyon.text) pins.canyon.text.className = 'text-xs font-semibold text-white transition-colors';
            if (activeWaypoint) activeWaypoint.innerHTML = '03 / 03 - Grand Canyon West Rim';
        }
    }

    // --- 8. Main Unified Hero Update Loop ---
    function updateHero() {
        const heroProgress = calculateHeroProgress();

        // Progress Bar Update
        if (heroProgressBar) {
            heroProgressBar.style.width = (heroProgress * 100) + '%';
        }

        // Background Canvas
        updateBackgroundCanvas(heroProgress);

        // Hero Title
        updateHeroTitle(heroProgress);

        // Card Movement Timelines
        // Card 1: 15% to 40% (RIGHT -> LEFT/CENTER -> UPPER-LEFT)
        updateCardTrajectory('card-1', heroProgress, 0.15, 0.40, 0);
        
        // Card 2: 40% to 65% (RIGHT -> LEFT/CENTER -> UPPER-LEFT)
        updateCardTrajectory('card-2', heroProgress, 0.40, 0.65, 0.2);
        
        // Card 3: 65% to 90% (RIGHT -> LEFT/CENTER -> UPPER-LEFT)
        updateCardTrajectory('card-3', heroProgress, 0.65, 0.90, 0.4);

        // Waypoint Bar
        updateWaypointIndicator(heroProgress);
    }

    // Single requestAnimationFrame scroll loop with ticking flag
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateHero();
                ticking = false;
            });
            ticking = true;
        }
    });

    // Initial Trigger
    updateHero();

    // --- FAQ Accordion Toggle Interaction ---
    document.querySelectorAll('.faq-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const item = button.closest('.faq-item');
        const content = item.querySelector('.faq-content');
        const icon = item.querySelector('.faq-icon');

        const isHidden = content.classList.contains('hidden');

        document.querySelectorAll('.faq-content').forEach((c) => c.classList.add('hidden'));
        document.querySelectorAll('.faq-icon').forEach((i) => (i.textContent = '+'));

        if (isHidden) {
          content.classList.remove('hidden');
          icon.textContent = '−';
        }
      });
    });
});
