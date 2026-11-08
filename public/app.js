/**
 * DARPAN STUDIO v2 — Slick, App-First Configurator Engine
 * Shares /api/upload, /api/orders, /api/config, and localStorage with v1.
 */

(() => {
  'use strict';

  let STUDIO_WHATSAPP_NUMBER = '918106511911';
  let RAZORPAY_KEY_ID = '';

  const DEFAULT_SAMPLE_PHOTOS = [
    {
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=85',
      name: 'Wedding_Portrait.jpg',
      w: 2400,
      h: 3200
    },
    {
      url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1000&q=85',
      name: 'Family_Moment.jpg',
      w: 2600,
      h: 1800
    },
    {
      url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1000&q=85',
      name: 'Classic_Portrait.jpg',
      w: 2000,
      h: 2500
    },
    {
      url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=85',
      name: 'Travel_Memory.jpg',
      w: 2800,
      h: 2100
    },
    {
      url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=85',
      name: 'Friends_Together.jpg',
      w: 2400,
      h: 2800
    },
    {
      url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1000&q=85',
      name: 'Smile_Portrait.jpg',
      w: 2200,
      h: 2800
    }
  ];

  // =========================================================================
  // 1. MODERN WEB GUIDANCE MANDATORY FALLBACKS
  // =========================================================================

  const initDialogLightDismissFallback = () => {
    document.querySelectorAll('dialog[closedby="any"]').forEach((dialog) => {
      if (!('closedBy' in HTMLDialogElement.prototype)) {
        dialog.addEventListener('click', (event) => {
          if (event.target !== dialog) return;
          const rect = dialog.getBoundingClientRect();
          const isDialogContent =
            rect.top <= event.clientY &&
            event.clientY <= rect.top + rect.height &&
            rect.left <= event.clientX &&
            event.clientX <= rect.left + rect.width;
          if (isDialogContent) return;
          dialog.close();
        });
      }
    });

    document.querySelectorAll('[data-close-dialog]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const dlg = document.getElementById(btn.getAttribute('data-close-dialog'));
        if (dlg && dlg.open) dlg.close();
      });
    });
  };

  const UserInvalidFallback = (() => {
    const dirtyState = new WeakMap();

    const updateState = (input) => {
      const isValid = input.checkValidity();
      input.classList.toggle('user-invalid-fallback', !isValid);
      input.classList.toggle('user-valid-fallback', isValid);
      if (!isValid) {
        input.setAttribute('aria-invalid', 'true');
      } else {
        input.removeAttribute('aria-invalid');
      }
    };

    const handleEvent = (event) => {
      const input = event.target;
      if (event.type === 'reset') {
        const controls = input.elements || [];
        for (const control of controls) {
          dirtyState.delete(control);
          control.classList.remove('user-invalid-fallback', 'user-valid-fallback');
          control.removeAttribute('aria-invalid');
        }
        return;
      }
      if (!input || !input.checkValidity) return;

      if (event.type === 'input' || event.type === 'change') {
        const s = dirtyState.get(input) || { hasInteracted: false, hasBlurred: false };
        s.hasInteracted = true;
        dirtyState.set(input, s);
        if (s.hasBlurred) updateState(input);
      } else if (event.type === 'blur') {
        const s = dirtyState.get(input) || { hasInteracted: false, hasBlurred: false };
        s.hasBlurred = true;
        dirtyState.set(input, s);
        if (s.hasInteracted) updateState(input);
      }
    };

    const init = (root = document) => {
      if (CSS.supports('selector(:user-invalid)')) return;
      root.addEventListener('blur', handleEvent, true);
      root.addEventListener('input', handleEvent);
      root.addEventListener('change', handleEvent);
      root.addEventListener('reset', handleEvent, true);
    };

    return { init };
  })();

  const initAriaInvalidSync = () => {
    const syncAria = (el) => {
      if (!el || typeof el.matches !== 'function') return;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
        try {
          el.setAttribute('aria-invalid', el.matches(':user-invalid') ? 'true' : 'false');
        } catch (_) {}
      }
    };
    document.addEventListener('blur', (e) => syncAria(e.target), true);
    document.addEventListener('input', (e) => {
      if (e.target?.hasAttribute?.('aria-invalid')) syncAria(e.target);
    });
  };

  const selectRadioOption = (clickedBtn, selectorWithinGroup) => {
    const group = clickedBtn.closest('[role="radiogroup"]') || document;
    group.querySelectorAll(selectorWithinGroup).forEach((btn) => {
      btn.classList.remove('active');
      btn.setAttribute('aria-checked', 'false');
    });
    clickedBtn.classList.add('active');
    clickedBtn.setAttribute('aria-checked', 'true');
  };

  // =========================================================================
  // 2. CONFIGURATOR STATE & HONEST PRICING
  // =========================================================================

  const state = {
    slots: DEFAULT_SAMPLE_PHOTOS.map((item) => ({
      ...item,
      isCustomerUpload: false,
      zoom: 100
    })),
    activeSlotIndex: 0,
    pack: 'trio',
    slotCount: 3,
    size: '8x12',
    singlePrice: 699,
    trioPrice: 1399,
    gallery6Price: 1699,
    widthIn: 8,
    heightIn: 12,
    mountHardwareDesc: 'Tabletop & Wall Dual Mount',
    orientation: 'portrait',
    moulding: 'black',
    mouldingName: 'Matte Black',
    mouldingPrice: 0,
    mountStyle: 'museum',
    mountPrice: 0,
    captionTitle: 'Forever & Always · 12.11.2026',
    paperFinish: 'Anti-Glare Matte Lustre',
    colorFilter: 'none',
    wallColor: 'alabaster'
  };

  const PACK_LABELS = {
    single: 'Single Frame',
    trio: 'Set of 3 Frames',
    gallery6: 'Set of 6 Wall Gallery',
    restoration: 'Photo Restoration + Frame'
  };

  const FILTER_CSS = {
    none: 'none',
    bw: 'grayscale(100%) contrast(1.08)',
    vintage: 'sepia(30%) contrast(1.04) brightness(1.02)'
  };

  const getShipmentSpec = (size, pack) => {
    const specs = {
      '6x8': { box: '9x11x1.75 in', slabKg: 1.0 },
      '8x12': { box: '11x15x1.75 in', slabKg: 1.0 },
      '12x18': { box: '15x21x2.3 in', slabKg: 2.5 },
      '16x24': { box: '19x27x2.5 in', slabKg: 4.5 }
    };
    const base = specs[size] || specs['8x12'];
    if (pack === 'trio') {
      return {
        box: size === '12x18' ? '15x21x4.2 in' : '11x15x4.25 in',
        slabKg: size === '12x18' ? 4.5 : 2.5
      };
    }
    if (pack === 'gallery6') return { box: '15x21x5.5 in', slabKg: 6.0 };
    return base;
  };

  const calculateCurrentPrice = () => {
    const singleUnit = state.singlePrice + state.mouldingPrice + state.mountPrice;
    let total = singleUnit;
    let compare = singleUnit;

    if (state.pack === 'trio') {
      total = state.trioPrice + state.mouldingPrice * 2 + state.mountPrice * 2;
      compare = singleUnit * 3;
    } else if (state.pack === 'gallery6') {
      total = state.gallery6Price + state.mouldingPrice * 3 + state.mountPrice * 3;
      compare = singleUnit * 6;
    } else if (state.pack === 'restoration') {
      total = Math.max(1599, singleUnit + 400);
      compare = total;
    }

    return {
      totalPrice: total,
      comparePrice: compare,
      rupeeSavings: Math.max(0, compare - total)
    };
  };

  const calculateActiveSlotDpi = () => {
    const slot = state.slots[state.activeSlotIndex] || state.slots[0];
    const wIn = state.orientation === 'landscape' ? state.heightIn : state.widthIn;
    const hIn = state.orientation === 'landscape' ? state.widthIn : state.heightIn;
    return Math.min(Math.round(slot.w / wIn), Math.round(slot.h / hIn));
  };

  // =========================================================================
  // 3. RENDER PHOTO DOCK & GALLERY WALL
  // =========================================================================

  const renderPhotoDock = () => {
    const dock = document.getElementById('photoDock');
    const hint = document.getElementById('slotCounterHint');
    if (!dock) return;

    const uploadedCount = state.slots.slice(0, state.slotCount).filter((s) => s.isCustomerUpload).length;
    if (hint) {
      hint.textContent =
        state.slotCount > 1
          ? `Frame #${state.activeSlotIndex + 1} selected (${uploadedCount}/${state.slotCount} uploaded)`
          : uploadedCount > 0
            ? 'Custom photo uploaded ✓'
            : 'Tap below to upload your photo';
    }

    dock.innerHTML = Array.from({ length: state.slotCount }, (_, idx) => {
      const slot = state.slots[idx];
      const isActive = idx === state.activeSlotIndex;
      return `
        <button type="button" class="dock-slot ${isActive ? 'active' : ''}" data-slot-idx="${idx}" title="Select Frame #${idx + 1}">
          <img src="${slot.url}" alt="Slot ${idx + 1}">
          <span class="dock-slot-num">#${idx + 1}</span>
        </button>
      `;
    }).join('');

    dock.querySelectorAll('[data-slot-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activeSlotIndex = parseInt(btn.getAttribute('data-slot-idx') || '0', 10);
        syncZoomSlider();
        updateStudioUI();
      });
    });
  };

  const renderGalleryWall = () => {
    const stage = document.getElementById('galleryWallStage');
    if (!stage) return;

    stage.setAttribute('data-pack-layout', state.pack);
    stage.setAttribute('data-size-scale', state.size);

    const canvasCenter = stage.closest('.canvas-center');
    if (canvasCenter) {
      canvasCenter.setAttribute('data-pack-layout', state.pack);
      canvasCenter.setAttribute('data-size-scale', state.size);
    }

    const cols = state.pack === 'trio' || state.pack === 'gallery6' ? 3 : 1;
    const singleOuterIn =
      (state.orientation === 'landscape' ? state.heightIn : state.widthIn) +
      (state.mountStyle === 'fullbleed' ? 1.0 : 1.5);
    const wallSpanIn = Math.round(singleOuterIn * cols + (cols > 1 ? (cols - 1) * 2 : 0));
    const spanPct = Math.min(100, Math.max(15, Math.round((wallSpanIn / 60) * 100)));
    const spanFill = document.getElementById('sofaSpanFill');
    const scaleLabel = document.getElementById('sofaScaleLabel');
    if (spanFill) spanFill.style.setProperty('--span-pct', `${spanPct}%`);
    if (scaleLabel) {
      scaleLabel.textContent =
        cols === 1
          ? `5 ft (60") Sofa Scale Reference · Frame Width: ~${wallSpanIn}" (${spanPct}% of sofa)`
          : `5 ft (60") Sofa Scale Reference · Wall Span: ~${wallSpanIn}" (${spanPct}% of sofa)`;
    }

    const isCaption = state.mountStyle === 'polaroid';

    stage.innerHTML = Array.from({ length: state.slotCount }, (_, idx) => {
      const slot = state.slots[idx];
      const isSelected = state.slotCount > 1 && idx === state.activeSlotIndex;
      const scale = (slot.zoom || 100) / 100;
      const filterCss = FILTER_CSS[state.colorFilter] || 'none';

      return `
        <div
          class="frame-node moulding-${state.moulding} mount-${state.mountStyle} orient-${state.orientation} ${isSelected ? 'selected-slot' : ''}"
          data-frame-slot="${idx}"
        >
          ${state.slotCount > 1 ? `<span class="slot-pill">#${idx + 1}</span>` : ''}
          <div class="frame-mat">
            <div class="frame-sheen" aria-hidden="true"></div>
            <div class="frame-viewport">
              <img
                src="${slot.url}"
                alt="Frame ${idx + 1} preview"
                style="filter:${filterCss}; transform:scale(${scale});"
              >
            </div>
            ${isCaption ? `<div class="frame-caption">${escapeHtml(state.captionTitle)}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    stage.querySelectorAll('[data-frame-slot]').forEach((el) => {
      el.addEventListener('click', () => {
        state.activeSlotIndex = parseInt(el.getAttribute('data-frame-slot') || '0', 10);
        syncZoomSlider();
        updateStudioUI();
      });
    });
  };

  const syncZoomSlider = () => {
    const slot = state.slots[state.activeSlotIndex] || state.slots[0];
    const zoomRange = document.getElementById('zoomRange');
    const zoomVal = document.getElementById('zoomVal');
    if (zoomRange) zoomRange.value = String(slot.zoom || 100);
    if (zoomVal) zoomVal.textContent = `${slot.zoom || 100}%`;
  };

  const updateStudioUI = () => {
    const roomStage = document.getElementById('roomStage');
    if (roomStage) roomStage.setAttribute('data-wall', state.wallColor);

    renderPhotoDock();
    renderGalleryWall();

    const captionBox = document.getElementById('customCaptionControls');
    if (captionBox) captionBox.hidden = state.mountStyle !== 'polaroid';

    // DPI Pill
    const dpi = calculateActiveSlotDpi();
    const dpiDot = document.getElementById('dpiDot');
    const dpiText = document.getElementById('dpiText');
    if (dpiDot && dpiText) {
      dpiDot.className = 'status-dot';
      if (dpi >= 200) {
        dpiDot.classList.add('good');
        dpiText.textContent = `${dpi} DPI · Sharp Print`;
      } else if (dpi >= 140) {
        dpiDot.classList.add('warn');
        dpiText.textContent = `${dpi} DPI · Good`;
      } else {
        dpiDot.classList.add('low');
        dpiText.textContent = `${dpi} DPI · Studio Enhance`;
      }
    }

    // Bottom Canvas Spec
    const specSummary = document.getElementById('stageSpecSummary');
    if (specSummary) {
      specSummary.textContent = `${state.slotCount} × (${state.widthIn}" × ${state.heightIn}") · ${state.mouldingName} · 2mm Acrylic`;
    }

    // Inspector Hints & Price Dock
    const pricing = calculateCurrentPrice();
    const packHint = document.getElementById('packSavingHint');
    const mountHint = document.getElementById('mountTypeHint');
    const mouldLabel = document.getElementById('selectedMouldingLabel');
    const totalEl = document.getElementById('liveTotalPrice');
    const compareEl = document.getElementById('liveComparePrice');
    const saveEl = document.getElementById('liveSavingsBadge');
    const shipNote = document.getElementById('liveShippingNote');
    const nudge = document.getElementById('aovUpsellAlert');

    if (packHint) {
      packHint.textContent =
        pricing.rupeeSavings > 0
          ? `Save ₹${pricing.rupeeSavings.toLocaleString('en-IN')} + Free Shipping`
          : state.pack === 'restoration'
            ? 'Includes Artist Restoration'
            : 'Standard Single Rate';
    }
    if (mountHint) mountHint.textContent = state.mountHardwareDesc;
    if (mouldLabel) mouldLabel.textContent = state.mouldingName;
    if (totalEl) totalEl.textContent = `₹${pricing.totalPrice.toLocaleString('en-IN')}`;

    if (compareEl && saveEl) {
      if (pricing.rupeeSavings > 0) {
        compareEl.hidden = false;
        saveEl.hidden = false;
        compareEl.textContent = `₹${pricing.comparePrice.toLocaleString('en-IN')}`;
        saveEl.textContent = `Save ₹${pricing.rupeeSavings.toLocaleString('en-IN')}`;
      } else {
        compareEl.hidden = true;
        saveEl.hidden = true;
      }
    }

    const isLowAov = pricing.totalPrice < 999;
    if (nudge) nudge.hidden = !isLowAov;
    if (shipNote) {
      shipNote.textContent = isLowAov
        ? '+₹99 Shipping (Orders ₹999+ ship free)'
        : 'Free Delivery · Extra ₹100 off on Orders ₹999+';
    }
  };

  // =========================================================================
  // 4. REAL PHOTO UPLOAD TO SERVER (/api/upload)
  // =========================================================================

  const uploadSingleFileToServer = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        const probe = new Image();
        probe.onload = async () => {
          let finalUrl = dataUrl;
          try {
            const res = await fetch('/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fileName: file.name, dataUrl })
            });
            if (res.ok) {
              const data = await res.json();
              if (data.ok && data.url) finalUrl = data.url;
            }
          } catch (_) {}
          resolve({
            url: finalUrl,
            name: file.name,
            w: probe.naturalWidth || 2000,
            h: probe.naturalHeight || 2600,
            isCustomerUpload: true
          });
        };
        probe.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });

  const handleFilesSelected = async (fileList) => {
    const validFiles = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (!validFiles.length) return;

    const label = document.getElementById('uploadFileName');
    if (label) label.textContent = `Uploading ${validFiles.length} photo(s)...`;

    const results = await Promise.all(validFiles.slice(0, 6).map(uploadSingleFileToServer));

    if (results.length === 1) {
      state.slots[state.activeSlotIndex] = {
        ...state.slots[state.activeSlotIndex],
        ...results[0],
        zoom: 100
      };
      if (state.slotCount > 1 && state.activeSlotIndex < state.slotCount - 1) {
        state.activeSlotIndex += 1;
      }
    } else {
      results.forEach((res, i) => {
        if (i < state.slots.length) {
          state.slots[i] = { ...state.slots[i], ...res, zoom: 100 };
        }
      });
      state.activeSlotIndex = 0;
    }

    if (label) label.textContent = 'Upload more or replace photo';
    syncZoomSlider();
    updateStudioUI();
    showToast(`Uploaded ${results.length} photo(s)`);
  };

  // =========================================================================
  // 5. BIND CONTROLS
  // =========================================================================

  const bindControls = () => {
    document.querySelectorAll('.wall-dot').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectRadioOption(btn, '.wall-dot');
        state.wallColor = btn.getAttribute('data-wall-color') || 'alabaster';
        updateStudioUI();
      });
    });

    const fileInput = document.getElementById('photoFileInput');
    const dropzone = document.getElementById('uploadDropzone');

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files?.length) handleFilesSelected(e.target.files);
      });
    }
    if (dropzone) {
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer?.files?.length) handleFilesSelected(e.dataTransfer.files);
      });
    }

    document.querySelectorAll('.sample-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.sample-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        const slot = state.slots[state.activeSlotIndex];
        slot.url = chip.getAttribute('data-sample');
        slot.w = parseInt(chip.getAttribute('data-w') || '2400', 10);
        slot.h = parseInt(chip.getAttribute('data-h') || '3000', 10);
        updateStudioUI();
      });
    });

    document.querySelectorAll('.seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectRadioOption(btn, '.seg-btn');
        state.pack = btn.getAttribute('data-pack') || 'single';
        state.slotCount = parseInt(btn.getAttribute('data-slots') || '1', 10);
        if (state.activeSlotIndex >= state.slotCount) state.activeSlotIndex = 0;
        updateStudioUI();
      });
    });

    const quickUpgrade = document.getElementById('quickUpgradeTrioBtn');
    if (quickUpgrade) {
      quickUpgrade.addEventListener('click', () => {
        const trio = document.querySelector('.seg-btn[data-pack="trio"]');
        if (trio) trio.click();
      });
    }

    document.querySelectorAll('.size-tile').forEach((tile) => {
      tile.addEventListener('click', () => {
        selectRadioOption(tile, '.size-tile');
        state.size = tile.getAttribute('data-size') || '8x12';
        state.singlePrice = parseInt(tile.getAttribute('data-single-price') || '699', 10);
        state.trioPrice = parseInt(tile.getAttribute('data-trio-price') || '1399', 10);
        state.gallery6Price = parseInt(tile.getAttribute('data-gallery6-price') || '1699', 10);
        state.widthIn = parseFloat(tile.getAttribute('data-w-in') || '8');
        state.heightIn = parseFloat(tile.getAttribute('data-h-in') || '12');
        state.mountHardwareDesc = tile.getAttribute('data-mount') || 'Wall Mount';
        updateStudioUI();
      });
    });

    document.querySelectorAll('.color-circle').forEach((circle) => {
      circle.addEventListener('click', () => {
        selectRadioOption(circle, '.color-circle');
        state.moulding = circle.getAttribute('data-moulding') || 'black';
        state.mouldingName = circle.getAttribute('data-moulding-name') || 'Matte Black';
        state.mouldingPrice = parseInt(circle.getAttribute('data-moulding-price') || '0', 10);
        updateStudioUI();
      });
    });

    document.querySelectorAll('[data-mount-style]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectRadioOption(btn, '[data-mount-style]');
        state.mountStyle = btn.getAttribute('data-mount-style') || 'museum';
        state.mountPrice = parseInt(btn.getAttribute('data-mount-price') || '0', 10);
        updateStudioUI();
      });
    });

    document.querySelectorAll('[data-orient]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectRadioOption(btn, '[data-orient]');
        state.orientation = btn.getAttribute('data-orient') || 'portrait';
        updateStudioUI();
      });
    });

    const captionInput = document.getElementById('captionTitleInput');
    if (captionInput) {
      captionInput.addEventListener('input', () => {
        state.captionTitle = captionInput.value;
        updateStudioUI();
      });
    }

    document.querySelectorAll('[data-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectRadioOption(btn, '[data-filter]');
        state.colorFilter = btn.getAttribute('data-filter') || 'none';
        updateStudioUI();
      });
    });

    document.querySelectorAll('[data-finish]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectRadioOption(btn, '[data-finish]');
        state.paperFinish = btn.getAttribute('data-finish') || 'Anti-Glare Matte Lustre';
        updateStudioUI();
      });
    });

    const zoomRange = document.getElementById('zoomRange');
    const zoomVal = document.getElementById('zoomVal');
    const resetBtn = document.getElementById('resetCropBtn');

    if (zoomRange) {
      zoomRange.addEventListener('input', () => {
        state.slots[state.activeSlotIndex].zoom = parseInt(zoomRange.value, 10);
        if (zoomVal) zoomVal.textContent = `${zoomRange.value}%`;
        updateStudioUI();
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.slots[state.activeSlotIndex].zoom = 100;
        syncZoomSlider();
        updateStudioUI();
      });
    }
  };

  // =========================================================================
  // 6. BAG, CHECKOUT & POLICIES
  // =========================================================================

  const CART_STORAGE_KEY = 'darpan_cart_v2';
  const ORDERS_STORAGE_KEY = 'darpan_studio_orders_v2';

  let cart = [];
  let paymentMode = 'prepaid';
  let pendingOrderDraft = null;

  const loadCart = () => {
    try {
      cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
    } catch (_) {
      cart = [];
    }
    updateCartBadge();
  };

  const saveCart = () => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (_) {}
    updateCartBadge();
  };

  const updateCartBadge = () => {
    const count = cart.reduce((acc, i) => acc + (i.qty || 1), 0);
    ['cartCountBadge', 'cartItemCountLabel', 'inlineCartCountText'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(count);
    });
  };

  const buildCartItem = () => {
    const pricing = calculateCurrentPrice();
    const shipSpec = getShipmentSpec(state.size, state.pack);
    const activePhotos = state.slots.slice(0, state.slotCount).map((s) => ({
      url: s.url,
      name: s.name
    }));

    return {
      id: `ITEM-${Date.now()}`,
      title: `${PACK_LABELS[state.pack]} (${state.widthIn}"×${state.heightIn}")`,
      pack: state.pack,
      size: state.size,
      orientation: state.orientation,
      mouldingName: state.mouldingName,
      mountStyle: state.mountStyle,
      paperFinish: state.paperFinish,
      colorFilter: state.colorFilter,
      noNailStrips: true,
      uploadedPhotos: activePhotos,
      photoSrc: activePhotos[0].url,
      dpi: calculateActiveSlotDpi(),
      qty: 1,
      unitPrice: pricing.totalPrice,
      lineTotal: pricing.totalPrice,
      shipSpec
    };
  };

  const calculateCartFinancials = () => {
    const itemsSubtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
    const gift = document.getElementById('addonGiftWrap')?.checked ? 99 : 0;
    const strips = document.getElementById('addonExtraStrips')?.checked ? 69 : 0;
    const subtotal = itemsSubtotal + gift + strips;
    const shipping = subtotal > 0 && subtotal < 999 ? 99 : 0;
    const discount = subtotal >= 999 ? 100 : 0;
    const codFee = 0;
    const grandTotal = Math.max(0, subtotal + shipping - discount);
    const payNow = grandTotal;
    const payOnDelivery = 0;

    return { subtotal, shipping, discount, codFee, grandTotal, payNow, payOnDelivery };
  };

  const renderCartModal = () => {
    const container = document.getElementById('cartItemsContainer');
    if (!container) return;

    if (!cart.length) {
      container.innerHTML = `<div style="padding:1.2rem; text-align:center; color:#666560;">Your bag is empty.</div>`;
    } else {
      container.innerHTML = cart
        .map(
          (item) => `
        <div class="cart-item-card">
          <img src="${item.photoSrc}" alt="${escapeHtml(item.title)}" class="cart-item-thumb">
          <div class="cart-item-info">
            <strong>${escapeHtml(item.title)}</strong>
            <div class="cart-item-meta">${escapeHtml(item.mouldingName)} · ${item.uploadedPhotos.length} photo(s)</div>
          </div>
          <div style="text-align:right;">
            <strong>₹${item.lineTotal.toLocaleString('en-IN')}</strong><br>
            <button type="button" class="cart-remove-btn" data-remove-id="${item.id}">Remove</button>
          </div>
        </div>
      `
        )
        .join('');

      container.querySelectorAll('[data-remove-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
          cart = cart.filter((i) => i.id !== btn.getAttribute('data-remove-id'));
          saveCart();
          renderCartModal();
        });
      });
    }

    const bill = calculateCartFinancials();
    document.getElementById('billSubtotal').textContent = `₹${bill.subtotal.toLocaleString('en-IN')}`;
    document.getElementById('billShipping').textContent = bill.shipping === 0 ? 'FREE' : `₹${bill.shipping}`;
    document.getElementById('billDiscountRow').hidden = bill.discount === 0;
    document.getElementById('billDiscount').textContent = `-₹${bill.discount}`;
    document.getElementById('billGrandTotal').textContent = `₹${bill.grandTotal.toLocaleString('en-IN')}`;

    const submitBtn = document.getElementById('submitOrderBtn');
    if (submitBtn) {
      submitBtn.textContent = `Pay ₹${bill.grandTotal.toLocaleString('en-IN')} & Confirm Order →`;
    }
  };

  const lookupPincodeAndAutoFill = async (pin) => {
    const cityInput = document.getElementById('customerCity');
    const stateSelect = document.getElementById('customerState');
    const pinStatus = document.getElementById('pincodeServiceStatus');

    const prefix2 = pin.slice(0, 2);
    let minDays = 4;
    let maxDays = 6;
    if (pin.startsWith('841')) {
      minDays = 1;
      maxDays = 2;
    } else if (['80', '81', '82', '83', '84', '85', '22', '27', '21', '70', '71'].includes(prefix2)) {
      minDays = 2;
      maxDays = 4;
    } else if (['11', '12', '20', '40', '56', '50', '60'].includes(prefix2)) {
      minDays = 3;
      maxDays = 5;
    }

    const prefixMap = {
      '11': { city: 'New Delhi', state: 'Delhi' },
      '12': { city: 'Gurugram', state: 'Haryana' },
      '20': { city: 'Noida', state: 'Uttar Pradesh' },
      '22': { city: 'Lucknow', state: 'Uttar Pradesh' },
      '27': { city: 'Gorakhpur', state: 'Uttar Pradesh' },
      '40': { city: 'Mumbai', state: 'Maharashtra' },
      '56': { city: 'Bengaluru', state: 'Karnataka' },
      '70': { city: 'Kolkata', state: 'West Bengal' },
      '80': { city: 'Patna', state: 'Bihar' },
      '83': { city: 'Ranchi', state: 'Jharkhand' },
      '84': { city: pin === '841428' ? 'Gopalganj' : 'Muzaffarpur', state: 'Bihar' }
    };

    if (prefixMap[prefix2]) {
      if (cityInput && !cityInput.value) cityInput.value = prefixMap[prefix2].city;
      if (stateSelect) stateSelect.value = prefixMap[prefix2].state;
    }

    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      if (res.ok) {
        const data = await res.json();
        const po = data?.[0]?.PostOffice?.[0];
        if (po) {
          if (cityInput && po.District) cityInput.value = po.District;
          if (stateSelect && po.State) {
            const opt = Array.from(stateSelect.options).find(
              (o) => o.value.toLowerCase() === po.State.toLowerCase()
            );
            if (opt) stateSelect.value = opt.value;
          }
        }
      }
    } catch (_) {}

    if (pinStatus) {
      const fmt = (d) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
      const d1 = new Date();
      d1.setDate(d1.getDate() + minDays);
      const d2 = new Date();
      d2.setDate(d2.getDate() + maxDays);
      pinStatus.hidden = false;
      pinStatus.textContent = `🚚 Estimated Delivery: ${fmt(d1)} – ${fmt(d2)} to ${cityInput?.value || pin}`;
    }
  };

  const POLICY_DOCS = {
    refund: {
      title: 'Refund, Cancellation & 24-Hr Replacement',
      html: `<p><strong>Free 24-Hr Damage Replacement:</strong> If your frame arrives damaged in transit, send one photo on WhatsApp within 24 hours of delivery for a free replacement dispatched within 24 hours—no return required.</p><p style="margin-top:0.6rem;"><strong>Cancellations &amp; Refunds:</strong> Orders may be cancelled within 4 hours of placement (before darkroom printing begins) for a 100% refund processed within 5–7 business days.</p>`
    },
    shipping: {
      title: 'Shipping & Delivery Policy',
      html: `<p>Dispatched within 24–36 hours from our Gopalganj studio via Delhivery Surface, Blue Dart, Xpressbees, and India Post. Delivery takes 2–4 days to Bihar, UP, Jharkhand, WB &amp; NCR, and 4–6 days across India. Free delivery on orders ₹999+.</p>`
    },
    privacy: {
      title: 'Privacy & Photo Confidentiality',
      html: `<p>Your uploaded photographs are strictly private and used solely to print your order. Print files are automatically deleted 14 days after delivery.</p>`
    },
    terms: {
      title: 'Terms & Conditions',
      html: `<p>Custom photo frames are made-to-order personalized items handcrafted to your selected size, moulding, and photo crop. Every order includes our 24-hour free replacement guarantee against transit damage.</p>`
    },
    contact: {
      title: 'Contact & Studio Address',
      html: `<p><strong>Darpan Color Lab</strong><br>Jangaliya More, Main Road, Gopalganj, Bihar – 841428<br>WhatsApp / Support: +91 81065 11911 · support@darpanframes.in</p>`
    }
  };

  const bindCheckoutAndPolicies = () => {
    const checkoutDialog = document.getElementById('checkoutDialog');
    const pgDialog = document.getElementById('paymentGatewayDialog');
    const policyDialog = document.getElementById('policyDialog');
    const inlineBar = document.getElementById('inlineCartConfirmation');

    document.getElementById('addToCartBtn')?.addEventListener('click', () => {
      const item = buildCartItem();
      cart.push(item);
      saveCart();
      renderCartModal();
      checkoutDialog?.showModal();
      showToast(`Added ${item.title} to Bag`);
    });

    document.getElementById('openCartBtn')?.addEventListener('click', () => {
      renderCartModal();
      checkoutDialog?.showModal();
    });

    document.getElementById('orderOnWhatsAppBtn')?.addEventListener('click', () => {
      const item = buildCartItem();
      const msg = `Hi Darpan Studio! I'd like to order: ${item.title} (${item.mouldingName}, ${item.mountStyle}) — ₹${item.lineTotal}. Sending my photo(s) below!`;
      window.open(`https://wa.me/${STUDIO_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    });

    ['addonGiftWrap', 'addonExtraStrips'].forEach((id) => {
      document.getElementById(id)?.addEventListener('change', renderCartModal);
    });

    document.querySelectorAll('input[name="paymentMode"]').forEach((r) => {
      r.addEventListener('change', () => {
        document.querySelectorAll('.pay-option').forEach((c) => c.classList.remove('active'));
        r.closest('.pay-option')?.classList.add('active');
        paymentMode = r.value;
        renderCartModal();
      });
    });

    const pinInput = document.getElementById('customerPincode');
    if (pinInput) {
      pinInput.addEventListener('input', () => {
        const pin = pinInput.value.replace(/\D/g, '').slice(0, 6);
        pinInput.value = pin;
        if (/^[1-8][0-9]{5}$/.test(pin)) lookupPincodeAndAutoFill(pin);
      });
    }

    const phoneInput = document.getElementById('customerPhone');
    if (phoneInput) {
      phoneInput.addEventListener('blur', () => {
        const d = phoneInput.value.replace(/\D/g, '');
        if (d.length === 12 && d.startsWith('91')) phoneInput.value = d.slice(2);
        else if (d.length === 11 && d.startsWith('0')) phoneInput.value = d.slice(1);
        else if (d.length === 10) phoneInput.value = d;
      });
    }

    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
      UserInvalidFallback.init(checkoutForm);
      checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!cart.length) {
          showToast('Add a frame to your bag first.');
          return;
        }
        if (!checkoutForm.checkValidity()) {
          checkoutForm.reportValidity();
          return;
        }

        const bill = calculateCartFinancials();
        const pin = document.getElementById('customerPincode').value.trim();
        const firstItem = cart[0];
        pendingOrderDraft = {
          orderId: `DRP-${Math.floor(10000 + Math.random() * 90000)}`,
          createdAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          customer: {
            name: document.getElementById('customerName').value.trim(),
            phone: document.getElementById('customerPhone').value.replace(/\D/g, '').slice(-10),
            email: document.getElementById('customerEmail').value.trim(),
            address: document.getElementById('customerAddress').value.trim(),
            pincode: pin,
            city: document.getElementById('customerCity').value.trim(),
            state: document.getElementById('customerState').value
          },
          items: cart,
          itemsSummary: cart.map((i) => `${i.qty}× ${i.title} [${i.mouldingName}]`).join(' + '),
          avgDpi: firstItem.dpi,
          boxDimension: firstItem.shipSpec.box,
          chargeableKg: firstItem.shipSpec.slabKg,
          recommendedCourier: pin.startsWith('8') || pin.startsWith('2') ? 'Delhivery One Surface' : 'Shiprocket (Blue Dart / Delhivery)',
          paymentMode,
          grandTotal: bill.grandTotal,
          payNow: bill.payNow,
          payOnDelivery: bill.payOnDelivery
        };

        document.getElementById('pgOrderSubtitle').textContent = `Order ${pendingOrderDraft.orderId}`;
        document.getElementById('pgAmountDisplay').textContent = `₹${bill.payNow.toLocaleString('en-IN')}`;
        document.getElementById('pgModeNote').textContent =
          bill.discount > 0 ? 'Secure Online Payment · ₹100 Discount Applied' : 'Secure Online Payment';
        pgDialog?.showModal();
      });
    }

    document.getElementById('confirmPaymentSuccessBtn')?.addEventListener('click', async () => {
      if (!pendingOrderDraft) return;
      const paymentId = `pay_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const confirmed = { ...pendingOrderDraft, paymentId, paymentStatus: 'VERIFIED' };

      try {
        const list = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || '[]');
        list.unshift(confirmed);
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(list));
      } catch (_) {}

      try {
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(confirmed)
        });
      } catch (_) {}

      cart = [];
      saveCart();
      pendingOrderDraft = null;
      checkoutForm?.reset();
      if (pgDialog?.open) pgDialog.close();
      if (checkoutDialog?.open) checkoutDialog.close();
      if (inlineBar) inlineBar.hidden = true;
      showToast(`🎉 Order ${confirmed.orderId} Confirmed!`);
    });

    document.querySelectorAll('.policy-link').forEach((btn) => {
      btn.addEventListener('click', () => {
        const doc = POLICY_DOCS[btn.getAttribute('data-policy')];
        if (!doc || !policyDialog) return;
        document.getElementById('policyDialogTitle').textContent = doc.title;
        document.getElementById('policyDialogContent').innerHTML = doc.html;
        policyDialog.showModal();
      });
    });
    // "Walls Our Customers Built" (Framekro Happy Customers Interactive Ribbon + Masonry Grid)
    const applyWallPresetFromShot = (shotBtn) => {
      const pack = shotBtn.getAttribute('data-preset-pack');
      const size = shotBtn.getAttribute('data-preset-size');
      const moulding = shotBtn.getAttribute('data-preset-moulding');
      const wallTag = shotBtn.getAttribute('data-wall-tag') || 'Customer Wall Setup';

      if (pack) document.querySelector(`.seg-btn[data-pack="${pack}"]`)?.click();
      if (size) document.querySelector(`.size-tile[data-size="${size}"]`)?.click();
      if (moulding) document.querySelector(`.color-circle[data-moulding="${moulding}"]`)?.click();

      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast(`✨ Loaded "${wallTag}" into studio — upload your photos!`);
    };

    document.querySelectorAll('#customerRibbonTrack .customer-wall-shot').forEach((shotBtn) => {
      shotBtn.addEventListener('click', () => applyWallPresetFromShot(shotBtn));
    });

    const viewRibbonBtn = document.getElementById('viewRibbonModeBtn');
    const viewGridBtn = document.getElementById('viewGridModeBtn');
    const ribbonViewport = document.getElementById('customerRibbonViewport');
    const masonryGrid = document.getElementById('wallsMasonryGrid');

    if (viewRibbonBtn && viewGridBtn && ribbonViewport && masonryGrid) {
      viewRibbonBtn.addEventListener('click', () => {
        viewRibbonBtn.classList.add('active');
        viewGridBtn.classList.remove('active');
        ribbonViewport.hidden = false;
        masonryGrid.hidden = true;
      });

      viewGridBtn.addEventListener('click', () => {
        viewGridBtn.classList.add('active');
        viewRibbonBtn.classList.remove('active');
        ribbonViewport.hidden = true;
        masonryGrid.hidden = false;

        if (!masonryGrid.children.length) {
          const uniqueShots = document.querySelectorAll(
            '#customerRibbonTrack .customer-wall-shot:not([aria-hidden="true"])'
          );
          uniqueShots.forEach((shot) => {
            const clone = shot.cloneNode(true);
            clone.classList.remove('tall');
            clone.addEventListener('click', () => applyWallPresetFromShot(clone));
            masonryGrid.appendChild(clone);
          });
        }
      });
    }

    document.getElementById('shareMyWallBtn')?.addEventListener('click', () => {
      const msg =
        'Hi Darpan Studio! Here is a photo of the frame wall I built at home (claiming my ₹100 wall showcase cashback):';
      window.open(`https://wa.me/${STUDIO_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    });
  };

  const loadServerConfig = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const cfg = await res.json();
        if (cfg.studioWhatsApp) STUDIO_WHATSAPP_NUMBER = cfg.studioWhatsApp;
        if (cfg.razorpayKeyId) RAZORPAY_KEY_ID = cfg.razorpayKeyId;
      }
    } catch (_) {}
  };

  const escapeHtml = (s) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const showToast = (msg) => {
    const stack = document.getElementById('toastContainer');
    if (!stack) return;
    const t = document.createElement('div');
    t.className = 'toast-msg';
    t.textContent = msg;
    stack.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  };

  document.addEventListener('DOMContentLoaded', () => {
    initDialogLightDismissFallback();
    initAriaInvalidSync();
    loadServerConfig();
    bindControls();
    loadCart();
    bindCheckoutAndPolicies();
    updateStudioUI();
  });
})();
