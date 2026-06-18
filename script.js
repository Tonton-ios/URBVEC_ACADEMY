// Import the Supabase client
import { supabase } from './supabase-config.js';
// Menu hamburger toggle
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

  if (!registrationForm || !courseSelect || !priceInfo || !priceAmount) return;

  const params = new URLSearchParams(window.location.search);
  const isFreeMode = params.get('mode') === 'gratuit';

  if (isFreeMode) {
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

  courseSelect.addEventListener('change', () => {
    const selectedOption = courseSelect.options[courseSelect.selectedIndex];
    const price = Number(selectedOption.dataset.price);

    if (!courseSelect.value || !price) {
      priceInfo.style.display = 'none';
      priceAmount.textContent = '';
      return;
    }

    priceAmount.textContent = `${price.toLocaleString('fr-FR')} HTG`;
    priceInfo.style.display = 'flex';
  });
}

function initAiCourseQuiz() {
  const quizScreen = document.getElementById('aiQuizScreen');
  const quizForm = document.getElementById('aiQuizForm');
  const welcomeScreen = document.getElementById('aiCourseWelcome');
  const dashboard = document.getElementById('aiCourseDashboard');
  const enterDashboardButton = document.getElementById('enterCourseDashboard');
  const levelLabel = document.getElementById('aiLevelLabel');
  const quizScoreLabel = document.getElementById('quizScoreLabel');
  const quizResultTitle = document.getElementById('quizResultTitle');
  const quizResultMessage = document.getElementById('quizResultMessage');

  if (!quizScreen || !quizForm || !welcomeScreen || !dashboard || !enterDashboardButton) return;

  quizForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!quizForm.checkValidity()) {
      quizForm.reportValidity();
      return;
    }

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

    quizScreen.style.display = 'none';
    welcomeScreen.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  enterDashboardButton.addEventListener('click', () => {
    welcomeScreen.classList.remove('active');
    dashboard.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

const COURSES_KEY = 'urbvec_courses';
const ACTIVE_COURSE_KEY = 'urbvec_active_course';
const fileCourseItemTypes = ['document', 'pdf', 'ppt', 'doc', 'video'];

const defaultCourses = [
  {
    id: 'free-ai',
    title: "Maîtriser l'IA au quotidien",
    slug: 'cours-gratuit',
    price: 0,
    status: 'Publié',
    description: "Apprendre à utiliser l'intelligence artificielle dans le quotidien."
  }
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

  if (!localStorage.getItem(COURSES_KEY)) {
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

      button.classList.add('active');
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
function initOnlineLoginForm() {
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

    submitButton.disabled = true; // Disable button to prevent multiple submissions
    submitButton.innerHTML = '<i class="ti ti-loader animate-spin"></i> Connexion en cours...'; // Show loading state

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.error('Erreur de connexion:', error.message);
        alert('Erreur de connexion: ' + error.message);
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
          playLogoTransition('cours-gratuit.html'); // Regular user
        }
      }
    } catch (err) {
      console.error('Erreur inattendue:', err.message);
      alert('Une erreur inattendue est survenue. Veuillez réessayer.');
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = '<i class="ti ti-arrow-right"></i> Continuer';
    }
  });
}

// Initialiser au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
  initAppHeight();
  initMenuToggle();
  initCourseFilters();
  initClickableCards();
  initModalButtons();
  initRegistrationForm();
  initAiCourseQuiz();
  renderStudentCourseOutline();
  initAdminTabs();
  initAdminCourses();
  initAdminCourseBuilder();
  initOnlineLoginForm(); // Initialize the online login form handler
  
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
