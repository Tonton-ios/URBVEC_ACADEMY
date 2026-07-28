// Import the Supabase client
import { supabase } from './supabase-config.js?v=20260730';

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
    const status = (card.dataset.status || 'Publié').trim();
    const enrollLink = card.querySelector('a.btn-enroll');
    const title = card.querySelector('h3')?.textContent?.trim() || '';
    const available = isCourseAvailable({ status });

    if (!card.querySelector('.course-availability-badge')) {
      const badge = document.createElement('span');
      badge.className = `course-availability-badge ${available ? 'available' : 'unavailable'}`;
      badge.textContent = available ? 'Disponible' : 'Indisponible';
      card.querySelector('.course-body')?.prepend(badge);
    }
    card.classList.toggle('is-unavailable', !available);

    if (enrollLink) {
      enrollLink.classList.toggle('is-disabled', !available);
      enrollLink.setAttribute('aria-disabled', String(!available));
      if (!enrollLink.hasAttribute('data-original-href')) {
        enrollLink.setAttribute('data-original-href', enrollLink.getAttribute('href') || 'inscription.html');
      }
      enrollLink.setAttribute('href', available ? enrollLink.getAttribute('data-original-href') || 'inscription.html' : '#');
      enrollLink.setAttribute('tabindex', available ? '0' : '-1');
      if (!available) {
        enrollLink.innerHTML = '<i class="ti ti-ban"></i> Indisponible';
      }
    }

    card.addEventListener('click', function(event) {
      const enrollLink = event.target.closest('a.btn-enroll');
      if (enrollLink) {
        if (!available) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        rememberPendingCourseSelection(slugify(title), title);
        return;
      }

      if (event.target.closest('a, button')) return;

      if (!available) return;

      const title = this.querySelector('h3')?.textContent || '';
      const category = this.querySelector('.course-cat')?.textContent || '';
      const level = this.querySelector('.course-level')?.textContent || '';
      const duration = this.querySelector('.course-meta-detail')?.textContent || '';
      const description = this.querySelector('p')?.textContent || '';
      const image = this.querySelector('.course-thumb')?.style.backgroundImage || '';
      
      openCourseModal(title, category, level, duration, description, image, status);
    });
  });
}

// Ouvrir le modal
function openCourseModal(title, category, level, duration, description, image, status = 'Publié') {
  const modal = document.getElementById('courseModal');
  if (!modal) return;

  const setText = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  };

  setText('modalTitle', title);
  setText('modalCategory', category);
  setText('modalLevel', level);
  setText('modalDuration', duration);
  setText('modalDescription', description);
  const modalImage = document.getElementById('modalImage');
  if (modalImage) modalImage.style.backgroundImage = image;
  modal.dataset.courseStatus = status;

  const enrollButton = modal.querySelector('[data-enroll-course]');
  if (enrollButton) {
    const available = isCourseAvailable({ status });
    enrollButton.disabled = !available;
    enrollButton.classList.toggle('is-disabled', !available);
    enrollButton.setAttribute('aria-disabled', String(!available));
    enrollButton.innerHTML = available
      ? '<i class="ti ti-play"></i> S\'inscrire maintenant'
      : '<i class="ti ti-ban"></i> Indisponible';
  }
  
  // Contenu d'apprentissage générique
  const learnings = ['Contenu structuré et actualisé', 'Vidéos tutoriels détaillées', 'Exercices pratiques', 'Support expert disponible'];
  const learningsList = document.getElementById('modalLearnings');
  if (learningsList) {
    learningsList.innerHTML = learnings.map(item => `<li>${item}</li>`).join('');
  }
  
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
  const modalTitle = document.getElementById('modalTitle')?.textContent?.trim() || '';
  const modalStatus = document.getElementById('courseModal')?.dataset.courseStatus || 'Publié';
  if (!isCourseAvailable({ status: modalStatus })) return;
  rememberPendingCourseSelection(slugify(modalTitle), modalTitle);
  window.location.href = 'inscription.html';
  closeCourseModal();
}

const unavailableCourseStatuses = ['Indisponible', 'Brouillon', 'Archivé'];

function isCourseAvailable(course) {
  return course && !unavailableCourseStatuses.includes(course.status);
}

function formatHtg(amount) {
  return `${Number(amount || 0).toLocaleString('fr-FR')} HTG`;
}

function getInputValue(id, fallback = '') {
  const value = document.getElementById(id)?.value;
  return typeof value === 'string' ? value.trim() : fallback;
}

function getCourseRegistrationFee(course) {
  return Number(course?.price || 0);
}

function getCourseParticipationFee(course) {
  return Number(course?.participationFee || 0);
}

function getCourseTotalFee(course) {
  return getCourseRegistrationFee(course) + getCourseParticipationFee(course);
}

function renderRegistrationCourseOptions(courseSelect) {
  if (!courseSelect) return;
  const courses = getCourses();
  const placeholder = courseSelect.querySelector('option[value=""]');

  courseSelect.innerHTML = '';
  if (placeholder) courseSelect.appendChild(placeholder);

  courses.forEach(course => {
    const option = document.createElement('option');
    option.value = course.id;
    option.dataset.price = String(getCourseRegistrationFee(course));
    option.dataset.participationFee = String(getCourseParticipationFee(course));
    option.dataset.status = course.status || 'Publié';
    option.disabled = !isCourseAvailable(course);
    option.textContent = `${course.title}${option.disabled ? ' (Indisponible)' : ''}`;
    courseSelect.appendChild(option);
  });
}

function rememberPendingCourseSelection(courseId = '', courseTitle = '') {
  try {
    if (courseId) sessionStorage.setItem('urbvec_pending_course_id', courseId);
    if (courseTitle) sessionStorage.setItem('urbvec_pending_course_title', courseTitle);
  } catch {
    // Ignore storage errors on restricted browsers
  }
}

function readPendingCourseSelection() {
  try {
    return {
      courseId: sessionStorage.getItem('urbvec_pending_course_id') || '',
      courseTitle: sessionStorage.getItem('urbvec_pending_course_title') || ''
    };
  } catch {
    return { courseId: '', courseTitle: '' };
  }
}

function clearPendingCourseSelection() {
  try {
    sessionStorage.removeItem('urbvec_pending_course_id');
    sessionStorage.removeItem('urbvec_pending_course_title');
  } catch {
    // Ignore storage errors on restricted browsers
  }
}

function updateRegistrationCourseSummary(courseSelect) {
  const summary = document.getElementById('courseSelectionSummary');
  if (!summary || !courseSelect) return;

  const selectedOption = courseSelect.options[courseSelect.selectedIndex];
  if (!selectedOption || !selectedOption.value) {
    summary.innerHTML = `
      <div class="course-summary-empty">
        <i class="ti ti-book-2"></i>
        <div>
          <strong>Aucune formation sélectionnée</strong>
          <p>Choisissez une formation pour voir son prix, son statut et ses détails.</p>
        </div>
      </div>
    `;
    return;
  }

  const course = getCourseById(selectedOption.value);
  const registrationFee = Number(selectedOption.dataset.price || 0);
  const participationFee = Number(selectedOption.dataset.participationFee || 0);
  const total = registrationFee + participationFee;

  summary.innerHTML = `
    <div class="course-summary-card">
      <div class="course-summary-head">
        <div>
          <div class="section-eyebrow">Formation choisie</div>
          <h3>${escapeHtml(course?.title || selectedOption.textContent)}</h3>
        </div>
        <span class="admin-badge ${selectedOption.dataset.status === 'Publié' ? 'active' : ''}">${escapeHtml(selectedOption.dataset.status || 'Publié')}</span>
      </div>
      <p>${escapeHtml(course?.description || 'Aucune description disponible pour le moment.')}</p>
      <div class="course-summary-metrics">
        <span><strong>${formatHtg(registrationFee)}</strong><small>Prix d'inscription</small></span>
        <span><strong>${formatHtg(participationFee)}</strong><small>Frais de participation</small></span>
        <span><strong>${formatHtg(total)}</strong><small>Total formation</small></span>
      </div>
    </div>
  `;
}

async function getRegistrationRecords() {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

async function saveRegistrationToDatabase(registration) {
  try {
    const { error } = await supabase
      .from('registrations')
      .insert([registration]);

    if (error) {
      console.warn("Impossible d'enregistrer l'inscription dans Supabase:", error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.warn("Supabase indisponible pour l'inscription:", error);
    return false;
  }
}

async function saveStudentToDatabase(student) {
  try {
    const { data, error } = await supabase.functions.invoke('admin-create-student', {
      body: {
        email: student.email || '',
        password: student.password || '',
        fullName: student.fullName || '',
        phone: student.phone || '',
        courseIds: student.assignedCourseIds || []
      }
    });
    if (error) throw error;
    if (!data?.id) throw new Error('La création du compte étudiant a échoué.');
    return data.id;
  } catch (error) {
    console.warn('Impossible de sauvegarder l\'étudiant dans Supabase:', error);
    const detail = String(error?.message || '');
    if (/function|fetch|network|non-2xx/i.test(detail)) {
      throw new Error("Le service de création des étudiants n'est pas déployé sur Supabase. Déploie la fonction « admin-create-student », puis réessaie.");
    }
    throw new Error(detail || "Le compte étudiant n'a pas pu être créé.");
  }
}

async function removeStudentFromDatabase(studentId) {
  try {
    const { error } = await supabase.rpc('admin_remove_student', {
      p_student_id: studentId
    });
    if (error) throw error;
    return true;
  } catch (error) {
    console.warn('Impossible de supprimer l\'étudiant depuis Supabase:', error);
    return false;
  }
}

async function renderAdminOverviewStats() {
  const setText = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = String(value);
  };

  const courses = getCourses();
  const resources = courses.reduce((total, course) => total + getCourseContent(course.id).reduce((sum, section) => sum + section.items.length, 0), 0);

  setText('adminStatCourses', courses.length);
  setText('adminStatResources', resources);

  try {
    const [profilesResult, coursesResult, registrationsResult] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('courses').select('id', { count: 'exact', head: true }),
      supabase.from('registrations').select('id', { count: 'exact', head: true })
    ]);

    if (typeof profilesResult.count === 'number') setText('adminStatStudents', profilesResult.count);
    if (typeof coursesResult.count === 'number') setText('adminStatCourses', coursesResult.count);
    if (typeof registrationsResult.count === 'number') setText('adminStatPayments', registrationsResult.count);
  } catch (error) {
    console.warn('Impossible de charger les statistiques admin.', error);
  }
}

async function renderAdminPaymentsTable() {
  const tbody = document.getElementById('adminPaymentsTableBody');
  if (!tbody) return;
  const records = await getRegistrationRecords();
  if (!records.length) {
    tbody.innerHTML = '<tr><td colspan="4">Aucun paiement en attente.</td></tr>';
    return;
  }
  tbody.innerHTML = records.map(record => `
    <tr>
      <td>${escapeHtml(record.full_name || '')}</td>
      <td>${escapeHtml(record.course_title || '')}</td>
      <td>${escapeHtml(record.transaction_id || '')}</td>
      <td>${escapeHtml(record.status || 'En attente')}</td>
    </tr>
  `).join('');
}

function populateAssignmentCourseSelect() {
  const select = document.getElementById('assignmentCourse');
  if (!select) return;
  select.innerHTML = getCourses().map(course => `
    <option value="${course.id}" ${isCourseAvailable(course) ? '' : 'disabled'}>${escapeHtml(course.title)}${isCourseAvailable(course) ? '' : ' (indisponible)'}</option>
  `).join('');
}

