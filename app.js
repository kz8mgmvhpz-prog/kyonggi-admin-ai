/**
 * 경기대학교 스마트 행정 AI 서비스 - 프론트엔드 비즈니스 로직 및 인터랙션 컨트롤러
 */

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search-input");
  const searchSubmit = document.getElementById("search-submit");
  const resultsBox = document.getElementById("results-box");
  const ddaySection = document.getElementById("dday-section");
  const bubbleTags = document.querySelectorAll(".bubble-tag");
  
  // 3D 지도 모달 관련 요소
  const mapOverlay = document.getElementById("map-overlay-modal");
  const mapCloseBtn = document.getElementById("map-close-btn");
  const modalMapTitle = document.getElementById("modal-map-title");
  const mapPin = document.getElementById("map-pin");
  const mapHighlightLabel = document.getElementById("map-highlight-label");
  const mapDescContent = document.getElementById("map-desc-content");

  // ==========================================================================
  // 1. MOUSE CURSOR ATMOSPHERE PARALLAX (무중력 오로라 마우스 이동 패럴랙스)
  // ==========================================================================
  const orbBlue = document.querySelector(".aura-orb-blue");
  const orbPurple = document.querySelector(".aura-orb-purple");

  window.addEventListener("mousemove", (e) => {
    const moveX = (e.clientX - window.innerWidth / 2) * 0.04;
    const moveY = (e.clientY - window.innerHeight / 2) * 0.04;

    if (orbBlue) {
      orbBlue.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.05)`;
    }
    if (orbPurple) {
      orbPurple.style.transform = `translate(${-moveX}px, ${-moveY}px) scale(1.1)`;
    }
  });

  // ==========================================================================
  // 2. NATURAL LANGUAGE INTENT PARSING ENGINE (자연어 매칭 엔진)
  // ==========================================================================
  function parseIntent(query) {
    const cleanQuery = query.toLowerCase().replace(/\s+/g, "");
    let matchedCategory = null;

    // INTENT_MAP 동의어 사전 루핑
    for (const [category, synonyms] of Object.entries(INTENT_MAP)) {
      const matchFound = synonyms.some(synonym => {
        const cleanSynonym = synonym.toLowerCase().replace(/\s+/g, "");
        return cleanQuery.includes(cleanSynonym) || cleanSynonym.includes(cleanQuery);
      });
      
      if (matchFound) {
        matchedCategory = category;
        break;
      }
    }
    return matchedCategory;
  }

  // ==========================================================================
  // 3. SEARCH & RESOLVE LOGIC (검색 매칭 및 동적 렌더링)
  // ==========================================================================
  function executeSearch(query) {
    if (!query || query.trim() === "") return;

    // 자연어 의도 파악 수행
    const matchedCategory = parseIntent(query);
    let matchedDepartments = [];

    if (matchedCategory) {
      // 1순위: 매칭된 의도 키워드를 바탕으로 부서 업무와 매핑
      matchedDepartments = KYONGGI_DATA.filter(dept => {
        return dept.tasks.some(task => task.includes(matchedCategory)) ||
               dept.department.includes(matchedCategory);
      });
    }

    // 2순위: 매칭 부서가 없거나 의도 매핑 실패 시, 단어 부분 일치 퍼지 검색 작동
    if (matchedDepartments.length === 0) {
      const queryWords = query.split(/\s+/);
      matchedDepartments = KYONGGI_DATA.filter(dept => {
        return queryWords.some(word => {
          return dept.department.includes(word) ||
                 dept.tasks.some(task => task.includes(word)) ||
                 dept.location.includes(word);
        });
      });
    }

    // 화면 렌더링 시작 (연속적인 움직임 제공을 위해 투명도 전환 유도)
    resultsBox.style.opacity = "0";
    ddaySection.style.opacity = "0";

    setTimeout(() => {
      // D-Day 학사 일정 플로팅 토스트 결합 (핵심 기능 3번)
      renderDDayToast(matchedCategory);
      
      // 검색 부서 결과 렌더링 (핵심 기능 2번)
      renderCards(matchedDepartments, query);

      resultsBox.style.opacity = "1";
      ddaySection.style.opacity = "1";
    }, 250);
  }

  // ==========================================================================
  // 4. FLOATING D-DAY TOAST RENDERER (D-Day 캡슐 토스트 렌더링)
  // ==========================================================================
  function renderDDayToast(category) {
    ddaySection.innerHTML = "";
    if (!category) return;

    // 관련 카테고리에 할당된 학사일정 찾기
    const schedule = D_DAY_SCHEDULES.find(s => s.category === category);
    if (!schedule) return;

    const toast = document.createElement("div");
    toast.className = "dday-container";
    toast.innerHTML = `
      <span class="dday-badge">D-${schedule.dDay}</span>
      <div class="dday-title">${schedule.title}</div>
      <div class="dday-date">${schedule.date} 마감</div>
    `;

    // 마크업에 결합 및 스르륵 떠오르기
    ddaySection.appendChild(toast);
  }

  // ==========================================================================
  // 5. DEPT CARDS DYNAMIC RENDERER (부서 안내 카드 렌더러)
  // ==========================================================================
  function renderCards(departments, originalQuery) {
    resultsBox.innerHTML = "";

    if (departments.length === 0) {
      resultsBox.innerHTML = `
        <div class="welcome-container" style="border-color: rgba(255, 255, 255, 0.05);">
          <span class="welcome-emoji">🔮</span>
          <h2 class="welcome-title">부서를 찾지 못했습니다</h2>
          <p class="welcome-body">
            "${originalQuery}"에 해당하는 부서 및 일정을 찾지 못했습니다.<br>
            '휴학', '장학금', '상담', '도서관' 등 조금 더 직관적인 단어로 다시 질문해 주세요.
          </p>
        </div>
      `;
      return;
    }

    // 개별 부서 카드 뼈대 동적 구축
    departments.forEach(dept => {
      const card = document.createElement("article");
      card.className = "floating-card";
      if (dept.emergency) {
        card.setAttribute("data-emergency", "true");
      }

      // 카드 헤더 마크업 (정제된 3개 주요 정보 노출)
      let headerHTML = `
        <div class="card-header">
          <div class="card-title-group">
            <span class="dept-badge">${dept.category} (${dept.campus})</span>
            <h3 class="dept-name">${dept.department}</h3>
            <p class="dept-loc">📍 위치: ${dept.location}</p>
          </div>
          <a href="tel:${dept.main_contact.replace(/-/g, '')}" class="dept-call-link" onclick="event.stopPropagation();">
            📞 전화 걸기
          </a>
        </div>
      `;

      // 클릭 시 연속적 확장(Stitch Flow) 영역 마크업
      let drawerHTML = `
        <div class="card-drawer">
          <div class="drawer-inner">
            <hr class="card-divider">
            
            <div class="drawer-title">주요 행정 업무</div>
            <ul class="task-list">
              ${dept.tasks.map(task => `<li>${task}</li>`).join("")}
            </ul>

            <div class="drawer-title">운영 시간</div>
            <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 20px;">⏱️ ${dept.office_hours}</p>

            <div class="drawer-title">직원 연결 및 내선번호</div>
            <div class="staff-grid">
              ${dept.staffs.map(staff => `
                <div class="staff-row">
                  <span class="staff-role">${staff.role}</span>
                  <span class="staff-duty">${staff.duty}</span>
                  <a href="tel:${staff.contact.replace(/-/g, '')}" class="staff-ext-btn" onclick="event.stopPropagation();">
                    ext.${staff.contact.split("-").pop()}
                  </a>
                </div>
              `).join("")}
            </div>

            <button type="button" class="btn-map-reveal" data-building="${dept.location.split(" ")[0]}">
              🗺️ 3D 입체 교내 지도로 상세 위치 보기 ➔
            </button>
          </div>
        </div>
      `;

      card.innerHTML = headerHTML + drawerHTML;

      // ==========================================================================
      // 6. CONTINUOUS ACCORDION TOGGLE (스르륵 열리는 카드 토글 연동)
      // ==========================================================================
      card.addEventListener("click", () => {
        const isActive = card.classList.contains("active");
        
        // 열려있던 모든 카드 원상복구
        document.querySelectorAll(".floating-card").forEach(c => {
          c.classList.remove("active");
        });

        // 닫혀있던 상태였다면 이번 카드 활성화
        if (!isActive) {
          card.classList.add("active");
          // 활성화된 카드가 뷰포트 안으로 무중력 스크롤 되도록 유도
          setTimeout(() => {
            card.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }, 300);
        }
      });

      // 3D 맵 오버레이 트리거 바인딩
      const mapBtn = card.querySelector(".btn-map-reveal");
      if (mapBtn) {
        mapBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const buildingName = mapBtn.getAttribute("data-building");
          open3DMap(buildingName);
        });
      }

      resultsBox.appendChild(card);
    });
  }

  // ==========================================================================
  // 7. 3D MAP VISUAL LAYER CONTROLLER (3D 입체 지도 제어)
  // ==========================================================================
  function open3DMap(building) {
    const mapInfo = CAMPUS_MAP_DATA[building];
    if (!mapInfo) return;

    modalMapTitle.textContent = `📍 ${building} 상세 위치 안내`;
    mapPin.style.left = mapInfo.x;
    mapPin.style.top = mapInfo.y;
    mapHighlightLabel.style.left = mapInfo.x;
    mapHighlightLabel.style.top = mapInfo.y;
    mapHighlightLabel.textContent = building;
    mapDescContent.textContent = mapInfo.description;

    // 모달 활성화 및 시각 굴절 오버레이 기동
    mapOverlay.classList.add("active");
    mapOverlay.setAttribute("aria-hidden", "false");
  }

  function close3DMap() {
    mapOverlay.classList.remove("active");
    mapOverlay.setAttribute("aria-hidden", "true");
  }

  mapCloseBtn.addEventListener("click", close3DMap);
  mapOverlay.addEventListener("click", (e) => {
    if (e.target === mapOverlay) close3DMap();
  });

  // ==========================================================================
  // 8. TRIGGERS & INPUT EVENT BINDING (검색 및 태그 터치 바인딩)
  // ==========================================================================
  searchSubmit.addEventListener("click", () => {
    executeSearch(searchInput.value);
  });

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      executeSearch(searchInput.value);
    }
  });

  bubbleTags.forEach(tag => {
    tag.addEventListener("click", () => {
      const query = tag.getAttribute("data-query");
      searchInput.value = query;
      executeSearch(query);
    });
  });
});
