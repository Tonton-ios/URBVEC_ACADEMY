// Menu hamburger toggle
function setAppHeight() {
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
}

function initAppHeight() {
  setAppHeight();
  window.addEventListener('resize', setAppHeight);
  window.addEventListener('orientationchange', () => {
    setTimeout(setAppHeight, 150);
  });

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setAppHeight);
  }
}

function initMenuToggle() {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      menuToggle.classList.toggle('active');
    });
    
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        menuToggle.classList.remove('active');
      });
    });
  }
}

// Filtrage des cours
function filterCourses(category, activeButton) {
  const courses = document.querySelectorAll('[data-category]');
  const buttons = document.querySelectorAll('.filter-btn');
  
  buttons.forEach(btn => btn.classList.remove('active'));
  if (activeButton) {
    activeButton.classList.add('active');
  }
  
  courses.forEach(course => {
    if (category === 'all' || course.dataset.category === category) {
      course.style.display = 'block';
    } else {
      course.style.display = 'none';
    }
  });
}

function initCourseFilters() {
  document.querySelectorAll('.filter-btn[data-filter]').forEach(button => {
    button.addEventListener('click', () => {
      filterCourses(button.dataset.filter, button);
    });
  });
}

// Rendre les cartes cliquables
function initClickableCards() {
  document.querySelectorAll('.course-card-expanded').forEach(card => {
    card.addEventListener('click', function() {
      const title = this.querySelector('h3').textContent;
      const category = this.querySelector('.course-cat').textContent;
      const level = this.querySelector('.course-level').textContent;
      const duration = this.querySelector('.course-meta-detail').textContent;
      const description = this.querySelector('p').textContent;
      const image = this.querySelector('.course-thumb').style.backgroundImage;
      
      openCourseModal(title, category, level, duration, description, image);
    });
  });
}

// Ouvrir le modal
function openCourseModal(title, category, level, duration, description, image) {
  const modal = document.getElementById('courseModal');
  if (!modal) return;
  
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalCategory').textContent = category;
  document.getElementById('modalLevel').textContent = level;
  document.getElementById('modalDuration').textContent = duration;
  document.getElementById('modalDescription').textContent = description;
  document.getElementById('modalImage').style.backgroundImage = image;
  
  // Contenu d'apprentissage générique
  const learnings = ['Contenu structuré et actualisé', 'Vidéos tutoriels détaillées', 'Exercices pratiques', 'Support expert disponible'];
  const learningsList = document.getElementById('modalLearnings');
  learningsList.innerHTML = learnings.map(item => `<li>${item}</li>`).join('');
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Fermer le modal
function closeCourseModal() {
  const modal = document.getElementById('courseModal');
  if (modal) {
    modal.classList.remove('active');
  }
  document.body.style.overflow = 'auto';
}

// S'inscrire
function enrollCourse() {
  alert('Redirection vers la page d\'inscription...');
  closeCourseModal();
}

function initModalButtons() {
  document.querySelectorAll('[data-modal-close]').forEach(button => {
    button.addEventListener('click', closeCourseModal);
  });

  document.querySelectorAll('[data-enroll-course]').forEach(button => {
    button.addEventListener('click', enrollCourse);
  });
}

// Page de bienvenue avec animation
function showWelcomePage() {
  setAppHeight();

  const welcomePage = document.createElement('div');
  welcomePage.id = 'welcome-page';
  welcomePage.className = 'welcome-page';
  welcomePage.innerHTML = `
    <div class="welcome-content">
      <div class="welcome-logo-wrap">
        <svg class="welcome-logo-line" viewBox="0 0 260 260" aria-hidden="true">
          <circle cx="130" cy="130" r="118"></circle>
        </svg>
        <img src="img/urbvec_academy.png" alt="URBVEC Academy Logo" class="welcome-logo">
      </div>
    </div>
  `;
  document.body.style.overflow = 'hidden';
  document.body.insertBefore(welcomePage, document.body.firstChild);
  
  // Supprimer la page de bienvenue après le tracé du contour
  setTimeout(() => {
    welcomePage.classList.add('fade-out');
    setTimeout(() => {
      welcomePage.remove();
      document.body.style.overflow = 'auto';
    }, 800);
  }, 2800);
}

// Initialiser au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
  initAppHeight();
  initMenuToggle();
  initCourseFilters();
  initClickableCards();
  initModalButtons();
  
  // Fermer le modal en cliquant dehors
  const modal = document.getElementById('courseModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        closeCourseModal();
      }
    });
  }
  
  // Afficher la page de bienvenue seulement sur la page d'accueil
  if (document.body.classList.contains('home-page')) {
    showWelcomePage();
  }
});