function renderAdminAssignmentsTable() {
  const tbody = document.querySelector('#admin-tab-deadlines .admin-table tbody');
  if (!tbody) return;
  supabase
    .from('assignment_submissions')
    .select('submitted_at,status,student_id,assignment_id,profiles(full_name,email),assignments(title)')
    .order('submitted_at', { ascending: false })
    .then(({ data, error }) => {
      if (error || !Array.isArray(data) || !data.length) {
        tbody.innerHTML = '<tr><td colspan="5">Aucune remise pour le moment.</td></tr>';
        return;
      }
      tbody.innerHTML = data.map(record => `
        <tr>
          <td>${escapeHtml(record.profiles?.full_name || record.profiles?.email || '')}</td>
          <td>${escapeHtml(record.assignments?.title || '')}</td>
          <td>${record.submitted_at ? escapeHtml(new Date(record.submitted_at).toLocaleString('fr-FR')) : ''}</td>
          <td>${escapeHtml(record.status || 'Soumis')}</td>
          <td>---</td>
        </tr>
      `).join('');
    })
    .catch(() => {
      tbody.innerHTML = '<tr><td colspan="5">Aucune remise pour le moment.</td></tr>';
    });
}

function getTrainerWhatsappUrl(registration) {
  const trainerWhatsappNumber = '50938449148';
  const message = [
    'Nouvelle inscription URBVEC Academy',
    '',
    `Nom complet: ${registration.full_name}`,
    `Email: ${registration.email}`,
    `Téléphone: ${registration.phone}`,
    `Formation choisie: ${registration.course_title}`,
    `Prix inscription: ${formatHtg(registration.registration_fee)}`,
    `Frais participation: ${formatHtg(registration.participation_fee)}`,
    `Méthode paiement: ${registration.payment_method}`,
    `ID transaction: ${registration.transaction_id}`,
    '',
    '*Envoyez le message et accompagnez-le avec le reçu.*',
    "L'admin URBVEC Academy vous contactera sous peu après vérification du paiement. Patientez."
  ].join('\n');

  return `https://wa.me/${trainerWhatsappNumber}?text=${encodeURIComponent(message)}`;
}

function getPaymentInfoWhatsappUrl() {
  const trainerWhatsappNumber = '50938449148';
  const message = "J'ai besoin de plus d'info sur les moyens de paiement.";
  return `https://wa.me/${trainerWhatsappNumber}?text=${encodeURIComponent(message)}`;
}

function showRegistrationNotice(message, type = 'success') {
  let notice = document.getElementById('registrationNotice');
  if (!notice) {
    notice = document.createElement('div');
    notice.id = 'registrationNotice';
    notice.className = 'registration-notice';
    notice.setAttribute('role', 'status');
    notice.setAttribute('aria-live', 'polite');
    document.body.appendChild(notice);
  }

  notice.classList.remove('success', 'info', 'error', 'show');
  notice.classList.add(type, 'show');
  notice.textContent = message;

  window.clearTimeout(window.__registrationNoticeTimer);
  window.__registrationNoticeTimer = window.setTimeout(() => {
    notice.classList.remove('show');
  }, 4200);
}

async function initRegistrationForm() {
  const registrationForm = document.getElementById('registrationForm');
  const courseSelect = document.getElementById('courseSelect');
  const priceInfo = document.getElementById('priceInfo');
  const priceAmount = document.getElementById('priceAmount');
  const registrationFeeAmount = document.getElementById('registrationFeeAmount');
  const participationFeeAmount = document.getElementById('participationFeeAmount');
  const participationNote = document.getElementById('participationNote');
  const freeCourseInfo = document.getElementById('freeCourseInfo');
  const moncashAlert = document.getElementById('moncashAlert');
  const paymentMethodInput = document.getElementById('paymentMethod');
  const selectedPaymentNumber = document.getElementById('selectedPaymentNumber');
  const selectedPaymentLabel = document.getElementById('selectedPaymentLabel');
  const selectedPaymentValue = document.getElementById('selectedPaymentValue');
  const paymentFields = document.getElementById('paymentFields');
  const submitNotice = document.getElementById('submitNotice');
  const registrationSubmit = document.getElementById('registrationSubmit');
  const paymentInfoLink = document.getElementById('paymentInfoLink');
  const transactionId = document.getElementById('transactionId');
  const paymentProof = document.getElementById('paymentProof');

  if (!registrationForm || !courseSelect) return;
  await ensureCourseDataLoaded();
  renderRegistrationCourseOptions(courseSelect);
  const params = new URLSearchParams(window.location.search);
  const pendingSelection = readPendingCourseSelection();
  const requestedCourseId = params.get('course') || pendingSelection.courseId || '';
  const requestedCourseTitle = pendingSelection.courseTitle || '';

  if (courseSelect && requestedCourseId) {
    const matchingOption = Array.from(courseSelect.options).find(option => {
      const optionTitle = option.textContent.toLowerCase();
      return option.value === requestedCourseId || (requestedCourseTitle && optionTitle.includes(requestedCourseTitle.toLowerCase()));
    });
    if (matchingOption) {
      courseSelect.value = matchingOption.value;
    }
  }

  updateRegistrationCourseSummary(courseSelect);
  if (paymentInfoLink) paymentInfoLink.href = getPaymentInfoWhatsappUrl();
  const isFreeMode = params.get('mode') === 'gratuit';

  if (isFreeMode) {
    if (courseSelect) {
    courseSelect.required = false;
    const courseField = courseSelect.closest('.form-group');
    if (courseField) courseField.style.display = 'none';
    if (priceInfo) priceInfo.style.display = 'none';

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

  if (!priceInfo || !priceAmount) return;

  const resetPaymentMethod = () => {
    if (paymentMethodInput) paymentMethodInput.value = '';
    document.querySelectorAll('[data-payment-method]').forEach(button => {
      button.classList.remove('active');
    });
    if (selectedPaymentNumber) selectedPaymentNumber.style.display = 'none';
    if (selectedPaymentValue) selectedPaymentValue.textContent = '';
    if (paymentFields) paymentFields.style.display = 'none';
    if (transactionId) transactionId.required = false;
    if (paymentProof) paymentProof.required = false;
  };

  const showPaymentFields = () => {
    if (paymentFields) paymentFields.style.display = 'grid';
    if (transactionId) transactionId.required = true;
    if (paymentProof) paymentProof.required = true;
  };

  const handleCourseChange = () => {
    const selectedOption = courseSelect.options[courseSelect.selectedIndex];
    if (!selectedOption) return;
    const registrationFee = selectedOption.value ? Number(selectedOption.dataset.price || 0) : null;
    const participationFee = selectedOption.value ? Number(selectedOption.dataset.participationFee || 0) : 0;
    const amountDueNow = Number(registrationFee || 0);
    resetPaymentMethod();

    if (selectedOption.value === "" || registrationFee === null) {
      priceInfo.style.display = 'none';
      updateRegistrationCourseSummary(courseSelect);
      if (participationNote) participationNote.style.display = 'none';
      if (freeCourseInfo) freeCourseInfo.style.display = 'none';
      if (moncashAlert) moncashAlert.style.display = 'none';
      if (submitNotice) submitNotice.style.display = 'none';
      if (registrationSubmit) {
        registrationSubmit.innerHTML = '<i class="ti ti-send"></i><span>Soumettre l\'inscription</span>';
      }
      return;
    }

    if (amountDueNow === 0) {
      priceInfo.style.display = 'none';
      updateRegistrationCourseSummary(courseSelect);
      if (participationNote) participationNote.style.display = 'none';
      if (freeCourseInfo) freeCourseInfo.style.display = 'flex';
      if (moncashAlert) moncashAlert.style.display = 'none';
      if (submitNotice) submitNotice.style.display = 'none';
      if (registrationSubmit) {
        registrationSubmit.innerHTML = '<i class="ti ti-player-play"></i><span>Démarrer le cours</span>';
      }
    } else {
      if (registrationFeeAmount) registrationFeeAmount.textContent = formatHtg(registrationFee);
      if (participationFeeAmount) participationFeeAmount.textContent = formatHtg(participationFee);
      priceAmount.textContent = formatHtg(amountDueNow);
      priceInfo.style.display = 'flex';
      if (participationNote) participationNote.style.display = 'flex';
      if (freeCourseInfo) freeCourseInfo.style.display = 'none';
      if (moncashAlert) moncashAlert.style.display = 'flex';
      if (submitNotice) submitNotice.style.display = 'flex';
      if (registrationSubmit) {
        registrationSubmit.innerHTML = '<i class="ti ti-send"></i><span>Soumettre l\'inscription</span>';
      }
    }

    updateRegistrationCourseSummary(courseSelect);
  };

  courseSelect.addEventListener('change', handleCourseChange);
  document.querySelectorAll('[data-payment-method]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-payment-method]').forEach(item => item.classList.remove('active'));
      button.classList.add('active');

      if (paymentMethodInput) paymentMethodInput.value = button.dataset.paymentMethod || '';
      if (selectedPaymentLabel) selectedPaymentLabel.textContent = `Numéro ${button.dataset.paymentMethod || 'paiement'}`;
      if (selectedPaymentValue) selectedPaymentValue.textContent = button.dataset.paymentNumber || '';
      if (selectedPaymentNumber) selectedPaymentNumber.style.display = 'block';
      if (paymentFields) paymentFields.style.display = 'grid';
      if (transactionId) transactionId.required = true;
      if (paymentProof) paymentProof.required = true;
      showPaymentFields();
    });
  });
  handleCourseChange(); // Initial check
  clearPendingCourseSelection();

  registrationForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!registrationForm.checkValidity()) {
      registrationForm.reportValidity();
      return;
    }

    const selectedCourseId = courseSelect.value;
    const selectedOption = courseSelect.options[courseSelect.selectedIndex];
    const registrationFee = selectedOption.value ? Number(selectedOption.dataset.price || 0) : null;
    const participationFee = selectedOption.value ? Number(selectedOption.dataset.participationFee || 0) : 0;
    const amountDueNow = Number(registrationFee || 0);
    const fullName = getInputValue('fullName');
    const email = getInputValue('email');
    const phone = getInputValue('phone');
    const proofFile = paymentProof?.files?.[0];

    if (!selectedCourseId) return;
    if (selectedOption.disabled) return;
    if (amountDueNow > 0 && !paymentMethodInput?.value) {
      alert('Veuillez choisir MonCash ou NatCash avant de soumettre.');
      return;
    }

    setActiveCourseId(selectedCourseId);

    if (amountDueNow === 0) {
      playLogoTransition('cours-gratuit.html');
      return;
    }

    if (registrationSubmit) {
      registrationSubmit.disabled = true;
      registrationSubmit.innerHTML = '<i class="ti ti-loader animate-spin"></i><span>Envoi en cours...</span>';
    }

    const registration = {
      full_name: fullName,
      email,
      phone,
      course_id: selectedCourseId,
      course_title: selectedOption.textContent.replace(' (Indisponible)', '').trim(),
      registration_fee: registrationFee,
      participation_fee: participationFee,
      amount_due_now: amountDueNow,
      payment_method: paymentMethodInput.value,
      transaction_id: getInputValue('transactionId'),
      receipt_file_name: proofFile?.name || '',
      status: 'En attente de vérification'
    };

    const savePromise = saveRegistrationToDatabase(registration);
    const whatsappUrl = getTrainerWhatsappUrl(registration);
    await savePromise;
    showRegistrationNotice('Merci, patientez. Bienvenue à URBVEC Academy, votre inscription est en cours de traitement.', 'success');
    setTimeout(() => {
      window.location.href = whatsappUrl;
    }, 900);

    if (registrationSubmit) {
      registrationSubmit.disabled = false;
      registrationSubmit.innerHTML = '<i class="ti ti-send"></i><span>Soumettre l\'inscription</span>';
    }
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
      if (!nameInp || !emailInp || !phoneInp || !passInp) return;

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

    const email = getInputValue('aiUserEmail');
    const password = getInputValue('aiUserPassword');
    const fullName = getInputValue('aiUserName');
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
    if (!submitBtn) return;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="ti ti-loader animate-spin"></i> Création du compte...';

    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone: document.getElementById('aiUserPhone')?.value || '' } }
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
      const email = getInputValue('aiLoginEmail');
      const password = getInputValue('aiLoginPassword');
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

