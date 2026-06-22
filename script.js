// Import the Supabase client
import { supabase } from './supabase-config.js';

// Menu hamburger toggle

// Helper to get initials for avatar
function getInitials(fullName) {
  if (!fullName) return 'ET'; // Default for Étudiant
  const parts = fullName.split(' ').filter(Boolean);
  if (parts.length === 0) return 'ET';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function setAppHeight() {
  const visibleHeights = [
    window.innerHeight,
    document.documentElement.clientHeight,
    window.visualViewport ? window.visualViewport.height : 0
  ];
  const appHeight = Math.ceil(Math.max(...visibleHeights.filter(Boolean)));
  const coverHeight = Math.ceil(Math.max(appHeight, window.screen ? window.screen.height : 0));

  document.documentElement.style.setProperty('--app-height', `${appHeight}px`);
  document.documentElement.style.setProperty('--cover-height', `${coverHeight}px`);
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
    card.addEventListener('click', function(event) {
      if (event.target.closest('a, button')) return;

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
  window.location.href = 'inscription.html';
  closeCourseModal();
}

function initRegistrationForm() {
  const registrationForm = document.getElementById('registrationForm');
  const courseSelect = document.getElementById('courseSelect');
  const priceInfo = document.getElementById('priceInfo');
  const priceAmount = document.getElementById('priceAmount');
  const freeCourseInfo = document.getElementById('freeCourseInfo');
  const moncashAlert = document.getElementById('moncashAlert');
  const paymentFields = document.getElementById('paymentFields');
  const registrationSubmit = document.getElementById('registrationSubmit');
  const transactionId = document.getElementById('transactionId');
  const paymentProof = document.getElementById('paymentProof');

  if (!registrationForm) return;

  const params = new URLSearchParams(window.location.search);
  const isFreeMode = params.get('mode') === 'gratuit';

  if (isFreeMode) {
    if (courseSelect) {
    courseSelect.required = false;
    courseSelect.closest('.form-group').style.display = 'none';
    priceInfo.style.display = 'none';

    if (freeCourseInfo) freeCourseInfo.style.display = 'flex';
    if (moncashAlert) moncashAlert.style.display = 'none';
    if (paymentFields) paymentFields.style.display = 'none';
    if (transactionId) transactionId.required = false;
    if (paymentProof) paymentProof.required = false;
    if (registrationSubmit) {
      registrationSubmit.innerHTML = '<i class="ti ti-player-play"></i><span>Démarrer le cours</span>';
    }
    }

    registrationForm.addEventListener('submit', (event) => {
      event.preventDefault();

      if (!registrationForm.checkValidity()) {
        registrationForm.reportValidity();
        return;
      }

      playLogoTransition('cours-gratuit.html');
    });

    return;
  }

  if (!courseSelect || !priceInfo || !priceAmount) return;

  const handleCourseChange = () => {
    const selectedOption = courseSelect.options[courseSelect.selectedIndex];
    const price = selectedOption.value ? Number(selectedOption.dataset.price) : null;

    if (selectedOption.value === "" || price === null) {
      priceInfo.style.display = 'none';
      return;
    }

    if (price === 0) {
      priceInfo.style.display = 'none';
      if (freeCourseInfo) freeCourseInfo.style.display = 'flex';
      if (moncashAlert) moncashAlert.style.display = 'none';
      if (paymentFields) paymentFields.style.display = 'none';
      if (transactionId) transactionId.required = false;
      if (paymentProof) paymentProof.required = false;
      if (registrationSubmit) {
        registrationSubmit.innerHTML = '<i class="ti ti-player-play"></i><span>Démarrer le cours</span>';
      }
    } else {
      priceAmount.textContent = `${price.toLocaleString('fr-FR')} HTG`;
      priceInfo.style.display = 'flex';
      if (freeCourseInfo) freeCourseInfo.style.display = 'none';
      if (moncashAlert) moncashAlert.style.display = 'flex';
      if (paymentFields) paymentFields.style.display = 'grid';
      if (transactionId) transactionId.required = true;
      if (paymentProof) paymentProof.required = true;
      if (registrationSubmit) {
        registrationSubmit.innerHTML = '<i class="ti ti-send"></i><span>Soumettre l\'inscription</span>';
      }
    }
  };

  courseSelect.addEventListener('change', handleCourseChange);
  handleCourseChange(); // Initial check

  registrationForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!registrationForm.checkValidity()) {
      registrationForm.reportValidity();
      return;
    }

    const selectedCourseId = courseSelect.value;
    const selectedOption = courseSelect.options[courseSelect.selectedIndex];
    const price = selectedOption.value ? Number(selectedOption.dataset.price) : null;
    const fullName = document.getElementById('fullName')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();

    if (!selectedCourseId) return;

    setActiveCourseId(selectedCourseId);
    saveStudentProfile({ fullName, email, phone });

    if (price === 0) {
      playLogoTransition('cours-gratuit.html');
      return;
    }

    savePurchasedCourseId(selectedCourseId);
    playLogoTransition('dashboard-etudiant.html');
  });
}

