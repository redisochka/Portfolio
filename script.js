const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
const navLinks = document.querySelectorAll('.nav a');

if (burger && nav) {
  burger.addEventListener('click', () => {
    const opened = nav.classList.toggle('is-open');
    burger.classList.toggle('is-open', opened);
    burger.setAttribute('aria-expanded', String(opened));
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', (event) => {
    const clickedInsideMenu = nav.contains(event.target) || burger.contains(event.target);

    if (!clickedInsideMenu) {
      nav.classList.remove('is-open');
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });
}

const desktopQuery = window.matchMedia('(min-width: 861px)');
const copyItems = Array.from(document.querySelectorAll('[data-project-copy]'));
const visualCards = Array.from(document.querySelectorAll('.project-visual-card[data-project-index]'));
let activeIndex = 0;
let observer = null;

const stickyCopy = document.querySelector('.projects-showcase__sticky');

function updateDimmedProjects(index) {
  visualCards.forEach((card, cardIndex) => {
    card.classList.toggle('is-dimmed', cardIndex !== index);
  });
}

function syncStickyHeight(index = activeIndex) {
  if (!stickyCopy || !desktopQuery.matches || !visualCards.length) {
    if (stickyCopy) stickyCopy.style.removeProperty('--sticky-copy-height');
    return;
  }

  const currentCard = visualCards[index] || visualCards[0];
  if (!currentCard) return;

  const nextHeight = Math.round(currentCard.getBoundingClientRect().height);
  if (nextHeight > 0) {
    stickyCopy.style.setProperty('--sticky-copy-height', `${nextHeight}px`);
  }
}


let projectSwapTimer = null;

function setActiveProject(index) {
  if (!copyItems.length) return;

  const safeIndex = Math.max(0, Math.min(index, copyItems.length - 1));
  const currentItem = copyItems[activeIndex];
  const nextItem = copyItems[safeIndex];

  if (!currentItem || !nextItem) return;

  if (safeIndex === activeIndex && nextItem.classList.contains('is-active')) {
    syncStickyHeight(safeIndex);
    updateDimmedProjects(safeIndex);
    return;
  }

  clearTimeout(projectSwapTimer);

  copyItems.forEach((item, itemIndex) => {
    if (itemIndex !== activeIndex) {
      item.classList.remove('is-active', 'is-leaving');
    }
  });

  currentItem.classList.remove('is-active');
  currentItem.classList.add('is-leaving');

  projectSwapTimer = setTimeout(() => {
    currentItem.classList.remove('is-leaving');
    activeIndex = safeIndex;
    nextItem.classList.add('is-active');
    syncStickyHeight(safeIndex);
    updateDimmedProjects(safeIndex);
  }, 190);
}

function destroyObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

function createObserver() {
  destroyObserver();

  if (!desktopQuery.matches || !visualCards.length) {
    setActiveProject(0);
    syncStickyHeight(0);
    return;
  }

  const ratioMap = new Map(visualCards.map((card, index) => [index, index === activeIndex ? 1 : 0]));

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const index = Number(entry.target.dataset.projectIndex || 0);
      ratioMap.set(index, entry.isIntersecting ? entry.intersectionRatio : 0);
    });

    let bestIndex = activeIndex;
    let bestRatio = ratioMap.get(activeIndex) || 0;

    ratioMap.forEach((ratio, index) => {
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestIndex = index;
      }
    });

    // do not switch too early: wait until the next card clearly dominates
    if (bestIndex !== activeIndex && bestRatio >= 0.58) {
      setActiveProject(bestIndex);
    } else if (bestIndex === activeIndex) {
      syncStickyHeight(activeIndex);
      updateDimmedProjects(activeIndex);
    }
  }, {
    threshold: [0.2, 0.35, 0.5, 0.58, 0.7, 0.82],
    rootMargin: '-18% 0px -18% 0px'
  });

  visualCards.forEach((card) => observer.observe(card));
  setActiveProject(0);
}

if (desktopQuery.addEventListener) {
  desktopQuery.addEventListener('change', createObserver);
} else if (desktopQuery.addListener) {
  desktopQuery.addListener(createObserver);
}

window.addEventListener('load', createObserver);
window.addEventListener('resize', createObserver);
createObserver();

window.addEventListener('load', () => syncStickyHeight(activeIndex));
window.addEventListener('resize', () => syncStickyHeight(activeIndex));