const fileCourseItemTypes = ['document', 'pdf', 'ppt', 'doc', 'video'];
let coursesCache = null;
const courseContentCache = new Map();
let studentProfileCache = {};
let courseDataLoadPromise = null;

const defaultCourses = [
  { id: '10000000-0000-4000-8000-000000000001', title: "Maîtriser l'IA au quotidien", slug: 'cours-gratuit', price: 0, participationFee: 0, status: 'Publié', description: "Apprendre à utiliser l'intelligence artificielle dans le quotidien." },
  { id: '10000000-0000-4000-8000-000000000002', title: "Développement Web Moderne", slug: 'dev-web-moderne', price: 2500, participationFee: 0, status: 'Publié', description: "Maîtrisez HTML, CSS et JavaScript pour créer des interfaces web professionnelles." },
  { id: '10000000-0000-4000-8000-000000000003', title: "Gestion de Projet & Leadership", slug: 'gestion-projet-leadership', price: 3000, participationFee: 0, status: 'Publié', description: "Apprenez les méthodologies agiles et le management d'équipe." },
  { id: '10000000-0000-4000-8000-000000000004', title: "Python & Automatisation", slug: 'python-automatisation', price: 3000, participationFee: 0, status: 'Publié', description: "Apprenez Python pour automatiser des tâches répétitives." },
  { id: '10000000-0000-4000-8000-000000000005', title: "Design UX/UI avec Figma", slug: 'ux-ui-figma', price: 2500, participationFee: 0, status: 'Publié', description: "Créez des interfaces intuitives avec Figma." },
  { id: '10000000-0000-4000-8000-000000000006', title: "Marketing Digital & SEO", slug: 'marketing-digital-seo', price: 2500, participationFee: 0, status: 'Publié', description: "Dominez les stratégies de marketing digital et le SEO." },
  { id: '10000000-0000-4000-8000-000000000007', title: "React Avancé", slug: 'react-avance', price: 4000, participationFee: 0, status: 'Publié', description: "Maîtrisez React pour construire des applications web modernes." },
  { id: '10000000-0000-4000-8000-000000000008', title: "Entrepreneuriat & Startup", slug: 'entrepreneuriat-startup', price: 3500, participationFee: 0, status: 'Publié', description: "Apprenez à lancer et développer votre startup." },
  { id: '10000000-0000-4000-8000-000000000009', title: "Intro à la Gestion & Finance", slug: 'intro-gestion-finance', price: 2500, participationFee: 0, status: 'Publié', description: "Maîtrisez les bases de la gestion d'entreprise." },
  { id: '10000000-0000-4000-8000-000000000010', title: "Data Science avec Python", slug: 'data-science-python', price: 4500, participationFee: 0, status: 'Publié', description: "Analysez des données complexes avec Python." },
  { id: '10000000-0000-4000-8000-000000000011', title: "Branding & Design Graphique", slug: 'branding-design-graphique', price: 2000, participationFee: 0, status: 'Publié', description: "Créez des identités visuelles fortes." },
  { id: '10000000-0000-4000-8000-000000000012', title: "Langues & Communication", slug: 'langues-communication', price: 1500, participationFee: 0, status: 'Publié', description: "Perfectionnez votre expression écrite et orale." },
  { id: '10000000-0000-4000-8000-000000000013', title: "Content Marketing & Copywriting", slug: 'content-marketing-copywriting', price: 2000, participationFee: 0, status: 'Publié', description: "Écrivez du contenu convaincant." },
  { id: '10000000-0000-4000-8000-000000000014', title: "Développement Personnel", slug: 'developpement-personnel', price: 1500, participationFee: 0, status: 'Publié', description: "Boostez votre confiance et gérez votre temps." },
  { id: '10000000-0000-4000-8000-000000000015', title: "Compétences Pratiques", slug: 'competences-pratiques', price: 1200, participationFee: 0, status: 'Publié', description: "Maîtrisez les outils informatiques essentiels." }
];

const defaultCourseContent = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    title: 'General',
    items: [
      { id: '30000000-0000-4000-8000-000000000001', title: 'Introduction', type: 'document', url: '', note: 'Done' }
    ]
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    title: 'Syllabus du cours',
    items: [
      { id: '30000000-0000-4000-8000-000000000002', title: 'Syllabus du cours: Introduction à la gestion', type: 'document', url: '', note: '' }
    ]
  },
  {
    id: '20000000-0000-4000-8000-000000000003',
    title: 'Séance 1____Lundi 1 juin 2026',
    items: [
      { id: '30000000-0000-4000-8000-000000000003', title: 'Document 1', type: 'document', url: '', note: '' }
    ]
  },
  {
    id: '20000000-0000-4000-8000-000000000004',
    title: 'Séance 2_____Lundi 8 Juin 2026',
    items: [
      { id: '30000000-0000-4000-8000-000000000004', title: 'Document 2', type: 'ppt', url: '', note: 'PPT' }
    ]
  },
  {
    id: '20000000-0000-4000-8000-000000000005',
    title: 'Mercredi 10 Juin 2026',
    items: [
      { id: '30000000-0000-4000-8000-000000000005', title: 'Quiz', type: 'quiz', url: '', note: 'Opened: Wednesday, 10 June 2026, 9:00 AM  Closed: Wednesday, 10 June 2026, 11:59 PM' }
    ]
  },
  {
    id: '20000000-0000-4000-8000-000000000006',
    title: 'Séance 3_____11 Juin 2026',
    items: [
      { id: '30000000-0000-4000-8000-000000000006', title: 'Document 3', type: 'ppt', url: '', note: 'PPTX' },
      { id: '30000000-0000-4000-8000-000000000007', title: 'Interview questions', type: 'pdf', url: '', note: 'PDF' },
      { id: '30000000-0000-4000-8000-000000000008', title: 'Interview report template', type: 'doc', url: '', note: 'DOCX' },
      { id: '30000000-0000-4000-8000-000000000009', title: 'Document 4', type: 'ppt', url: '', note: 'PPTX' },
      { id: '30000000-0000-4000-8000-000000000010', title: 'Document 5', type: 'ppt', url: '', note: 'PPTX' }
    ]
  }
];

function createId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  const random = () => Math.floor(Math.random() * 0x100000000).toString(16).padStart(8, '0');
  return `${random().slice(0, 8)}-${random().slice(0, 4)}-4${random().slice(0, 3)}-8${random().slice(0, 3)}-${random()}${random().slice(0, 4)}`;
}

// Ne jamais réutiliser les objets/identifiants du contenu modèle entre deux cours.
// Sans cette copie, modifier un nouveau cours pouvait tenter de rattacher une
// section déjà enregistrée pour un autre cours (conflit 409 dans Supabase).
function cloneCourseContent(content = []) {
  return content.map(section => ({
    id: section.id,
    title: section.title || '',
    items: (section.items || []).map(item => ({ ...item }))
  }));
}

function getInitialCourseContent(courseId) {
  return courseId === defaultCourses[0].id ? cloneCourseContent(defaultCourseContent) : [];
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'cours';
}

function normalizeCourse(course) {
  return {
    status: 'Publié',
    description: '',
    ...course,
    participationFee: Number(course.participationFee ?? course.participation_fee ?? 0)
  };
}

function normalizeSection(row, items = []) {
  return {
    id: row.id,
    title: row.title,
    items: items
      .sort((a, b) => (a.position || 0) - (b.position || 0))
      .map(item => ({
        id: item.id,
        title: item.title,
        type: item.type || 'document',
        url: item.url || '',
        note: item.note || '',
        fileName: item.file_name || '',
        deadline_at: item.deadline_at || null
      }))
  };
}

async function loadCoursesFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('id,title,slug,price,participation_fee,status,description')
      .order('created_at', { ascending: true });
    if (error) throw error;
    if (Array.isArray(data) && data.length) {
      coursesCache = data.map(normalizeCourse);
      return coursesCache;
    }
    coursesCache = defaultCourses.map(normalizeCourse);
    return coursesCache;
  } catch (error) {
    console.warn('Impossible de charger les cours depuis Supabase.', error);
  }

  coursesCache = defaultCourses.map(normalizeCourse);
  return coursesCache;
}

async function loadCourseContentFromSupabase(courseId) {
  try {
    const [sectionsResult, itemsResult] = await Promise.all([
      supabase
        .from('course_sections')
        .select('id,course_id,title,position')
        .eq('course_id', courseId)
        .order('position', { ascending: true }),
      supabase
        .from('course_items')
        .select('id,course_id,section_id,title,type,url,note,file_name,position')
        .eq('course_id', courseId)
        .order('position', { ascending: true })
    ]);

    const sections = sectionsResult.data || [];
    const items = itemsResult.data || [];
    if (!sectionsResult.error && !itemsResult.error && sections.length) {
      const grouped = sections.map(section => normalizeSection(section, items.filter(item => item.section_id === section.id)));
      courseContentCache.set(courseId, grouped);
      return grouped;
    }
    if (courseId === defaultCourses[0].id) {
      const fallback = getInitialCourseContent(courseId);
      courseContentCache.set(courseId, fallback);
      return fallback;
    }
  } catch (error) {
    console.warn('Impossible de charger le contenu depuis Supabase.', error);
  }

  const fallback = getInitialCourseContent(courseId);
  courseContentCache.set(courseId, fallback);
  return fallback;
}

async function ensureCourseDataLoaded() {
  if (courseDataLoadPromise) return courseDataLoadPromise;

  courseDataLoadPromise = (async () => {
    await loadCoursesFromSupabase();
    const activeCourseId = getActiveCourseId();
    await loadCourseContentFromSupabase(activeCourseId);
    if (!courseContentCache.has(defaultCourses[0].id)) {
      await loadCourseContentFromSupabase(defaultCourses[0].id);
    }
  })();

  return courseDataLoadPromise;
}

function getCourses() {
  return coursesCache || defaultCourses.map(normalizeCourse);
}

