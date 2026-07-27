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

const unavailableCourseStatuses = ['Indisponible', 'Brouillon', 'Archivé'];
const CONTACT_PAGE = 'contact.html';

function isCourseAvailable(course) {
  return course && !unavailableCourseStatuses.includes(course.status);
}

function formatHtg(amount) {
  return `${Number(amount || 0).toLocaleString('fr-FR')} HTG`;
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

function getLocalRegistrationRecords() {
  try {
    const saved = localStorage.getItem('urbvec_registration_records');
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function getRegistrationRecords() {
  const localRecords = getLocalRegistrationRecords();
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !Array.isArray(data)) return localRecords;
    return data;
  } catch {
    return localRecords;
  }
}

function saveLocalRegistrationRecord(record) {
  const records = getLocalRegistrationRecords();
  const next = [record, ...records].slice(0, 100);
  localStorage.setItem('urbvec_registration_records', JSON.stringify(next));
  return next;
}

function getLocalAssignmentRecords() {
  try {
    const saved = localStorage.getItem('urbvec_assignment_records');
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalAssignmentRecord(record) {
  const records = getLocalAssignmentRecords();
  const next = [record, ...records].slice(0, 100);
  localStorage.setItem('urbvec_assignment_records', JSON.stringify(next));
  return next;
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
    const { data, error } = await supabase.rpc('admin_upsert_student_profile', {
      p_email: student.email || '',
      p_full_name: student.fullName || '',
      p_phone: student.phone || '',
      p_course_ids: student.assignedCourseIds || []
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.warn('Impossible de sauvegarder l\'étudiant dans Supabase:', error);
    return null;
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

function renderAdminOverviewStats() {
  const setText = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = String(value);
  };

  const localStudents = new Set([
    ...getStudentAccounts().map(account => account.email?.toLowerCase()).filter(Boolean),
    ...getLocalRegistrationRecords().map(record => record.email?.toLowerCase()).filter(Boolean)
  ]).size;
  const localCourses = getCourses().length;
  const localResources = getCourses().reduce((total, course) => total + getCourseContent(course.id).reduce((sum, section) => sum + section.items.length, 0), 0);
  const localPayments = getLocalRegistrationRecords().length;

  setText('adminStatStudents', localStudents);
  setText('adminStatCourses', localCourses);
  setText('adminStatResources', localResources);
  setText('adminStatPayments', localPayments);

  supabase.from('profiles').select('id', { count: 'exact', head: true }).then(({ count }) => {
    if (typeof count === 'number') setText('adminStatStudents', count);
  }).catch(() => {});
  supabase.from('courses').select('id', { count: 'exact', head: true }).then(({ count }) => {
    if (typeof count === 'number') setText('adminStatCourses', count);
  }).catch(() => {});
  supabase.from('registrations').select('id', { count: 'exact', head: true }).then(({ count }) => {
    if (typeof count === 'number') setText('adminStatPayments', count);
  }).catch(() => {});
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
  const records = getLocalAssignmentRecords();
  if (!records.length) {
    tbody.innerHTML = '<tr><td colspan="5">Aucune remise pour le moment.</td></tr>';
    return;
  }
  tbody.innerHTML = records.map(record => `
    <tr>
      <td>${escapeHtml(record.student || '')}</td>
      <td>${escapeHtml(record.title || '')}</td>
      <td>${record.submitted_at ? escapeHtml(new Date(record.submitted_at).toLocaleString('fr-FR')) : ''}</td>
      <td>En attente</td>
      <td>---</td>
    </tr>
  `).join('');
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

function initRegistrationForm() {
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

  if (!registrationForm) return;
  renderRegistrationCourseOptions(courseSelect);
  if (paymentInfoLink) paymentInfoLink.href = getPaymentInfoWhatsappUrl();

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
    const registrationFee = selectedOption.value ? Number(selectedOption.dataset.price || 0) : null;
    const participationFee = selectedOption.value ? Number(selectedOption.dataset.participationFee || 0) : 0;
    const amountDueNow = Number(registrationFee || 0);
    resetPaymentMethod();

    if (selectedOption.value === "" || registrationFee === null) {
      priceInfo.style.display = 'none';
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
    const fullName = document.getElementById('fullName')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    const proofFile = paymentProof?.files?.[0];

    if (!selectedCourseId) return;
    if (selectedOption.disabled) return;
    if (amountDueNow > 0 && !paymentMethodInput?.value) {
      alert('Veuillez choisir MonCash ou NatCash avant de soumettre.');
      return;
    }

    setActiveCourseId(selectedCourseId);
    saveStudentProfile({ fullName, email, phone });

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
      transaction_id: transactionId?.value.trim() || '',
      receipt_file_name: proofFile?.name || '',
      status: 'En attente de vérification'
    };

    const savePromise = saveRegistrationToDatabase(registration);
    savePurchasedCourseId(selectedCourseId);
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
const STUDENT_ACCOUNTS_KEY = 'urbvec_student_accounts';
const STUDENT_LIBRARY_KEY = 'urbvec_student_library';
const fileCourseItemTypes = ['document', 'pdf', 'ppt', 'doc', 'video'];

const defaultCourses = [
  { id: 'free-ai', title: "Maîtriser l'IA au quotidien", slug: 'cours-gratuit', price: 0, participationFee: 0, status: 'Publié', description: "Apprendre à utiliser l'intelligence artificielle dans le quotidien." },
  { id: 'dev-web-moderne', title: "Développement Web Moderne", slug: 'dev-web-moderne', price: 2500, participationFee: 0, status: 'Publié', description: "Maîtrisez HTML, CSS et JavaScript pour créer des interfaces web professionnelles." },
  { id: 'gestion-projet-leadership', title: "Gestion de Projet & Leadership", slug: 'gestion-projet-leadership', price: 3000, participationFee: 0, status: 'Publié', description: "Apprenez les méthodologies agiles et le management d'équipe." },
  { id: 'python-automatisation', title: "Python & Automatisation", slug: 'python-automatisation', price: 3000, participationFee: 0, status: 'Publié', description: "Apprenez Python pour automatiser des tâches répétitives." },
  { id: 'ux-ui-figma', title: "Design UX/UI avec Figma", slug: 'ux-ui-figma', price: 2500, participationFee: 0, status: 'Publié', description: "Créez des interfaces intuitives avec Figma." },
  { id: 'marketing-digital-seo', title: "Marketing Digital & SEO", slug: 'marketing-digital-seo', price: 2500, participationFee: 0, status: 'Publié', description: "Dominez les stratégies de marketing digital et le SEO." },
  { id: 'react-avance', title: "React Avancé", slug: 'react-avance', price: 4000, participationFee: 0, status: 'Publié', description: "Maîtrisez React pour construire des applications web modernes." },
  { id: 'entrepreneuriat-startup', title: "Entrepreneuriat & Startup", slug: 'entrepreneuriat-startup', price: 3500, participationFee: 0, status: 'Publié', description: "Apprenez à lancer et développer votre startup." },
  { id: 'intro-gestion-finance', title: "Intro à la Gestion & Finance", slug: 'intro-gestion-finance', price: 2500, participationFee: 0, status: 'Publié', description: "Maîtrisez les bases de la gestion d'entreprise." },
  { id: 'data-science-python', title: "Data Science avec Python", slug: 'data-science-python', price: 4500, participationFee: 0, status: 'Publié', description: "Analysez des données complexes avec Python." },
  { id: 'branding-design-graphique', title: "Branding & Design Graphique", slug: 'branding-design-graphique', price: 2000, participationFee: 0, status: 'Publié', description: "Créez des identités visuelles fortes." },
  { id: 'langues-communication', title: "Langues & Communication", slug: 'langues-communication', price: 1500, participationFee: 0, status: 'Publié', description: "Perfectionnez votre expression écrite et orale." },
  { id: 'content-marketing-copywriting', title: "Content Marketing & Copywriting", slug: 'content-marketing-copywriting', price: 2000, participationFee: 0, status: 'Publié', description: "Écrivez du contenu convaincant." },
  { id: 'developpement-personnel', title: "Développement Personnel", slug: 'developpement-personnel', price: 1500, participationFee: 0, status: 'Publié', description: "Boostez votre confiance et gérez votre temps." },
  { id: 'competences-pratiques', title: "Compétences Pratiques", slug: 'competences-pratiques', price: 1200, participationFee: 0, status: 'Publié', description: "Maîtrisez les outils informatiques essentiels." }
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
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.map(course => ({
          participationFee: 0,
          status: 'Publié',
          ...course
        }));
      }
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
  if (!course || getCourseTotalFee(course) <= 0) return;

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

function getAssignedCourseIds(profile = getStudentProfile()) {
  const raw = profile.assignedCourseIds || profile.assigned_course_ids;
  if (Array.isArray(raw)) return raw.filter(Boolean);
  const single = profile.assignedCourseId || profile.assigned_course_id;
  return single ? [single] : [];
}

function saveStudentLibrary(payload) {
  localStorage.setItem(STUDENT_LIBRARY_KEY, JSON.stringify(payload));
}

function getStudentLibrary() {
  try {
    const saved = localStorage.getItem(STUDENT_LIBRARY_KEY);
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function getStudentAccounts() {
  try {
    const saved = localStorage.getItem(STUDENT_ACCOUNTS_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Impossible de lire les comptes étudiants.', error);
    return [];
  }
}

function saveStudentAccount(account) {
  const accounts = getStudentAccounts();
  const sanitized = {
    fullName: account.fullName || '',
    email: account.email || '',
    phone: account.phone || '',
    password: account.password || '',
    assignedCourseIds: Array.isArray(account.assignedCourseIds) ? account.assignedCourseIds.filter(Boolean) : (account.assignedCourseId ? [account.assignedCourseId] : []),
    assignedCourseTitles: Array.isArray(account.assignedCourseTitles) ? account.assignedCourseTitles.filter(Boolean) : (account.assignedCourseTitle ? [account.assignedCourseTitle] : [])
  };
  const index = accounts.findIndex(item => item.email.toLowerCase() === sanitized.email.toLowerCase());
  if (index >= 0) {
    accounts[index] = { ...accounts[index], ...sanitized };
  } else {
    accounts.push(sanitized);
  }
  localStorage.setItem(STUDENT_ACCOUNTS_KEY, JSON.stringify(accounts));
  return sanitized;
}

function findStudentAccount(email, password) {
  return getStudentAccounts().find(account => account.email.toLowerCase() === email.toLowerCase() && account.password === password) || null;
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

function getPurchasedCourses() {
  const purchasedIds = getPurchasedCourseIds();
  const courses = getCourses();
  return purchasedIds
    .map(courseId => courses.find(course => course.id === courseId))
    .filter(course => course && getCourseTotalFee(course) > 0);
}

function getCourseById(courseId) {
  return getCourses().find(course => course.id === courseId) || null;
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
  const profile = dbProfile || getStudentProfile();
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
  const purchasedCourses = getPurchasedCourses();
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
  const content = getCourseContent(activeCourseId);
  const allItems = content.flatMap(section => section.items.map(item => ({ ...item, sectionTitle: section.title })));
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

  const assignments = allItems.filter(item => item.type === 'assignment' || item.type === 'devoir');
  const quizzes = allItems.filter(item => item.type === 'quiz');

  assignmentsPanel.innerHTML = assignments.length ? assignments.map(item => `
    <article class="student-task-card ${isDeadlinePassed(item.deadline_at) ? 'is-locked' : ''}">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.note || item.sectionTitle || 'Devoir du cours')}</p>
      <div class="student-task-meta">
        <span><i class="ti ti-calendar-time"></i> ${item.deadline_at ? formatDeadline(item.deadline_at) : 'Sans deadline'}</span>
      </div>
      <label class="student-upload-box ${isDeadlinePassed(item.deadline_at) ? 'is-locked' : ''}">
        <input type="file" ${isDeadlinePassed(item.deadline_at) ? 'disabled' : ''}>
        <span><i class="ti ti-upload"></i> Déposer le devoir</span>
      </label>
      <textarea placeholder="Ajoutez un commentaire" ${isDeadlinePassed(item.deadline_at) ? 'disabled' : ''}></textarea>
      <button type="button" class="btn-primary" ${isDeadlinePassed(item.deadline_at) ? 'disabled' : ''}>Soumettre le devoir</button>
    </article>
  `).join('') : '<p class="student-empty-section">Aucun devoir disponible pour le moment.</p>';

  quizPanel.innerHTML = quizzes.length ? quizzes.map(item => `
    <article class="student-task-card ${isDeadlinePassed(item.deadline_at) ? 'is-locked' : ''}">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.note || item.sectionTitle || 'Quiz du cours')}</p>
      <div class="student-task-meta">
        <span><i class="ti ti-bolt"></i> Points définis par l’admin</span>
        <span><i class="ti ti-calendar-time"></i> ${item.deadline_at ? formatDeadline(item.deadline_at) : 'Sans deadline'}</span>
      </div>
      <button type="button" class="btn-primary" ${isDeadlinePassed(item.deadline_at) ? 'disabled' : ''}>Commencer le quiz</button>
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
    const activities = getStudentActivity();
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
      .single();

    if (profileData) {
      const { data: assignedRows } = await supabase
        .from('student_courses')
        .select('course_id, courses(title)')
        .eq('student_id', session.user.id);

      const assignedCourseIds = (assignedRows || []).map(row => row.course_id).filter(Boolean);
      const assignedCourseTitles = (assignedRows || [])
        .map(row => row.courses?.title || row.course_title || '')
        .filter(Boolean);

      saveStudentProfile({
        fullName: profileData.full_name || session.user.user_metadata?.full_name || '',
        email: profileData.email || session.user.email,
        phone: profileData.phone || session.user.user_metadata?.phone || '',
        assignedCourseId: assignedCourseIds[0] || '',
        assignedCourseIds,
        assignedCourseTitle: assignedCourseTitles[0] || '',
        assignedCourseTitles
      });
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
    .single();

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

  const accounts = getStudentAccounts();
  const registrationsPromise = getRegistrationRecords();
  const combined = new Map();

  accounts.forEach(account => {
    combined.set((account.email || '').toLowerCase(), {
      fullName: account.fullName || '',
      email: account.email || '',
      phone: account.phone || '',
      assignedCourseTitles: account.assignedCourseTitles || [],
      source: 'Compte',
      studentId: account.profileId || account.id || ''
    });
  });

  registrationsPromise.then(registrations => {
    registrations.forEach(record => {
      const key = (record.email || '').toLowerCase();
      if (!combined.has(key)) {
        combined.set(key, {
          fullName: record.full_name || '',
          email: record.email || '',
          phone: record.phone || '',
          assignedCourseTitles: [record.course_title].filter(Boolean),
          source: 'Inscription',
          studentId: record.student_id || ''
        });
      }
    });

    const list = Array.from(combined.values());
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="5">Aucun étudiant chargé pour le moment.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(account => {
      const courseTitles = Array.isArray(account.assignedCourseTitles)
        ? account.assignedCourseTitles
        : account.assignedCourseTitle
          ? [account.assignedCourseTitle]
          : [];
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
  fillAdminCourseForm(getCourses().find(course => course.id === getActiveCourseId()));

  courseForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const titleInput = document.getElementById('courseTitle');
    const slugInput = document.getElementById('courseSlug');
    const priceInput = document.getElementById('coursePrice');
    const participationFeeInput = document.getElementById('courseParticipationFee');
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
    const selectedCourse = getCourses().find(course => course.id === button.dataset.selectCourse);
    fillAdminCourseForm(selectedCourse);
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

function initAdminStudentForm() {
  const form = document.getElementById('adminStudentForm');
  if (!form) return;

  populateAdminStudentCourseSelect();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const fullName = document.getElementById('studentFullNameAdmin')?.value.trim();
    const email = document.getElementById('studentEmailAdmin')?.value.trim();
    const phone = document.getElementById('studentPhoneAdmin')?.value.trim();
    const password = document.getElementById('studentPasswordAdmin')?.value.trim();
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
        assignedCourseIds: courseIds,
        assignedCourseTitles: courseTitles
      });

      saveStudentAccount({
        fullName,
        email,
        phone,
        password,
        assignedCourseIds: courseIds,
        assignedCourseTitles: courseTitles,
        profileId: studentProfileId || ''
      });

      saveStudentProfile({
        fullName,
        email,
        phone,
        assignedCourseId: courseIds[0],
        assignedCourseIds: courseIds,
        assignedCourseTitle: courseTitles[0],
        assignedCourseTitles: courseTitles,
        profileId: studentProfileId || ''
      });

      form.reset();
      populateAdminStudentCourseSelect();
      renderAdminStudentList();
      alert(`Compte étudiant créé et cours attribué: ${course.title}`);
    } catch (error) {
      console.error('Erreur création étudiant:', error);
      alert('Erreur inattendue lors de la création du compte étudiant.');
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
      const student = getStudentAccounts().find(account => account.email?.toLowerCase() === email.toLowerCase());
      const registrations = await getRegistrationRecords();
      const registration = registrations.find(record => record.email?.toLowerCase() === email.toLowerCase());
      const profile = getStudentProfile();
      const courseIds = profile.assignedCourseIds || profile.assigned_course_ids || [];
      const selectedCourses = prompt('IDs des cours à attribuer, séparés par des virgules', courseIds.join(', '));
      if (!selectedCourses) return;
      const nextCourseIds = selectedCourses.split(',').map(item => item.trim()).filter(Boolean);
      if (!nextCourseIds.length) return;

      await saveStudentToDatabase({
        fullName: student?.fullName || registration?.full_name || '',
        email,
        phone: student?.phone || registration?.phone || '',
        assignedCourseIds: nextCourseIds
      });

      saveStudentProfile({
        fullName: student?.fullName || registration?.full_name || '',
        email,
        phone: student?.phone || registration?.phone || '',
        assignedCourseIds: nextCourseIds
      });

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
          .single();
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
    const name = document.getElementById('contactName')?.value.trim() || 'Visiteur';
    const email = document.getElementById('contactEmail')?.value.trim() || '';
    const subject = document.getElementById('contactSubject')?.value.trim() || 'Contact URBVEC Academy';
    const message = document.getElementById('contactMessage')?.value.trim() || '';
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

    const localAccount = findStudentAccount(email, password);
    if (localAccount) {
      saveStudentProfile({
        fullName: localAccount.fullName,
        email: localAccount.email,
        phone: localAccount.phone,
        assignedCourseId: localAccount.assignedCourseId,
        assignedCourseTitle: localAccount.assignedCourseTitle
      });
      playLogoTransition('dashboard-etudiant.html');
      submitButton.disabled = false;
      submitButton.innerHTML = '<i class="ti ti-arrow-right"></i> Continuer';
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
        playLogoTransition('dashboard-etudiant.html');
        return;
      }

      if (data.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
      .select('is_admin,full_name,assigned_course_id,assigned_course_title')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Erreur lors de la récupération du profil:', profileError.message);
          alert('Erreur lors de la récupération du profil. Veuillez réessayer.');
          await supabase.auth.signOut(); // Log out the user if profile check fails for security
          return;
        }

        saveStudentProfile({
          fullName: profileData?.full_name || data.user.user_metadata?.full_name || '',
          email,
        phone: profileData?.phone || data.user?.user_metadata?.phone || '',
          assignedCourseId: profileData?.assigned_course_id || '',
          assignedCourseTitle: profileData?.assigned_course_title || ''
        });

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
      .select('is_admin,assigned_course_id,assigned_course_title')
      .eq('id', session.user.id)
      .single();

    if (profileData) {
      saveStudentProfile({
        email: session.user.email || '',
        assignedCourseId: profileData.assigned_course_id || '',
        assignedCourseTitle: profileData.assigned_course_title || ''
      });
    }

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

  paidDashboard.addEventListener('click', (event) => {
    const button = event.target.closest('[data-paid-course]');
    if (!button) return;
    renderPaidStudentDashboard(button.dataset.paidCourse);
    showView('courses');
    toggleMenu(false);
  });

  paidDashboard.addEventListener('click', (event) => {
    const submitAssignmentButton = event.target.closest('#paidCourseAssignmentsPanel .student-task-card .btn-primary');
    if (!submitAssignmentButton) return;
    const card = submitAssignmentButton.closest('.student-task-card');
    const title = card?.querySelector('h3')?.textContent || 'Devoir';
    saveLocalAssignmentRecord({
      title,
      student: getStudentProfile().fullName || getStudentProfile().email || 'Étudiant',
      submitted_at: new Date().toISOString()
    });
    renderAdminOverviewStats();
    renderAdminPaymentsTable();
    showRegistrationNotice('Devoir envoyé. L’admin le verra dans son tableau de bord.', 'success');
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
      localStorage.removeItem(STUDENT_PROFILE_KEY);
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
  initContactForm();
  initRegistrationForm();
  initAiCourseQuiz();
  renderStudentCourseOutline();

  // Initialisations spécifiques à la page d'administration
  // Elles ne s'exécutent que si l'élément '.admin-sidebar' est présent dans le DOM
  if (document.querySelector('.admin-sidebar')) {
    initAdminTabs();
    initAdminCourses();
    initAdminCourseBuilder();
    renderAdminStudentList();
    renderAdminOverviewStats();
    renderAdminPaymentsTable();
    renderAdminAssignmentsTable();
    populateAssignmentCourseSelect();
    initAdminStudentActions();
  }
  initOnlineLoginForm();
  initAdminStudentForm();
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
