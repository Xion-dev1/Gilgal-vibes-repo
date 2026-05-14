/* ============================================================
   GILGAL VIBES INCORPORATED — app.js
   Features: Page routing, Booking form, Downloads portal,
   Reminder system, Scroll reveal, Navbar scroll
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  /* ──────────────────────────────────────────
     1. PAGE ROUTING
     Single-page navigation — shows/hides pages
  ────────────────────────────────────────── */
  window.showPage = function (pageId) {
    // Hide all pages
    document
      .querySelectorAll(".page")
      .forEach((p) => p.classList.remove("active"));
    // Show target page
    const target = document.getElementById(`page-${pageId}`);
    if (target) {
      target.classList.add("active");
      window.scrollTo({ top: 0, behavior: "smooth" });
      // Trigger reveal animations for newly shown page
      setTimeout(triggerReveal, 100);
    }
    // Special page inits
    if (pageId === "downloads") renderRecordings();
  };

  /* ──────────────────────────────────────────
     2. NAVBAR — scroll effect + active link
  ────────────────────────────────────────── */
  const navbar = document.getElementById("navbar");
  window.addEventListener(
    "scroll",
    () => {
      navbar.classList.toggle("scrolled", window.scrollY > 60);
    },
    { passive: true },
  );

  /* ──────────────────────────────────────────
     3. MOBILE MENU
  ────────────────────────────────────────── */
  window.toggleMenu = function () {
    const menu = document.getElementById("mobile-menu");
    const ham = document.getElementById("hamburger");
    menu.classList.toggle("open");
    // Animate hamburger to X
    const spans = ham.querySelectorAll("span");
    if (menu.classList.contains("open")) {
      spans[0].style.transform = "rotate(45deg) translate(4px,4px)";
      spans[1].style.opacity = "0";
      spans[2].style.transform = "rotate(-45deg) translate(4px,-4px)";
    } else {
      spans[0].style.transform = "";
      spans[1].style.opacity = "";
      spans[2].style.transform = "";
    }
  };

  /* ──────────────────────────────────────────
     4. SCROLL REVEAL
  ────────────────────────────────────────── */
  const revealSelectors = [
    ".service-card",
    ".stat",
    ".why-item",
    ".testi-card",
    ".equip-card",
    ".price-card",
    ".event-type",
    ".why-item",
    ".step",
    ".recording-card",
    ".contact-item",
    ".sidebar-card",
    ".genre-tag",
    ".s-step",
  ];

  function setupReveal() {
    revealSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el, i) => {
        if (!el.classList.contains("reveal")) {
          el.classList.add("reveal");
          el.style.transitionDelay = `${i * 70}ms`;
        }
      });
    });
    triggerReveal();
  }

  function triggerReveal() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    document
      .querySelectorAll(".reveal:not(.visible)")
      .forEach((el) => observer.observe(el));
  }

  setupReveal();

  /* ──────────────────────────────────────────
     5. BOOKINGS — Object & Array based system
  ────────────────────────────────────────── */

  // Array of all bookings (would go to a backend in production)
  const bookings = [];

  window.submitBooking = function (e) {
    e.preventDefault();

    // Build a booking OBJECT from form fields
    const booking = {
      id: "GV-" + Math.random().toString(36).substr(2, 6).toUpperCase(),
      name: document.getElementById("b-name").value.trim(),
      phone: document.getElementById("b-phone").value.trim(),
      email: document.getElementById("b-email").value.trim(),
      service: document.getElementById("b-service").value,
      date: document.getElementById("b-date").value,
      type: document.getElementById("b-type").value,
      guests: document.getElementById("b-guests").value,
      venue: document.getElementById("b-venue").value.trim(),
      notes: document.getElementById("b-notes").value.trim(),
      status: "pending",
      bookedAt: new Date().toISOString(),
    };

    // Add to bookings array
    bookings.push(booking);

    // Schedule a reminder for this booking
    scheduleReminder(booking);

    // Save to localStorage (persists across sessions)
    saveBookings();

    // Show success message
    document.getElementById("booking-form").style.display = "none";
    document.getElementById("booking-success").style.display = "block";
    document.getElementById("booking-ref").textContent = `Ref: ${booking.id}`;
    document.getElementById("contract-link").href =
      `contract.html?id=${booking.id}`;
  };

  function saveBookings() {
    localStorage.setItem("gv_bookings", JSON.stringify(bookings));
  }

  // Load saved bookings on start
  function loadBookings() {
    const saved = localStorage.getItem("gv_bookings");
    if (saved) {
      const parsed = JSON.parse(saved);
      parsed.forEach((b) => bookings.push(b));
    }
  }
  loadBookings();

  /* ──────────────────────────────────────────
     6. REMINDER SYSTEM
     Checks every minute if any show is
     within 24 hours and triggers an alert
  ────────────────────────────────────────── */

  // Object to track which reminders have already fired
  const firedReminders = {};

  function scheduleReminder(booking) {
    const showDate = new Date(booking.date);
    const now = new Date();
    const msUntil = showDate - now;
    const oneDayMs = 24 * 60 * 60 * 1000;

    // If show is more than 24hrs away, we'll catch it on the interval
    // If show is within 24hrs, fire immediately
    if (msUntil > 0 && msUntil <= oneDayMs) {
      fireReminder(booking);
    }
  }

  function fireReminder(booking) {
    if (firedReminders[booking.id]) return; // don't fire twice
    firedReminders[booking.id] = true;

    const serviceLabel = booking.service.replace("-", " — ").toUpperCase();
    showToast(
      `🔔 SHOW TOMORROW: ${serviceLabel} for ${booking.name} at ${booking.venue}`,
      "reminder",
      8000,
    );
  }

  // Check bookings every 60 seconds
  setInterval(() => {
    const oneDayMs = 24 * 60 * 60 * 1000;
    bookings.forEach((booking) => {
      if (booking.status === "confirmed") {
        const showDate = new Date(booking.date);
        const msUntil = showDate - new Date();
        if (msUntil > 0 && msUntil <= oneDayMs) {
          fireReminder(booking);
        }
      }
    });
  }, 60000);

  /* ──────────────────────────────────────────
     7. DOWNLOADS PORTAL
     Reads from admin uploads, real Paystack
  ────────────────────────────────────────── */

  const PAYSTACK_KEY = "pk_test_34434e0ab95f12328cbb2994112da19bddad4fb7";
  const DOWNLOAD_AMOUNT = 150000; // ₦1,500 in kobo

  let activeRecording = null;

  function getRecordings() {
    try {
      return JSON.parse(localStorage.getItem("gv_recordings") || "[]");
    } catch {
      return [];
    }
  }

  window.renderRecordings = function () {
    const grid = document.getElementById("recordings-grid");
    if (!grid) return;
    const recs = getRecordings();
    if (!recs.length) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--muted)">
          <i class="fa-solid fa-music" style="font-size:36px;opacity:0.15;display:block;margin-bottom:16px"></i>
          <p style="font-size:14px">No recordings available yet.<br/>Recordings are ready within 3 days of your event.</p>
        </div>`;
      return;
    }
    grid.innerHTML = recs
      .map(
        (rec) => `
      <div class="recording-card reveal">
        <span class="rec-type audio">🎵 Audio Recording</span>
        <h4>${rec.title}</h4>
        <p class="rec-date">${formatDate(rec.date)}${rec.size ? " &nbsp;·&nbsp; " + rec.size : ""}</p>
        <div style="font-family:'Playfair Display',serif;font-size:28px;color:var(--gold);margin-bottom:16px;font-weight:900">₦1,500</div>
        <button class="btn-primary full" onclick="openDlModal('${rec.id}')">
          <i class="fa-solid fa-lock"></i> Unlock Download
        </button>
      </div>
    `,
      )
      .join("");
    setTimeout(triggerReveal, 50);
  };

  window.searchEvent = function () {
    const query = document
      .getElementById("search-input")
      .value.trim()
      .toLowerCase();
    const results = document.getElementById("search-results");
    if (!query) {
      results.innerHTML = "";
      return;
    }
    const recs = getRecordings();
    const found = recs.filter(
      (r) =>
        r.title.toLowerCase().includes(query) ||
        r.id.toLowerCase().includes(query) ||
        (r.email && r.email.toLowerCase().includes(query)),
    );
    if (!found.length) {
      results.innerHTML = `<div class="no-results">No recordings found for "<strong>${query}</strong>".<br/><span style="font-size:12px">Try your full name, event name, or booking reference. Recordings are available 3 days after your event.</span></div>`;
      return;
    }
    results.innerHTML = found
      .map(
        (rec) => `
      <div class="result-card">
        <div class="result-info">
          <h4>${rec.title}</h4>
          <p>${formatDate(rec.date)} &nbsp;·&nbsp; Audio Recording${rec.size ? " · " + rec.size : ""}</p>
        </div>
        <div style="font-family:'Playfair Display',serif;font-size:22px;color:var(--gold);font-weight:900;white-space:nowrap">₦1,500</div>
        <button class="btn-primary" onclick="openDlModal('${rec.id}')">
          <i class="fa-solid fa-lock"></i> Unlock
        </button>
      </div>
    `,
      )
      .join("");
  };

  window.openDlModal = function (recId) {
    const rec = getRecordings().find((r) => r.id === recId);
    if (!rec) return;
    activeRecording = rec;
    document.getElementById("dl-title").textContent = rec.title;
    document.getElementById("dl-meta").textContent =
      formatDate(rec.date) + (rec.size ? " · " + rec.size : "");
    document.getElementById("dl-email").value = "";
    document.getElementById("dl-email-err").style.display = "none";
    document.getElementById("dl-overlay").style.display = "flex";
  };

  window.closeDlModal = function () {
    document.getElementById("dl-overlay").style.display = "none";
    activeRecording = null;
  };

  document
    .getElementById("dl-overlay")
    ?.addEventListener("click", function (e) {
      if (e.target === this) closeDlModal();
    });

  window.payWithPaystack = function () {
    const emailInput = document.getElementById("dl-email");
    const emailErr = document.getElementById("dl-email-err");
    const email = emailInput.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailErr.style.display = "block";
      emailInput.style.borderColor = "#e03e3e";
      emailInput.focus();
      return;
    }
    emailErr.style.display = "none";
    emailInput.style.borderColor = "rgba(255,255,255,0.1)";
    if (!activeRecording) return;

    // Snapshot the recording NOW before anything closes
    const recSnapshot = Object.assign({}, activeRecording);

    const payBtn = document.getElementById("dl-pay-btn");
    payBtn.disabled = true;
    payBtn.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin"></i> Opening Paystack...';

    const handler = PaystackPop.setup({
      key: PAYSTACK_KEY,
      email: email,
      amount: DOWNLOAD_AMOUNT,
      currency: "NGN",
      ref: "GV-DL-" + Date.now(),
      metadata: {
        custom_fields: [
          {
            display_name: "Recording",
            variable_name: "recording",
            value: recSnapshot.title,
          },
          {
            display_name: "Event Date",
            variable_name: "event_date",
            value: recSnapshot.date,
          },
        ],
      },
      callback: function (response) {
        // Pass snapshot so activeRecording being null doesn't matter
        onPaymentSuccess(response, email, recSnapshot);
      },
      onClose: function () {
        payBtn.disabled = false;
        payBtn.innerHTML =
          '<i class="fa-solid fa-lock"></i> Pay ₦1,500 with Paystack';
      },
    });
    handler.openIframe();
  };

  function onPaymentSuccess(response, email, rec) {
    // Save purchase record
    const purchases = JSON.parse(localStorage.getItem("gv_purchases") || "[]");
    purchases.push({
      ref: response.reference,
      recordingId: rec.id,
      title: rec.title,
      email: email,
      paidAt: new Date().toISOString(),
    });
    localStorage.setItem("gv_purchases", JSON.stringify(purchases));

    // Close payment modal AFTER saving snapshot
    document.getElementById("dl-overlay").style.display = "none";
    activeRecording = null;

    // Show success modal with Google Drive link
    const driveLink = document.getElementById("dl-drive-link");
    driveLink.href = rec.link;
    driveLink.textContent = "Download My Recording";
    document.getElementById("dl-success-overlay").style.display = "flex";

    // Send email to client with download link
    sendDownloadEmail(email, rec, response.reference);
  }

  function sendDownloadEmail(email, rec, ref) {
    // Make sure EmailJS is initialised
    try {
      emailjs.init({ publicKey: "rBQ167rJoiQ2j06sg" });
    } catch (e) {}

    const templateParams = {
      to_name: email,
      client_name: email,
      to_email: email,
      email: email,
      user_email: email,
      booking_ref: ref,
      status: "Payment Confirmed — Download Ready ✓",
      status_message: `Your payment of ₦1,500 for "${rec.title}" has been confirmed.\n\nYour download link is ready. Click the button below or copy this link into your browser:\n\n${rec.link}\n\nEvent Date: ${formatDate(rec.date)}${rec.size ? "\nFile Size: " + rec.size : ""}\n\nIf you have any trouble downloading, contact us on WhatsApp: +234 803 409 5659\n\nThank you for choosing Gilgal Vibes!`,
      service: "Audio Recording Download — ₦1,500",
      event_type: "Recording Purchase",
      event_date: formatDate(rec.date),
      venue: rec.title,
      contract_link: rec.link,
      reply_to: "okingilgalvibes@gmail.com",
    };

    emailjs
      .send("service_3esjjui", "template_48lu5i4", templateParams, {
        publicKey: "rBQ167rJoiQ2j06sg",
      })
      .catch((err) => console.error("❌ Download email failed:", err));
  }

  /* ──────────────────────────────────────────
     9. CONTACT FORM
  ────────────────────────────────────────── */
  window.submitContact = function (e) {
    e.preventDefault();
    document.getElementById("contact-form").style.display = "none";
    document.getElementById("contact-success").style.display = "block";
  };

  /* ──────────────────────────────────────────
     10. TOAST NOTIFICATION
  ────────────────────────────────────────── */
  function showToast(message, type = "info", duration = 4000) {
    document.getElementById("gv-toast")?.remove();

    const colors = {
      info: "#c8a84b",
      reminder: "#c8a84b",
      success: "#3d9970",
      error: "#e03e3e",
    };

    const toast = document.createElement("div");
    toast.id = "gv-toast";
    toast.textContent = message;
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "32px",
      right: "32px",
      background: "#141414",
      color: "#f0ede8",
      border: `1px solid ${colors[type] || colors.info}`,
      borderLeft: `4px solid ${colors[type] || colors.info}`,
      borderRadius: "2px",
      padding: "16px 24px",
      fontSize: "13px",
      fontFamily: "'Outfit', sans-serif",
      fontWeight: "500",
      boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
      zIndex: "9990",
      maxWidth: "380px",
      lineHeight: "1.5",
      opacity: "0",
      transform: "translateY(16px)",
      transition: "opacity 0.3s ease, transform 0.3s ease",
    });
    document.body.appendChild(toast);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
      }),
    );
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(16px)";
      setTimeout(() => toast.remove(), 350);
    }, duration);
  }

  /* ──────────────────────────────────────────
     11. HELPERS
  ────────────────────────────────────────── */
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  // Set min date on booking form to today
  const dateInput = document.getElementById("b-date");
  if (dateInput) {
    dateInput.min = new Date().toISOString().split("T")[0];
  }

  // Initial page load
  triggerReveal();
});