async function saveCourses(courses) {
  const normalized = courses.map(normalizeCourse);
  coursesCache = normalized;
  try {
    const payload = normalized.map(course => ({
      id: course.id,
      title: course.title,
      slug: course.slug,
      price: Number(course.price || 0),
      participation_fee: Number(getCourseParticipationFee(course)),
      status: course.status || 'Publié',
      description: course.description || '',
      updated_at: new Date().toISOString()
    }));
    const { error } = await supabase.from('courses').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (error) {
    console.warn('Impossible de sauvegarder les cours dans Supabase.', error);
    return false;
  }
}

function getActiveCourseId() {
  const params = new URLSearchParams(window.location.search);
  const courseFromUrl = params.get('course');
  const courses = getCourses();
  const preferred = courseFromUrl || courses[0]?.id || defaultCourses[0].id;

  return courses.some(course => course.id === preferred) ? preferred : courses[0].id;
}

function setActiveCourseId(courseId) {
  const params = new URLSearchParams(window.location.search);
  params.set('course', courseId);
  const nextUrl = `${window.location.pathname}?${params.toString()}${window.location.hash || ''}`;
  window.history.replaceState({}, '', nextUrl);
}

function getStudentProfile() {
  return studentProfileCache;
}

function saveStudentProfile(profile) {
  studentProfileCache = { ...studentProfileCache, ...profile };
  syncStudentProfileToSupabase(profile).catch(() => {});
  return profile;
}

function clearStudentLocalState() {
  return true;
}

function getAssignedCourseIds(profile = getStudentProfile()) {
  const raw = profile.assignedCourseIds || profile.assigned_course_ids;
  if (Array.isArray(raw)) return raw.filter(Boolean);
  const single = profile.assignedCourseId || profile.assigned_course_id;
  return single ? [single] : [];
}

function getStudentLibrary() {
  return loadStudentLibraryFromSupabase().catch(() => ({ items: [] }));
}

function getStudentActivity() {
  return loadStudentActivityFromSupabase().catch(() => []);
}

async function getLoggedInStudentId() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || '';
  } catch {
    return '';
  }
}