async function initAiCourseQuiz() { 
  const quizScreen = document.getElementById('aiQuizScreen');
  const quizForm = document.getElementById('aiQuizForm');
  const welcomeScreen = document.getElementById('aiCourseWelcome');
  const dashboard = document.getElementById('aiCourseDashboard');
  const enterDashboardButton = document.getElementById('enterCourseDashboard');

  if (!quizScreen || !quizForm || !welcomeScreen || !dashboard || !enterDashboardButton) return;

  const loginScreen = document.getElementById('aiLoginScreen');
  const showLoginBtn = document.getElementById('showAiLogin');
  const showSignupBtn = document.getElementById('showAiSignup');

  const stepAccount = document.getElementById('aiFormStepAccount');
  const stepQuiz = document.getElementById('aiFormStepQuiz');
  const btnNextToQuiz = document.getElementById('aiBtnNextToQuiz');

  const showSignupFlow = () => {
    quizScreen.style.display = 'block'; // Ensure quiz screen is visible for signup flow
    quizScreen.classList.add('active'); // Assuming 'active' class controls visibility
    if (loginScreen) loginScreen.style.display = 'none';
    welcomeScreen.classList.remove('active');
    dashboard.classList.remove('active');
    if (stepAccount) stepAccount.style.display = 'block';
    if (stepQuiz) stepQuiz.style.display = 'none';
  };

  if (quizScreen && quizForm) showSignupFlow(); // Only show signup flow if on the quiz page

  if (btnNextToQuiz && stepAccount && stepQuiz) {
    btnNextToQuiz.addEventListener('click', () => {
      const nameInp = document.getElementById('aiUserName');
      const emailInp = document.getElementById('aiUserEmail');
      const phoneInp = document.getElementById('aiUserPhone');
      const passInp = document.getElementById('aiUserPassword');
      
      if (!nameInp.value.trim() || !emailInp.checkValidity() || !phoneInp.value.trim() || passInp.value.length < 6) {
        if (!nameInp.value.trim()) nameInp.reportValidity();
        else if (!emailInp.checkValidity()) emailInp.reportValidity();
        else if (!phoneInp.value.trim()) phoneInp.reportValidity();
        else passInp.reportValidity();
        return;
      }

      stepAccount.style.display = 'none';
      stepQuiz.style.display = 'block';
      // document.querySelector('.ai-course-auth-header').style.display = 'none'; // This element was removed
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (showLoginBtn && loginScreen) {
    showLoginBtn.addEventListener('click', () => {
      quizScreen.style.display = 'none';
      loginScreen.style.display = 'block';
    });
  }
  if (showSignupBtn && loginScreen) {
    showSignupBtn.addEventListener('click', () => {
      // When switching from login to signup, reset to account step
      showSignupFlow();
    });
  }

  quizForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!quizForm.checkValidity()) {
      quizForm.reportValidity();
      return;
    }

    const email = document.getElementById('aiUserEmail').value;
    const password = document.getElementById('aiUserPassword').value;
    const fullName = document.getElementById('aiUserName').value;
    const formData = new FormData(quizForm);
    const correctAnswers = {
      ai_definition: 'systeme',
      replace_people: 'outil',
      prompt_definition: 'instruction',
      good_prompt: 'clair',
      ai_mistakes: 'oui',
      privacy: 'prive',
      learning_attitude: 'pratiquer'
    };

    const score = Object.entries(correctAnswers).reduce((total, [name, answer]) => {
      return total + (formData.get(name) === answer ? 1 : 0);
    }, 0);

    const submitBtn = document.getElementById('aiQuizSubmit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="ti ti-loader animate-spin"></i> Création du compte...';

    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone: phone } } // Pass phone number here
      });

      if (authError) {
        console.warn("Inscription Supabase non bloquante pour le cours gratuit:", authError.message);
      }
    } catch (error) {
      console.warn("Inscription Supabase indisponible pour le cours gratuit:", error);
    }

    showAiCourseResult(score);
    quizScreen.style.display = 'none';
    welcomeScreen.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="ti ti-arrow-right"></i><span>S\'inscrire et voir mon résultat</span>';
  });

  const loginForm = document.getElementById('aiFreeLoginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('aiLoginEmail').value;
      const password = document.getElementById('aiLoginPassword').value;
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("Erreur: " + error.message);
      else {
        if (loginScreen) loginScreen.style.display = 'none';
        dashboard.classList.add('active');
      }
    });
  }

  enterDashboardButton.addEventListener('click', () => {
    welcomeScreen.classList.remove('active');
    dashboard.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  renderStudentCourseOutline();
}

function showAiCourseResult(score) {
  const levelLabel = document.getElementById('aiLevelLabel');
  const quizScoreLabel = document.getElementById('quizScoreLabel');
  const quizResultTitle = document.getElementById('quizResultTitle');
  const quizResultMessage = document.getElementById('quizResultMessage');

  if (levelLabel) {
    levelLabel.textContent = score >= 6 ? 'Base solide' : score >= 3 ? 'Débutant motivé' : 'Nouveau départ';
  }

  if (quizScoreLabel && quizResultTitle && quizResultMessage) {
    quizScoreLabel.textContent = `Résultat du QCM : ${score}/7 bonnes réponses`;

    if (score >= 6) {
      quizResultTitle.textContent = 'Très bon départ';
      quizResultMessage.textContent = 'Vous comprenez déjà les bases : l’IA est un outil puissant, mais il faut savoir bien la guider et vérifier ses réponses.';
    } else if (score >= 3) {
      quizResultTitle.textContent = 'Bon début';
      quizResultMessage.textContent = 'Vous avez quelques bons réflexes. Ce cours va renforcer les bases : prompt, vérification, usages pratiques et limites de l’IA.';
    } else {
      quizResultTitle.textContent = 'Nouveau départ';
      quizResultMessage.textContent = 'Aucun souci : ce cours commence depuis zéro et va vous guider pas à pas pour comprendre et utiliser l’IA simplement.';
    }
  }
}

const COURSES_KEY = 'urbvec_courses';
const ACTIVE_COURSE_KEY = 'urbvec_active_course';
const PURCHASED_COURSES_KEY = 'urbvec_purchased_courses';
const STUDENT_PROFILE_KEY = 'urbvec_student_profile';
const STUDENT_ACTIVITY_KEY = 'urbvec_student_activity';
const fileCourseItemTypes = ['document', 'pdf', 'ppt', 'doc', 'video'];

const defaultCourses = [
  { id: 'free-ai', title: "Maîtriser l'IA au quotidien", slug: 'cours-gratuit', price: 0, status: 'Publié', description: "Apprendre à utiliser l'intelligence artificielle dans le quotidien." },
  { id: 'dev-web-moderne', title: "Développement Web Moderne", slug: 'dev-web-moderne', price: 2500, status: 'Publié', description: "Maîtrisez HTML, CSS et JavaScript pour créer des interfaces web professionnelles." },
  { id: 'gestion-projet-leadership', title: "Gestion de Projet & Leadership", slug: 'gestion-projet-leadership', price: 3000, status: 'Publié', description: "Apprenez les méthodologies agiles et le management d'équipe." },
  { id: 'python-automatisation', title: "Python & Automatisation", slug: 'python-automatisation', price: 3000, status: 'Publié', description: "Apprenez Python pour automatiser des tâches répétitives." },
  { id: 'ux-ui-figma', title: "Design UX/UI avec Figma", slug: 'ux-ui-figma', price: 2500, status: 'Publié', description: "Créez des interfaces intuitives avec Figma." },
  { id: 'marketing-digital-seo', title: "Marketing Digital & SEO", slug: 'marketing-digital-seo', price: 2500, status: 'Publié', description: "Dominez les stratégies de marketing digital et le SEO." },
  { id: 'react-avance', title: "React Avancé", slug: 'react-avance', price: 4000, status: 'Publié', description: "Maîtrisez React pour construire des applications web modernes." },
  { id: 'entrepreneuriat-startup', title: "Entrepreneuriat & Startup", slug: 'entrepreneuriat-startup', price: 3500, status: 'Publié', description: "Apprenez à lancer et développer votre startup." },
  { id: 'intro-gestion-finance', title: "Intro à la Gestion & Finance", slug: 'intro-gestion-finance', price: 2500, status: 'Publié', description: "Maîtrisez les bases de la gestion d'entreprise." },
  { id: 'data-science-python', title: "Data Science avec Python", slug: 'data-science-python', price: 4500, status: 'Publié', description: "Analysez des données complexes avec Python." },
  { id: 'branding-design-graphique', title: "Branding & Design Graphique", slug: 'branding-design-graphique', price: 2000, status: 'Publié', description: "Créez des identités visuelles fortes." },
  { id: 'langues-communication', title: "Langues & Communication", slug: 'langues-communication', price: 1500, status: 'Publié', description: "Perfectionnez votre expression écrite et orale." },
  { id: 'content-marketing-copywriting', title: "Content Marketing & Copywriting", slug: 'content-marketing-copywriting', price: 2000, status: 'Publié', description: "Écrivez du contenu convaincant." },
  { id: 'developpement-personnel', title: "Développement Personnel", slug: 'developpement-personnel', price: 1500, status: 'Publié', description: "Boostez votre confiance et gérez votre temps." },
  { id: 'competences-pratiques', title: "Compétences Pratiques", slug: 'competences-pratiques', price: 1200, status: 'Publié', description: "Maîtrisez les outils informatiques essentiels." }
];

const defaultCourseContent = [
  {
    id: 'general',
    title: 'General',
    items: [
      { id: 'intro', title: 'Introduction', type: 'document', url: '', note: 'Done' }
    ]
  },
  {
    id: 'syllabus',
    title: 'Syllabus du cours',
    items: [
      { id: 'syllabus-file', title: 'Syllabus du cours: Introduction à la gestion', type: 'document', url: '', note: '' }
    ]
  },
  {
    id: 'session-1',
    title: 'Séance 1____Lundi 1 juin 2026',
    items: [
      { id: 'document-1', title: 'Document 1', type: 'document', url: '', note: '' }
    ]
  },
  {
    id: 'session-2',
    title: 'Séance 2_____Lundi 8 Juin 2026',
    items: [
      { id: 'document-2', title: 'Document 2', type: 'ppt', url: '', note: 'PPT' }
    ]
  },
  {
    id: 'quiz-10-juin',
    title: 'Mercredi 10 Juin 2026',
    items: [
      { id: 'quiz-1', title: 'Quiz', type: 'quiz', url: '', note: 'Opened: Wednesday, 10 June 2026, 9:00 AM  Closed: Wednesday, 10 June 2026, 11:59 PM' }
    ]
  },
  {
    id: 'session-3',
    title: 'Séance 3_____11 Juin 2026',
    items: [
      { id: 'document-3', title: 'Document 3', type: 'ppt', url: '', note: 'PPTX' },
      { id: 'interview-questions', title: 'Interview questions', type: 'pdf', url: '', note: 'PDF' },
      { id: 'interview-template', title: 'Interview report template', type: 'doc', url: '', note: 'DOCX' },
      { id: 'document-4', title: 'Document 4', type: 'ppt', url: '', note: 'PPTX' },
      { id: 'document-5', title: 'Document 5', type: 'ppt', url: '', note: 'PPTX' }
    ]
  }
];

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'cours';
}

