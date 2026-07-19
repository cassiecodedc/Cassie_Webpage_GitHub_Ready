const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");

const syncHeader = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 18);
};

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

if (nav && navToggle && header) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    document.body.classList.toggle("nav-open", isOpen);
    header.classList.toggle("nav-active", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      nav.classList.remove("is-open");
      document.body.classList.remove("nav-open");
      header.classList.remove("nav-active");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

const stopFeatureMedia = (feature) => {
  if (!(feature instanceof Element)) return;

  feature.querySelectorAll("video").forEach((media) => {
    media.pause();
    media.muted = true;
  });

  feature.querySelectorAll(".mock-sound, .mock-ig-sound").forEach((button) => {
    button.textContent = "Listen";
    button.setAttribute("aria-label", button.classList.contains("mock-ig-sound") ? "Listen to posted reel" : "Listen to reel");
  });

  feature.querySelectorAll("iframe").forEach((frame) => {
    const currentSrc = frame.getAttribute("src");
    if (!currentSrc) return;
    frame.setAttribute("src", currentSrc);
  });
};

const clearActiveFeatures = (exceptFeature = null) => {
  document.querySelectorAll(".social-feature.is-active").forEach((activeFeature) => {
    if (activeFeature === exceptFeature) return;
    activeFeature.classList.remove("is-active");
    stopFeatureMedia(activeFeature);
  });
};

const isPointerInsideActivePhone = (event) => {
  if (!(event instanceof PointerEvent || event instanceof MouseEvent)) return false;

  return Array.from(document.querySelectorAll(".social-feature.is-active .social-phone")).some((phone) => {
    const phoneBounds = phone.getBoundingClientRect();
    return (
      phoneBounds.width > 0 &&
      event.clientX >= phoneBounds.left &&
      event.clientX <= phoneBounds.right &&
      event.clientY >= phoneBounds.top &&
      event.clientY <= phoneBounds.bottom
    );
  });
};

document.querySelectorAll("[data-phone-demo]").forEach((demo) => {
  const replayButton = demo.querySelector(".mock-replay");
  const soundButton = demo.querySelector(".mock-sound");
  const postedSoundButton = demo.querySelector(".mock-ig-sound");
  const video = demo.querySelector(".mock-video");
  const postedVideo = demo.querySelector(".mock-ig-video");
  const caption = demo.querySelector(".mock-caption");
  const feature = demo.closest(".social-feature");
  const trigger = feature?.querySelector(".social-copy");
  const row = feature?.querySelector(".social-row");
  const phone = feature?.querySelector(".social-phone");
  let typingTimer;
  let shareTimer;
  let sharedTimer;
  let hasTyped = false;
  let isPhoneLocked = false;

  const syncSoundButtons = (isMuted) => {
    if (soundButton) {
      soundButton.textContent = isMuted ? "Listen" : "Sound on";
      soundButton.setAttribute("aria-label", isMuted ? "Listen to reel" : "Mute reel");
    }

    if (postedSoundButton) {
      postedSoundButton.textContent = isMuted ? "Listen" : "Sound on";
      postedSoundButton.setAttribute("aria-label", isMuted ? "Listen to posted reel" : "Mute posted reel");
    }
  };

  const keepDemoActive = () => {
    if (!feature) return;

    clearActiveFeatures(feature);
    feature.classList.add("is-active");
    isPhoneLocked = true;
  };

  const keepPlaying = (media) => {
    if (!(media instanceof HTMLVideoElement)) return;

    media.classList.add("has-source");
    media.play().catch(() => {});
  };

  const playVideo = async () => {
    if (!(video instanceof HTMLVideoElement)) return;

    try {
      demo.classList.add("is-playing");
      video.classList.add("has-source");
      video.muted = true;
      video.currentTime = 0;
      const playPromise = video.play();
      if (playPromise) await playPromise;

      if (postedVideo instanceof HTMLVideoElement) {
        postedVideo.classList.add("has-source");
        postedVideo.muted = video.muted;
        if (postedVideo.readyState < 2) {
          postedVideo.load();
        }
      }
    } catch {
      demo.classList.add("is-playing");
      video.classList.add("has-source");
    }
  };

  const prepareDraftVideo = () => {
    if (video instanceof HTMLVideoElement) {
      video.classList.add("has-source");
      video.muted = true;
      video.pause();
      try {
        video.currentTime = 0;
      } catch {
        // Some browsers do not allow seeking until metadata is ready.
      }
    }

    if (postedVideo instanceof HTMLVideoElement) {
      postedVideo.classList.add("has-source");
      postedVideo.muted = true;
      postedVideo.pause();
      try {
        postedVideo.currentTime = 0;
      } catch {
        // Some browsers do not allow seeking until metadata is ready.
      }
    }

    syncSoundButtons(true);
  };

  const runShareSequence = () => {
    window.clearTimeout(shareTimer);
    window.clearTimeout(sharedTimer);

    shareTimer = window.setTimeout(() => {
      demo.classList.add("is-ready-share", "is-clicking-share");
    }, 900);

    sharedTimer = window.setTimeout(() => {
      demo.classList.remove("is-clicking-share");

      if (postedVideo instanceof HTMLVideoElement) {
        postedVideo.classList.add("has-source");
        postedVideo.muted = true;
        try {
          postedVideo.currentTime = 0;
        } catch {
          postedVideo.currentTime = 0;
        }
        postedVideo.play().catch(() => {});
        if (video instanceof HTMLVideoElement) {
          video.pause();
        }
      }

      demo.classList.add("is-shared");
    }, 2100);
  };

  const typeCaption = async () => {
    if (!(caption instanceof HTMLElement) || hasTyped) return;

    const text = caption.dataset.caption || "";
    let index = 0;
    hasTyped = true;
    caption.textContent = "";
    window.clearInterval(typingTimer);
    prepareDraftVideo();

    typingTimer = window.setInterval(() => {
      caption.textContent = text.slice(0, index);
      index += 1;

      if (index > text.length) {
        window.clearInterval(typingTimer);
        runShareSequence();
      }
    }, 34);
  };

  if (feature && trigger && row instanceof HTMLElement && phone instanceof HTMLElement) {
    const movePhone = (event) => {
      const phoneBounds = phone.getBoundingClientRect();
      const nearPhone =
        phoneBounds.width > 0 &&
        event.clientX >= phoneBounds.left - 34 &&
        event.clientX <= phoneBounds.right + 34 &&
        event.clientY >= phoneBounds.top - 34 &&
        event.clientY <= phoneBounds.bottom + 34;

      if (isPhoneLocked && nearPhone) return;
      if (isPhoneLocked && !nearPhone) {
        isPhoneLocked = false;
      }
      if (!isPhoneLocked && nearPhone) {
        isPhoneLocked = true;
        return;
      }

      const featureBounds = feature.getBoundingClientRect();
      const rowBounds = row.getBoundingClientRect();
      const phoneX = Math.min(
        Math.max(event.clientX - featureBounds.left + 230, 170),
        featureBounds.width - 145
      );
      const phoneY = Math.min(
        Math.max(event.clientY - featureBounds.top, rowBounds.top - featureBounds.top + 130),
        rowBounds.bottom - featureBounds.top - 130
      );

      feature.style.setProperty("--phone-x", `${phoneX}px`);
      feature.style.setProperty("--phone-y", `${phoneY}px`);
    };

    const activateFeature = (event) => {
      if (isPointerInsideActivePhone(event) && !feature.classList.contains("is-active")) return;

      clearActiveFeatures(feature);
      feature.classList.add("is-active");
      if (event instanceof PointerEvent || event instanceof MouseEvent) {
        movePhone(event);
      }
      typeCaption();
      if (hasTyped && demo.classList.contains("is-shared") && postedVideo instanceof HTMLVideoElement) {
        postedVideo.play().catch(() => {});
      }
    };

    const deactivateFeature = () => {
      isPhoneLocked = false;
      feature.classList.remove("is-active");
      stopFeatureMedia(feature);
    };

    const deactivateUnlessEnteringPhone = (event) => {
      if (event.relatedTarget instanceof Node && phone.contains(event.relatedTarget)) {
        isPhoneLocked = true;
        return;
      }

      deactivateFeature();
    };

    row.addEventListener("pointerenter", activateFeature);
    row.addEventListener("pointermove", movePhone);
    row.addEventListener("pointerleave", deactivateUnlessEnteringPhone);
    row.addEventListener("mouseenter", activateFeature);
    row.addEventListener("mousemove", movePhone);
    row.addEventListener("mouseleave", deactivateUnlessEnteringPhone);

    phone.addEventListener("pointerenter", () => {
      clearActiveFeatures(feature);
      isPhoneLocked = true;
      feature.classList.add("is-active");
    });

    phone.addEventListener("pointerleave", (event) => {
      isPhoneLocked = false;
      if (event.relatedTarget instanceof Node && row.contains(event.relatedTarget)) {
        feature.classList.add("is-active");
        return;
      }

      deactivateFeature();
    });

    trigger.addEventListener("focusin", () => {
      feature.classList.add("is-active");
      typeCaption();
    });

    trigger.addEventListener("focusout", () => {
      feature.classList.remove("is-active");
      stopFeatureMedia(feature);
    });
  }

  if (window.matchMedia("(max-width: 900px)").matches) {
    window.setTimeout(typeCaption, 700);
  }

  if (video instanceof HTMLVideoElement) {
    video.addEventListener("loadedmetadata", () => {
      video.classList.add("has-source");
    });

    video.addEventListener("error", () => {
      video.classList.remove("has-source");
    });
  }

  if (postedVideo instanceof HTMLVideoElement) {
    postedVideo.addEventListener("loadedmetadata", () => {
      postedVideo.classList.add("has-source");
    });
    postedVideo.load();
  }

  replayButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    keepDemoActive();
    playVideo();
  });

  soundButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!(video instanceof HTMLVideoElement)) return;

    keepDemoActive();
    video.muted = !video.muted;
    if (postedVideo instanceof HTMLVideoElement) {
      postedVideo.muted = video.muted;
    }
    syncSoundButtons(video.muted);
    keepPlaying(video);
    keepPlaying(postedVideo);
  });

  postedSoundButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!(postedVideo instanceof HTMLVideoElement)) return;

    keepDemoActive();
    postedVideo.muted = !postedVideo.muted;
    if (video instanceof HTMLVideoElement) {
      video.muted = postedVideo.muted;
    }
    syncSoundButtons(postedVideo.muted);
    keepPlaying(postedVideo);
  });
});

