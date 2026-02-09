/* ===================================
   GLOBAL UNIVERSITY EXPLORER
   Main Application Logic
   =================================== */

// === CONFIGURATION ===
const CONFIG = {
    API_BASE: '/.netlify/functions/universities',
    ANIMATION_DELAY: 100,
    CAROUSEL_TOTAL: 6
};

// === STATE MANAGEMENT ===
const state = {
    universities: [],
    filteredResults: [],
    currentCarouselIndex: 0,
    isLoading: false,
    carouselAutoPlay: null
};

// === DOM ELEMENTS ===
const elements = {
    countryInput: document.getElementById('country'),
    stateInput: document.getElementById('state'),
    searchBtn: document.getElementById('searchBtn'),
    loading: document.getElementById('loading'),
    results: document.getElementById('results'),
    noResults: document.getElementById('noResults'),
    carouselTrack: document.getElementById('carouselTrack'),
    carouselDots: document.getElementById('carouselDots')
};

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    animateStats();
    initStaticCarousel();
});

function initializeApp() {
    // Simple fade-in for hero
    const hero = document.querySelector('.hero-content');
    if (hero) {
        hero.style.opacity = '0';
        setTimeout(() => {
            hero.style.transition = 'opacity 0.8s ease';
            hero.style.opacity = '1';
        }, 100);
    }
}

// === EVENT LISTENERS ===
function setupEventListeners() {
    // Search button click
    elements.searchBtn.addEventListener('click', handleSearch);
    
    // Enter key on inputs
    elements.countryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    elements.stateInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    // Mobile menu toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            mobileToggle.setAttribute('aria-expanded', 
                navMenu.classList.contains('active'));
        });
    }
    
    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    
    // Carousel controls
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');
    
    if (prevBtn) prevBtn.addEventListener('click', () => scrollCarousel('prev'));
    if (nextBtn) nextBtn.addEventListener('click', () => scrollCarousel('next'));
    
    // Pause auto-play on hover
    const carousel = document.querySelector('.carousel-container');
    if (carousel) {
        carousel.addEventListener('mouseenter', () => clearInterval(state.carouselAutoPlay));
        carousel.addEventListener('mouseleave', () => startCarouselAutoPlay());
    }
    
    // Dot click handlers
    document.querySelectorAll('.carousel-dot').forEach((dot, index) => {
        dot.addEventListener('click', () => scrollToCarouselIndex(index));
    });
    
    // Consultation form
    const consultationForm = document.getElementById('consultationForm');
    if (consultationForm) {
        consultationForm.addEventListener('submit', handleConsultationSubmit);
    }
}