function getCourses() {
  try {
    const saved = localStorage.getItem(COURSES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch (error) {
    console.warn('Impossible de lire la liste des cours.', error);
  }

  return defaultCourses;
}

function saveCourses(courses) {
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
}

function getActiveCourseId() {
  const params = new URLSearchParams(window.location.search);
  const courseFromUrl = params.get('course');
  const courses = getCourses();
  const saved = localStorage.getItem(ACTIVE_COURSE_KEY);
  const preferred = courseFromUrl || saved || courses[0]?.id || defaultCourses[0].id;

  return courses.some(course => course.id === preferred) ? preferred : courses[0].id;
}

function setActiveCourseId(courseId) {
  localStorage.setItem(ACTIVE_COURSE_KEY, courseId);
}

function getPurchasedCourseIds() {
  try {
    const saved = localStorage.getItem(PURCHASED_COURSES_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Impossible de lire les cours achetés.', error);
    return [];
  }
}

function savePurchasedCourseId(courseId) {
  if (!courseId || courseId === 'free-ai') return;
  const courses = getCourses();
  const course = courses.find(item => item.id === courseId);
  if (!course || Number(course.price || 0) <= 0) return;

  const purchasedIds = getPurchasedCourseIds();
  if (!purchasedIds.includes(courseId)) {
    localStorage.setItem(PURCHASED_COURSES_KEY, JSON.stringify([...purchasedIds, courseId]));
  }
}

function getStudentProfile() {
  try {
    const saved = localStorage.getItem(STUDENT_PROFILE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.warn('Impossible de lire le profil étudiant.', error);
    return {};
  }
}

function saveStudentProfile(profile) {
  const nextProfile = { ...getStudentProfile(), ...profile };
  localStorage.setItem(STUDENT_PROFILE_KEY, JSON.stringify(nextProfile));
  return nextProfile;
}

function getStudentActivity() {
  try {
    const saved = localStorage.getItem(STUDENT_ACTIVITY_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Impossible de lire les activités étudiant.', error);
    return [];
  }
}

function saveStudentActivity(activity) {
  const activities = getStudentActivity();
  localStorage.setItem(STUDENT_ACTIVITY_KEY, JSON.stringify([activity, ...activities].slice(0, 12)));
}

function getCourseContentKey(courseId = getActiveCourseId()) {
  return `urbvec_course_content_${courseId}`;
}

function getCourseContent(courseId = getActiveCourseId()) {
  try {
    const saved = localStorage.getItem(getCourseContentKey(courseId));
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }

    const legacySaved = localStorage.getItem('urbvec_free_course_content');
    if (courseId === 'free-ai' && legacySaved) {
      const parsedLegacy = JSON.parse(legacySaved);
      if (Array.isArray(parsedLegacy)) return parsedLegacy;
    }
  } catch (error) {
    console.warn('Impossible de lire le contenu du cours.', error);
  }

  return defaultCourseContent;
}

function saveCourseContent(content, courseId = getActiveCourseId()) {
  try {
    localStorage.setItem(getCourseContentKey(courseId), JSON.stringify(content));
    return true;
  } catch (error) {
    console.warn('Impossible de sauvegarder le contenu du cours.', error);
    alert("Ce fichier est trop lourd pour être gardé dans ce site statique. Utilise un fichier plus petit ou connecte un stockage en ligne.");
    return false;
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result));
    reader.addEventListener('error', () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value || '';
  return div.innerHTML;
}

function getCourseItemIcon(type) {
  const icons = {
    document: 'ti-file-text',
    pdf: 'ti-file-type-pdf',
    ppt: 'ti-file-type-ppt',
    doc: 'ti-file-type-doc',
    video: 'ti-video',
    quiz: 'ti-clipboard-list',
    link: 'ti-link'
  };

  return icons[type] || 'ti-file';
}

function moveArrayItem(items, index, direction) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const copy = [...items];
  const [item] = copy.splice(index, 1);
  copy.splice(nextIndex, 0, item);
  return copy;
}

function renderStudentCourseOutline() {
  const outline = document.getElementById('studentCourseOutline');
  if (!outline) return;

  const activeCourseId = getActiveCourseId();
  const activeCourse = getCourses().find(course => course.id === activeCourseId) || defaultCourses[0];
  const content = getCourseContent(activeCourseId);
  const sectionCount = content.length || 0;
  const itemCount = content.reduce((total, section) => total + section.items.length, 0);
  const dashboardTitle = document.querySelector('.dashboard-welcome h1');
  const welcomeTitle = document.querySelector('.course-welcome-card h1');

  if (dashboardTitle) dashboardTitle.textContent = activeCourse.title;
  if (welcomeTitle) welcomeTitle.textContent = activeCourse.title;

  document.querySelectorAll('.dashboard-stats span').forEach((stat, index) => {
    if (index === 0) stat.innerHTML = `<i class="ti ti-book-2"></i> ${sectionCount} sections`;
    if (index === 1) stat.innerHTML = `<i class="ti ti-file-stack"></i> ${itemCount} contenus`;
  });

  const progressLabel = document.querySelector('.lesson-progress span');
  if (progressLabel) {
    progressLabel.textContent = sectionCount ? `Section 1 sur ${sectionCount}` : 'Aucune section';
  }

  outline.classList.add('student-course-outline');
  outline.innerHTML = content.map((section, sectionIndex) => `
    <article class="student-course-section">
      <button class="course-section-toggle" type="button" aria-label="Ouvrir ou fermer la section">
        <i class="ti ti-chevron-down"></i>
      </button>
      <div class="student-section-body">
        <h2>${escapeHtml(section.title)}</h2>
        <div class="student-resource-list">
          ${section.items.map(item => `
            <a class="student-resource-row" href="${escapeHtml(item.url || '#')}" ${item.url ? 'target="_blank" rel="noopener"' : ''} ${item.fileName ? `download="${escapeHtml(item.fileName)}"` : ''}>
              <i class="ti ${getCourseItemIcon(item.type)}"></i>
              <span>${escapeHtml(item.title)}</span>
              ${item.note && item.note !== 'Done' ? `<strong>${escapeHtml(item.note)}</strong>` : ''}
              ${sectionIndex === 0 && item.note === 'Done' ? '<em><i class="ti ti-check"></i> Done</em>' : ''}
            </a>
          `).join('') || '<p class="student-empty-section">Aucun contenu pour le moment.</p>'}
        </div>
      </div>
    </article>
  `).join('');
}

function renderCourseOutlineMarkup(content) {
  return content.map((section, sectionIndex) => `
    <article class="student-course-section">
      <button class="course-section-toggle" type="button" aria-label="Ouvrir ou fermer la section">
        <i class="ti ti-chevron-down"></i>
      </button>
      <div class="student-section-body">
        <h2>${escapeHtml(section.title)}</h2>
        <div class="student-resource-list">
          ${section.items.map(item => `
            <a class="student-resource-row" href="${escapeHtml(item.url || '#')}" ${item.url ? 'target="_blank" rel="noopener"' : ''} ${item.fileName ? `download="${escapeHtml(item.fileName)}"` : ''}>
              <i class="ti ${getCourseItemIcon(item.type)}"></i>
              <span>${escapeHtml(item.title)}</span>
              ${item.note && item.note !== 'Done' ? `<strong>${escapeHtml(item.note)}</strong>` : ''}
              ${sectionIndex === 0 && item.note === 'Done' ? '<em><i class="ti ti-check"></i> Done</em>' : ''}
            </a>
          `).join('') || '<p class="student-empty-section">Aucun contenu pour le moment.</p>'}
        </div>
      </div>
    </article>
  `).join('');
}

function getPurchasedCourses() {
  const purchasedIds = getPurchasedCourseIds();
  const courses = getCourses();
  return purchasedIds
    .map(courseId => courses.find(course => course.id === courseId))
    .filter(course => course && Number(course.price || 0) > 0);
}

function renderPaidStudentDashboard(selectedCourseId = getActiveCourseId()) {
  const dashboard = document.getElementById('paidStudentDashboard');
  const courseList = document.getElementById('paidCoursesList');
  const courseCount = document.getElementById('paidCourseCount');
  const courseTitle = document.getElementById('paidCourseTitle');
  const courseDescription = document.getElementById('paidCourseDescription');
  const courseMeta = document.getElementById('paidCourseMeta');
  const outline = document.getElementById('paidCourseOutline');

  if (!dashboard || !courseList || !courseCount || !courseTitle || !courseDescription || !courseMeta || !outline) return;

  const purchasedCourses = getPurchasedCourses();
  const activeCourse = purchasedCourses.find(course => course.id === selectedCourseId) || purchasedCourses[0];
  courseCount.textContent = `${purchasedCourses.length} cours`;

  if (!purchasedCourses.length) {
    courseList.innerHTML = '<p class="student-empty-section">Aucun cours acheté pour le moment.</p>';
    courseTitle.textContent = 'Aucun cours payant actif';
    courseDescription.textContent = 'Achetez une formation pour débloquer un dashboard étudiant complet.';
    courseMeta.innerHTML = '<span><i class="ti ti-book-2"></i> 0 sections</span><span><i class="ti ti-file-stack"></i> 0 contenus</span>';
    outline.innerHTML = `
      <div class="paid-empty-state">
        <i class="ti ti-lock-open"></i>
        <h3>Aucun cours payant actif</h3>
        <p>Après validation de votre paiement, votre formation apparaîtra dans ce dashboard étudiant.</p>
        <a href="inscription.html" class="btn-primary">Choisir une formation</a>
      </div>
    `;
    return;
  }

  setActiveCourseId(activeCourse.id);
  const content = getCourseContent(activeCourse.id);
  const sectionCount = content.length || 0;
  const itemCount = content.reduce((total, section) => total + section.items.length, 0);

  courseList.innerHTML = purchasedCourses.map(course => `
    <button type="button" class="paid-course-item ${course.id === activeCourse.id ? 'active' : ''}" data-paid-course="${course.id}">
      <span>${escapeHtml(course.title)}</span>
      <strong>${Number(course.price || 0).toLocaleString('fr-FR')} HTG</strong>
    </button>
  `).join('');

  courseTitle.textContent = activeCourse.title;
  courseDescription.textContent = activeCourse.description || 'Votre formation payante avec contenus, documents et exercices.';
  courseMeta.innerHTML = `
    <span><i class="ti ti-book-2"></i> ${sectionCount} sections</span>
    <span><i class="ti ti-file-stack"></i> ${itemCount} contenus</span>
  `;
  outline.classList.add('student-course-outline');
  outline.innerHTML = content.length
    ? renderCourseOutlineMarkup(content)
    : '<p class="student-empty-section">Le contenu de ce cours sera ajouté bientôt.</p>';
}

function renderAdminCourseBuilder() {
  const outline = document.getElementById('adminCourseOutline');
  const sectionSelect = document.getElementById('itemSection');
  const contentCourseSelect = document.getElementById('contentCourseSelect');
  const selectedCourseLabel = document.getElementById('selectedCourseLabel');
  const previewSelectedCourse = document.getElementById('previewSelectedCourse');
  if (!outline || !sectionSelect || !contentCourseSelect) return;

  const activeCourseId = getActiveCourseId();
  const courses = getCourses();
  const activeCourse = courses.find(course => course.id === activeCourseId) || courses[0];
  const content = getCourseContent(activeCourseId);
  const existingSectionValue = sectionSelect.value;

  contentCourseSelect.innerHTML = courses.map(course => `<option value="${course.id}" ${course.id === activeCourseId ? 'selected' : ''}>${escapeHtml(course.title)}</option>`).join('');
  if (selectedCourseLabel) selectedCourseLabel.textContent = activeCourse.title;
  if (previewSelectedCourse) previewSelectedCourse.href = `cours-gratuit.html?course=${encodeURIComponent(activeCourseId)}`;
  sectionSelect.innerHTML = content.map(section => `<option value="${section.id}">${escapeHtml(section.title)}</option>`).join('');
  if (content.some(section => section.id === existingSectionValue)) {
    sectionSelect.value = existingSectionValue;
  }

  outline.innerHTML = content.map((section, sectionIndex) => `
    <article class="admin-outline-section">
      <div class="admin-outline-section-head">
        <h3><i class="ti ti-chevron-down"></i> ${escapeHtml(section.title)}</h3>
        <div class="admin-outline-tools">
          <button type="button" data-move-section="${section.id}" data-direction="-1" aria-label="Monter la section" ${sectionIndex === 0 ? 'disabled' : ''}><i class="ti ti-arrow-up"></i></button>
          <button type="button" data-move-section="${section.id}" data-direction="1" aria-label="Descendre la section" ${sectionIndex === content.length - 1 ? 'disabled' : ''}><i class="ti ti-arrow-down"></i></button>
          <button type="button" data-edit-section="${section.id}" aria-label="Modifier la section"><i class="ti ti-pencil"></i></button>
          <button type="button" data-delete-section="${section.id}" aria-label="Supprimer la section"><i class="ti ti-trash"></i></button>
        </div>
      </div>
      <div class="admin-outline-items">
        ${section.items.map((item, itemIndex) => `
          <div class="admin-outline-item">
            <span><i class="ti ${getCourseItemIcon(item.type)}"></i> ${escapeHtml(item.title)} ${item.note ? `<small>${escapeHtml(item.note)}</small>` : ''} ${item.fileName ? `<small>${escapeHtml(item.fileName)}</small>` : ''}</span>
            <div class="admin-outline-tools">
              <button type="button" data-move-item="${item.id}" data-section-id="${section.id}" data-direction="-1" aria-label="Monter le contenu" ${itemIndex === 0 ? 'disabled' : ''}><i class="ti ti-arrow-up"></i></button>
              <button type="button" data-move-item="${item.id}" data-section-id="${section.id}" data-direction="1" aria-label="Descendre le contenu" ${itemIndex === section.items.length - 1 ? 'disabled' : ''}><i class="ti ti-arrow-down"></i></button>
              <button type="button" data-edit-item="${item.id}" data-section-id="${section.id}" aria-label="Modifier le contenu"><i class="ti ti-pencil"></i></button>
              <button type="button" data-delete-item="${item.id}" data-section-id="${section.id}" aria-label="Supprimer le contenu"><i class="ti ti-x"></i></button>
            </div>
          </div>
        `).join('') || '<p>Aucun contenu dans cette section.</p>'}
      </div>
    </article>
  `).join('');
}

function renderAdminCourseList() {
  const courseList = document.getElementById('adminCourseList');
  if (!courseList) return;

  const activeCourseId = getActiveCourseId();
  const courses = getCourses();
  courseList.innerHTML = courses.map(course => `
    <div class="admin-course-list-item ${course.id === activeCourseId ? 'active' : ''}">
      <div>
        <strong>${escapeHtml(course.title)}</strong>
        <span>${escapeHtml(course.status)} · ${Number(course.price || 0).toLocaleString('fr-FR')} HTG · ${escapeHtml(course.slug)}</span>
      </div>
      <button type="button" data-select-course="${course.id}"><i class="ti ti-check"></i> Utiliser</button>
    </div>
  `).join('');
}

function initAdminCourses() {
  const courseForm = document.getElementById('adminCourseForm');
  const courseList = document.getElementById('adminCourseList');
  if (!courseForm) return;

  const currentCourses = getCourses();
  // On recharge la liste si elle est vide ou si elle ne contient que l'ancien cours unique
  if (!localStorage.getItem(COURSES_KEY) || (currentCourses.length === 1 && currentCourses[0].id === 'free-ai')) {
    saveCourses(defaultCourses);
  }

  renderAdminCourseList();

  courseForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const titleInput = document.getElementById('courseTitle');
    const slugInput = document.getElementById('courseSlug');
    const priceInput = document.getElementById('coursePrice');
    const statusInput = document.getElementById('courseStatus');
    const descriptionInput = document.getElementById('courseDescription');
    const title = titleInput.value.trim();
    if (!title) return;

    const slug = slugInput.value.trim() || slugify(title);
    const courses = getCourses();
    let course = courses.find(item => item.slug === slug);

    if (course) {
      course.title = title;
      course.price = Number(priceInput.value || 0);
      course.status = statusInput.value;
      course.description = descriptionInput.value.trim();
    } else {
      course = {
        id: createId('course'),
        title,
        slug,
        price: Number(priceInput.value || 0),
        status: statusInput.value,
        description: descriptionInput.value.trim()
      };
      courses.push(course);
      saveCourseContent([], course.id);
    }

    saveCourses(courses);
    setActiveCourseId(course.id);
    courseForm.reset();
    renderAdminCourseList();
    renderAdminCourseBuilder();
  });

  courseList?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-select-course]');
    if (!button) return;
    setActiveCourseId(button.dataset.selectCourse);
    renderAdminCourseList();
    renderAdminCourseBuilder();
  });
}

