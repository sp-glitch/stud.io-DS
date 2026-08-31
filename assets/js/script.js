/* ==========================================================================
   stud.io Design System — script.js
   --------------------------------------------------------------------------
   [1] 토스트
   [2] 컬러 칩 복사
   [3] 칩 선택
   [4] 프로그레스
   [5] 데모 버튼 피드백
   [6] 사이드바 (모바일) + 스크롤 스파이
   [7] 테마 전환
   [8] 컴포넌트 인터랙션
   [9] 모달
   [10] 맨 위로
   ========================================================================== */

(function () {
  'use strict';

  /* ========================================================================
     [1] 토스트
     ======================================================================== */
  var toastEl = document.getElementById('toast');
  var toastMsgEl = document.getElementById('toastMsg');
  var toastTimer = null;

  function showToast(message) {
    toastMsgEl.textContent = message;
    toastEl.classList.add('is-open');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('is-open');
    }, 1700);
  }

  function copyValue(text) {
    var done = function () { showToast(text + ' 복사 완료'); };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(function () { legacyCopy(text, done); });
    } else {
      legacyCopy(text, done);
    }
  }

  // file:// 등 비보안 컨텍스트 대응
  function legacyCopy(text, done) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy'); done(); } catch (err) { /* 무시 */ }
    document.body.removeChild(area);
  }

  /* ========================================================================
     [2] 컬러 칩 복사
     ======================================================================== */
  document.querySelectorAll('.swatch').forEach(function (swatch) {
    swatch.addEventListener('click', function () {
      copyValue(swatch.dataset.value);
    });
  });

  /* ========================================================================
     [3] 칩 선택 — 그룹 단위로 하나만 활성
     ======================================================================== */
  var chipResultEl = document.getElementById('chipResult');

  document.querySelectorAll('[data-chip-group]').forEach(function (group) {
    group.addEventListener('click', function (event) {
      var chip = event.target.closest('.chip');
      if (!chip) return;

      group.querySelectorAll('.chip').forEach(function (item) {
        item.classList.toggle('is-active', item === chip);
      });

      if (chipResultEl) chipResultEl.textContent = chip.textContent.trim();
      showToast(chip.textContent.trim() + ' 선택됨');
    });
  });

  /* ========================================================================
     [4] 프로그레스
     ======================================================================== */
  (function initProgress() {
    var bars = document.querySelectorAll('[data-bar]');
    if (!bars.length) return;

    var valueEl = document.getElementById('progValue');
    var timeEl = document.querySelector('[data-prog-time]');
    var lessonEl = document.querySelector('[data-prog-lesson]');
    var pctEl = document.querySelector('[data-prog-pct]');
    var controls = document.querySelectorAll('[data-prog]');
    var replayBtn = document.getElementById('progReplay');

    var TOTAL_SECONDS = 25 * 60 + 7;   // 25:07
    var TOTAL_LESSONS = 14;
    var DEFAULT_VALUE = 70;

    function formatTime(seconds) {
      var m = Math.floor(seconds / 60);
      var s = Math.round(seconds % 60);
      return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }

    function setProgress(value) {
      // width 만 바꾸면 CSS transition(--duration-slow)이 알아서 채웁니다
      bars.forEach(function (bar) { bar.style.width = value + '%'; });

      if (valueEl) valueEl.textContent = value + '%';
      if (timeEl) timeEl.textContent = formatTime(TOTAL_SECONDS * value / 100);
      if (lessonEl) lessonEl.textContent = Math.round(TOTAL_LESSONS * value / 100);
      if (pctEl) pctEl.textContent = value;

      controls.forEach(function (btn) {
        btn.classList.toggle('is-active', Number(btn.dataset.prog) === value);
      });
    }

    controls.forEach(function (btn) {
      btn.addEventListener('click', function () {
        setProgress(Number(btn.dataset.prog));
      });
    });

    if (replayBtn) {
      replayBtn.addEventListener('click', function () {
        setProgress(0);
        setTimeout(function () { setProgress(DEFAULT_VALUE); }, 80);
      });
    }

    // 최초 로드 시 0% → 70%
    setProgress(0);
    setTimeout(function () { setProgress(DEFAULT_VALUE); }, 350);
  })();

  /* ========================================================================
     [5] 데모 버튼 피드백
     ======================================================================== */
  document.querySelectorAll('[data-toast]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      showToast(btn.dataset.toast);
    });
  });

  /* ========================================================================
     [6] 사이드바 + 스크롤 스파이
     ======================================================================== */
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('overlay');
  var menuBtn = document.getElementById('menuBtn');
  var content = document.getElementById('content');
  var crumbEl = document.getElementById('crumb');
  var navEl = document.getElementById('nav');

  /* href 를 안전하게 요소로 바꿉니다.
     "#" 하나만 있는 링크(이동 대상이 없는 메뉴)는 querySelector 가 예외를 던지므로 걸러냅니다. */
  function sectionOf(hash) {
    if (!hash || hash.charAt(0) !== '#' || hash.length < 2) return null;
    try { return document.querySelector(hash); } catch (e) { return null; }
  }

  /* 메뉴 ↔ 섹션은 1:1로 짝지어 둡니다. href="#id" 가 유일한 연결 고리입니다. */
  var links = Array.prototype.slice.call(navEl.querySelectorAll('.nav__link'));
  var sections = links
    .map(function (link) { return sectionOf(link.getAttribute('href')); })
    .filter(Boolean);

  var MOBILE_MAX = 1100;

  /* 클릭 직후에는 스크롤 스파이를 잠급니다.
     잠그지 않으면 부드러운 스크롤이 진행되는 동안 스파이가 중간 섹션을
     활성으로 덮어써서 "클릭한 메뉴가 아닌 다른 메뉴"가 켜집니다. */
  var spyPaused = false;
  var pauseTimer = null;

  function pauseSpy() {
    spyPaused = true;
    clearTimeout(pauseTimer);
    pauseTimer = setTimeout(resumeSpy, 900);   // 안전장치
  }
  function resumeSpy() {
    clearTimeout(pauseTimer);
    spyPaused = false;
  }

  /* 사용자가 직접 스크롤하면 즉시 스파이에게 주도권을 돌려줍니다 */
  ['wheel', 'touchmove'].forEach(function (evt) {
    content.addEventListener(evt, resumeSpy, { passive: true });
  });

  /* 활성 표시는 이 함수 하나만 건드립니다 — 상태가 갈라지지 않도록 */
  function setActiveLink(link) {
    links.forEach(function (item) {
      item.classList.toggle('is-active', item === link);
    });
    if (link && crumbEl) crumbEl.textContent = link.textContent.trim();
  }

  function linkOf(section) {
    if (!section) return null;
    for (var i = 0; i < links.length; i++) {
      if (links[i].getAttribute('href') === '#' + section.id) return links[i];
    }
    return null;
  }

  /* 앵커 여백은 CSS의 --scroll-offset 하나가 기준입니다.
     여기서는 "어느 섹션이 활성인가"를 판정할 때만 참고합니다. */
  function scrollOffset() {
    var raw = getComputedStyle(document.documentElement).getPropertyValue('--scroll-offset');
    return parseFloat(raw) || 32;
  }

  function openSidebar() {
    sidebar.classList.add('is-open');
    overlay.classList.add('is-open');
  }
  function closeSidebar() {
    sidebar.classList.remove('is-open');
    overlay.classList.remove('is-open');
  }

  menuBtn.addEventListener('click', openSidebar);
  overlay.addEventListener('click', closeSidebar);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeSidebar();
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > MOBILE_MAX) closeSidebar();
  });

  /* 앵커 이동 — 좌표를 직접 계산하지 않습니다.
     scrollIntoView 가 CSS 의 scroll-padding-top / scroll-margin-top 을 그대로 존중하므로
     헤더 높이가 바뀌어도 CSS 토큰만 고치면 됩니다. */
  function goToSection(target) {
    if (!target) return;
    target.scrollIntoView({ block: 'start' });   // 부드러움은 CSS scroll-behavior 가 담당
  }

  /* 메뉴 클릭 — 클릭이 활성 상태의 최종 결정권을 갖습니다 */
  navEl.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('.nav__link');
    if (!link) return;

    var hash = link.getAttribute('href');
    var target = sectionOf(hash);

    /* 이동할 섹션이 없는 메뉴(단독 샘플의 서비스 메뉴 등)는
       페이지를 튕기지 않고 활성 표시만 옮깁니다. */
    if (!target) {
      e.preventDefault();
      setActiveLink(link);
      if (window.innerWidth <= MOBILE_MAX) closeSidebar();
      return;
    }

    e.preventDefault();
    setActiveLink(link);                         // ① 클릭한 메뉴만 활성
    pauseSpy();                                  // ② 이동 중 스파이가 덮어쓰지 못하게
    goToSection(target);                         // ③ 해당 섹션으로 이동

    // 주소창 해시를 맞춰 두어 새로고침·공유·뒤로가기에서도 같은 위치로 복귀
    if (history.replaceState) history.replaceState(null, '', hash);
    else location.hash = hash;

    if (window.innerWidth <= MOBILE_MAX) closeSidebar();
  });

  /* 해시를 달고 처음 진입한 경우 —
     레이아웃(웹폰트·이미지)이 잡힌 뒤 한 번 더 위치를 보정합니다. */
  function syncHash() {
    if (!location.hash) return;
    var target = document.querySelector(location.hash);
    if (!target) return;

    setActiveLink(linkOf(target));
    pauseSpy();
    requestAnimationFrame(function () { goToSection(target); });
  }
  window.addEventListener('load', syncHash);
  window.addEventListener('hashchange', syncHash);

  /* 스크롤 스파이 — 임계선을 마지막으로 지난 섹션 하나만 활성으로 봅니다.
     (offsetTop 은 offsetParent 가 body 라 헤더 높이가 섞여 들어가므로 쓰지 않습니다) */
  function updateActiveLink() {
    if (spyPaused) return;                       // 클릭 이동 중에는 관여하지 않음
    if (!sections.length) return;                // 짝지을 섹션이 없으면 스파이는 쉽니다

    var threshold = content.getBoundingClientRect().top + scrollOffset() + 8;
    var current = sections[0];

    sections.forEach(function (section) {
      if (section.getBoundingClientRect().top <= threshold) current = section;
    });

    setActiveLink(linkOf(current));
  }

  content.addEventListener('scroll', updateActiveLink, { passive: true });
  window.addEventListener('resize', updateActiveLink);

  /* 초기화 */
  updateActiveLink();
  syncHash();


  /* ========================================================================
     [7] 테마 전환 (Light / Dark)
     다크 값 자체는 CSS 의 [data-theme="dark"] 한 곳에만 있습니다.
     여기서는 그 속성을 갈아 끼우고 선택을 기억하는 일만 합니다.
     ======================================================================== */
  var root = document.documentElement;
  var themeBtn = document.getElementById('themeBtn');
  var themeLabel = document.getElementById('themeLabel');

  function currentTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function applyTheme(theme, remember) {
    root.setAttribute('data-theme', theme);
    // 버튼은 "지금 상태"가 아니라 "누르면 갈 곳"을 알려 줍니다
    if (themeLabel) themeLabel.textContent = theme === 'dark' ? '라이트' : '다크';
    if (themeBtn) themeBtn.setAttribute('aria-pressed', String(theme === 'dark'));
    if (remember) { try { localStorage.setItem('studio-theme', theme); } catch (e) {} }
  }

  // head 스크립트가 이미 정해 둔 값에 라벨만 맞춥니다(저장하지 않음 —
  // 저장해 버리면 아래 OS 연동이 영영 동작하지 않습니다)
  applyTheme(currentTheme(), false);

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next, true);
      showToast(next === 'dark' ? '다크 모드로 전환했어요' : '라이트 모드로 전환했어요');
    });
  }

  /* OS 설정 변경 — 사용자가 직접 고른 적이 없을 때만 따라갑니다 */
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  function onSystemThemeChange(e) {
    var saved = null;
    try { saved = localStorage.getItem('studio-theme'); } catch (err) {}
    if (!saved) applyTheme(e.matches ? 'dark' : 'light', false);
  }
  if (mq.addEventListener) mq.addEventListener('change', onSystemThemeChange);
  else if (mq.addListener) mq.addListener(onSystemThemeChange);


  /* ========================================================================
     [8] 컴포넌트 인터랙션
     클릭 하나를 위임으로 받아 처리합니다. 마크업에 data-* 만 붙이면
     새로 추가되는 컴포넌트도 이 파일을 고치지 않고 그대로 동작합니다.

       [data-single]       한 그룹에서 하나만 활성 (탭 · 세그먼트 · 페이지네이션)
       [data-tabs]         탭 + [data-panel] 패널 전환
       [data-toggle-group] 여러 개 동시 선택 (필터 체크박스)
       [data-select]       드롭다운 열기/닫기 + 값 선택
       [data-accordion]    한 번에 하나만 펼침
       [data-stars]        별점 입력
     ======================================================================== */
  var SINGLE = '.tabs__item, .seg__btn, .pager__btn, .banner__dot, .banner__nav';

  function selectOne(group, item, selector) {
    Array.prototype.forEach.call(group.querySelectorAll(selector), function (el) {
      el.classList.toggle('is-active', el === item);
    });
  }

  document.addEventListener('click', function (e) {
    var target = e.target;
    if (!target || !target.closest) return;

    /* ── 별점 입력 ── */
    var star = target.closest('.stars__star');
    if (star) {
      var starWrap = star.closest('[data-stars]');
      if (starWrap) {
        var score = Number(star.dataset.star);
        Array.prototype.forEach.call(starWrap.querySelectorAll('.stars__star'), function (s) {
          s.classList.toggle('is-off', Number(s.dataset.star) > score);
        });
        showToast(score + '점을 선택했어요');
        return;
      }
    }

    /* ── 토글 버튼 — 저장 · 찜처럼 켠 상태가 유지되는 액션 ──
       (공유처럼 한 번 실행하고 끝나는 액션은 [data-toast] 로 둡니다) */
    var toggleBtn = target.closest('[data-toggle-btn]');
    if (toggleBtn) {
      var isOn = toggleBtn.classList.toggle('is-on');
      toggleBtn.setAttribute('aria-pressed', String(isOn));
      var msg = isOn ? toggleBtn.dataset.toastOn : toggleBtn.dataset.toastOff;
      if (msg) showToast(msg);
      return;
    }

    /* ── 드롭다운: 항목 선택 ── */
    var option = target.closest('.select-list__item');
    if (option) {
      var list = option.parentElement;
      var trigger = list.previousElementSibling;
      selectOne(list, option, '.select-list__item');
      if (trigger && trigger.hasAttribute('data-select')) {
        var valueEl = trigger.querySelector('.select__value');
        if (valueEl) valueEl.textContent = option.textContent.trim();
        trigger.classList.remove('is-open');
        list.hidden = true;
      }
      return;
    }

    /* ── 드롭다운: 열기 / 닫기 ── */
    var select = target.closest('[data-select]');
    if (select) {
      var menu = select.nextElementSibling;
      var willOpen = !select.classList.contains('is-open');
      select.classList.toggle('is-open', willOpen);
      if (menu && menu.classList.contains('select-list')) menu.hidden = !willOpen;
      return;
    }

    /* ── 탭 + 패널 ── */
    var tab = target.closest('.player__tab');
    if (tab) {
      var tabGroup = tab.closest('[data-tabs]');
      if (tabGroup) {
        selectOne(tabGroup, tab, '.player__tab');
        var panelHost = tabGroup.parentElement;
        Array.prototype.forEach.call(panelHost.querySelectorAll('[data-panel]'), function (panel) {
          panel.hidden = panel.dataset.panel !== tab.dataset.tab;
        });
        return;
      }
    }

    /* ── 단일 선택 그룹 ── */
    var one = target.closest(SINGLE);
    if (one) {
      var group = one.closest('[data-single]');
      if (group) {
        var items = Array.prototype.slice.call(group.querySelectorAll(SINGLE))
          .filter(function (el) { return !el.classList.contains('is-arrow'); });

        if (one.classList.contains('is-arrow')) {
          // 화살표는 앞뒤로 한 칸 이동 (방향은 data-dir 로 읽습니다 —
          // 아이콘을 바꿔도 로직이 깨지지 않게)
          var at = items.findIndex(function (el) { return el.classList.contains('is-active'); });
          var step = one.dataset.dir === 'prev' ? -1 : 1;
          var next = Math.min(Math.max(at + step, 0), items.length - 1);
          selectOne(group, items[next], SINGLE);
        } else {
          selectOne(group, one, SINGLE);
        }
        return;
      }
    }

    /* ── 다중 선택 (필터 체크박스) ── */
    var row = target.closest('.filter__row');
    if (row && row.closest('[data-toggle-group]')) {
      row.classList.toggle('is-on');
      return;
    }

    /* ── 스위치 ── */
    var sw = target.closest('.switch');
    if (sw) {
      var on = sw.classList.toggle('is-on');
      showToast(on ? '알림을 켰어요' : '알림을 껐어요');
      return;
    }

    /* ── 아코디언 ── */
    var head = target.closest('[data-accordion-head]');
    if (head) {
      var item = head.parentElement;
      var wrap = head.closest('[data-accordion]');
      var open = !item.classList.contains('is-open');
      // 한 번에 하나만 펼칩니다
      Array.prototype.forEach.call(wrap.querySelectorAll('.accordion__item'), function (it) {
        var body = it.querySelector('.accordion__body');
        var isTarget = it === item && open;
        it.classList.toggle('is-open', isTarget);
        if (body) body.hidden = !isTarget;
      });
      return;
    }

    /* ── 열린 드롭다운 바깥 클릭 시 닫기 ── */
    Array.prototype.forEach.call(document.querySelectorAll('[data-select].is-open'), function (el) {
      el.classList.remove('is-open');
      var m = el.nextElementSibling;
      if (m && m.classList.contains('select-list')) m.hidden = true;
    });
  });


  /* ========================================================================
     [9] 모달
     [8]과 같은 방식입니다 — 마크업에 data-* 만 붙이면 이 파일을 고치지 않고
     새 모달이 그대로 동작합니다.

       [data-modal-open="id"]  여는 버튼
       [data-modal-close]      닫는 지점 (스크림 · ✕ · 부정 버튼)
       [data-modal-focus]      열었을 때 포커스를 받을 요소.
                               되돌릴 수 없는 확인에서는 '부정' 버튼에 둡니다 —
                               엔터를 연달아 눌러 지워 버리는 일을 막습니다.

     닫는 방법(스크림 · ESC · 부정 버튼)은 모두 같은 결과여야 합니다.
     "아무 일도 일어나지 않고 직전 상태로 돌아간다" — 이것이 부정의 정의입니다.
     ======================================================================== */
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var openedModal = null;
  var modalOpener = null;

  function modalFocusables(modal) {
    return Array.prototype.filter.call(modal.querySelectorAll(FOCUSABLE), function (el) {
      return el.offsetParent !== null;
    });
  }

  function showModal(modal, opener) {
    if (openedModal) hideModal();
    openedModal = modal;
    modalOpener = opener || null;
    modal.hidden = false;
    document.body.classList.add('is-modal-open');

    // 포커스를 모달 안으로 옮겨 놓아야 스크린리더가 바깥 문서를 계속 읽지 않습니다
    var first = modal.querySelector('[data-modal-focus]') || modalFocusables(modal)[0];
    if (first) first.focus();
  }

  function hideModal() {
    if (!openedModal) return;
    openedModal.hidden = true;
    openedModal = null;
    document.body.classList.remove('is-modal-open');
    // 열기 전 있던 자리로 포커스를 돌려놓습니다
    if (modalOpener && modalOpener.focus) modalOpener.focus();
    modalOpener = null;
  }

  document.addEventListener('click', function (e) {
    if (!e.target || !e.target.closest) return;

    var opener = e.target.closest('[data-modal-open]');
    if (opener) {
      var target = document.getElementById(opener.getAttribute('data-modal-open'));
      if (target) {
        e.preventDefault();
        showModal(target, opener);
      }
      return;
    }

    if (e.target.closest('[data-modal-close]')) hideModal();
  });

  document.addEventListener('keydown', function (e) {
    if (!openedModal) return;

    if (e.key === 'Escape') {
      hideModal();
      return;
    }

    /* 포커스 트랩 — 마지막에서 Tab, 첫 항목에서 Shift+Tab 이면 반대편으로 넘깁니다 */
    if (e.key !== 'Tab') return;

    var items = modalFocusables(openedModal);
    if (!items.length) return;

    var first = items[0];
    var last = items[items.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });


  /* ========================================================================
     [10] 맨 위로
     이 문서는 body 가 아니라 .content 가 스크롤합니다 — 그쪽을 듣고 그쪽을 올립니다.
     부드러움은 CSS 의 scroll-behavior 가 담당하므로(모션 최소화 설정도 거기서
     함께 되돌립니다) 여기서는 목적지만 정합니다.
     ======================================================================== */
  var toTopBtn = document.getElementById('toTop');

  if (toTopBtn) {
    // 한 화면쯤 내려간 뒤에 나타납니다
    var TOTOP_AT = 400;

    var syncToTop = function () {
      toTopBtn.classList.toggle('is-visible', content.scrollTop > TOTOP_AT);
    };

    content.addEventListener('scroll', syncToTop, { passive: true });

    toTopBtn.addEventListener('click', function () {
      content.scrollTop = 0;

      /* 포커스도 함께 올립니다. 버튼은 곧 사라지므로(visibility:hidden) 포커스가
         갈 곳을 만들어 두지 않으면 키보드 사용자는 문서 처음부터 다시 훑어야 합니다. */
      content.setAttribute('tabindex', '-1');
      content.focus({ preventScroll: true });
    });

    syncToTop();
  }
})();
