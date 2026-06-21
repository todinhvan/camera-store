export function initStickyHeader(
  header,
  {
    threshold = 40,
    shrinkAdd = [],
    shrinkRemove = [],
    expandAdd = [],
    expandRemove = [],
  } = {},
) {
  if (!header) {
    return;
  }

  const updateState = () => {
    const isShrunk = window.scrollY > threshold;

    header.classList.toggle("is-scrolled", isShrunk);

    shrinkAdd.forEach((className) => {
      header.classList.toggle(className, isShrunk);
    });

    shrinkRemove.forEach((className) => {
      header.classList.toggle(className, !isShrunk);
    });

    expandAdd.forEach((className) => {
      header.classList.toggle(className, !isShrunk);
    });

    expandRemove.forEach((className) => {
      header.classList.toggle(className, isShrunk);
    });
  };

  updateState();
  window.addEventListener("scroll", updateState, { passive: true });
}

export function initMobileMenu({
  button = document.getElementById("mobile-menu-btn"),
  menu = document.getElementById("mobile-menu"),
} = {}) {
  if (!button || !menu) {
    return;
  }

  let isOpen = false;

  const render = () => {
    menu.classList.toggle("translate-x-full", !isOpen);
    button.innerHTML = `<span class="material-symbols-outlined">${
      isOpen ? "close" : "menu"
    }</span>`;
    button.setAttribute("aria-expanded", String(isOpen));
  };

  render();

  button.addEventListener("click", () => {
    isOpen = !isOpen;
    render();
  });
}

export function initCouponCopy(root = document) {
  const buttons = root.querySelectorAll("[data-copy-coupon]");

  const writeText = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (error) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand("copy");
        document.body.removeChild(textarea);
        return copied;
      } catch {
        return false;
      }
    }
  };

  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      const code = button.dataset.copyCoupon;
      const originalContent = button.innerHTML;
      const copied = await writeText(code);

      if (!copied) {
        return;
      }

      button.innerHTML =
        '<span class="font-bold">Copied!</span> <span class="material-symbols-outlined text-[16px]">check</span>';
      button.classList.add("is-copied");

      window.setTimeout(() => {
        button.innerHTML = originalContent;
        button.classList.remove("is-copied");
      }, 2000);
    });
  });
}

export function initHeroSlider({
  rootSelector,
  slideSelector = ".hero-slide",
  dotSelector = ".slider-dot",
  interval = 5000,
  pauseOnHover = false,
} = {}) {
  const root = rootSelector ? document.querySelector(rootSelector) : document;
  if (!root) return;
  
  const slides = Array.from(root.querySelectorAll(slideSelector));
  const dots = Array.from(root.querySelectorAll(dotSelector));

  if (slides.length === 0) return;

  let currentSlide = 0;
  let timerId = null;

  const showSlide = (index) => {
    // Calculate wrapping index
    currentSlide = (index + slides.length) % slides.length;

    // Update slides visibility
    slides.forEach((slide, i) => {
      const isActive = i === currentSlide;
      if (isActive) {
        slide.classList.remove("opacity-0", "z-0");
        slide.classList.add("opacity-100", "z-10");
        slide.style.opacity = "";
        slide.style.zIndex = "";
      } else {
        slide.classList.remove("opacity-100", "z-10");
        slide.classList.add("opacity-0", "z-0");
        slide.style.opacity = "";
        slide.style.zIndex = "";
      }
      slide.setAttribute("aria-hidden", String(!isActive));
    });

    // Update dots state
    dots.forEach((dot, i) => {
      const isActive = i === currentSlide;
      dot.classList.toggle("bg-primary", isActive);
      dot.classList.toggle("bg-outline-variant", !isActive);
      dot.setAttribute("aria-pressed", String(isActive));
    });
  };

  const nextSlide = () => {
    showSlide(currentSlide + 1);
  };

  const startTimer = () => {
    stopTimer();
    if (slides.length > 1) {
      timerId = window.setInterval(nextSlide, interval);
    }
  };

  const stopTimer = () => {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }
  };

  // 1. Click dot to banner
  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      showSlide(index);
      // Reset timer so it doesn't immediately rotate again
      startTimer(); 
    });
  });

  // 2. Hover pause rotate
  if (pauseOnHover && root instanceof HTMLElement) {
    root.addEventListener("mouseenter", stopTimer);
    root.addEventListener("mouseleave", startTimer);
    
    // Accessibility: Pause when keyboard focusing on dots
    root.addEventListener("focusin", stopTimer);
    root.addEventListener("focusout", startTimer);
  }

  // 3. Swipe / Drag support
  let startX = 0;
  let isDragging = false;

  const handleDragStart = (e) => {
    isDragging = true;
    startX = e.type.includes("mouse") ? e.pageX : e.touches[0].clientX;
    stopTimer();
  };

  const handleDragEnd = (e) => {
    if (!isDragging) return;
    isDragging = false;
    const endX = e.type.includes("mouse") ? e.pageX : e.changedTouches[0].clientX;
    const diff = startX - endX;

    // Minimum swipe distance threshold
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        showSlide(currentSlide + 1); // Swipe left -> Next slide
      } else {
        showSlide(currentSlide - 1); // Swipe right -> Previous slide
      }
    }
    
    // Start timer again if we're not currently hovered (or if pauseOnHover is false)
    if (!pauseOnHover || !root.matches(':hover')) {
        startTimer();
    }
  };

  root.addEventListener("mousedown", handleDragStart);
  root.addEventListener("touchstart", handleDragStart, { passive: true });
  root.addEventListener("mouseup", handleDragEnd);
  root.addEventListener("touchend", handleDragEnd);
  root.addEventListener("mouseleave", (e) => {
    if (isDragging) {
       // Simulate end at the boundary
       handleDragEnd(new MouseEvent("mouseup", { pageX: e.pageX }));
    } else {
       // The original mouseleave logic
       if (pauseOnHover) startTimer();
    }
  });

  // 4. Auto-rotate Start
  showSlide(0);
  startTimer();
}

export function initMockForm({
  formSelector = "form",
  loadingLabel = "Sending...",
  successLabel = "Message Sent",
} = {}) {
  const form = document.querySelector(formSelector);

  if (!form) {
    return;
  }

  const button = form.querySelector('button[type="submit"], button');
  let isSubmitting = false;

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!button || isSubmitting) {
      return;
    }

    isSubmitting = true;
    const originalContent = button.innerHTML;
    button.innerHTML = `<span class="material-symbols-outlined ui-spin">sync</span> ${loadingLabel}`;
    button.disabled = true;

    window.setTimeout(() => {
      button.innerHTML = `<span class="material-symbols-outlined">check_circle</span> ${successLabel}`;
      button.classList.replace("bg-secondary", "bg-green-600");

      window.setTimeout(() => {
        button.innerHTML = originalContent;
        button.classList.replace("bg-green-600", "bg-secondary");
        button.disabled = false;
        isSubmitting = false;
        form.reset();
      }, 3000);
    }, 1500);
  };

  form.addEventListener("submit", handleSubmit);

  if (button) {
    button.addEventListener("click", handleSubmit);
  }
}

export function initParallax({
  selector = "[data-parallax-map]",
  rate = 0.05,
} = {}) {
  const element = document.querySelector(selector);

  if (!element) {
    return;
  }

  const updatePosition = () => {
    element.style.transform = `translateY(${window.pageYOffset * rate}px)`;
  };

  window.addEventListener("scroll", updatePosition, { passive: true });
}