document.querySelectorAll(".social-feature-video").forEach((feature) => {
  feature.addEventListener("pointerenter", (event) => {
    if (isPointerInsideActivePhone(event) && !feature.classList.contains("is-active")) return;

    clearActiveFeatures(feature);
    feature.classList.add("is-active");
  });

  feature.addEventListener("pointerleave", () => {
    feature.classList.remove("is-active");
    stopFeatureMedia(feature);
  });
});

document.querySelectorAll("[data-newspaper-carousel]").forEach((section) => {
  const papers = Array.from(section.querySelectorAll(".newspaper-sheet"));
  const previousButton = section.querySelector("[data-newspaper-prev]");
  const nextButton = section.querySelector("[data-newspaper-next]");
  let ticking = false;
  let hoverProgress = null;
  let hoverTarget = null;
  let hoverTimer;

  const getScrollProgress = () => {
    const rect = section.getBoundingClientRect();
    const scrollRange = Math.max(rect.height - window.innerHeight, 1);
    return Math.min(Math.max((0 - rect.top) / scrollRange, 0), 1);
  };

  const getCurrentIndex = () => {
    const maxIndex = Math.max(papers.length - 1, 1);
    return Math.min(Math.round(hoverProgress ?? getScrollProgress() * maxIndex), papers.length - 1);
  };

  const updateNewspaperCarousel = () => {
    const maxIndex = Math.max(papers.length - 1, 1);
    const progress = hoverProgress ?? getScrollProgress() * maxIndex;
    const activeIndex = Math.min(Math.round(progress), papers.length - 1);

    section.style.setProperty("--paper-shift", progress.toFixed(3));
    section.style.setProperty("--paper-progress", (progress / maxIndex).toFixed(3));
    papers.forEach((paper, index) => {
      paper.classList.toggle("is-current", index === activeIndex);
    });

    ticking = false;
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateNewspaperCarousel);
  };

  updateNewspaperCarousel();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);

  const setManualPaper = (direction) => {
    const maxIndex = Math.max(papers.length - 1, 1);
    hoverProgress = Math.min(Math.max(getCurrentIndex() + direction, 0), maxIndex);
    hoverTarget = hoverProgress;
    window.clearTimeout(hoverTimer);
    requestUpdate();
  };

  previousButton?.addEventListener("click", () => setManualPaper(-1));
  nextButton?.addEventListener("click", () => setManualPaper(1));

  section.addEventListener("pointermove", (event) => {
    const rect = section.getBoundingClientRect();
    const localX = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
    const maxIndex = Math.max(papers.length - 1, 1);
    const activeIndex = getCurrentIndex();
    let nextTarget = activeIndex;

    if (localX > rect.width * 0.82) {
      nextTarget = Math.min(activeIndex + 1, maxIndex);
    } else if (localX < rect.width * 0.18) {
      nextTarget = Math.max(activeIndex - 1, 0);
    }

    if (nextTarget === activeIndex) {
      hoverTarget = null;
      window.clearTimeout(hoverTimer);
      return;
    }

    if (hoverTarget !== nextTarget) {
      hoverTarget = nextTarget;
      window.clearTimeout(hoverTimer);
      hoverTimer = window.setTimeout(() => {
        hoverProgress = hoverTarget;
        requestUpdate();
      }, 620);
    }
  });

  section.addEventListener("pointerleave", () => {
    window.clearTimeout(hoverTimer);
    hoverTarget = null;
    hoverProgress = null;
    requestUpdate();
  });
});

document.querySelectorAll("[data-swarovski-carousel]").forEach((section) => {
  const cards = Array.from(section.querySelectorAll(".swarovski-right-card"));
  const previousButton = section.querySelector("[data-swarovski-prev]");
  const nextButton = section.querySelector("[data-swarovski-next]");
  let activeIndex = 0;

  const updateSwarovskiCarousel = () => {
    section.dataset.activeCard = String(activeIndex);
    cards.forEach((card, index) => {
      card.classList.toggle("is-current", index === activeIndex);
      card.classList.toggle("is-before", index < activeIndex);
      card.classList.toggle("is-after", index > activeIndex);
    });
  };

  updateSwarovskiCarousel();

  previousButton?.addEventListener("click", () => {
    activeIndex = (activeIndex - 1 + cards.length) % cards.length;
    updateSwarovskiCarousel();
  });

  nextButton?.addEventListener("click", () => {
    activeIndex = (activeIndex + 1) % cards.length;
    updateSwarovskiCarousel();
  });
});