// === SEARCH FUNCTIONALITY ===
async function handleSearch() {
    const country = elements.countryInput.value.trim();
    const stateProvince = elements.stateInput.value.trim();
    
    if (!country) {
        showNotification('Please enter a country name', 'warning');
        return;
    }
    
    showLoading(true);
    hideResults();
    
    try {
        const universities = await fetchUniversities(country);
        
        if (universities.length === 0) {
            showNoResults();
            return;
        }
        
        // Filter by state if provided
        const filtered = stateProvince 
            ? universities.filter(uni => 
                uni['state-province'] && 
                uni['state-province'].toLowerCase().includes(stateProvince.toLowerCase())
              )
            : universities;
        
        if (filtered.length === 0) {
            showNoResults();
            return;
        }
        
        state.filteredResults = filtered;
        displayResults(filtered);
        
    } catch (error) {
        console.error('Search error:', error);
        showNotification('Failed to fetch universities. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// === API CALLS ===
async function fetchUniversities(country) {
    try {
        const response = await axios.get(CONFIG.API_BASE, {
            params: { country },
            timeout: 10000 // 10 second timeout
        });
        
        // Validate response
        if (!response.data || !Array.isArray(response.data)) {
            console.warn('Invalid API response format');
            return [];
        }
        
        return response.data;
    } catch (error) {
        console.error('API Error:', error);
        if (error.response) {
            // Server responded with error
            throw new Error(`Server error: ${error.response.status}`);
        } else if (error.request) {
            // Request made but no response
            throw new Error('Network error: No response from server');
        } else {
            // Something else happened
            throw new Error('Request failed');
        }
    }
}

// === DISPLAY RESULTS ===
function displayResults(universities) {
    elements.results.innerHTML = '';
    elements.noResults.classList.add('hidden');
    
    universities.forEach((uni, index) => {
        const card = createUniversityCard(uni, index);
        elements.results.appendChild(card);
    });
    
    // Scroll to results
    setTimeout(() => {
        elements.results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 300);
}

function createUniversityCard(university, index) {
    const card = document.createElement('article');
    card.className = 'university-card glass';
    card.style.animationDelay = `${index * 0.1}s`;
    
    const websites = university.web_pages || [];
    const domains = university.domains || [];
    const stateProvince = university['state-province'] || 'N/A';
    
    card.innerHTML = `
        <h3 class="university-name">${escapeHtml(university.name)}</h3>
        <div class="university-info">
            <div class="info-item">
                <span class="info-icon">🌍</span>
                <span>${escapeHtml(university.country)}</span>
            </div>
            ${stateProvince !== 'N/A' ? `
                <div class="info-item">
                    <span class="info-icon">📍</span>
                    <span>${escapeHtml(stateProvince)}</span>
                </div>
            ` : ''}
            ${domains.length > 0 ? `
                <div class="info-item">
                    <span class="info-icon">🔗</span>
                    <span>${escapeHtml(domains[0])}</span>
                </div>
            ` : ''}
        </div>
        ${websites.length > 0 ? `
            <a href="${escapeHtml(websites[0])}" 
               target="_blank" 
               rel="noopener noreferrer" 
               class="university-link"
               aria-label="Visit ${escapeHtml(university.name)} website">
                Visit Website
                <span>→</span>
            </a>
        ` : ''}
    `;
    
    return card;
}

// === CAROUSEL FUNCTIONALITY ===
function initStaticCarousel() {
    startCarouselAutoPlay();
}

function scrollCarousel(direction) {
    const track = elements.carouselTrack;
    const cardWidth = 256 + 32; // card width (256px from CSS) + gap (32px from CSS)
    
    if (direction === 'next') {
        state.currentCarouselIndex = (state.currentCarouselIndex + 1) % CONFIG.CAROUSEL_TOTAL;
    } else {
        state.currentCarouselIndex = (state.currentCarouselIndex - 1 + CONFIG.CAROUSEL_TOTAL) % CONFIG.CAROUSEL_TOTAL;
    }
    
    track.scrollTo({
        left: cardWidth * state.currentCarouselIndex,
        behavior: 'smooth'
    });
    updateCarouselDots();
    resetCarouselAutoPlay();
}

function scrollToCarouselIndex(index) {
    const track = elements.carouselTrack;
    const cardWidth = 256 + 32; // card width (256px from CSS) + gap (32px from CSS)
    track.scrollTo({
        left: cardWidth * index,
        behavior: 'smooth'
    });
    state.currentCarouselIndex = index;
    updateCarouselDots();
    resetCarouselAutoPlay();
}

function updateCarouselDots() {
    const dots = document.querySelectorAll('.carousel-dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === state.currentCarouselIndex);
    });
}

function startCarouselAutoPlay() {
    state.carouselAutoPlay = setInterval(() => {
        scrollCarousel('next');
    }, 1000);
}

function resetCarouselAutoPlay() {
    clearInterval(state.carouselAutoPlay);
    startCarouselAutoPlay();
}

// === CONSULTATION FORM ===
function handleConsultationSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const message = document.getElementById('userMessage').value;
    
    const mailtoLink = `mailto:kingsuraj6387@gmail.com?subject=University Consultation Request from ${encodeURIComponent(name)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`)}`;
    
    window.location.href = mailtoLink;
    
    showFormStatus('Message prepared! Your email client will open.', 'success');
    e.target.reset();
}

function showFormStatus(message, type) {
    const status = document.getElementById('formStatus');
    status.textContent = message;
    status.className = `form-status ${type}`;
    status.classList.remove('hidden');
    
    setTimeout(() => {
        status.classList.add('hidden');
    }, 5000);
}

// === STATS ANIMATION ===
function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number[data-target]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.dataset.target);
                animateNumber(entry.target, target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    
    statNumbers.forEach(stat => observer.observe(stat));
}

function animateNumber(element, target) {
    const duration = 1500;
    const increment = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
}

// === HEADER SCROLL EFFECT ===
let lastScroll = 0;
let ticking = false;

window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            const header = document.querySelector('.header');
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 100) {
                header.style.background = 'rgba(10, 10, 10, 0.95)';
                header.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
            } else {
                header.style.background = 'rgba(10, 10, 10, 0.8)';
                header.style.boxShadow = 'none';
            }
            
            lastScroll = currentScroll;
            ticking = false;
        });
        ticking = true;
    }
});

// === UI HELPERS ===
function showLoading(show) {
    state.isLoading = show;
    elements.loading.classList.toggle('hidden', !show);
}

function hideResults() {
    elements.results.innerHTML = '';
    elements.noResults.classList.add('hidden');
}

function showNoResults() {
    elements.noResults.classList.remove('hidden');
    showLoading(false);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'error' ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 215, 0, 0.2)'};
        backdrop-filter: blur(20px);
        border: 1px solid ${type === 'error' ? 'rgba(255, 0, 0, 0.4)' : 'rgba(255, 215, 0, 0.4)'};
        border-radius: 15px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// === UTILITY FUNCTIONS ===
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// === KEYBOARD ACCESSIBILITY ===
document.addEventListener('keydown', (e) => {
    // Escape key closes mobile menu
    if (e.key === 'Escape') {
        const navMenu = document.querySelector('.nav-menu');
        const mobileToggle = document.querySelector('.mobile-toggle');
        if (navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            mobileToggle.setAttribute('aria-expanded', 'false');
        }
    }
});

// === PERFORMANCE OPTIMIZATION ===
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// === ERROR HANDLING ===
window.addEventListener('error', (e) => {
    console.error('Error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Promise rejection:', e.reason);
});

// === ANALYTICS (Optional) ===
function trackSearch(country, state, resultsCount) {
    console.log('Search:', { country, state, resultsCount });
}

// === EXPORT FOR TESTING ===
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchUniversities,
        createUniversityCard,
        escapeHtml
    };
}

// === CSS ANIMATIONS ===
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    .nav-menu.active {
        display: flex;
        flex-direction: column;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: rgba(10, 10, 10, 0.98);
        backdrop-filter: blur(20px);
        padding: 2rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
`;
document.head.appendChild(style);

console.log('🎓 UniExplorer loaded!');
