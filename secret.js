(() => {
  const trigger = document.querySelector('#open-code');
  const gate = document.querySelector('#code-gate');
  const form = document.querySelector('#code-form');
  const field = document.querySelector('#access-code');
  const feedback = document.querySelector('#code-feedback');
  const submit = document.querySelector('#unlock-game');
  const shell = document.querySelector('#game-shell');
  const portfolio = [document.querySelector('.site-header'), document.querySelector('#main'), document.querySelector('.skip-link')];
  let generation = 0;
  let savedScroll = 0;
  let frame;
  let failedAttempts = 0;
  let lockedUntil = 0;
  const bytes = value => Uint8Array.from(atob(value), char => char.charCodeAt(0));

  trigger.addEventListener('click', () => {
    closeMenu();
    feedback.textContent = '';
    feedback.className = '';
    gate.showModal();
    document.body.classList.add('dialog-open');
    field.focus();
  });
  gate.querySelector('.gate-close').addEventListener('click', () => gate.close());
  gate.addEventListener('close', () => {
    generation++;
    form.reset();
    field.type = 'password';
    submit.disabled = false;
    submit.textContent = 'Débloquer le jeu →';
    document.body.classList.remove('dialog-open');
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled) return;
    if (Date.now() < lockedUntil) {
      feedback.className = 'error';
      feedback.textContent = 'Trop de tentatives. Réessaie dans quelques secondes.';
      return;
    }
    const attempt = ++generation;
    submit.disabled = true;
    submit.textContent = 'Déchiffrement…';
    feedback.className = '';
    feedback.textContent = 'Ouverture du passage secret…';
    try {
      if (!globalThis.crypto?.subtle) throw new Error('HTTPS est nécessaire pour ouvrir le jeu.');
      const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(field.value), 'PBKDF2', false, ['deriveKey']);
      field.value = '';
      const response = await fetch('assets/mission-reseau.enc.json?v=2', { cache: 'no-store' });
      if (!response.ok) throw new Error('Le jeu est indisponible. Réessaie dans un instant.');
      const encrypted = await response.json();
      if (encrypted.version !== 1 || encrypted.iterations !== 600000 || encrypted.algorithm !== 'AES-GCM') throw new Error('Version du jeu non reconnue. Actualise la page.');
      const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: bytes(encrypted.salt), iterations: encrypted.iterations, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
      const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(encrypted.iv), tagLength: 128 }, key, bytes(encrypted.ciphertext));
      if (attempt !== generation || !gate.open) return;
      savedScroll = scrollY;
      frame = document.createElement('iframe');
      frame.title = 'Mission Réseau — mini-jeu du portfolio';
      // No same-origin privilege, navigation, popups, storage or network access.
      frame.setAttribute('sandbox', 'allow-scripts');
      frame.srcdoc = new TextDecoder().decode(plaintext);
      new Uint8Array(plaintext).fill(0);
      gate.close();
      portfolio.forEach(element => { element.hidden = true; });
      shell.replaceChildren(frame);
      shell.hidden = false;
      document.body.classList.add('secret-world');
      document.title = 'Mission Réseau — Adam Giuglardo';
      frame.addEventListener('load', () => frame.focus(), { once: true });
    } catch (error) {
      if (attempt !== generation || !gate.open) return;
      feedback.className = 'error';
      failedAttempts += 1;
      if (failedAttempts >= 5) { lockedUntil = Date.now() + 30000; failedAttempts = 0; }
      feedback.textContent = error.name === 'OperationError' ? 'Code refusé.' : 'Impossible d’ouvrir le passage secret pour le moment.';
      field.value = '';
      field.focus();
    } finally {
      if (attempt === generation) {
        submit.disabled = false;
        submit.textContent = 'Débloquer le jeu →';
      }
    }
  });

  addEventListener('message', event => {
    if (!frame || event.source !== frame.contentWindow || event.origin !== 'null' || event.data?.type !== 'portfolio:return') return;
    frame.remove();
    frame = undefined;
    shell.hidden = true;
    portfolio.forEach(element => { element.hidden = false; });
    document.body.classList.remove('secret-world');
    document.title = 'Adam Giuglardo — Réseaux & Télécommunications';
    scrollTo({ top: savedScroll, behavior: 'instant' });
    trigger.focus({ preventScroll: true });
    queueReadingPosition();
  });
})();