async function syncStudentProfileToSupabase(profile) {
  const studentId = await getLoggedInStudentId();
  if (!studentId || !profile?.email) return false;

  const payload = {
    id: studentId,
    email: profile.email,
    full_name: profile.fullName || profile.full_name || '',
    phone: profile.phone || '',
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
  return true;
}

async function loadStudentActivityFromSupabase() {
  const studentId = await getLoggedInStudentId();
  if (!studentId) return [];
  const { data, error } = await supabase
    .from('student_activity_logs')
    .select('label,action,time,metadata,created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(12);
  if (error || !Array.isArray(data)) return [];
  return data.map(row => ({
    label: row.label,
    action: row.action,
    time: row.time || row.created_at,
    ...row.metadata
  }));
}

async function loadStudentLibraryFromSupabase() {
  const studentId = await getLoggedInStudentId();
  if (!studentId) return { items: [] };
  const { data, error } = await supabase
    .from('student_library_items')
    .select('course_id,item_id,title,kind,url,file_name,note,metadata,created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  if (error || !Array.isArray(data)) return { items: [] };
  return {
    items: data.map(row => ({
      courseId: row.course_id,
      itemId: row.item_id,
      title: row.title,
      kind: row.kind,
      url: row.url,
      fileName: row.file_name,
      note: row.note,
      ...row.metadata
    }))
  };
}

function getCourseContent(courseId = getActiveCourseId()) {
  if (courseContentCache.has(courseId)) return courseContentCache.get(courseId);
  const initialContent = getInitialCourseContent(courseId);
  courseContentCache.set(courseId, initialContent);
  return initialContent;
}

async function saveCourseContent(content, courseId = getActiveCourseId()) {
  const normalized = Array.isArray(content) ? content : [];
  courseContentCache.set(courseId, normalized);
  try {
    const sectionsPayload = [];
    const itemsPayload = [];
    normalized.forEach((section, sectionIndex) => {
      sectionsPayload.push({
        id: section.id,
        course_id: courseId,
        title: section.title,
        position: sectionIndex,
        updated_at: new Date().toISOString()
      });
      (section.items || []).forEach((item, itemIndex) => {
        itemsPayload.push({
          id: item.id,
          course_id: courseId,
          section_id: section.id,
          title: item.title,
          type: item.type || 'document',
          url: item.url || '',
          note: item.note || '',
          file_name: item.fileName || item.file_name || '',
          position: itemIndex,
          updated_at: new Date().toISOString()
        });
      });
    });

    // Ne jamais supprimer tout le cours pour une simple modification : pendant la
    // recréation, les éléments pointaient vers des sections absentes (erreur 409/FK).
    // Les sections sont donc écrites avant leurs contenus, puis seuls les enregistrements
    // qui ne sont plus présents dans l'interface sont retirés.
    if (sectionsPayload.length) {
      const { error: sectionsError } = await supabase
        .from('course_sections')
        .upsert(sectionsPayload, { onConflict: 'id' });
      if (sectionsError) throw sectionsError;
    }
    if (itemsPayload.length) {
      const { error: itemsError } = await supabase
        .from('course_items')
        .upsert(itemsPayload, { onConflict: 'id' });
      if (itemsError) throw itemsError;
    }

    const { data: currentItems, error: currentItemsError } = await supabase
      .from('course_items')
      .select('id')
      .eq('course_id', courseId);
    if (currentItemsError) throw currentItemsError;
    const keptItemIds = new Set(itemsPayload.map(item => item.id));
    const removedItemIds = (currentItems || []).map(item => item.id).filter(id => !keptItemIds.has(id));
    if (removedItemIds.length) {
      const { error } = await supabase.from('course_items').delete().in('id', removedItemIds);
      if (error) throw error;
    }

    const { data: currentSections, error: currentSectionsError } = await supabase
      .from('course_sections')
      .select('id')
      .eq('course_id', courseId);
    if (currentSectionsError) throw currentSectionsError;
    const keptSectionIds = new Set(sectionsPayload.map(section => section.id));
    const removedSectionIds = (currentSections || []).map(section => section.id).filter(id => !keptSectionIds.has(id));
    if (removedSectionIds.length) {
      const { error } = await supabase.from('course_sections').delete().in('id', removedSectionIds);
      if (error) throw error;
    }
    return true;
  } catch (error) {
    console.warn('Impossible de sauvegarder le contenu du cours.', error);
    // La modification locale ne doit pas masquer le contenu réellement
    // enregistré si Supabase a refusé la demande.
    await loadCourseContentFromSupabase(courseId);
    const reason = error?.message ? ' Détail Supabase : ' + error.message : '';
    alert("Impossible d'enregistrer le contenu. Vérifie les droits administrateur et la migration Supabase." + reason);
    return false;
  }
}

async function uploadCourseFile(file, courseId) {
  if (!file) return '';
  const maximumSize = 50 * 1024 * 1024;
  if (file.size > maximumSize) {
    throw new Error('Le fichier dépasse la limite de 50 Mo.');
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const path = `${courseId}/${createId('file')}-${safeName}`;
  const { error } = await supabase.storage
    .from('course-files')
    .upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from('course-files').getPublicUrl(path);
  return data?.publicUrl || '';
}

async function uploadAssignmentFile(file, assignmentId) {
  if (!file) return { name: '', url: '' };
  if (file.size > 50 * 1024 * 1024) throw new Error('Le fichier dépasse la limite de 50 Mo.');
  const path = `${assignmentId}/${createId()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
  const { error } = await supabase.storage.from('assignment-files').upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('assignment-files').getPublicUrl(path);
  return { name: file.name, url: data?.publicUrl || '' };
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

function parseDeadline(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isDeadlinePassed(value) {
  const deadline = parseDeadline(value);
  return deadline ? deadline.getTime() < Date.now() : false;
}

function formatDeadline(value) {
  const deadline = parseDeadline(value);
  if (!deadline) return '';
  return deadline.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
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
            <a class="student-resource-row ${isDeadlinePassed(item.deadline_at) ? 'is-locked' : ''}" href="${isDeadlinePassed(item.deadline_at) ? 'javascript:void(0)' : escapeHtml(item.url || '#')}" ${item.url && !isDeadlinePassed(item.deadline_at) ? 'target="_blank" rel="noopener"' : ''} ${item.fileName && !isDeadlinePassed(item.deadline_at) ? `download="${escapeHtml(item.fileName)}"` : ''} ${isDeadlinePassed(item.deadline_at) ? 'aria-disabled="true" tabindex="-1"' : ''}>
              <i class="ti ${getCourseItemIcon(item.type)}"></i>
              <span>${escapeHtml(item.title)}</span>
              ${item.note && item.note !== 'Done' ? `<strong>${escapeHtml(item.note)}</strong>` : ''}
              ${item.deadline_at ? `<em>${isDeadlinePassed(item.deadline_at) ? 'Deadline passée' : `Jusqu’au ${escapeHtml(formatDeadline(item.deadline_at))}`}</em>` : ''}
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
            <a class="student-resource-row ${isDeadlinePassed(item.deadline_at) ? 'is-locked' : ''}" href="${isDeadlinePassed(item.deadline_at) ? 'javascript:void(0)' : escapeHtml(item.url || '#')}" ${item.url && !isDeadlinePassed(item.deadline_at) ? 'target="_blank" rel="noopener"' : ''} ${item.fileName && !isDeadlinePassed(item.deadline_at) ? `download="${escapeHtml(item.fileName)}"` : ''} ${isDeadlinePassed(item.deadline_at) ? 'aria-disabled="true" tabindex="-1"' : ''}>
              <i class="ti ${getCourseItemIcon(item.type)}"></i>
              <span>${escapeHtml(item.title)}</span>
              ${item.note && item.note !== 'Done' ? `<strong>${escapeHtml(item.note)}</strong>` : ''}
              ${item.deadline_at ? `<em>${isDeadlinePassed(item.deadline_at) ? 'Deadline passée' : `Jusqu’au ${escapeHtml(formatDeadline(item.deadline_at))}`}</em>` : ''}
              ${sectionIndex === 0 && item.note === 'Done' ? '<em><i class="ti ti-check"></i> Done</em>' : ''}
            </a>
          `).join('') || '<p class="student-empty-section">Aucun contenu pour le moment.</p>'}
        </div>
      </div>
    </article>
  `).join('');
}

function getCourseById(courseId) {
  return getCourses().find(course => course.id === courseId) || null;
}

async function loadCourseAssessments(courseId) {
  const [assignmentsResult, quizzesResult] = await Promise.all([
    supabase.from('assignments').select('id,title,instructions,deadline_at,max_score').eq('course_id', courseId).order('created_at'),
    supabase.from('course_quizzes').select('id,title,instructions,closes_at,quiz_questions(id,question,points,quiz_options(id,option_text,position))').eq('course_id', courseId).order('created_at')
  ]);
  return {
    assignments: assignmentsResult.error ? [] : (assignmentsResult.data || []),
    quizzes: quizzesResult.error ? [] : (quizzesResult.data || [])
  };
}

async function renderPaidStudentDashboard(selectedCourseId = getActiveCourseId()) {
  const dashboard = document.getElementById('paidStudentDashboard');
  const courseList = document.getElementById('paidCoursesList');
  const courseCount = document.getElementById('paidCourseCount');
  const courseTitle = document.getElementById('paidCourseTitle');
  const courseDescription = document.getElementById('paidCourseDescription');
  const courseMeta = document.getElementById('paidCourseMeta');
  const outline = document.getElementById('paidCourseOutline');
  const assignmentsPanel = document.getElementById('paidCourseAssignmentsPanel');
  const quizPanel = document.getElementById('paidCourseQuizPanel');
  const recentActivity = document.getElementById('studentRecentActivity');
  const studentFirstName = document.getElementById('studentFirstName');
  const studentAvatar = document.getElementById('studentAvatar');
  const studentFullName = document.getElementById('studentFullName');
  const studentEmail = document.getElementById('studentEmail');
  const studentPhone = document.getElementById('studentPhone');
  const studentAssignedCourse = document.getElementById('studentAssignedCourse');

  if (!dashboard || !courseList || !courseCount || !courseTitle || !courseDescription || !courseMeta || !outline || !assignmentsPanel || !quizPanel) return;

  const dbProfile = await getDatabaseStudentSnapshot().catch(() => null);
  const profile = dbProfile || {
    fullName: '',
    email: '',
    phone: '',
    assignedCourseIds: [],
    assignedCourseTitles: []
  };
  const cards = document.getElementById('studentPaidCourseCards');
  const fullName = profile.fullName || profile.full_name || 'Étudiant URBVEC';
  const firstName = fullName.split(' ').filter(Boolean)[0] || 'étudiant';
  const email = profile.email || 'email@exemple.com';
  const phone = profile.phone || 'Téléphone non ajouté';
  const assignedCourseIds = getAssignedCourseIds(profile);
  const assignedCourse = getCourseById(selectedCourseId) || getCourseById(assignedCourseIds[0]) || null;
  const assignedCourseTitles = Array.isArray(profile.assignedCourseTitles || profile.assigned_course_titles)
    ? (profile.assignedCourseTitles || profile.assigned_course_titles).filter(Boolean)
    : [];

  if (studentFirstName) studentFirstName.textContent = firstName;
  if (studentAvatar) studentAvatar.textContent = getInitials(fullName);
  if (studentFullName) studentFullName.textContent = fullName;
  if (studentEmail) studentEmail.textContent = email;
  if (studentPhone) studentPhone.textContent = phone;
  const profileAssignedCourses = document.getElementById('profileAssignedCourses');
  const purchasedCourses = [];
  const assignedCourses = assignedCourseIds
    .map(courseId => getCourseById(courseId))
    .filter(Boolean);
  if (profileAssignedCourses) profileAssignedCourses.textContent = String(assignedCourseIds.length || assignedCourses.length || purchasedCourses.length || 0);
  const activeCourse = purchasedCourses.find(course => course.id === selectedCourseId)
    || assignedCourses.find(course => course.id === selectedCourseId)
    || purchasedCourses[0]
    || assignedCourses[0];
  courseCount.textContent = `${purchasedCourses.length} cours`;

  if (studentAssignedCourse) {
    const assignedLabel = assignedCourseTitles.join(', ') || activeCourse?.title || assignedCourse?.title || 'En attente';
    studentAssignedCourse.textContent = `Cours attribué: ${assignedLabel}`;
  }

  const { activityData } = await hydrateStudentExtras();

  if (!assignedCourses.length && !purchasedCourses.length) {
    courseList.innerHTML = '<p class="student-empty-section">Aucun cours attribué pour le moment.</p>';
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

  const activeCourseId = activeCourse?.id || assignedCourseIds[0] || purchasedCourses[0]?.id || getActiveCourseId();
  if (activeCourseId) setActiveCourseId(activeCourseId);
  await loadCourseContentFromSupabase(activeCourseId);
  const content = getCourseContent(activeCourseId);
  const sectionCount = content.length || 0;
  const itemCount = content.reduce((total, section) => total + section.items.length, 0);

  const coursesToRender = [...new Map([...assignedCourses, ...purchasedCourses].map(course => [course.id, course])).values()];
  courseList.innerHTML = coursesToRender.map(course => `
    <button type="button" class="paid-course-item ${course.id === activeCourseId ? 'active' : ''}" data-paid-course="${course.id}">
      <span>${escapeHtml(course.title)}</span>
      <strong>${formatHtg(getCourseTotalFee(course))}</strong>
    </button>
  `).join('');

  courseTitle.textContent = activeCourse?.title || 'Votre formation';
  courseDescription.textContent = activeCourse?.description || 'Votre formation payante avec contenus, documents et exercices.';
  if (dashboard) {
    dashboard.dataset.assignedCourse = assignedCourse?.title || activeCourse?.title || '';
  }
  courseMeta.innerHTML = `
    <span><i class="ti ti-book-2"></i> ${sectionCount} sections</span>
    <span><i class="ti ti-file-stack"></i> ${itemCount} contenus</span>
  `;
  outline.classList.add('student-course-outline');
  outline.innerHTML = content.length
    ? renderCourseOutlineMarkup(content)
    : '<p class="student-empty-section">Le contenu de ce cours sera ajouté bientôt.</p>';

  const assessments = await loadCourseAssessments(activeCourseId).catch(() => ({ assignments: [], quizzes: [] }));
  const assignments = assessments.assignments;
  const quizzes = assessments.quizzes;

  assignmentsPanel.innerHTML = assignments.length ? assignments.map(item => `
    <article class="student-task-card ${isDeadlinePassed(item.deadline_at) ? 'is-locked' : ''}">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.instructions || 'Devoir du cours')}</p>
      <div class="student-task-meta">
        <span><i class="ti ti-calendar-time"></i> ${item.deadline_at ? formatDeadline(item.deadline_at) : 'Sans deadline'}</span>
      </div>
      <label class="student-upload-box ${isDeadlinePassed(item.deadline_at) ? 'is-locked' : ''}">
        <input type="file" data-assignment-file="${item.id}" accept=".pdf,.doc,.docx,.ppt,.pptx,.odt,.txt,image/*" ${isDeadlinePassed(item.deadline_at) ? 'disabled' : ''}>
        <span><i class="ti ti-upload"></i> Déposer le devoir</span>
      </label>
      <textarea data-assignment-text="${item.id}" placeholder="Ajoutez un commentaire" ${isDeadlinePassed(item.deadline_at) ? 'disabled' : ''}></textarea>
      <button type="button" class="btn-primary" data-submit-assignment="${item.id}" ${isDeadlinePassed(item.deadline_at) ? 'disabled' : ''}>Soumettre le devoir</button>
    </article>
  `).join('') : '<p class="student-empty-section">Aucun devoir disponible pour le moment.</p>';

  quizPanel.innerHTML = quizzes.length ? quizzes.map(item => `
    <article class="student-task-card ${isDeadlinePassed(item.closes_at) ? 'is-locked' : ''}">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.instructions || 'Répondez puis envoyez vos réponses.')}</p>
      <div class="student-task-meta">
        <span><i class="ti ti-bolt"></i> Points définis par l’admin</span>
        <span><i class="ti ti-calendar-time"></i> ${item.closes_at ? formatDeadline(item.closes_at) : 'Sans deadline'}</span>
      </div>
      <div class="student-quiz-questions">${(item.quiz_questions || []).map(question => `<fieldset><legend>${escapeHtml(question.question)}</legend>${(question.quiz_options || []).sort((a, b) => a.position - b.position).map(option => `<label><input type="radio" name="quiz-${item.id}-${question.id}" value="${option.id}"> ${escapeHtml(option.option_text)}</label>`).join('')}</fieldset>`).join('')}</div>
      <button type="button" class="btn-primary" data-submit-quiz="${item.id}" ${isDeadlinePassed(item.closes_at) ? 'disabled' : ''}>Envoyer le quiz</button>
    </article>
  `).join('') : '<p class="student-empty-section">Aucun quiz disponible pour le moment.</p>';

  if (cards) {
    cards.innerHTML = coursesToRender.length
      ? coursesToRender.map(course => `
        <article class="student-course-card">
          <div class="student-course-card-head">
            <h3>${escapeHtml(course.title)}</h3>
            <span class="course-status">${escapeHtml(course.status || 'Publié')}</span>
          </div>
          <p>${escapeHtml(course.description || 'Cours attribué à votre compte.')}</p>
          <button type="button" class="btn-primary" data-paid-course="${course.id}">Ouvrir le cours</button>
        </article>
      `).join('')
      : '<div class="paid-empty-state"><i class="ti ti-lock-open"></i><h3>Aucun cours attribué</h3><p>Votre administrateur doit vous attribuer au moins un cours.</p></div>';
  }

  if (recentActivity) {
    const activities = Array.isArray(activityData) ? activityData : getStudentActivity();
    recentActivity.innerHTML = activities.length
      ? activities.map(activity => `
        <div class="activity-item">
          <span>${escapeHtml(activity.label || activity.action || 'Activité')}</span>
          <small>${escapeHtml(activity.time || '')}</small>
        </div>
      `).join('')
      : '<p class="student-empty-section">Aucune activité pour le moment.</p>';
  }
}

async function syncStudentProfileFromSession() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name,email,is_admin')
      .eq('id', session.user.id)
      .maybeSingle();

    if (profileData) {
      const { data: assignedRows } = await supabase
        .from('student_courses')
        .select('course_id, courses(title)')
        .eq('student_id', session.user.id);

      const assignedCourseIds = (assignedRows || []).map(row => row.course_id).filter(Boolean);
      const assignedCourseTitles = (assignedRows || [])
        .map(row => row.courses?.title || row.course_title || '')
        .filter(Boolean);

      studentProfileCache = {
        fullName: profileData.full_name || session.user.user_metadata?.full_name || '',
        email: profileData.email || session.user.email,
        phone: profileData.phone || session.user.user_metadata?.phone || '',
        assignedCourseId: assignedCourseIds[0] || '',
        assignedCourseIds,
        assignedCourseTitle: assignedCourseTitles[0] || '',
        assignedCourseTitles
      };
      saveStudentProfile(studentProfileCache);
      return;
    }
  } catch (error) {
    console.warn('Impossible de synchroniser le profil étudiant.', error);
  }
}

async function getDatabaseStudentSnapshot() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.email) return null;

  const { data: profileData } = await supabase
    .from('profiles')
    .select('id,full_name,email,phone,is_admin')
    .eq('id', session.user.id)
    .maybeSingle();

  if (!profileData) return null;

  const { data: assignedRows } = await supabase
    .from('student_courses')
    .select('course_id,courses(title)')
    .eq('student_id', session.user.id);

  const assignedCourseIds = (assignedRows || []).map(row => row.course_id).filter(Boolean);
  const assignedCourseTitles = (assignedRows || [])
    .map(row => row.courses?.title || row.course_title || '')
    .filter(Boolean);

  return {
    id: profileData.id,
    fullName: profileData.full_name || session.user.user_metadata?.full_name || '',
    email: profileData.email || session.user.email,
    phone: profileData.phone || '',
    isAdmin: Boolean(profileData.is_admin),
    assignedCourseId: assignedCourseIds[0] || '',
    assignedCourseIds,
    assignedCourseTitle: assignedCourseTitles[0] || '',
    assignedCourseTitles
  };
}

async function hydrateStudentExtras() {
  const [libraryData, activityData] = await Promise.all([
    loadStudentLibraryFromSupabase().catch(() => getStudentLibrary()),
    loadStudentActivityFromSupabase().catch(() => getStudentActivity())
  ]);

  return { libraryData, activityData };
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
    <div class="admin-course-list-item ${course.id === activeCourseId ? 'active' : ''} ${isCourseAvailable(course) ? '' : 'unavailable'}">
      <div>
        <strong>${escapeHtml(course.title)}</strong>
        <span>${escapeHtml(course.status)} · Inscription ${formatHtg(getCourseRegistrationFee(course))} · Participation ${formatHtg(getCourseParticipationFee(course))} · ${escapeHtml(course.slug)}</span>
      </div>
      <button type="button" data-select-course="${course.id}" ${isCourseAvailable(course) ? '' : 'disabled'}><i class="ti ti-check"></i> ${isCourseAvailable(course) ? 'Utiliser' : 'Bloqué'}</button>
    </div>
  `).join('');
}