function initAdminCourseBuilder() {
  const sectionForm = document.getElementById('courseSectionForm');
  const itemForm = document.getElementById('courseItemForm');
  const outline = document.getElementById('adminCourseOutline');
  const resetButton = document.getElementById('resetCourseContent');
  const itemType = document.getElementById('itemType');
  const itemFile = document.getElementById('itemFile');
  const itemFileGroup = document.getElementById('itemFileGroup');
  const itemUrl = document.getElementById('itemUrl');
  const itemUrlGroup = document.getElementById('itemUrlGroup');

  if (!sectionForm || !itemForm || !outline) return;

  function updateItemSourceField() {
    const usesFile = fileCourseItemTypes.includes(itemType.value);
    itemFileGroup.style.display = usesFile ? 'flex' : 'none';
    itemUrlGroup.style.display = usesFile ? 'none' : 'flex';
    itemFile.required = usesFile;
    itemUrl.required = !usesFile && itemType.value === 'link';
  }

  if (!localStorage.getItem(COURSES_KEY)) {
    saveCourses(defaultCourses);
  }

  if (!localStorage.getItem(getCourseContentKey('free-ai'))) {
    saveCourseContent(getCourseContent('free-ai'), 'free-ai');
  }

  renderAdminCourseBuilder();
  updateItemSourceField();
  itemType.addEventListener('change', updateItemSourceField);

  document.getElementById('contentCourseSelect')?.addEventListener('change', (event) => {
    setActiveCourseId(event.target.value);
    renderAdminCourseList();
    renderAdminCourseBuilder();
  });

  sectionForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const titleInput = document.getElementById('sectionTitle');
    const title = titleInput.value.trim();
    if (!title) return;

    const activeCourseId = getActiveCourseId();
    const content = getCourseContent(activeCourseId);
    content.push({ id: createId('section'), title, items: [] });
    saveCourseContent(content, activeCourseId);
    titleInput.value = '';
    renderAdminCourseBuilder();
  });

  itemForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const sectionId = document.getElementById('itemSection').value;
    const title = document.getElementById('itemTitle').value.trim();
    const type = itemType.value;
    let url = itemUrl.value.trim();
    const note = document.getElementById('itemNote').value.trim();
    if (!sectionId || !title) return;
    const usesFile = fileCourseItemTypes.includes(type);

    const activeCourseId = getActiveCourseId();
    const content = getCourseContent(activeCourseId);
    const targetSection = content.find(section => section.id === sectionId);
    if (!targetSection) return;

    let fileName = '';
    if (usesFile) {
      const file = itemFile.files[0];
      if (!file) {
        itemFile.reportValidity();
        return;
      }

      fileName = file.name;
      try {
        url = await readFileAsDataUrl(file);
      } catch (error) {
        console.warn('Impossible de lire le fichier.', error);
        alert("Le fichier n'a pas pu être ajouté. Essaie avec un autre fichier.");
        return;
      }
    }

    targetSection.items.push({ id: createId('item'), title, type, url, note, fileName });
    if (!saveCourseContent(content, activeCourseId)) return;
    itemForm.reset();
    document.getElementById('itemSection').value = sectionId;
    updateItemSourceField();
    renderAdminCourseBuilder();
  });

  outline.addEventListener('click', (event) => {
    const sectionButton = event.target.closest('[data-delete-section]');
    const editSectionButton = event.target.closest('[data-edit-section]');
    const moveSectionButton = event.target.closest('[data-move-section]');
    const itemButton = event.target.closest('[data-delete-item]');
    const editItemButton = event.target.closest('[data-edit-item]');
    const moveItemButton = event.target.closest('[data-move-item]');
    const activeCourseId = getActiveCourseId();
    let content = getCourseContent(activeCourseId);

    if (sectionButton) {
      content = content.filter(section => section.id !== sectionButton.dataset.deleteSection);
      saveCourseContent(content, activeCourseId);
      renderAdminCourseBuilder();
      return;
    }

    if (editSectionButton) {
      const section = content.find(item => item.id === editSectionButton.dataset.editSection);
      const title = prompt('Nouveau titre de section', section?.title || '');
      if (!section || !title?.trim()) return;
      section.title = title.trim();
      saveCourseContent(content, activeCourseId);
      renderAdminCourseBuilder();
      return;
    }

    if (moveSectionButton) {
      const index = content.findIndex(section => section.id === moveSectionButton.dataset.moveSection);
      content = moveArrayItem(content, index, Number(moveSectionButton.dataset.direction));
      saveCourseContent(content, activeCourseId);
      renderAdminCourseBuilder();
      return;
    }

    if (itemButton) {
      content = content.map(section => {
        if (section.id !== itemButton.dataset.sectionId) return section;
        return {
          ...section,
          items: section.items.filter(item => item.id !== itemButton.dataset.deleteItem)
        };
      });
      saveCourseContent(content, activeCourseId);
      renderAdminCourseBuilder();
      return;
    }

    if (editItemButton) {
      const section = content.find(item => item.id === editItemButton.dataset.sectionId);
      const item = section?.items.find(entry => entry.id === editItemButton.dataset.editItem);
      const title = prompt('Nouveau titre du contenu', item?.title || '');
      if (!item || !title?.trim()) return;
      item.title = title.trim();
      saveCourseContent(content, activeCourseId);
      renderAdminCourseBuilder();
      return;
    }

    if (moveItemButton) {
      content = content.map(section => {
        if (section.id !== moveItemButton.dataset.sectionId) return section;
        const index = section.items.findIndex(item => item.id === moveItemButton.dataset.moveItem);
        return {
          ...section,
          items: moveArrayItem(section.items, index, Number(moveItemButton.dataset.direction))
        };
      });
      saveCourseContent(content, activeCourseId);
      renderAdminCourseBuilder();
    }
  });

  resetButton?.addEventListener('click', () => {
    saveCourseContent(defaultCourseContent, getActiveCourseId());
    renderAdminCourseBuilder();
  });
}

