/* ==========================================================================
   샘플 화면 인터랙션 — samples/*.html 공통
   --------------------------------------------------------------------------
   디자인 시스템의 assets/js/script.js 와 같은 방식이다 —
   마크업에 data-* 만 붙이면 이 파일을 고치지 않고 새 화면이 그대로 동작한다.
   (script.js 는 문서 전용 요소(#nav · #content · #toast)를 전제하므로
    샘플에서는 그 파일을 쓰지 않고 필요한 동작만 여기에 둔다)

     [1] 좋아요 · 저장 토글
     [2] 칩 · 탭 단일 선택
     [3] 모달
     [4] 맨 위로
   ========================================================================== */
(function () {
  'use strict';

  /* ========================================================================
     [1] 좋아요 · 저장 토글
     카드 클릭이나 링크 동작에 영향을 주지 않도록 전파를 끊는다.
     ======================================================================== */
  document.querySelectorAll('.mediabtn[aria-pressed]').forEach(function (btn) {
    btn.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      btn.setAttribute('aria-pressed', btn.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    });
  });

  /* ========================================================================
     [2] 단일 선택 — 한 그룹에서 하나만 활성
       [data-chip-group]  칩 줄 (.chip)
       [data-tabs]        플레이어 패널 탭 (.player__tab) + [data-panel] 전환
     ======================================================================== */
  document.querySelectorAll('[data-chip-group]').forEach(function (group) {
    group.addEventListener('click', function (event) {
      var chip = event.target.closest('.chip');
      if (!chip) { return; }
      group.querySelectorAll('.chip').forEach(function (item) {
        item.classList.toggle('is-active', item === chip);
      });
    });
  });

  /* 별점 입력 — 누른 별까지 켜고 그 뒤는 끈다 */
  document.querySelectorAll('[data-stars]').forEach(function (group) {
    group.addEventListener('click', function (event) {
      var star = event.target.closest('.stars__star');
      if (!star) { return; }
      var score = Number(star.getAttribute('data-star'));
      group.querySelectorAll('.stars__star').forEach(function (item) {
        item.classList.toggle('is-off', Number(item.getAttribute('data-star')) > score);
      });
    });
  });

  document.querySelectorAll('[data-tabs]').forEach(function (group) {
    group.addEventListener('click', function (event) {
      var tab = event.target.closest('.player__tab');
      if (!tab) { return; }

      group.querySelectorAll('.player__tab').forEach(function (item) {
        item.classList.toggle('is-active', item === tab);
      });

      /* 패널은 탭 묶음의 형제로 둔다 — 마크업이 얕아 어디가 무엇인지 바로 읽힌다 */
      var host = group.parentElement;
      host.querySelectorAll('[data-panel]').forEach(function (panel) {
        panel.hidden = panel.getAttribute('data-panel') !== tab.getAttribute('data-tab');
      });
    });
  });

  /* ========================================================================
     [3] 모달 — 디자인 시스템 script.js 의 [9] 와 같은 규약
       [data-modal-open="id"]  여는 버튼
       [data-modal-close]      닫는 지점 (스크림 · ✕ · 부정 버튼)
       [data-modal-focus]      열었을 때 포커스를 받을 자리

     닫는 방법(스크림 · ESC · 부정 버튼)은 모두 같은 결과여야 한다 —
     "아무 일도 일어나지 않고 직전 상태로 돌아간다"가 곧 부정의 정의다.
     ======================================================================== */
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var openedModal = null;
  var modalOpener = null;

  function focusables(modal) {
    return Array.prototype.filter.call(modal.querySelectorAll(FOCUSABLE), function (el) {
      return el.offsetParent !== null;
    });
  }

  function showModal(modal, opener) {
    if (openedModal) { hideModal(); }
    openedModal = modal;
    modalOpener = opener || null;
    modal.hidden = false;
    document.body.classList.add('is-modal-open');

    var first = modal.querySelector('[data-modal-focus]') || focusables(modal)[0];
    if (first) { first.focus(); }
  }

  function hideModal() {
    if (!openedModal) { return; }
    openedModal.hidden = true;
    openedModal = null;
    document.body.classList.remove('is-modal-open');
    if (modalOpener && modalOpener.focus) { modalOpener.focus(); }
    modalOpener = null;
  }

  document.addEventListener('click', function (event) {
    if (!event.target || !event.target.closest) { return; }

    var opener = event.target.closest('[data-modal-open]');
    if (opener) {
      var target = document.getElementById(opener.getAttribute('data-modal-open'));
      if (target) {
        event.preventDefault();
        showModal(target, opener);
      }
      return;
    }

    if (event.target.closest('[data-modal-close]')) { hideModal(); }
  });

  document.addEventListener('keydown', function (event) {
    if (!openedModal) { return; }

    if (event.key === 'Escape') {
      hideModal();
      return;
    }

    /* 포커스 트랩 — 마지막에서 Tab, 첫 항목에서 Shift+Tab 이면 반대편으로 넘긴다 */
    if (event.key !== 'Tab') { return; }

    var items = focusables(openedModal);
    if (!items.length) { return; }

    var first = items[0];
    var last = items[items.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  /* ========================================================================
     [4] 맨 위로
     샘플 화면은 문서 전체가 스크롤한다 (디자인 시스템 문서는 .content 가 스크롤해
     script.js 쪽이 그 컨테이너를 본다 — 다른 점은 그것 하나뿐이다).
     부드러움은 CSS 의 scroll-behavior 가 담당하므로 여기서는 목적지만 정한다.
     ======================================================================== */
  var toTopBtn = document.getElementById('toTop');

  if (toTopBtn) {
    // 한 화면쯤 내려간 뒤에 나타난다
    var TOTOP_AT = 400;

    var syncToTop = function () {
      toTopBtn.classList.toggle('is-visible', window.scrollY > TOTOP_AT);
    };

    window.addEventListener('scroll', syncToTop, { passive: true });

    toTopBtn.addEventListener('click', function () {
      document.documentElement.scrollTop = 0;

      /* 포커스도 함께 올린다. 버튼은 곧 사라지므로(visibility:hidden) 갈 곳을
         만들어 두지 않으면 키보드 사용자는 문서 처음부터 다시 훑어야 한다. */
      var main = document.querySelector('main');
      if (main) {
        main.setAttribute('tabindex', '-1');
        main.focus({ preventScroll: true });
      }
    });

    syncToTop();
  }
})();