function populateAdminStudentCourseSelect() {
  const select = document.getElementById('studentCourseAdmin');
  if (!select) return;
  const courses = getCourses();
  select.innerHTML = courses.map(course => `
    <option value="${course.id}" ${isCourseAvailable(course) ? '' : 'disabled'}>${escapeHtml(course.title)}${isCourseAvailable(course) ? '' : ' (indisponible)'}</option>
  `).join('');
}

function renderAdminStudentList() {
  const tbody = document.getElementById('adminStudentsTableBody');
  if (!tbody) return;
  getRegistrationRecords().then(async registrations => {
    const combined = new Map();

    registrations.forEach(record => {
      combined.set((record.email || '').toLowerCase(), {
        fullName: record.full_name || '',
        email: record.email || '',
        phone: record.phone || '',
        assignedCourseTitles: [record.course_title].filter(Boolean),
        source: 'Inscription',
        studentId: record.student_id || ''
      });
    });

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id,email,full_name,phone');

    (profiles || []).forEach(profile => {
      const key = (profile.email || '').toLowerCase();
      if (!combined.has(key)) {
        combined.set(key, {
          fullName: profile.full_name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          assignedCourseTitles: [],
          source: 'Compte',
          studentId: profile.id || ''
        });
      }
    });

    const { data: studentCourses } = await supabase
      .from('student_courses')
      .select('student_id, course_id, courses(title)');

    const courseMap = new Map();
    (studentCourses || []).forEach(row => {
      const key = row.student_id;
      if (!courseMap.has(key)) courseMap.set(key, []);
      courseMap.get(key).push(row.courses?.title || '');
    });

    const list = Array.from(combined.values()).map(account => ({
      ...account,
      assignedCourseTitles: [...(account.assignedCourseTitles || []), ...(courseMap.get(account.studentId) || [])].filter(Boolean)
    }));

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="5">Aucun étudiant chargé pour le moment.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(account => {
      const courseTitles = Array.isArray(account.assignedCourseTitles) ? account.assignedCourseTitles : [];
      const courseLabel = courseTitles.length ? courseTitles.join(', ') : 'Non attribué';
      return `
        <tr>
          <td>${escapeHtml(account.fullName || '')}</td>
          <td>${escapeHtml(account.email || '')}<br><small>${escapeHtml(account.phone || '')}</small></td>
          <td>${escapeHtml(courseLabel)}</td>
          <td>${escapeHtml(account.source || 'Actif')}</td>
          <td>
            <button type="button" class="admin-mini-btn" data-assign-course="${escapeHtml(account.email || '')}">Attribuer</button>
            <button type="button" class="admin-mini-btn" data-delete-student="${escapeHtml(account.studentId || account.email || '')}">Supprimer</button>
          </td>
        </tr>
      `;
    }).join('');
  });
}

function fillAdminCourseForm(course) {
  if (!course) return;

  const titleInput = document.getElementById('courseTitle');
  const slugInput = document.getElementById('courseSlug');
  const priceInput = document.getElementById('coursePrice');
  const participationFeeInput = document.getElementById('courseParticipationFee');
  const statusInput = document.getElementById('courseStatus');
  const descriptionInput = document.getElementById('courseDescription');

  if (titleInput) titleInput.value = course.title || '';
  if (slugInput) slugInput.value = course.slug || '';
  if (priceInput) priceInput.value = getCourseRegistrationFee(course);
  if (participationFeeInput) participationFeeInput.value = getCourseParticipationFee(course);
  if (statusInput) statusInput.value = course.status || 'Publié';
  if (descriptionInput) descriptionInput.value = course.description || '';
}

async function initAdminCourses() {
  const courseForm = document.getElementById('adminCourseForm');
  const courseList = document.getElementById('adminCourseList');
  if (!courseForm) return;

  await ensureCourseDataLoaded();
  const currentCourses = getCourses();
  if (!currentCourses.length) {
    await saveCourses(defaultCourses);
  }

  renderAdminCourseList();
  fillAdminCourseForm(getCourses().find(course => course.id === getActiveCourseId()));

  courseForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const titleInput = document.getElementById('courseTitle');
    const slugInput = document.getElementById('courseSlug');
    const priceInput = document.getElementById('coursePrice');
    const participationFeeInput = document.getElementById('courseParticipationFee');
    const statusInput = document.getElementById('courseStatus');
    const descriptionInput = document.getElementById('courseDescription');
    if (!titleInput || !slugInput || !priceInput || !participationFeeInput || !statusInput || !descriptionInput) return;
    const title = titleInput.value.trim();
    if (!title) return;

    const slug = slugInput.value.trim() || slugify(title);
    const courses = getCourses();
    let course = courses.find(item => item.slug === slug);

    if (course) {
      course.title = title;
      course.price = Number(priceInput.value || 0);
      course.participationFee = Number(participationFeeInput.value || 0);
      course.status = statusInput.value;
      course.description = descriptionInput.value.trim();
    } else {
      course = {
        id: createId('course'),
        title,
        slug,
        price: Number(priceInput.value || 0),
        participationFee: Number(participationFeeInput.value || 0),
        status: statusInput.value,
        description: descriptionInput.value.trim()
      };
      courses.push(course);
    }

    if (!await saveCourses(courses)) {
      alert("Le cours n'a pas pu être enregistré. Vérifie les droits administrateur Supabase.");
      return;
    }
    if (!courseContentCache.has(course.id)) courseContentCache.set(course.id, []);
    setActiveCourseId(course.id);
    courseForm.reset();
    renderAdminCourseList();
    renderAdminCourseBuilder();
  });

  courseList?.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-select-course]');
    if (!button) return;
    setActiveCourseId(button.dataset.selectCourse);
    await loadCourseContentFromSupabase(button.dataset.selectCourse);
    const selectedCourse = getCourses().find(course => course.id === button.dataset.selectCourse);
    fillAdminCourseForm(selectedCourse);
    renderAdminCourseList();
    renderAdminCourseBuilder();
  });
}

async function initAdminCourseBuilder() {
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
    if (!itemType || !itemFileGroup || !itemUrlGroup || !itemFile || !itemUrl) return;
    const usesFile = fileCourseItemTypes.includes(itemType.value);
    itemFileGroup.style.display = usesFile ? 'flex' : 'none';
    itemUrlGroup.style.display = usesFile ? 'none' : 'flex';
    itemFile.required = usesFile;
    itemUrl.required = !usesFile && itemType.value === 'link';
  }

  await ensureCourseDataLoaded();

  renderAdminCourseBuilder();
  updateItemSourceField();
  itemType?.addEventListener('change', updateItemSourceField);

  document.getElementById('contentCourseSelect')?.addEventListener('change', async (event) => {
    setActiveCourseId(event.target.value);
    await loadCourseContentFromSupabase(event.target.value);
    renderAdminCourseList();
    renderAdminCourseBuilder();
  });

  sectionForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const titleInput = document.getElementById('sectionTitle');
    if (!titleInput) return;
    const title = titleInput.value.trim();
    if (!title) return;

    const activeCourseId = getActiveCourseId();
    const content = getCourseContent(activeCourseId);
    content.push({ id: createId('section'), title, items: [] });
    await saveCourseContent(content, activeCourseId);
    titleInput.value = '';
    renderAdminCourseBuilder();
  });

  itemForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const sectionInput = document.getElementById('itemSection');
    const titleInput = document.getElementById('itemTitle');
    const noteInput = document.getElementById('itemNote');
    if (!sectionInput || !titleInput || !noteInput || !itemType || !itemUrl || !itemFile) return;
    const sectionId = sectionInput.value;
    const title = titleInput.value.trim();
    const type = itemType.value;
    let url = itemUrl.value.trim();
    const note = noteInput.value.trim();
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
        url = await uploadCourseFile(file, activeCourseId);
      } catch (error) {
        console.warn('Impossible d’envoyer le fichier vers Supabase Storage.', error);
        alert(error.message || "Le fichier n'a pas pu être envoyé. Vérifie Supabase Storage et réessaie.");
        return;
      }
    }

    targetSection.items.push({ id: createId('item'), title, type, url, note, fileName });
    if (!await saveCourseContent(content, activeCourseId)) return;
    itemForm.reset();
    if (sectionInput) sectionInput.value = sectionId;
    updateItemSourceField();
    renderAdminCourseBuilder();
  });

  outline.addEventListener('click', async (event) => {
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
      await saveCourseContent(content, activeCourseId);
      renderAdminCourseBuilder();
      return;
    }

    if (editSectionButton) {
      const section = content.find(item => item.id === editSectionButton.dataset.editSection);
      const title = prompt('Nouveau titre de section', section?.title || '');
      if (!section || !title?.trim()) return;
      section.title = title.trim();
      await saveCourseContent(content, activeCourseId);
      renderAdminCourseBuilder();
      return;
    }

    if (moveSectionButton) {
      const index = content.findIndex(section => section.id === moveSectionButton.dataset.moveSection);
      content = moveArrayItem(content, index, Number(moveSectionButton.dataset.direction));
      await saveCourseContent(content, activeCourseId);
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
      await saveCourseContent(content, activeCourseId);
      renderAdminCourseBuilder();
      return;
    }

    if (editItemButton) {
      const section = content.find(item => item.id === editItemButton.dataset.sectionId);
      const item = section?.items.find(entry => entry.id === editItemButton.dataset.editItem);
      const title = prompt('Nouveau titre du contenu', item?.title || '');
      if (!item || !title?.trim()) return;
      item.title = title.trim();
      await saveCourseContent(content, activeCourseId);
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
      await saveCourseContent(content, activeCourseId);
      renderAdminCourseBuilder();
    }
  });

  resetButton?.addEventListener('click', async () => {
    const activeCourseId = getActiveCourseId();
    await saveCourseContent(getInitialCourseContent(activeCourseId), activeCourseId);
    renderAdminCourseBuilder();
  });
}

function initAdminStudentForm() {
  const form = document.getElementById('adminStudentForm');
  if (!form) return;

  populateAdminStudentCourseSelect();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const fullName = getInputValue('studentFullNameAdmin');
    const email = getInputValue('studentEmailAdmin');
    const phone = getInputValue('studentPhoneAdmin');
    const password = getInputValue('studentPasswordAdmin');
    const courseSelect = document.getElementById('studentCourseAdmin');
    const selectedOptions = Array.from(courseSelect?.selectedOptions || []);
    const courseIds = selectedOptions.map(option => option.value).filter(Boolean);
    const courseTitles = selectedOptions.map(option => option.textContent).filter(Boolean);
    const course = getCourseById(courseIds[0]);

    if (!fullName || !email || !password || !course || !courseIds.length) {
      alert('Veuillez remplir le nom, l email, le mot de passe et le cours attribué.');
      return;
    }

    try {
      const studentProfileId = await saveStudentToDatabase({
        fullName,
        email,
        phone,
        password,
        assignedCourseIds: courseIds,
        assignedCourseTitles: courseTitles
      });
      form.reset();
      populateAdminStudentCourseSelect();
      renderAdminStudentList();
      alert(`Compte étudiant créé et cours attribué: ${course.title}`);
    } catch (error) {
      console.error('Erreur création étudiant:', error);
      alert(error?.message || 'Erreur inattendue lors de la création du compte étudiant.');
    }
  });
}

