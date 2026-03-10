document.addEventListener('DOMContentLoaded', function() {
    const spaceship = document.getElementById('spaceship');
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let mouseX = x;
    let mouseY = y;
    let angle = 0;
    let exploded = false;

    // Track mouse position
    document.addEventListener('mousemove', function(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function explode() {
        exploded = true;
        
        // Create explosion effect
        spaceship.innerHTML = `
            <div class="explosion">
                <div class="particle" style="--angle: 0deg;"></div>
                <div class="particle" style="--angle: 45deg;"></div>
                <div class="particle" style="--angle: 90deg;"></div>
                <div class="particle" style="--angle: 135deg;"></div>
                <div class="particle" style="--angle: 180deg;"></div>
                <div class="particle" style="--angle: 225deg;"></div>
                <div class="particle" style="--angle: 270deg;"></div>
                <div class="particle" style="--angle: 315deg;"></div>
            </div>
        `;
        
        // Fade out and disappear after explosion
        setTimeout(() => {
            spaceship.style.opacity = '0';
            setTimeout(() => {
                spaceship.style.display = 'none';
            }, 500);
        }, 300);
    }

    function updatePosition() {
        if (exploded) return;

        // Calculate distance to mouse
        const dx = mouseX - x;
        const dy = mouseY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if spaceship touches mouse (within 25px radius)
        if (distance < 25) {
            explode();
            return;
        }
        
        // Smooth follow with easing (adjust 0.007 for speed - lower = slower)
        x += dx * 0.007;
        y += dy * 0.007;

        // Calculate rotation to face movement direction
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
            angle = Math.atan2(dy, dx) * (180 / Math.PI);
        }

        // Apply position and rotation
        spaceship.style.left = (x - 20) + 'px'; // Center the spaceship
        spaceship.style.top = (y - 12) + 'px';
        spaceship.style.transform = `rotate(${angle}deg)`;
    }

    // Start animation
    setInterval(updatePosition, 16); // ~60fps

    // Handle window resize
    window.addEventListener('resize', function() {
        if (x > window.innerWidth) x = window.innerWidth / 2;
        if (y > window.innerHeight) y = window.innerHeight / 2;
    });
});