let lastScroll = window.pageYOffset;
const header = document.querySelector('.header');
const scrollThreshold = 10;

window.addEventListener('scroll', () => {
  if (!header) return;

  const currentScroll = window.pageYOffset;

  if (Math.abs(currentScroll - lastScroll) < scrollThreshold) return;

  if (currentScroll <= 20) {
    header.classList.remove('hide');
    lastScroll = currentScroll;
    return;
  }

  if (currentScroll > lastScroll && currentScroll > 100) {
    header.classList.add('hide');
  } else {
    header.classList.remove('hide');
  }

  lastScroll = currentScroll;
});


document.querySelectorAll('[data-copy]').forEach((link) => {
  link.addEventListener('click', async (event) => {
    event.preventDefault();

    const value = link.getAttribute('data-copy');
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
    } catch (error) {
      const tempInput = document.createElement('input');
      tempInput.value = value;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      tempInput.remove();
    }
  });
});


document.addEventListener('click', async (event) => {
  const link = event.target.closest('[data-copy]');
  if (!link) return;

  event.preventDefault();

  const value = link.getAttribute('data-copy');
  if (!value) return;

  try {
    await navigator.clipboard.writeText(value);
  } catch (error) {
    const tempInput = document.createElement('input');
    tempInput.value = value;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    tempInput.remove();
  }
});


const detailBlocks = Array.from(document.querySelectorAll('[data-detail-block]'));
const detailItems = Array.from(document.querySelectorAll('[data-detail-stage]'));
let detailObserver = null;

function setDetailStage(stage) {
  detailBlocks.forEach((block, index) => {
    const blockStage = Number(block.dataset.detailBlock || index + 1);
    block.classList.toggle('is-visible', blockStage === stage);
  });
}

function destroyDetailObserver() {
  if (detailObserver) {
    detailObserver.disconnect();
    detailObserver = null;
  }
}

let currentVisibleDetailStage = 1;
let detailStageCommitTimer = null;

function createDetailObserver() {
  destroyDetailObserver();
  clearTimeout(detailStageCommitTimer);

  if (!detailBlocks.length || !detailItems.length) return;

  if (!desktopQuery.matches) {
    detailBlocks.forEach((block) => block.classList.add('is-visible'));
    return;
  }

  currentVisibleDetailStage = 1;
  setDetailStage(1);

  const ratioMap = new Map();
  detailItems.forEach((item) => {
    ratioMap.set(Number(item.dataset.detailStage || 1), 0);
  });

  detailObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const stage = Number(entry.target.dataset.detailStage || 1);
      ratioMap.set(stage, entry.isIntersecting ? entry.intersectionRatio : 0);
    });

    let candidateStage = currentVisibleDetailStage;
    let candidateRatio = ratioMap.get(currentVisibleDetailStage) || 0;

    ratioMap.forEach((ratio, stage) => {
      if (ratio > candidateRatio) {
        candidateRatio = ratio;
        candidateStage = stage;
      }
    });

    const currentRatio = ratioMap.get(currentVisibleDetailStage) || 0;
    const dominance = candidateRatio - currentRatio;

    if (
      candidateStage !== currentVisibleDetailStage &&
      candidateRatio >= 0.5 &&
      dominance >= 0.12
    ) {
      clearTimeout(detailStageCommitTimer);
      detailStageCommitTimer = setTimeout(() => {
        currentVisibleDetailStage = candidateStage;
        setDetailStage(candidateStage);
      }, 110);
    }
  }, {
    threshold: [0.24, 0.36, 0.48, 0.58, 0.68, 0.8],
    rootMargin: '-6% 0px -16% 0px'
  });

  detailItems.forEach((item) => detailObserver.observe(item));
}

createDetailObserver();
desktopQuery.addEventListener('change', createDetailObserver);



const scrollUpBtn = document.querySelector('.scroll-up-btn');

if (scrollUpBtn) {
  const toggleScrollUpBtn = () => {
    scrollUpBtn.classList.toggle('is-visible', window.scrollY > 500);
  };

  toggleScrollUpBtn();
  window.addEventListener('scroll', toggleScrollUpBtn, { passive: true });

  scrollUpBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}



document.addEventListener('click', (event) => {
  const upBtn = event.target.closest('.scroll-up-btn');
  if (!upBtn) return;

  event.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