function initAdminStudentActions() {
  const table = document.getElementById('adminStudentsTableBody');
  if (!table) return;

  table.addEventListener('click', async (event) => {
    const assignButton = event.target.closest('[data-assign-course]');
    const deleteButton = event.target.closest('[data-delete-student]');

    if (assignButton) {
      const email = assignButton.dataset.assignCourse;
      const registrations = await getRegistrationRecords();
      const registration = registrations.find(record => record.email?.toLowerCase() === email.toLowerCase());
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      const currentAssignments = await supabase
        .from('student_courses')
        .select('course_id')
        .eq('student_id', profileRow?.id || '');
      const courseIds = (currentAssignments.data || []).map(row => row.course_id).filter(Boolean);
      const selectedCourses = prompt('IDs des cours à attribuer, séparés par des virgules', courseIds.join(', '));
      if (!selectedCourses) return;
      const nextCourseIds = selectedCourses.split(',').map(item => item.trim()).filter(Boolean);
      if (!nextCourseIds.length) return;

      if (!profileRow?.id) {
        alert("Cet étudiant n'existe pas dans Supabase.");
        return;
      }
      const { error: assignmentError } = await supabase.rpc('admin_assign_courses', {
        p_student_id: profileRow.id,
        p_course_ids: nextCourseIds
      });
      if (assignmentError) {
        console.warn('Impossible d’attribuer les cours à l’étudiant.', assignmentError);
        alert(assignmentError.message || "Les cours n'ont pas pu être attribués.");
        return;
      }

      renderAdminStudentList();
      renderAdminOverviewStats();
      alert('Cours mis à jour pour cet étudiant.');
      return;
    }

    if (deleteButton) {
      const studentId = deleteButton.dataset.deleteStudent;
      if (!studentId) return;
      if (!confirm('Supprimer cet élève et tous ses accès ?')) return;
      let resolvedStudentId = studentId;
      if (studentId.includes('@')) {
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', studentId)
          .maybeSingle();
        resolvedStudentId = profileRow?.id || studentId;
      }
      const ok = await removeStudentFromDatabase(resolvedStudentId);
      if (!ok) return;
      renderAdminStudentList();
      renderAdminOverviewStats();
      alert('Élève supprimé.');
    }
  });
}

function initAdminAssessments() {
  const quizForm = document.getElementById('adminQuizForm');
  const assignmentForm = document.getElementById('adminAssignmentForm');
  const quizCourse = document.getElementById('quizCourse');
  const quizList = document.getElementById('adminQuizList');
  const assignmentList = document.getElementById('adminAssignmentList');
  let editingQuizId = '';
  let editingQuestionId = '';
  let editingAssignmentId = '';
  if (quizCourse) {
    quizCourse.innerHTML = getCourses().map(course => `<option value="${course.id}">${escapeHtml(course.title)}</option>`).join('');
  }

  const renderLists = async () => {
    const [quizzesResult, assignmentsResult] = await Promise.all([
      supabase.from('course_quizzes').select('id,title,closes_at,course_id,courses(title)').order('created_at', { ascending: false }),
      supabase.from('assignments').select('id,title,deadline_at,course_id,courses(title)').order('created_at', { ascending: false })
    ]);
    const quizzes = quizzesResult.data || [];
    const assignments = assignmentsResult.data || [];
    if (quizList) quizList.innerHTML = quizzes.length ? quizzes.map(item => `<tr><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.courses?.title || getCourseById(item.course_id)?.title || '')}</td><td>${item.closes_at ? escapeHtml(formatDeadline(item.closes_at)) : 'Sans deadline'}</td><td><button type="button" class="admin-secondary-btn" data-edit-quiz="${item.id}">Modifier</button> <button type="button" class="admin-secondary-btn" data-delete-quiz="${item.id}">Supprimer</button></td></tr>`).join('') : '<tr><td colspan="4">Aucun quiz.</td></tr>';
    if (assignmentList) assignmentList.innerHTML = assignments.length ? assignments.map(item => `<tr><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.courses?.title || getCourseById(item.course_id)?.title || '')}</td><td>${item.deadline_at ? escapeHtml(formatDeadline(item.deadline_at)) : 'Sans deadline'}</td><td><button type="button" class="admin-secondary-btn" data-edit-assignment="${item.id}">Modifier</button> <button type="button" class="admin-secondary-btn" data-delete-assignment="${item.id}">Supprimer</button></td></tr>`).join('') : '<tr><td colspan="4">Aucun devoir.</td></tr>';
  };

  quizForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const courseId = quizCourse?.value;
    const question = getInputValue('quizQuestion');
    const correct = getInputValue('quizCorrect');
    const options = ['quizOptionA', 'quizOptionB', 'quizOptionC', 'quizOptionD'].map(getInputValue).filter(Boolean);
    if (!courseId || !question || options.length < 2 || !correct) return alert('Remplis le cours, la question, au moins deux options et la bonne réponse.');
    const quizPayload = {
      course_id: courseId,
      title: getInputValue('quizChapter', 'Quiz'),
      closes_at: document.getElementById('quizDeadline')?.value || null,
      time_limit_minutes: Number(getInputValue('quizTimeline').match(/\d+/)?.[0] || 0),
      shuffle_questions: getInputValue('quizShuffle') === 'Oui'
    };
    let quiz;
    let quizError;
    if (editingQuizId) {
      ({ data: quiz, error: quizError } = await supabase.from('course_quizzes').update(quizPayload).eq('id', editingQuizId).select('id').single());
    } else {
      ({ data: quiz, error: quizError } = await supabase.from('course_quizzes').insert(quizPayload).select('id').single());
    }
    if (quizError || !quiz) return alert(quizError?.message || 'Impossible de créer le quiz.');
    const questionPayload = { quiz_id: quiz.id, question, points: Number(getInputValue('quizPoints') || 1) };
    let savedQuestion;
    let questionError;
    if (editingQuizId) {
      ({ data: savedQuestion, error: questionError } = await supabase.from('quiz_questions').update(questionPayload).eq('id', editingQuestionId).select('id').single());
    } else {
      ({ data: savedQuestion, error: questionError } = await supabase.from('quiz_questions').insert(questionPayload).select('id').single());
    }
    if (questionError || !savedQuestion) return alert(questionError?.message || 'Quiz créé, mais question non enregistrée.');
    if (editingQuizId) {
      const { error: removeOptionsError } = await supabase.from('quiz_options').delete().eq('question_id', savedQuestion.id);
      if (removeOptionsError) return alert(removeOptionsError.message);
    }
    const { error: optionError } = await supabase.from('quiz_options').insert(options.map((option_text, position) => ({ question_id: savedQuestion.id, option_text, position, is_correct: option_text.trim().toLowerCase() === correct.trim().toLowerCase() })));
    if (optionError) return alert(optionError.message);
    editingQuizId = '';
    editingQuestionId = '';
    quizForm.reset();
    quizForm.querySelector('button[type="submit"]').innerHTML = '<i class="ti ti-device-floppy"></i> Enregistrer la question';
    await renderLists();
    alert('Quiz enregistré avec succès.');
  });

  assignmentForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const courseId = getInputValue('assignmentCourse');
    const title = getInputValue('assignmentTitle');
    if (!courseId || !title) return alert('Choisis un cours et ajoute un titre.');
    const payload = {
      course_id: courseId,
      title,
      instructions: getInputValue('assignmentInstructions'),
      deadline_at: document.getElementById('assignmentDeadline')?.value || null,
      max_score: Number(getInputValue('assignmentMaxScore') || 20)
    };
    const { error } = editingAssignmentId
      ? await supabase.from('assignments').update(payload).eq('id', editingAssignmentId)
      : await supabase.from('assignments').insert(payload);
    if (error) return alert(error.message);
    editingAssignmentId = '';
    assignmentForm.reset();
    populateAssignmentCourseSelect();
    await renderLists();
    alert('Devoir enregistré avec succès.');
  });

  const loadAssignment = async (id) => {
    const { data, error } = await supabase.from('assignments').select('*').eq('id', id).single();
    if (error || !data) return alert(error?.message || 'Devoir introuvable.');
    editingAssignmentId = id;
    document.getElementById('assignmentCourse').value = data.course_id;
    document.getElementById('assignmentTitle').value = data.title || '';
    document.getElementById('assignmentInstructions').value = data.instructions || '';
    document.getElementById('assignmentDeadline').value = data.deadline_at ? data.deadline_at.slice(0, 16) : '';
    document.getElementById('assignmentMaxScore').value = data.max_score || 20;
  };
  const loadQuiz = async (id) => {
    const { data, error } = await supabase.from('course_quizzes').select('*,quiz_questions(id,question,points,quiz_options(id,option_text,is_correct,position))').eq('id', id).single();
    const question = data?.quiz_questions?.[0];
    if (error || !data || !question) return alert(error?.message || 'Quiz introuvable.');
    editingQuizId = id;
    editingQuestionId = question.id;
    document.getElementById('quizCourse').value = data.course_id;
    document.getElementById('quizChapter').value = data.title || 'Quiz';
    document.getElementById('quizQuestion').value = question.question || '';
    document.getElementById('quizPoints').value = question.points || 1;
    document.getElementById('quizDeadline').value = data.closes_at ? data.closes_at.slice(0, 16) : '';
    const opts = (question.quiz_options || []).sort((a, b) => a.position - b.position);
    ['quizOptionA', 'quizOptionB', 'quizOptionC', 'quizOptionD'].forEach((field, index) => { document.getElementById(field).value = opts[index]?.option_text || ''; });
    document.getElementById('quizCorrect').value = opts.find(option => option.is_correct)?.option_text || '';
  };
  quizList?.addEventListener('click', async event => {
    const edit = event.target.closest('[data-edit-quiz]');
    const remove = event.target.closest('[data-delete-quiz]');
    if (edit) return loadQuiz(edit.dataset.editQuiz);
    if (remove && confirm('Supprimer ce quiz et ses questions ?')) {
      const { error } = await supabase.from('course_quizzes').delete().eq('id', remove.dataset.deleteQuiz);
      if (error) return alert(error.message);
      await renderLists();
    }
  });
  assignmentList?.addEventListener('click', async event => {
    const edit = event.target.closest('[data-edit-assignment]');
    const remove = event.target.closest('[data-delete-assignment]');
    if (edit) return loadAssignment(edit.dataset.editAssignment);
    if (remove && confirm('Supprimer ce devoir et ses remises ?')) {
      const { error } = await supabase.from('assignments').delete().eq('id', remove.dataset.deleteAssignment);
      if (error) return alert(error.message);
      await renderLists();
    }
  });
  renderLists();
}