function initModalButtons() {
  document.querySelectorAll('[data-modal-close]').forEach(button => {
    button.addEventListener('click', closeCourseModal);
  });

  document.querySelectorAll('[data-enroll-course]').forEach(button => {
    button.addEventListener('click', enrollCourse);
  });
}

function initAdminTabs() {
  const tabButtons = document.querySelectorAll('[data-admin-tab]');
  const tabs = document.querySelectorAll('.admin-tab');

  if (!tabButtons.length || !tabs.length) return;

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const target = button.dataset.adminTab;

      tabButtons.forEach(item => item.classList.remove('active'));
      tabs.forEach(tab => tab.classList.remove('active'));

      // On met à jour le bouton de la sidebar correspondante
      const sidebarBtn = document.querySelector(`.admin-sidebar [data-admin-tab="${target}"]`);
      if (sidebarBtn) sidebarBtn.classList.add('active');
      else button.classList.add('active');

      document.getElementById(`admin-tab-${target}`)?.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

let welcomeScrollY = 0;

function lockWelcomeScroll() {
  welcomeScrollY = window.scrollY || document.documentElement.scrollTop || 0;
  document.documentElement.classList.add('welcome-lock');
  document.body.classList.add('welcome-lock');
  document.body.style.position = 'fixed';
  document.body.style.top = `-${welcomeScrollY}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
}

function unlockWelcomeScroll() {
  document.documentElement.classList.remove('welcome-lock');
  document.body.classList.remove('welcome-lock');
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  window.scrollTo(0, welcomeScrollY);
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
  lockWelcomeScroll();
  welcomePage.addEventListener('touchmove', (event) => event.preventDefault(), { passive: false });
  welcomePage.addEventListener('wheel', (event) => event.preventDefault(), { passive: false });
  document.body.insertBefore(welcomePage, document.body.firstChild);
  
  // Supprimer la page de bienvenue après le tracé du contour
  setTimeout(() => {
    welcomePage.classList.add('fade-out');
    setTimeout(() => {
      welcomePage.remove();
      unlockWelcomeScroll();
    }, 800);
  }, 2800);
}

function playLogoTransition(redirectUrl) {
  setAppHeight();

  const transitionPage = document.createElement('div');
  transitionPage.className = 'welcome-page';
  transitionPage.innerHTML = `
    <div class="welcome-content">
      <div class="welcome-logo-wrap">
        <svg class="welcome-logo-line" viewBox="0 0 260 260" aria-hidden="true">
          <circle cx="130" cy="130" r="118"></circle>
        </svg>
        <img src="img/urbvec_academy.png" alt="URBVEC Academy Logo" class="welcome-logo">
      </div>
    </div>
  `;

  lockWelcomeScroll();
  transitionPage.addEventListener('touchmove', (event) => event.preventDefault(), { passive: false });
  transitionPage.addEventListener('wheel', (event) => event.preventDefault(), { passive: false });
  document.body.insertBefore(transitionPage, document.body.firstChild);

  setTimeout(() => {
    window.location.href = redirectUrl;
  }, 3000);
}

// Function to handle online course login
async function initOnlineLoginForm() {
  const loginForm = document.querySelector('.online-login-form');
  if (!loginForm) return;

  const emailInput = document.getElementById('studentLogin');
  const passwordInput = document.getElementById('studentPassword');
  const submitButton = loginForm.querySelector('button[type="submit"]');

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      alert('Veuillez entrer votre email et votre mot de passe.');
      return;
    }

    saveStudentProfile({ email });

    submitButton.disabled = true; // Disable button to prevent multiple submissions
    submitButton.innerHTML = '<i class="ti ti-loader animate-spin"></i> Connexion en cours...'; // Show loading state

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.error('Erreur de connexion:', error.message);
        playLogoTransition('dashboard-etudiant.html');
        return;
      }

      if (data.user) {
        // User successfully logged in, now check if they are an admin
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Erreur lors de la récupération du profil:', profileError.message);
          alert('Erreur lors de la récupération du profil. Veuillez réessayer.');
          await supabase.auth.signOut(); // Log out the user if profile check fails for security
          return;
        }

        if (profileData && profileData.is_admin) {
          playLogoTransition('admin.html'); // Admin user
        } else {
          playLogoTransition('dashboard-etudiant.html');
        }
      }
    } catch (err) {
      console.error('Erreur inattendue:', err.message);
      playLogoTransition('dashboard-etudiant.html');
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = '<i class="ti ti-arrow-right"></i> Continuer';
    }
  });

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();

    if (profileData?.is_admin) {
      playLogoTransition('admin.html');
      return;
    }

    playLogoTransition('dashboard-etudiant.html');
  } catch (error) {
    console.warn('Session étudiant non disponible.', error);
  }
}

async function initPaidStudentDashboard() {
  const paidDashboard = document.getElementById('paidStudentDashboard');
  if (!paidDashboard) return;

  renderPaidStudentDashboard();

  paidDashboard.addEventListener('click', (event) => {
    const button = event.target.closest('[data-paid-course]');
    if (!button) return;
    renderPaidStudentDashboard(button.dataset.paidCourse);
  });

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();

    if (profileData?.is_admin) {
      playLogoTransition('admin.html');
    }
  } catch (error) {
    console.warn('Session du dashboard étudiant non disponible.', error);
  }
}

// Initializer for DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
  initAppHeight();
  initMenuToggle();
  initCourseFilters();
  initClickableCards();
  initModalButtons();
  initRegistrationForm();
  initAiCourseQuiz();
  renderStudentCourseOutline();

  // Initialisations spécifiques à la page d'administration
  // Elles ne s'exécutent que si l'élément '.admin-sidebar' est présent dans le DOM
  if (document.querySelector('.admin-sidebar')) {
    initAdminTabs();
    initAdminCourses();
    initAdminCourseBuilder();
  }
  initOnlineLoginForm();
  initPaidStudentDashboard();
  
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