function initAdminResources() {
  const form = document.getElementById('adminResourceForm');
  const courseSelect = document.getElementById('resourceCourse');
  const sectionSelect = document.getElementById('resourceChapter');
  const typeSelect = document.getElementById('resourceType');
  const fileInput = document.getElementById('resourceFile');
  const urlInput = document.getElementById('resourceUrl');
  if (!form || !courseSelect || !sectionSelect || !typeSelect || !fileInput || !urlInput) return;

  const fillCourses = () => {
    courseSelect.innerHTML = getCourses().map(course => `<option value="${course.id}">${escapeHtml(course.title)}</option>`).join('');
    courseSelect.value = getActiveCourseId();
  };
  const fillSections = async () => {
    const courseId = courseSelect.value;
    await loadCourseContentFromSupabase(courseId);
    const sections = getCourseContent(courseId);
    sectionSelect.innerHTML = sections.map(section => `<option value="${section.id}">${escapeHtml(section.title)}</option>`).join('');
  };
  const updateSource = () => {
    const isLink = typeSelect.value === 'Lien';
    urlInput.required = isLink;
    fileInput.required = !isLink;
    urlInput.closest('.form-group').style.display = isLink ? 'block' : 'none';
    fileInput.closest('.form-group').style.display = isLink ? 'none' : 'block';
  };

  fillCourses();
  fillSections();
  updateSource();
  courseSelect.addEventListener('change', fillSections);
  typeSelect.addEventListener('change', updateSource);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const courseId = courseSelect.value;
    const section = getCourseContent(courseId).find(item => item.id === sectionSelect.value);
    const title = getInputValue('resourceTitle');
    if (!section || !title) return alert('Choisis une section et ajoute un titre.');
    const typeMap = { PDF: 'pdf', 'Vidéo': 'video', Lien: 'link' };
    const type = typeMap[typeSelect.value] || 'document';
    let url = getInputValue('resourceUrl');
    let fileName = '';
    try {
      if (type !== 'link') {
        const file = fileInput.files?.[0];
        if (!file) return fileInput.reportValidity();
        fileName = file.name;
        url = await uploadCourseFile(file, courseId);
      }
      section.items.push({ id: createId(), title, type, url, fileName, note: '' });
      if (!await saveCourseContent(getCourseContent(courseId), courseId)) return;
      form.reset();
      fillCourses();
      await fillSections();
      updateSource();
      alert('Ressource publiée avec succès.');
    } catch (error) {
      alert(error.message || 'Impossible de publier la ressource.');
    }
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

function initContactForm() {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = getInputValue('contactName', 'Visiteur') || 'Visiteur';
    const email = getInputValue('contactEmail');
    const subject = getInputValue('contactSubject', 'Contact URBVEC Academy') || 'Contact URBVEC Academy';
    const message = getInputValue('contactMessage');
    const whatsappMessage = [
      'Bonjour URBVEC Academy,',
      '',
      `Nom: ${name}`,
      email ? `Email: ${email}` : null,
      `Sujet: ${subject}`,
      '',
      message
    ].filter(Boolean).join('\n');

    window.open(`https://wa.me/50938449148?text=${encodeURIComponent(whatsappMessage)}`, '_blank', 'noopener,noreferrer');
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

function initAdminLogoutButton() {
  const logoutButton = document.getElementById('adminLogoutBtn');
  if (!logoutButton) return;

  logoutButton.addEventListener('click', async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Déconnexion admin indisponible.', error);
    }
    playLogoTransition('index.html');
  });
}

function refreshAdminViews() {
  renderAdminStudentList();
  renderAdminOverviewStats();
  renderAdminPaymentsTable();
  renderAdminAssignmentsTable();
  renderAdminCourseList();
  renderAdminCourseBuilder();
  populateAssignmentCourseSelect();
}

function startAdminRealtimeSync() {
  // Realtime is disabled because it is not configured in the current Supabase project.
  // Admin views refresh after each local action without keeping a failing WebSocket open.
  return null;
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

function navigateTo(redirectUrl) {
  window.location.assign(redirectUrl);
}

// Function to handle online course login
async function initOnlineLoginForm() {
  const loginForm = document.querySelector('.online-login-form');
  if (!loginForm) return;

  const emailInput = document.getElementById('studentLogin');
  const passwordInput = document.getElementById('studentPassword');
  const submitButton = loginForm.querySelector('button[type="submit"]');
  if (!emailInput || !passwordInput || !submitButton) return;

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

      if (error || !data?.user) {
        const message = error?.message === 'Invalid login credentials'
          ? "Email ou mot de passe incorrect. Si ce compte a été créé avant le déploiement de « admin-create-student », recrée-le depuis l'administration."
          : (error?.message || 'Échec de la connexion. Vérifiez vos identifiants.');
        console.error('Erreur de connexion:', message);
        alert(message);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin,full_name')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Erreur lors de la récupération du profil:', profileError.message);
        alert('Erreur lors de la récupération du profil. Veuillez réessayer.');
        await supabase.auth.signOut();
        return;
      }

      const sessionProfile = await getDatabaseStudentSnapshot();
      if (sessionProfile) {
        clearStudentLocalState();
        saveStudentProfile(sessionProfile);
      }

      const isAdmin = profileData?.is_admin === true || data.user.user_metadata?.is_admin === true;
      if (isAdmin) {
        navigateTo('admin.html');
      } else {
        navigateTo('dashboard-etudiant.html');
      }
    } catch (err) {
      console.error('Erreur inattendue:', err?.message || err);
      alert('Une erreur est survenue pendant la connexion. Veuillez réessayer.');
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
      .maybeSingle();

    if (profileData) {
      clearStudentLocalState();
    }

    const isAdmin = profileData?.is_admin === true || session.user.user_metadata?.is_admin === true;
    if (isAdmin) {
      navigateTo('admin.html');
      return;
    }

    navigateTo('dashboard-etudiant.html');
  } catch (error) {
    console.warn('Session étudiant non disponible.', error);
  }
}

async function initPaidStudentDashboard() {
  const paidDashboard = document.getElementById('paidStudentDashboard');
  if (!paidDashboard) return;

  await renderPaidStudentDashboard();

  const menuToggle = document.getElementById('studentMenuToggle');
  const mobileMenu = document.getElementById('studentMobileMenu');
  const menuClose = document.getElementById('studentMenuClose');
  const viewButtons = paidDashboard.querySelectorAll('[data-student-view]');
  const courseTabButtons = paidDashboard.querySelectorAll('[data-course-tab]');
  const overviewView = document.getElementById('studentOverviewView');
  const courseView = document.getElementById('studentCourseView');
  const profileView = document.getElementById('studentProfileView');
  const backToOverview = document.getElementById('backToStudentOverview');
  const logoutButton = document.getElementById('studentLogoutBtn');

  const showView = (view) => {
    if (overviewView) overviewView.style.display = view === 'overview' ? 'block' : 'none';
    if (courseView) courseView.style.display = view === 'courses' ? 'block' : 'none';
    if (profileView) profileView.style.display = view === 'profile' ? 'block' : 'none';
    viewButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.studentView === view));
  };

  const showCoursePanel = (panel) => {
    paidDashboard.querySelectorAll('[data-course-panel]').forEach(node => {
      node.classList.toggle('active', node.dataset.coursePanel === panel);
    });
    courseTabButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.courseTab === panel));
  };

  const toggleMenu = (open) => {
    if (!mobileMenu) return;
    mobileMenu.classList.toggle('open', open);
    mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
  };

  menuToggle?.addEventListener('click', () => toggleMenu(true));
  menuClose?.addEventListener('click', () => toggleMenu(false));
  mobileMenu?.addEventListener('click', (event) => {
    if (event.target === mobileMenu) toggleMenu(false);
  });

  paidDashboard.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-paid-course]');
    if (!button) return;
    await renderPaidStudentDashboard(button.dataset.paidCourse);
    showView('courses');
    toggleMenu(false);
  });

  paidDashboard.addEventListener('click', async (event) => {
    const assignmentButton = event.target.closest('[data-submit-assignment]');
    const quizButton = event.target.closest('[data-submit-quiz]');
    if (!assignmentButton && !quizButton) return;

    if (assignmentButton) {
      const assignmentId = assignmentButton.dataset.submitAssignment;
      const file = paidDashboard.querySelector(`[data-assignment-file="${assignmentId}"]`)?.files?.[0];
      const text = paidDashboard.querySelector(`[data-assignment-text="${assignmentId}"]`)?.value?.trim() || '';
      assignmentButton.disabled = true;
      try {
        const uploaded = await uploadAssignmentFile(file, assignmentId);
        const { error } = await supabase.rpc('submit_assignment', {
          p_assignment_id: assignmentId,
          p_submitted_text: text,
          p_submitted_link: '',
          p_file_name: uploaded.name,
          p_file_url: uploaded.url
        });
        if (error) throw error;
        showRegistrationNotice('Devoir envoyé avec succès.', 'success');
      } catch (error) {
        showRegistrationNotice(error.message || 'Impossible d’envoyer le devoir.', 'error');
      } finally {
        assignmentButton.disabled = false;
      }
      return;
    }

    const quizId = quizButton.dataset.submitQuiz;
    const answers = {};
    paidDashboard.querySelectorAll(`input[name^="quiz-${quizId}-"]:checked`).forEach(input => {
      answers[input.name.replace(`quiz-${quizId}-`, '')] = input.value;
    });
    quizButton.disabled = true;
    try {
      const { data, error } = await supabase.rpc('submit_quiz_attempt', { p_quiz_id: quizId, p_answers: answers });
      if (error) throw error;
      const result = Array.isArray(data) ? data[0] : data;
      showRegistrationNotice(`Quiz envoyé : ${result?.score || 0}/${result?.total_points || 0}`, 'success');
    } catch (error) {
      showRegistrationNotice(error.message || 'Impossible d’envoyer le quiz.', 'error');
    } finally {
      quizButton.disabled = false;
    }
  });

  viewButtons.forEach(button => {
    button.addEventListener('click', () => {
      const nextView = button.dataset.studentView === 'profile' ? 'profile' : button.dataset.studentView === 'courses' ? 'courses' : 'overview';
      showView(nextView);
      toggleMenu(false);
    });
  });

  courseTabButtons.forEach(button => {
    button.addEventListener('click', () => showCoursePanel(button.dataset.courseTab));
  });

  if (backToOverview) {
    backToOverview.addEventListener('click', () => showView('overview'));
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Déconnexion Supabase indisponible.', error);
    }
      playLogoTransition('cours-online.html');
    });
  }

  await syncStudentProfileFromSession();
  await renderPaidStudentDashboard();
  showView('overview');
  showCoursePanel('content');

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .maybeSingle();

    const isAdmin = profileData?.is_admin === true || session.user.user_metadata?.is_admin === true;
    if (isAdmin) {
      navigateTo('admin.html');
    }
  } catch (error) {
    console.warn('Session du dashboard étudiant non disponible.', error);
  }
}

// Initializer for DOM content loaded
document.addEventListener('DOMContentLoaded', async () => {
  const runSafe = async (fn) => {
    try {
      return await fn();
    } catch (error) {
      console.warn('Initialisation partielle ignorée.', error);
      return null;
    }
  };

  await runSafe(async () => {
    initAppHeight();
    initMenuToggle();
    initCourseFilters();
    initClickableCards();
    initModalButtons();
    initContactForm();
    await initRegistrationForm();
    initAiCourseQuiz();
    await ensureCourseDataLoaded();
    renderStudentCourseOutline();
  });

  // Initialisations spécifiques à la page d'administration
  // Elles ne s'exécutent que si l'élément '.admin-sidebar' est présent dans le DOM
  if (document.querySelector('.admin-sidebar')) {
    await runSafe(async () => initAdminTabs());
    await runSafe(async () => initAdminLogoutButton());
    await runSafe(async () => initAdminCourses());
    await runSafe(async () => initAdminCourseBuilder());
    await runSafe(async () => refreshAdminViews());
    await runSafe(async () => initAdminStudentActions());
    await runSafe(async () => initAdminAssessments());
    await runSafe(async () => initAdminResources());
    await runSafe(async () => startAdminRealtimeSync());
  }
  await runSafe(async () => initOnlineLoginForm());
  await runSafe(async () => initAdminStudentForm());
  await runSafe(async () => initPaidStudentDashboard());
  
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
